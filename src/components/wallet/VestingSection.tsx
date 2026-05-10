import { useState } from 'react';
import { type Address, formatUnits } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useVestingInfo } from '../../hooks/useWallet';
import { vestingAbi, xkiStakingAbi, XKI_STAKING } from '../../config/contracts';

function fmt(value: bigint, decimals = 6): string {
  const num = Number(formatUnits(value, decimals));
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function fmtDate(ts: bigint): string {
  return new Date(Number(ts) * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function fmtTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Fully vested';
  const days = Math.floor(seconds / 86400);
  const months = Math.floor(days / 30);
  const remDays = days % 30;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ${remDays}d`;
  return `${days} day${days > 1 ? 's' : ''}`;
}

const TIER_NAMES: Record<number, string> = { 0: 'Explorer (3m, 1x)', 1: 'Builder (6m, 2x)', 2: 'Architect (12m, 3x)', 3: 'Founder (24m, 4x)', 4: 'Visionary (36m, 5x)' };

export default function VestingSection({ address }: { address: Address }) {
  const { vestingAddress, data: vesting, isLoading } = useVestingInfo(address);
  const [stakeOpen, setStakeOpen] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');
  const [stakeTier, setStakeTier] = useState(3);

  const { writeContract: release, data: releaseTx, isPending: releasing } = useWriteContract();
  const { isLoading: releaseConfirming, isSuccess: releaseSuccess } = useWaitForTransactionReceipt({ hash: releaseTx });

  const { writeContract: stakeFromVesting, data: stakeTx, isPending: staking } = useWriteContract();
  const { isLoading: stakeConfirming, isSuccess: stakeSuccess } = useWaitForTransactionReceipt({ hash: stakeTx });

  if (isLoading) {
    return (
      <div className="glass-panel p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-white/10 rounded" />
          <div className="h-4 w-full bg-white/10 rounded" />
          <div className="h-20 w-full bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  if (!vestingAddress || !vesting) return null;

  const now = Date.now() / 1000;
  const { totalAllocation, released, releasable, lockedBalance, start, cliff, vestingEnd } = vesting;

  const totalDuration = Number(vestingEnd) - Number(start);
  const elapsed = Math.min(now - Number(start), totalDuration);
  const cliffPct = totalDuration > 0 ? ((Number(cliff) - Number(start)) / totalDuration) * 100 : 0;

  const beforeCliff = now < Number(cliff);
  const afterEnd = now >= Number(vestingEnd);
  const vestedPct = totalAllocation > 0n
    ? Number((released * 10000n) / totalAllocation) / 100
    : 0;
  const progressPct = totalDuration > 0 ? Math.min((elapsed / totalDuration) * 100, 100) : 0;

  const remaining = Math.max(Number(vestingEnd) - now, 0);

  const handleRelease = () => {
    release({
      address: vestingAddress,
      abi: vestingAbi,
      functionName: 'release',
    });
  };

  const handleStakeFromVesting = () => {
    // XKI has 6 decimals
    const amountWei = BigInt(Math.floor(parseFloat(stakeAmount) * 1e6));
    stakeFromVesting({
      address: XKI_STAKING,
      abi: xkiStakingAbi,
      functionName: 'stakeFromVesting',
      args: [vestingAddress, amountWei, stakeTier],
    });
  };

  return (
    <div className="glass-panel p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔒</span>
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold">Vesting</h2>
        </div>
        <span className="font-serif text-lg text-white">{fmt(totalAllocation)} $XKI</span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="relative h-1 bg-white/10 rounded-full overflow-hidden">
          {beforeCliff ? (
            <div
              className="absolute h-full bg-gray-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((elapsed / (Number(cliff) - Number(start))) * cliffPct, cliffPct)}%` }}
            />
          ) : (
            <>
              <div
                className="absolute h-full bg-gray-600 rounded-full"
                style={{ width: `${cliffPct}%` }}
              />
              <div
                className="absolute h-full bg-[#D4AF37] rounded-full transition-all duration-500"
                style={{ left: `${cliffPct}%`, width: `${progressPct - cliffPct}%` }}
              />
            </>
          )}
        </div>
        <div className="flex justify-between text-[9px] text-gray-600">
          <span>{fmtDate(start)}</span>
          <span>Cliff · {fmtDate(cliff)}</span>
          <span>{fmtDate(vestingEnd)}</span>
        </div>
      </div>

      {/* Status Banner */}
      {beforeCliff && (
        <div className="text-[10px] uppercase tracking-widest text-amber-400 bg-amber-900/10 border border-amber-900/30 px-3 py-2 rounded">
          Cliff in {Math.ceil((Number(cliff) - now) / 86400)} days — 0% vested
        </div>
      )}
      {afterEnd && (
        <div className="text-[10px] uppercase tracking-widest text-emerald-400 bg-emerald-900/10 border border-emerald-900/30 px-3 py-2 rounded">
          Fully vested ✓
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-gray-600 mb-1">Released</p>
          <p className="text-sm font-mono text-white">{fmt(released)} $XKI</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-gray-600 mb-1">Releasable Now</p>
          <p className={`text-sm font-mono ${releasable > 0n ? 'text-[#D4AF37]' : 'text-white'}`}>{fmt(releasable)} $XKI</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-gray-600 mb-1">Locked (Stakeable)</p>
          <p className="text-sm font-mono text-white">{fmt(lockedBalance)} $XKI</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-gray-600 mb-1">Time Remaining</p>
          <p className="text-sm font-mono text-white">{fmtTimeRemaining(remaining)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-white/5">
        <button
          onClick={handleRelease}
          disabled={releasable === 0n || releasing || releaseConfirming}
          className="px-5 py-2.5 bg-white text-black text-[10px] uppercase tracking-widest font-bold hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {releasing || releaseConfirming ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" />
              {releaseConfirming ? 'Confirming...' : 'Releasing...'}
            </span>
          ) : releaseSuccess ? 'Released ✓' : 'Release Tokens'}
        </button>

        <button
          onClick={() => setStakeOpen(!stakeOpen)}
          disabled={lockedBalance === 0n}
          className="px-5 py-2.5 border border-white/20 text-gray-400 text-[10px] uppercase tracking-widest hover:text-white hover:border-white/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Stake from Vesting
          <svg className={`w-2.5 h-2.5 transition-transform ${stakeOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 10 6">
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Stake from Vesting Expand */}
      {stakeOpen && (
        <div className="border border-white/10 rounded p-4 space-y-4 bg-white/[0.02]">
          <div>
            <label className="text-[9px] uppercase tracking-[0.3em] text-gray-600 block mb-2">Amount</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent border border-white/10 px-3 py-2 text-sm font-mono text-white focus:border-white/30 focus:outline-none"
              />
              <button
                onClick={() => setStakeAmount(formatUnits(lockedBalance, 6))}
                className="px-3 py-2 border border-white/10 text-[9px] uppercase tracking-widest text-gray-500 hover:text-white hover:border-white/30 transition-colors"
              >
                Max
              </button>
            </div>
          </div>

          <div>
            <label className="text-[9px] uppercase tracking-[0.3em] text-gray-600 block mb-2">Lock Tier</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[0, 1, 2, 3, 4].map((t) => (
                <button
                  key={t}
                  onClick={() => setStakeTier(t)}
                  className={`px-3 py-2 text-[10px] uppercase tracking-widest border transition-colors ${
                    stakeTier === t
                      ? 'border-white/40 text-white bg-white/5'
                      : 'border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20'
                  }`}
                >
                  {TIER_NAMES[t]}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStakeFromVesting}
            disabled={!stakeAmount || parseFloat(stakeAmount) <= 0 || staking || stakeConfirming}
            className="px-5 py-2.5 bg-white text-black text-[10px] uppercase tracking-widest font-bold hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {staking || stakeConfirming ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" />
                {stakeConfirming ? 'Confirming...' : 'Staking...'}
              </span>
            ) : stakeSuccess ? 'Staked ✓' : 'Stake'}
          </button>
        </div>
      )}
    </div>
  );
}
