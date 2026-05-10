import { useState } from 'react';
import { type Address, formatUnits } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import {
  useStakingPositions, useEffectiveWeight,
  useRewardTokens, useEarnedRewards, useRewardTokenSymbols,
} from '../../hooks/useWallet';
import { xkiStakingAbi, xkiRewardDistributorAbi, XKI_STAKING, XKI_REWARD_DISTRIBUTOR } from '../../config/contracts';

const TIER_NAME: Record<number, string> = { 0: 'Explorer', 1: 'Builder', 2: 'Architect', 3: 'Founder', 4: 'Visionary' };
const TIER_EMOJI: Record<number, string> = { 0: '🔭', 1: '🏗️', 2: '⚖️', 3: '🔑', 4: '🚀' };
const TIER_MULT: Record<number, number> = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5 };
const TIER_DURATION: Record<number, number> = { 0: 3, 1: 6, 2: 12, 3: 24, 4: 36 };

function fmt(value: bigint, decimals = 18): string {
  const num = Number(formatUnits(value, decimals));
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function fmtFull(value: bigint, decimals = 18): string {
  return Number(formatUnits(value, decimals)).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

type StakePosition = {
  id: bigint;
  amount: bigint;
  lockTier: number;
  startTime: bigint;
  weight: bigint;
  fromVesting: boolean;
  active: boolean;
  cooldownActive: boolean;
  cooldownStart: bigint;
  cooldownEnd: bigint;
};

function StatusBadge({ status }: { status: 'active' | 'cooldown' | 'ready' }) {
  const styles = {
    active: 'text-emerald-400 bg-emerald-900/10 border-emerald-900',
    cooldown: 'text-amber-400 bg-amber-900/10 border-amber-900',
    ready: 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/30',
  };
  const labels = { active: 'Active', cooldown: 'Cooldown', ready: 'Ready to Withdraw' };
  return (
    <span className={`px-2 py-0.5 text-[10px] uppercase tracking-widest border rounded ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function PositionRow({ pos, now }: { pos: StakePosition; now: number }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmHard, setConfirmHard] = useState(false);
  const tier = Number(pos.lockTier);
  const isCooldown = pos.cooldownActive;
  const cooldownReady = isCooldown && Number(pos.cooldownEnd) <= now;
  const status = cooldownReady ? 'ready' : isCooldown ? 'cooldown' : 'active';

  const { writeContract: requestUnstake, data: reqTx, isPending: reqPending } = useWriteContract();
  const { isLoading: reqConfirming, isSuccess: reqSuccess } = useWaitForTransactionReceipt({ hash: reqTx });

  const { writeContract: completeUnstake, data: compTx, isPending: compPending } = useWriteContract();
  const { isLoading: compConfirming, isSuccess: compSuccess } = useWaitForTransactionReceipt({ hash: compTx });

  const { writeContract: hardUnstake, data: hardTx, isPending: hardPending } = useWriteContract();
  const { isLoading: hardConfirming, isSuccess: hardSuccess } = useWaitForTransactionReceipt({ hash: hardTx });

  const cooldownRemaining = isCooldown && !cooldownReady
    ? (() => {
        const secs = Number(pos.cooldownEnd) - now;
        const days = Math.floor(secs / 86400);
        const hours = Math.floor((secs % 86400) / 3600);
        return `${days}d ${hours}h left`;
      })()
    : '';

  const cooldownPct = isCooldown && !cooldownReady
    ? Math.min(((now - Number(pos.cooldownStart)) / (Number(pos.cooldownEnd) - Number(pos.cooldownStart))) * 100, 100)
    : 0;

  return (
    <div className="border-b border-white/5 last:border-b-0">
      <div
        className="flex items-center gap-4 py-3 px-2 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-sm font-mono text-gray-500 w-8">#{Number(pos.id)}</span>
        <span className="text-sm font-mono text-white flex-1 truncate">{fmtFull(pos.amount)} $XKI</span>
        <span className="text-sm text-gray-400 hidden lg:block flex-1 truncate">
          {TIER_EMOJI[tier]} {TIER_NAME[tier]} · {TIER_DURATION[tier]}m · {TIER_MULT[tier]}x
        </span>
        <span className="text-sm font-mono text-white hidden lg:block w-28 text-right truncate">{fmt(pos.weight)}</span>
        <div className="flex items-center gap-2 shrink-0">
          {pos.fromVesting && (
            <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded hidden sm:inline">Vesting</span>
          )}
          <StatusBadge status={status} />
        </div>
        <svg className={`w-3 h-3 text-gray-500 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 10 6">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Cooldown progress bar */}
      {isCooldown && !cooldownReady && (
        <div className="px-2 pb-2">
          <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400/50 rounded-full transition-all" style={{ width: `${cooldownPct}%` }} />
          </div>
          <p className="text-[9px] text-amber-400/70 mt-1">{cooldownRemaining}</p>
        </div>
      )}

      {/* Expanded actions */}
      {expanded && (
        <div className="px-2 pb-4 pt-1 space-y-3">
          {/* Mobile tier info */}
          <p className="text-sm text-gray-400 sm:hidden">
            {TIER_EMOJI[tier]} {TIER_NAME[tier]} · {TIER_DURATION[tier]}m · {TIER_MULT[tier]}x · Weight: {fmt(pos.weight)}
          </p>

          <div className="flex flex-wrap gap-2">
            {status === 'active' && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); requestUnstake({ address: XKI_STAKING, abi: xkiStakingAbi, functionName: 'requestUnstake', args: [pos.id] }); }}
                  disabled={reqPending || reqConfirming}
                  className="px-4 py-2 border border-white/20 text-gray-400 text-[10px] uppercase tracking-widest hover:text-white hover:border-white/40 transition-colors disabled:opacity-30"
                >
                  {reqPending || reqConfirming ? 'Processing...' : reqSuccess ? 'Requested ✓' : 'Request Unstake'}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmHard(true); }}
                  className="px-4 py-2 border border-red-500/30 text-red-400/70 text-[10px] uppercase tracking-widest hover:text-red-400 hover:border-red-500/50 transition-colors"
                >
                  Hard Unstake
                </button>
              </>
            )}
            {status === 'cooldown' && (
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmHard(true); }}
                className="px-4 py-2 border border-red-500/30 text-red-400/70 text-[10px] uppercase tracking-widest hover:text-red-400 hover:border-red-500/50 transition-colors"
              >
                Hard Unstake
              </button>
            )}
            {status === 'ready' && (
              <button
                onClick={(e) => { e.stopPropagation(); completeUnstake({ address: XKI_STAKING, abi: xkiStakingAbi, functionName: 'completeUnstake', args: [pos.id] }); }}
                disabled={compPending || compConfirming}
                className="px-4 py-2 bg-white text-black text-[10px] uppercase tracking-widest font-bold hover:bg-gray-200 transition-colors disabled:opacity-30"
              >
                {compPending || compConfirming ? 'Processing...' : compSuccess ? 'Withdrawn ✓' : 'Complete Unstake'}
              </button>
            )}
          </div>

          {/* Hard unstake confirmation */}
          {confirmHard && (
            <div className="border border-red-500/20 bg-red-500/5 rounded p-4 space-y-3">
              <p className="text-xs text-red-400 leading-relaxed">
                <strong>10% of your staked amount will be permanently burned.</strong> This action is irreversible.
              </p>
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest text-gray-500">You receive</span>
                <span className="text-sm font-mono text-white">{fmtFull(pos.amount * 9n / 10n)} $XKI</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest text-red-400">Burned (10%)</span>
                <span className="text-sm font-mono text-red-400">-{fmtFull(pos.amount / 10n)} $XKI</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); hardUnstake({ address: XKI_STAKING, abi: xkiStakingAbi, functionName: 'hardUnstake', args: [pos.id] }); }}
                  disabled={hardPending || hardConfirming}
                  className="px-4 py-2 bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] uppercase tracking-widest font-bold hover:bg-red-500/30 transition-colors disabled:opacity-30"
                >
                  {hardPending || hardConfirming ? 'Processing...' : hardSuccess ? 'Done ✓' : 'Burn 10% & Withdraw'}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmHard(false); }}
                  className="px-4 py-2 border border-white/10 text-gray-500 text-[10px] uppercase tracking-widest hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StakingSection({ address }: { address: Address }) {
  const { data: positions, isLoading: posLoading } = useStakingPositions(address);
  const { data: weight } = useEffectiveWeight(address);
  const { data: rewardTokens } = useRewardTokens();
  const { data: earnedResults, isLoading: rewardsLoading } = useEarnedRewards(address, rewardTokens as Address[] | undefined);
  const { data: symbols } = useRewardTokenSymbols(rewardTokens as Address[] | undefined);

  const { writeContract: claimRewards, data: claimTx, isPending: claiming } = useWriteContract();
  const { isLoading: claimConfirming, isSuccess: claimSuccess } = useWaitForTransactionReceipt({ hash: claimTx });

  const now = Math.floor(Date.now() / 1000);
  const activePositions = positions
    ? (positions as StakePosition[]).filter((p) => p.active || p.cooldownActive)
    : [];

  const rewards: { token: Address; amount: bigint; symbol: string }[] = [];
  let totalRewards = 0n;
  if (rewardTokens && earnedResults && symbols) {
    (rewardTokens as Address[]).forEach((token, i) => {
      const amount = earnedResults[i]?.status === 'success' ? earnedResults[i].result as bigint : 0n;
      const sym = symbols[i]?.status === 'success' ? symbols[i].result as string : '???';
      if (amount > 0n) {
        rewards.push({ token, amount, symbol: sym });
        totalRewards += amount;
      }
    });
  }

  const handleClaim = () => {
    if (!rewardTokens) return;
    claimRewards({
      address: XKI_REWARD_DISTRIBUTOR,
      abi: xkiRewardDistributorAbi,
      functionName: 'claimRewards',
      args: [rewardTokens as Address[]],
    });
  };

  if (posLoading) {
    return (
      <div className="glass-panel p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-white/10 rounded" />
          <div className="h-12 w-full bg-white/10 rounded" />
          <div className="h-12 w-full bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">⚡</span>
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold">Staking</h2>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-gray-500">
          Total Weight: <span className="text-white font-mono">{weight ? fmt(weight as bigint) : '0'}</span>
        </span>
      </div>

      {/* Table Header (desktop) */}
      {activePositions.length > 0 && (
        <div className="hidden sm:flex items-center gap-4 px-2 text-[9px] uppercase tracking-[0.3em] text-gray-600">
          <span className="w-8">#</span>
          <span className="flex-1">Amount</span>
          <span className="flex-1 hidden lg:block">Tier</span>
          <span className="w-28 text-right hidden lg:block">Weight</span>
          <span className="shrink-0">Status</span>
          <span className="w-3 shrink-0" />
        </div>
      )}

      {/* Positions */}
      {activePositions.length > 0 ? (
        <div>
          {activePositions.map((pos) => (
            <PositionRow key={Number((pos as StakePosition).id)} pos={pos as StakePosition} now={now} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-6">No staking positions</p>
      )}

      {/* Rewards */}
      <div className="border-t border-white/5 pt-6 space-y-4">
        <h3 className="text-[9px] uppercase tracking-[0.3em] text-gray-600">Rewards</h3>

        {rewards.length > 0 ? (
          <div className="space-y-2">
            {rewards.map((r) => (
              <div key={r.token} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🪙</span>
                  <span className="text-sm font-mono text-white">{fmtFull(r.amount)} ${r.symbol}</span>
                </div>
                <span className="text-[10px] font-mono text-gray-600">{r.token.slice(0, 6)}...{r.token.slice(-4)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No rewards accrued yet</p>
        )}

        <button
          onClick={handleClaim}
          disabled={totalRewards === 0n || claiming || claimConfirming}
          className="px-5 py-2.5 bg-white text-black text-[10px] uppercase tracking-widest font-bold hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {claiming || claimConfirming ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" />
              {claimConfirming ? 'Confirming...' : 'Claiming...'}
            </span>
          ) : claimSuccess ? 'Claimed ✓' : 'Claim All Rewards'}
        </button>
      </div>
    </div>
  );
}
