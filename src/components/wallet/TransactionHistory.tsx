import { type Address, formatUnits } from 'viem';
import { useTransactionHistory, type TxEvent } from '../../hooks/useTransactionHistory';

function fmt(value: bigint, decimals = 6): string {
  const num = Number(formatUnits(value, decimals));
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function fmtDate(ts: number): string {
  const now = Date.now() / 1000;
  const diff = now - ts;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const EVENT_CONFIG: Record<TxEvent['type'], { icon: string; template: (e: TxEvent) => string }> = {
  stake: { icon: '🟢', template: (e) => `Staked ${fmt(e.amount)} $XKI · ${e.extra}` },
  unstake_request: { icon: '🟡', template: (e) => `Unstake requested · Cooldown until ${e.extra}` },
  unstake_complete: { icon: '✅', template: (e) => `Withdrew ${fmt(e.amount)} $XKI` },
  hard_unstake: { icon: '🔴', template: (e) => `Hard unstake ${fmt(e.amount)} $XKI · ${e.extra} $XKI burned` },
  reward_claimed: { icon: '💰', template: (e) => `Claimed ${fmt(e.amount)} $XKI rewards` },
  transfer_in: { icon: '📥', template: (e) => `Received ${fmt(e.amount)} $XKI from ${e.extra}` },
  transfer_out: { icon: '📤', template: (e) => `Sent ${fmt(e.amount)} $XKI to ${e.extra}` },
  vesting_release: { icon: '🔓', template: (e) => `Released ${fmt(e.amount)} $XKI from vesting` },
};

function SkeletonRows() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <div className="w-6 h-6 rounded bg-white/10 animate-pulse" />
          <div className="flex-1 h-4 bg-white/10 animate-pulse rounded" />
          <div className="w-16 h-4 bg-white/10 animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}

export default function TransactionHistory({ address }: { address: Address }) {
  const { events, isLoading, loadMore, hasMore, totalCount } = useTransactionHistory(address);

  return (
    <div className="glass-panel p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">📜</span>
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold">History</h2>
        </div>
        {totalCount > 0 && (
          <span className="text-[10px] text-gray-600">{totalCount} events</span>
        )}
      </div>

      {isLoading ? (
        <SkeletonRows />
      ) : events.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">No transactions found</p>
      ) : (
        <div className="space-y-1">
          {events.map((event, i) => {
            const config = EVENT_CONFIG[event.type];
            return (
              <div key={`${event.txHash}-${event.type}-${i}`} className="flex items-start gap-3 py-2.5 border-b border-white/5 last:border-b-0">
                <span className="text-base mt-0.5 shrink-0">{config.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 truncate">{config.template(event)}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{fmtDate(event.timestamp)}</p>
                </div>
                <a
                  href={`https://etherscan.io/tx/${event.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] text-gray-600 hover:text-gray-400 transition-colors shrink-0"
                >
                  {event.txHash.slice(0, 6)}...
                </a>
              </div>
            );
          })}
        </div>
      )}

      {hasMore && (
        <button
          onClick={loadMore}
          className="w-full py-2.5 border border-white/10 text-gray-500 text-[10px] uppercase tracking-widest hover:text-white hover:border-white/20 transition-colors"
        >
          Load More
        </button>
      )}
    </div>
  );
}
