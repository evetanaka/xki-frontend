import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits, type Address } from 'viem';
import {
  Wallet, ArrowLeftRight, PlusCircle, Copy, ChevronRight,
  Layers, Gift, Download, Clock, Zap, Info, AlertCircle, ArrowDown, X, Unlock
} from 'lucide-react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useStakingSimulator } from '../hooks/useStakingSimulator';
import { MULTIPLIERS, DURATIONS, TIER_NAMES, TIER_EMOJIS } from '../lib/constants';
import WalletButton from '../components/WalletButton';
import {
  XKI_TOKEN, XKI_STAKING, XKI_REWARD_DISTRIBUTOR,
  xkiTokenAbi, xkiStakingAbi, xkiRewardDistributorAbi, vestingAbi,
} from '../config/contracts';
import {
  useXKIBalance, useAllowance, useStakingPositions, useEffectiveWeight,
  useTotalStaked, useRewardTokens, useEarnedRewards, useRewardTokenSymbols,
  useVestingInfo,
} from '../hooks/useWallet';

const tiers = [
  { emoji: '🔭', duration: '3 months', name: 'Explorer', mult: '1x', cooldown: '3 months', benefit: 'Base rewards from all ecosystem projects', highlight: false },
  { emoji: '🏗️', duration: '6 months', name: 'Builder', mult: '2x', cooldown: '6 months', benefit: 'Early access to ecosystem projects', highlight: false },
  { emoji: '⚖️', duration: '12 months', name: 'Architect', mult: '3x', cooldown: '12 months', benefit: 'Governance voting power', highlight: true },
  { emoji: '🔑', duration: '24 months', name: 'Founder', mult: '4x', cooldown: '24 months', benefit: 'Ecosystem projects private sale access', highlight: false },
  { emoji: '🚀', duration: '36 months', name: 'Visionary', mult: '5x', cooldown: '36 months', benefit: 'Ecosystem projects TGE Airdrops', highlight: false },
];

const TIER_DURATIONS = [3, 6, 12, 24, 36];
const TIER_DURATION_MAP: Record<number, number> = { 0: 3, 1: 6, 2: 12, 3: 24, 4: 36 };
const TIER_EMOJI_MAP: Record<number, string> = { 0: '🔭', 1: '🏗️', 2: '⚖️', 3: '🔑', 4: '🚀' };
const TIER_NAME_MAP: Record<number, string> = { 0: 'Explorer', 1: 'Builder', 2: 'Architect', 3: 'Founder', 4: 'Visionary' };
const TIER_MULT_MAP: Record<number, number> = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5 };

function fmt(value: bigint, decimals = 18): string {
  const num = Number(formatUnits(value, decimals));
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num);
}

function fmtFull(value: bigint, decimals = 18): string {
  const num = Number(formatUnits(value, decimals));
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num);
}

function Pulse({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-white/10 ${className}`} />;
}

export default function StakePage() {
  const [showHardUnstakeModal, setShowHardUnstakeModal] = useState(false);
  const [showCooldownModal, setShowCooldownModal] = useState(false);
  const [selectedStakeId, setSelectedStakeId] = useState<bigint | null>(null);
  const [selectedStakeAmount, setSelectedStakeAmount] = useState<bigint>(0n);
  const [selectedStakeTier, setSelectedStakeTier] = useState<number>(0);
  const [stakeTier, setStakeTier] = useState(2);
  const [stakeAmount, setStakeAmount] = useState('');
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const sim = useStakingSimulator();

  const headerRef = useIntersectionObserver<HTMLDivElement>();
  const statsRef = useIntersectionObserver<HTMLDivElement>();

  const { address, isConnected } = useAccount();

  // On-chain reads
  const { data: xkiBalance, isLoading: balLoading } = useXKIBalance(address);
  const { data: allowance, refetch: refetchAllowance } = useAllowance(address);
  const { data: positions, isLoading: posLoading, refetch: refetchPositions } = useStakingPositions(address);
  const { data: effectiveWeight, isLoading: ewLoading } = useEffectiveWeight(address);
  const { data: tvl, isLoading: tvlLoading } = useTotalStaked();
  const { data: rewardTokens } = useRewardTokens();
  const { data: earnedResults, isLoading: earnedLoading } = useEarnedRewards(address, rewardTokens as Address[] | undefined);
  const { data: symbolResults } = useRewardTokenSymbols(rewardTokens as Address[] | undefined);
  const vestingInfo = useVestingInfo(address);

  // Write contracts
  const { writeContract: approve, data: approveTxHash, isPending: approving } = useWriteContract();
  const { writeContract: stake, data: stakeTxHash, isPending: staking } = useWriteContract();
  const { writeContract: requestUnstake, data: cooldownTxHash, isPending: requestingUnstake } = useWriteContract();
  const { writeContract: completeUnstake, data: completeTxHash } = useWriteContract();
  const { writeContract: hardUnstake, data: hardTxHash, isPending: hardUnstaking } = useWriteContract();
  const { writeContract: claimRewards, data: claimTxHash, isPending: claiming } = useWriteContract();
  const { writeContract: releaseVesting, data: releaseTxHash, isPending: releasing } = useWriteContract();

  const { isSuccess: approveSuccess, isLoading: approveConfirming } = useWaitForTransactionReceipt({ hash: approveTxHash });
  const { isSuccess: stakeSuccess, isLoading: stakeConfirming } = useWaitForTransactionReceipt({ hash: stakeTxHash });
  const { isSuccess: cooldownSuccess, isLoading: cooldownConfirming } = useWaitForTransactionReceipt({ hash: cooldownTxHash });
  const { isSuccess: hardSuccess, isLoading: hardConfirming } = useWaitForTransactionReceipt({ hash: hardTxHash });
  const { isSuccess: claimSuccess, isLoading: claimConfirming } = useWaitForTransactionReceipt({ hash: claimTxHash });

  // After approve succeeds, auto-trigger stake
  useEffect(() => {
    if (approveSuccess && stakeAmount && address) {
      const amount = parseUnits(stakeAmount, 18);
      stake({
        address: XKI_STAKING,
        abi: xkiStakingAbi,
        functionName: 'stake',
        args: [amount, stakeTier],
      });
    }
  }, [approveSuccess]);

  // Refetch after stake/unstake/claim
  useEffect(() => {
    if (stakeSuccess || cooldownSuccess || hardSuccess || claimSuccess) {
      refetchPositions();
      refetchAllowance();
    }
  }, [stakeSuccess, cooldownSuccess, hardSuccess, claimSuccess]);

  // Tick timer for cooldowns
  useEffect(() => {
    const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 10000);
    return () => clearInterval(interval);
  }, []);

  // Derived data
  const activePositions = positions?.filter((p) => p.active) ?? [];
  const totalStaked = activePositions.reduce((sum, p) => sum + p.amount, 0n);

  const rewardList = (rewardTokens ?? []).map((token, i) => {
    const earned = earnedResults?.[i]?.status === 'success' ? (earnedResults[i].result as bigint) : 0n;
    const symbol = symbolResults?.[i]?.status === 'success' ? (symbolResults[i].result as string) : '???';
    return { token: token as Address, earned, symbol };
  }).filter(r => r.earned > 0n);

  const totalClaimable = rewardList.reduce((s, r) => s + r.earned, 0n);

  // Stake action
  const handleStake = () => {
    if (!stakeAmount || !address) return;
    try {
      const amount = parseUnits(stakeAmount, 18);
      const needsApproval = allowance === undefined || allowance < amount;
      console.log('[Stake] amount:', amount.toString(), 'tier:', stakeTier, 'allowance:', allowance?.toString(), 'needsApproval:', needsApproval);
      if (needsApproval) {
        approve({
          address: XKI_TOKEN,
          abi: xkiTokenAbi,
          functionName: 'approve',
          args: [XKI_STAKING, amount],
        }, {
          onError: (err) => console.error('[Approve Error]', err),
          onSuccess: (hash) => console.log('[Approve TX]', hash),
        });
      } else {
        stake({
          address: XKI_STAKING,
          abi: xkiStakingAbi,
          functionName: 'stake',
          args: [amount, stakeTier],
        }, {
          onError: (err) => console.error('[Stake Error]', err),
          onSuccess: (hash) => console.log('[Stake TX]', hash),
        });
      }
    } catch (err) {
      console.error('[handleStake Error]', err);
    }
  };

  const handleClaimAll = () => {
    if (!rewardTokens || rewardTokens.length === 0) return;
    claimRewards({
      address: XKI_REWARD_DISTRIBUTOR,
      abi: xkiRewardDistributorAbi,
      functionName: 'claimRewards',
      args: [rewardTokens as Address[]],
    });
  };

  const handleRequestUnstake = (stakeId: bigint) => {
    requestUnstake({
      address: XKI_STAKING,
      abi: xkiStakingAbi,
      functionName: 'requestUnstake',
      args: [stakeId],
    });
  };

  const handleCompleteUnstake = (stakeId: bigint) => {
    completeUnstake({
      address: XKI_STAKING,
      abi: xkiStakingAbi,
      functionName: 'completeUnstake',
      args: [stakeId],
    });
  };

  const handleHardUnstake = () => {
    if (selectedStakeId === null) return;
    hardUnstake({
      address: XKI_STAKING,
      abi: xkiStakingAbi,
      functionName: 'hardUnstake',
      args: [selectedStakeId],
    });
    setShowHardUnstakeModal(false);
  };

  const handleRelease = () => {
    if (!vestingInfo.vestingAddress) return;
    releaseVesting({
      address: vestingInfo.vestingAddress,
      abi: vestingAbi,
      functionName: 'release',
    });
  };

  function cooldownTimeLeft(end: bigint): string {
    const diff = Number(end) - now;
    if (diff <= 0) return 'Ready';
    const days = Math.floor(diff / 86400);
    const months = Math.floor(days / 30);
    if (months > 0) return `~${months} month${months > 1 ? 's' : ''} left`;
    if (days > 0) return `~${days} day${days > 1 ? 's' : ''} left`;
    const hours = Math.floor(diff / 3600);
    return `~${hours} hour${hours > 1 ? 's' : ''} left`;
  }

  function cooldownProgress(start: bigint, end: bigint): number {
    const total = Number(end) - Number(start);
    if (total <= 0) return 100;
    const elapsed = now - Number(start);
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }

  return (
    <div className="bg-[#050505]">
      {/* Coming soon modal removed */}
      {/* Header */}
      <section className="pt-28 pb-8 px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div ref={headerRef} className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 parallax-section">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-gray-500 mb-2">Ki Foundation</p>
              <h1 className="text-3xl md:text-4xl font-serif text-white gradient-text">Staking</h1>
            </div>
            <p className="text-xs text-gray-500 font-light max-w-md">Lock your $XKI tokens, earn rewards from every project in the ecosystem. The longer you commit, the more you earn.</p>
          </div>

          <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 parallax-section">
            <div className="glass-panel p-5 text-center">
              <p className="text-[9px] uppercase tracking-[0.3em] text-gray-600 mb-2">Total Value Locked</p>
              {tvlLoading ? <Pulse className="h-7 w-24 mx-auto" /> : <p className="text-xl font-serif text-white">{tvl ? `${fmtFull(tvl)} XKI` : '—'}</p>}
            </div>
            <div className="glass-panel p-5 text-center">
              <p className="text-[9px] uppercase tracking-[0.3em] text-gray-600 mb-2">Average APY</p>
              <p className="text-xl font-serif text-white">—</p>
            </div>
            <div className="glass-panel p-5 text-center">
              <p className="text-[9px] uppercase tracking-[0.3em] text-gray-600 mb-2">Total Stakers</p>
              <p className="text-xl font-serif text-white">—</p>
            </div>
            <div className="glass-panel p-5 text-center">
              <p className="text-[9px] uppercase tracking-[0.3em] text-gray-600 mb-2">Reward Tokens</p>
              <p className="text-xl font-serif text-white">{rewardTokens ? rewardTokens.length.toString() : '—'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DISCONNECTED VIEW ═══ */}
      {!isConnected && (
        <>
          {/* Tiers */}
          <section className="py-12 px-6 md:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-serif text-white mb-2">Choose Your Commitment</h2>
                <p className="text-xs text-gray-500">Higher lock duration = higher multiplier = more rewards</p>
              </div>
              <div className="glass-panel overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      <th className="text-left text-[10px] uppercase tracking-widest text-gray-500 py-4 px-6 font-normal w-12" />
                      <th className="text-left text-[10px] uppercase tracking-widest text-gray-500 py-4 px-4 font-normal">Duration</th>
                      <th className="text-left text-[10px] uppercase tracking-widest text-gray-500 py-4 px-4 font-normal">Tier</th>
                      <th className="text-center text-[10px] uppercase tracking-widest text-gray-500 py-4 px-4 font-normal">Multiplier</th>
                      <th className="text-left text-[10px] uppercase tracking-widest text-gray-500 py-4 px-4 font-normal hidden md:table-cell">Cooldown</th>
                      <th className="text-left text-[10px] uppercase tracking-widest text-gray-500 py-4 px-6 font-normal">Benefits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiers.map((tier, i) => (
                      <tr key={i} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${tier.highlight ? 'bg-white/[0.01]' : ''} ${i === tiers.length - 1 ? 'border-b-0' : ''}`}>
                        <td className="py-5 px-6 text-xl">{tier.emoji}</td>
                        <td className="py-5 px-4 text-sm text-white font-serif">{tier.duration}</td>
                        <td className="py-5 px-4"><span className={`text-xs uppercase tracking-wider ${tier.highlight ? 'text-white' : 'text-gray-400'}`}>{tier.name}</span></td>
                        <td className="py-5 px-4 text-center"><span className="text-lg font-mono text-white font-bold">{tier.mult}</span></td>
                        <td className="py-5 px-4 text-xs text-gray-500 hidden md:table-cell">{tier.cooldown}</td>
                        <td className="py-5 px-6 text-xs text-gray-500">{tier.benefit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Simulator */}
          <section className="py-12 px-6 md:px-8">
            <div className="max-w-2xl mx-auto">
              <div className="glass-panel p-8 md:p-12">
                <h3 className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-8 text-center font-serif">Rewards Simulator</h3>
                <div className="space-y-8">
                  <div>
                    <div className="flex justify-between items-end mb-3">
                      <label className="text-[10px] uppercase tracking-widest text-gray-500">Stake Amount</label>
                      <span className="text-lg font-mono text-white">{sim.amount.toLocaleString()} XKI</span>
                    </div>
                    <input type="range" min="1000" max="10000000" value={sim.amount} step="1000" onChange={(e) => sim.setAmount(Number(e.target.value))} className="w-full" />
                    <div className="flex justify-between text-[9px] text-gray-600 mt-1"><span>1K</span><span>10M</span></div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-3">Lock Duration</label>
                    <div className="grid grid-cols-5 gap-2">
                      {DURATIONS.map((d) => (
                        <button key={d} onClick={() => sim.setDuration(d)} className={`tier-card py-3 border border-white/10 text-center ${sim.duration === d ? 'active' : ''}`}>
                          <span className="block text-sm font-mono text-white">{d}m</span>
                          <span className="block text-[9px] text-gray-600 mt-1">{MULTIPLIERS[d]}x</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-white/10 pt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500">Effective Power</span>
                      <span className="text-lg font-mono text-white">{sim.power.toLocaleString()} XKI</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500">Tier</span>
                      <span className="text-sm text-white uppercase tracking-wider">{sim.tierName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500">Est. Monthly Rewards</span>
                      <span className="text-lg font-mono text-white">~{sim.monthlyDAR < 1 ? sim.monthlyDAR.toFixed(2) : Math.round(sim.monthlyDAR).toLocaleString()} $DAR</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Buy XKI */}
          <section className="py-12 px-6 md:px-8">
            <div className="max-w-2xl mx-auto">
              <div className="glass-panel p-8 text-center">
                <div className="text-3xl mb-4">💱</div>
                <h3 className="text-sm uppercase tracking-[0.15em] text-white mb-2 font-serif">Get XKI</h3>
                <p className="text-xs text-gray-500 font-light mb-6">Acquire $XKI tokens to start staking and earning ecosystem rewards.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a href="#" className="px-6 py-3 bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors flex items-center gap-2">
                    <ArrowLeftRight className="w-3 h-3" />
                    Swap on Uniswap
                  </a>
                  <button className="px-6 py-3 border border-white/20 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/5 transition-colors flex items-center gap-2">
                    <PlusCircle className="w-3 h-3" />
                    Add to MetaMask
                  </button>
                </div>
                <div className="mt-6 flex items-center justify-center gap-2">
                  <span className="text-[9px] font-mono text-gray-600">0xeA8704...3b621</span>
                  <button onClick={() => navigator.clipboard.writeText(XKI_TOKEN)} className="text-gray-600 hover:text-white transition-colors">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Connect CTA */}
          <section className="py-16 px-6 md:px-8">
            <div className="max-w-lg mx-auto text-center">
              <div className="w-16 h-16 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wallet className="w-6 h-6 text-gray-500" />
              </div>
              <h3 className="text-xl font-serif text-white mb-3">Connect Your Wallet</h3>
              <p className="text-xs text-gray-500 font-light mb-8">Connect with MetaMask, Keplr, or any wallet to view your positions, stake, and claim rewards.</p>
              <div className="flex justify-center">
                <WalletButton />
              </div>
            </div>
          </section>
        </>
      )}

      {/* ═══ CONNECTED VIEW ═══ */}
      {isConnected && (
        <>
          {/* Dashboard */}
          <section className="py-8 px-6 md:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-5">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-gray-600 mb-2">My Total Staked</p>
                  {posLoading ? <Pulse className="h-7 w-32" /> : <p className="text-xl font-serif text-white">{fmtFull(totalStaked)} XKI</p>}
                </div>
                <div className="glass-panel p-5">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-gray-600 mb-2">Effective Weight</p>
                  {ewLoading ? <Pulse className="h-7 w-24" /> : <p className="text-xl font-serif text-white">{effectiveWeight ? fmtFull(effectiveWeight) : '0'}</p>}
                  <p className="text-[10px] text-gray-600 mt-1">weighted power</p>
                </div>
                <div className="glass-panel p-5">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-gray-600 mb-2">Active Positions</p>
                  <p className="text-xl font-serif text-white">{activePositions.length}</p>
                </div>
                <div className="glass-panel p-5 relative">
                  {totalClaimable > 0n && <div className="absolute top-3 right-3 w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
                  <p className="text-[9px] uppercase tracking-[0.3em] text-gray-600 mb-2">Total Claimable</p>
                  {earnedLoading ? <Pulse className="h-7 w-20" /> : (
                    <p className="text-xl font-serif text-white">{rewardList.length > 0 ? `${rewardList.length} token${rewardList.length > 1 ? 's' : ''}` : 'None'}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Wallet className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-400">Available in wallet:</span>
                  {balLoading ? <Pulse className="h-5 w-24" /> : <span className="text-sm font-mono text-white">{xkiBalance ? fmtFull(xkiBalance) : '0'} XKI</span>}
                </div>
                <a href="#new-stake" className="text-[10px] uppercase tracking-widest text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                  Stake more <ArrowDown className="w-3 h-3" />
                </a>
              </div>
            </div>
          </section>

          {/* My Positions */}
          <section className="py-8 px-6 md:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Layers className="w-4 h-4 text-gray-500" />
                  <h2 className="text-lg font-serif text-white">My Positions</h2>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-gray-500">{activePositions.length} active</span>
              </div>

              {posLoading ? (
                <div className="space-y-4">
                  <Pulse className="h-40 w-full" />
                  <Pulse className="h-40 w-full" />
                </div>
              ) : positions && positions.length > 0 ? (
                <div className="space-y-4">
                  {positions.filter(p => p.active).map((pos) => {
                    const tier = Number(pos.lockTier);
                    const isCooldown = pos.cooldownActive;
                    const cooldownReady = isCooldown && Number(pos.cooldownEnd) <= now;
                    const stakeDate = new Date(Number(pos.startTime) * 1000);

                    return (
                      <div key={pos.id.toString()} className={`glass-panel p-6 ${isCooldown ? 'border-yellow-500/10' : ''}`}>
                        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                          <div className="flex-grow">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-[10px] uppercase tracking-widest text-gray-400 bg-white/5 px-2 py-1">Position #{pos.id.toString()}</span>
                              {isCooldown ? (
                                <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                  {cooldownReady ? 'Ready to Withdraw' : 'Cooldown'}
                                </span>
                              ) : (
                                <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20">Earning</span>
                              )}
                              <span className="text-[9px] uppercase tracking-wider text-gray-500">
                                {TIER_EMOJI_MAP[tier]} {TIER_NAME_MAP[tier]} · {TIER_MULT_MAP[tier]}x
                              </span>
                              {pos.fromVesting && <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20">Vesting</span>}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                              <div><p className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">Amount</p><p className="text-sm font-mono text-white">{fmtFull(pos.amount)} XKI</p></div>
                              <div><p className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">Tier</p><p className="text-sm text-white">{TIER_DURATION_MAP[tier]}m · {TIER_MULT_MAP[tier]}x</p></div>
                              <div>
                                <p className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">{isCooldown ? 'Cooldown Ends' : 'Staked Since'}</p>
                                <p className={`text-sm ${isCooldown ? 'text-yellow-400' : 'text-gray-400'}`}>
                                  {isCooldown ? (cooldownReady ? 'Now!' : new Date(Number(pos.cooldownEnd) * 1000).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })) : stakeDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            {isCooldown && !cooldownReady && (
                              <>
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="flex-grow h-1.5 bg-white/5 rounded-sm overflow-hidden">
                                    <div className="h-full bg-yellow-500/40 rounded-sm" style={{ width: `${cooldownProgress(pos.cooldownStart, pos.cooldownEnd)}%` }} />
                                  </div>
                                  <span className="text-[10px] font-mono text-yellow-500 whitespace-nowrap">{cooldownTimeLeft(pos.cooldownEnd)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-yellow-500/60">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>No rewards during cooldown · Weight removed</span>
                                </div>
                              </>
                            )}
                            {!isCooldown && (
                              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                <Info className="w-3 h-3" />
                                <span>Cooldown to unstake: <strong className="text-white">{TIER_DURATION_MAP[tier]} months</strong> · Or hard unstake now (10% burn)</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-row lg:flex-col gap-2 lg:min-w-[160px]">
                            {cooldownReady ? (
                              <button onClick={() => handleCompleteUnstake(pos.id)} className="flex-1 lg:flex-none py-2.5 px-4 bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors text-center">Withdraw</button>
                            ) : isCooldown ? (
                              <button disabled className="flex-1 lg:flex-none py-2.5 px-4 bg-gray-900 text-gray-600 text-[10px] font-bold uppercase tracking-widest cursor-not-allowed text-center">Waiting...</button>
                            ) : (
                              <button onClick={() => { setSelectedStakeId(pos.id); setSelectedStakeAmount(pos.amount); setSelectedStakeTier(tier); setShowCooldownModal(true); }} className="flex-1 lg:flex-none py-2.5 px-4 border border-white/20 text-gray-400 text-[10px] uppercase tracking-widest hover:text-white hover:border-white/40 transition-colors text-center flex items-center justify-center gap-1">
                                <Clock className="w-3 h-3" /> Cooldown
                              </button>
                            )}
                            <button onClick={() => { setSelectedStakeId(pos.id); setSelectedStakeAmount(pos.amount); setShowHardUnstakeModal(true); }} className="flex-1 lg:flex-none py-2.5 px-4 border border-white/10 text-gray-600 text-[10px] uppercase tracking-widest hover:text-red-400 hover:border-red-900 transition-colors text-center flex items-center justify-center gap-1">
                              <Zap className="w-3 h-3" /> Hard Unstake
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="glass-panel p-8 text-center">
                  <p className="text-gray-500 text-sm">No staking positions yet. Create your first stake below.</p>
                </div>
              )}
            </div>
          </section>

          {/* Vesting Section */}
          {vestingInfo.vestingAddress && vestingInfo.data && (
            <section className="py-8 px-6 md:px-8">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <Unlock className="w-4 h-4 text-gray-500" />
                  <h2 className="text-lg font-serif text-white">Vesting</h2>
                </div>
                <div className="glass-panel p-6 md:p-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">Total Allocation</p>
                      <p className="text-sm font-mono text-white">{fmtFull(vestingInfo.data.totalAllocation)} XKI</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">Released</p>
                      <p className="text-sm font-mono text-white">{fmtFull(vestingInfo.data.released)} XKI</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">Releasable Now</p>
                      <p className="text-sm font-mono text-green-400">{fmtFull(vestingInfo.data.releasable)} XKI</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">Locked Balance</p>
                      <p className="text-sm font-mono text-white">{fmtFull(vestingInfo.data.lockedBalance)} XKI</p>
                    </div>
                  </div>

                  {/* Vesting Progress */}
                  <div className="mb-6">
                    <div className="flex justify-between text-[9px] uppercase tracking-widest text-gray-600 mb-2">
                      <span>May 2025</span>
                      <span>Cliff: May 2027</span>
                      <span>End: May 2028</span>
                    </div>
                    {(() => {
                      const startTs = 1746057600; // May 1 2025
                      const cliffTs = 1809129600; // May 1 2027
                      const endTs = 1840665600; // May 1 2028
                      const total = endTs - startTs;
                      const elapsed = Math.max(0, now - startTs);
                      const pct = Math.min(100, (elapsed / total) * 100);
                      const cliffPct = ((cliffTs - startTs) / total) * 100;
                      const inCliff = now < cliffTs;
                      return (
                        <div className="relative h-2 bg-white/5">
                          <div className="absolute left-0 top-0 h-full bg-white/20" style={{ width: `${cliffPct}%` }} />
                          <div className="absolute left-0 top-0 h-full" style={{ width: `${pct}%`, background: inCliff ? 'rgba(234,179,8,0.4)' : 'rgba(74,222,128,0.4)' }} />
                          <div className="absolute top-0 h-full w-px bg-white/30" style={{ left: `${cliffPct}%` }} />
                        </div>
                      );
                    })()}
                    <div className="flex justify-between text-[9px] text-gray-600 mt-1">
                      <span>Cliff phase (0% vested)</span>
                      <span>Linear vesting</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleRelease}
                      disabled={releasing || vestingInfo.data.releasable === 0n}
                      className="px-6 py-3 bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors disabled:bg-gray-900 disabled:text-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Download className="w-3 h-3" />
                      {releasing ? 'Releasing...' : 'Release Tokens'}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-4 leading-relaxed">
                    <strong className="text-gray-400">Stake from Vesting:</strong> You can stake your locked tokens directly from this vesting contract by using the "Stake from Vesting" option in the New Stake form below. This allows you to earn rewards on tokens that haven't vested yet.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Rewards Panel */}
          <section className="py-8 px-6 md:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <Gift className="w-4 h-4 text-gray-500" />
                <h2 className="text-lg font-serif text-white">Rewards</h2>
              </div>

              <div className="glass-panel p-6">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-4">Claimable Rewards</p>
                {earnedLoading ? (
                  <div className="space-y-3 mb-6">
                    <Pulse className="h-12 w-full" />
                    <Pulse className="h-12 w-full" />
                  </div>
                ) : rewardList.length > 0 ? (
                  <>
                    <div className="space-y-3 mb-6">
                      {rewardList.map((r) => (
                        <div key={r.token} className="flex items-center justify-between py-3 border-b border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold text-white">{r.symbol[0]}</div>
                            <div>
                              <p className="text-sm text-white font-mono">{fmt(r.earned)} ${r.symbol}</p>
                              <p className="text-[10px] text-gray-600 font-mono">{r.token.slice(0, 6)}...{r.token.slice(-4)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleClaimAll}
                      disabled={claiming || claimConfirming}
                      className="w-full py-3 bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-900 disabled:text-gray-600 disabled:cursor-not-allowed"
                    >
                      <Download className="w-3 h-3" />
                      {claiming ? 'Confirm in wallet...' : claimConfirming ? 'Claiming ⏳' : 'Claim All Rewards'}
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 py-4">No claimable rewards yet. Stake XKI to start earning.</p>
                )}
              </div>
            </div>
          </section>

          {/* New Stake */}
          <section id="new-stake" className="py-8 px-6 md:px-8 pb-16">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <PlusCircle className="w-4 h-4 text-gray-500" />
                <h2 className="text-lg font-serif text-white">New Stake</h2>
              </div>

              <div className="glass-panel p-8 md:p-10">
                <div className="mb-8">
                  <div className="flex justify-between items-end mb-3">
                    <label className="text-[10px] uppercase tracking-widest text-gray-500">Amount</label>
                    <button
                      onClick={() => xkiBalance && setStakeAmount(formatUnits(xkiBalance, 18))}
                      className="text-[9px] uppercase tracking-widest text-gray-500 hover:text-white transition-colors border border-white/10 px-2 py-0.5"
                    >
                      MAX
                    </button>
                  </div>
                  <div className="flex items-center border-b border-white/20 pb-2 gap-3">
                    <input type="number" placeholder="0" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} className="flex-grow bg-transparent text-2xl font-mono text-white placeholder-gray-800 focus:outline-none" />
                    <span className="text-sm text-gray-500 font-mono">XKI</span>
                  </div>
                  <p className="text-[10px] text-gray-600 mt-2">Balance: <span className="font-mono">{xkiBalance ? fmtFull(xkiBalance) : '0'} XKI</span></p>
                </div>

                <div className="mb-8">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-3">Lock Duration</label>
                  <div className="grid grid-cols-5 gap-2">
                    {TIER_DURATIONS.map((d, i) => (
                      <button key={d} onClick={() => setStakeTier(i)} className={`tier-card py-4 border border-white/10 text-center ${stakeTier === i ? 'active' : ''}`}>
                        <span className="text-2xl block mb-1">{TIER_EMOJIS[d]}</span>
                        <span className="block text-xs font-mono text-white">{d}m</span>
                        <span className="block text-[9px] text-gray-600 mt-1">{MULTIPLIERS[d]}x</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6 mb-8 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500">Multiplier</span>
                    <span className="text-sm font-mono text-white">{MULTIPLIERS[TIER_DURATIONS[stakeTier]]}x</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500">Tier</span>
                    <span className="text-sm text-white">{TIER_EMOJIS[TIER_DURATIONS[stakeTier]]} {TIER_NAMES[TIER_DURATIONS[stakeTier]]}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500">Effective Weight</span>
                    <span className="text-sm font-mono text-white">{stakeAmount ? (Number(stakeAmount) * MULTIPLIERS[TIER_DURATIONS[stakeTier]]).toLocaleString() : '0'}</span>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-4 mb-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-gray-400 leading-relaxed"><strong className="text-white">Cooldown unstake:</strong> Request unstake → wait the cooldown period (= tier duration) → withdraw 100%. No rewards during cooldown.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-yellow-500/80 leading-relaxed"><strong className="text-yellow-400">Hard unstake:</strong> Withdraw immediately — 10% of your stake is burned permanently, 90% returned.</p>
                  </div>
                </div>

                <button
                  onClick={handleStake}
                  disabled={!stakeAmount || Number(stakeAmount) <= 0 || approving || approveConfirming || staking || stakeConfirming}
                  className="w-full py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors flex items-center justify-center gap-3 disabled:bg-gray-900 disabled:text-gray-600 disabled:cursor-not-allowed"
                >
                  {approving ? 'Confirm in wallet...' : approveConfirming ? 'Approving ⏳' : staking ? 'Confirm in wallet...' : stakeConfirming ? 'Staking ⏳' : stakeAmount && Number(stakeAmount) > 0
                    ? (allowance !== undefined && allowance < parseUnits(stakeAmount || '0', 18) ? `Approve & Stake ${Number(stakeAmount).toLocaleString()} XKI` : `Stake ${Number(stakeAmount).toLocaleString()} XKI`)
                    : 'Enter Amount to Stake'}
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ═══ HARD UNSTAKE MODAL ═══ */}
      {showHardUnstakeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md m-4 p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-serif text-white">Hard Unstake</h3>
                  <p className="text-[10px] text-gray-500">Immediate withdrawal</p>
                </div>
              </div>
              <button onClick={() => setShowHardUnstakeModal(false)} className="text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4 mb-6">
              <div className="bg-red-500/5 border border-red-500/15 p-4">
                <p className="text-xs text-red-400 leading-relaxed"><strong>10% of your staked amount will be permanently burned.</strong> This action is irreversible.</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest text-gray-500">Staked Amount</span><span className="text-sm font-mono text-white">{fmtFull(selectedStakeAmount)} XKI</span></div>
                <div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest text-red-400">Burn (10%)</span><span className="text-sm font-mono text-red-400">-{fmtFull(selectedStakeAmount / 10n)} XKI</span></div>
                <div className="h-[1px] bg-white/10" />
                <div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest text-gray-500">You Receive (90%)</span><span className="text-lg font-mono text-white">{fmtFull(selectedStakeAmount * 9n / 10n)} XKI</span></div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowHardUnstakeModal(false)} className="flex-1 py-3 border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-colors">Cancel</button>
              <button onClick={handleHardUnstake} disabled={hardUnstaking || hardConfirming} className="flex-1 py-3 bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/30 transition-colors disabled:opacity-50">
                {hardUnstaking ? 'Confirm in wallet...' : hardConfirming ? 'Processing ⏳' : 'Burn 10% & Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ COOLDOWN MODAL ═══ */}
      {showCooldownModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md m-4 p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-lg font-serif text-white">Start Cooldown</h3>
                  <p className="text-[10px] text-gray-500">Get 100% back after waiting period</p>
                </div>
              </div>
              <button onClick={() => setShowCooldownModal(false)} className="text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4 mb-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest text-gray-500">Staked Amount</span><span className="text-sm font-mono text-white">{fmtFull(selectedStakeAmount)} XKI</span></div>
                <div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest text-gray-500">Cooldown Period</span><span className="text-sm font-mono text-yellow-400">{TIER_DURATION_MAP[selectedStakeTier]} months</span></div>
                <div className="h-[1px] bg-white/10" />
                <div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest text-gray-500">You Receive</span><span className="text-lg font-mono text-green-400">{fmtFull(selectedStakeAmount)} XKI (100%)</span></div>
              </div>
              <div className="bg-yellow-500/5 border border-yellow-500/15 p-3 flex items-start gap-2">
                <AlertCircle className="w-3 h-3 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-yellow-500/80 leading-relaxed">Your staking weight will be removed immediately. <strong>No rewards during cooldown.</strong></p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCooldownModal(false)} className="flex-1 py-3 border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-colors">Cancel</button>
              <button
                onClick={() => { if (selectedStakeId !== null) { handleRequestUnstake(selectedStakeId); setShowCooldownModal(false); } }}
                disabled={requestingUnstake || cooldownConfirming}
                className="flex-1 py-3 bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {requestingUnstake ? 'Confirm in wallet...' : cooldownConfirming ? 'Processing ⏳' : 'Start Cooldown'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
