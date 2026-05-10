import { type Address, formatUnits } from 'viem';
import {
  useXKIBalance, useStakingPositions, useEffectiveWeight,
  useRewardTokens, useEarnedRewards, useVestingInfo,
} from '../../hooks/useWallet';

function fmt(value: bigint, decimals = 18): string {
  const num = Number(formatUnits(value, decimals));
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function Skeleton() {
  return <div className="animate-pulse bg-white/10 h-6 w-24 rounded" />;
}

function Card({ label, value, sub, isLoading }: { label: string; value: string; sub: string; isLoading: boolean }) {
  return (
    <div className="glass-panel p-5 hover-lift">
      <p className="text-[9px] uppercase tracking-[0.3em] text-gray-600 mb-2">{label}</p>
      {isLoading ? <Skeleton /> : (
        <>
          <p className="text-xl font-serif text-white stat-number" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</p>
          <p className="text-[10px] text-gray-500 mt-1">{sub}</p>
        </>
      )}
    </div>
  );
}

export default function OverviewCards({ address }: { address: Address }) {
  const { data: balance, isLoading: balLoading } = useXKIBalance(address);
  const { data: positions, isLoading: stakLoading } = useStakingPositions(address);
  const { data: weight, isLoading: weightLoading } = useEffectiveWeight(address);
  const { data: rewardTokens } = useRewardTokens();
  const { data: earnedResults, isLoading: rewardsLoading } = useEarnedRewards(address, rewardTokens as Address[] | undefined);
  const { vestingAddress, data: vesting, isLoading: vestLoading } = useVestingInfo(address);

  const totalStaked = positions
    ? (positions as any[]).filter((p: any) => p.active).reduce((sum: bigint, p: any) => sum + BigInt(p.amount), 0n)
    : 0n;

  const totalRewards = earnedResults
    ? earnedResults.reduce((sum: bigint, r: any) => r.status === 'success' ? sum + BigInt(r.result) : sum, 0n)
    : 0n;
  const rewardCount = rewardTokens ? (rewardTokens as any[]).length : 0;

  const hasVesting = !!vestingAddress && !!vesting;

  const vestingSub = hasVesting
    ? vesting.cliff > BigInt(Math.floor(Date.now() / 1000))
      ? `Cliff: ${Math.ceil((Number(vesting.cliff) - Date.now() / 1000) / 86400)}d`
      : `${((Number(vesting.released) / Number(vesting.totalAllocation)) * 100).toFixed(1)}% released`
    : '';

  const cards = [
    {
      label: 'Available Balance',
      value: `${balance ? fmt(balance as bigint) : '0'} $XKI`,
      sub: '',
      isLoading: balLoading,
    },
    {
      label: 'Total Staked',
      value: `${fmt(totalStaked)} $XKI`,
      sub: `${weight ? fmt(weight as bigint) : '0'} effective weight`,
      isLoading: stakLoading || weightLoading,
    },
    ...(hasVesting ? [{
      label: 'Vesting',
      value: `${fmt(vesting.totalAllocation)} $XKI`,
      sub: vestingSub,
      isLoading: vestLoading,
    }] : []),
    {
      label: 'Claimable Rewards',
      value: `${fmt(totalRewards)} $XKI`,
      sub: `${rewardCount} reward token${rewardCount !== 1 ? 's' : ''}`,
      isLoading: rewardsLoading,
    },
  ];

  const gridCols = hasVesting
    ? 'grid-cols-2 md:grid-cols-4'
    : 'grid-cols-1 sm:grid-cols-3';

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {cards.map((c) => (
        <Card key={c.label} {...c} />
      ))}
    </div>
  );
}
