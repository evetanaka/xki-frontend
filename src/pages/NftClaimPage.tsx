import { useState, useEffect } from 'react';
import { useKeplrWallet } from '../hooks/useKeplrWallet';
import { api } from '../lib/api';

/* ── Rarity Config ── */
const SCARCITY_CONFIG: Record<string, {
  glow: string; border: string; badge: string; text: string; bg: string; order: number;
}> = {
  Legendary: {
    glow: 'shadow-[0_0_30px_rgba(255,215,0,0.4)]',
    border: 'border-yellow-500/60',
    badge: 'bg-gradient-to-r from-yellow-500 to-amber-600',
    text: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    order: 0,
  },
  Epic: {
    glow: 'shadow-[0_0_25px_rgba(139,92,246,0.35)]',
    border: 'border-violet-500/50',
    badge: 'bg-gradient-to-r from-violet-500 to-purple-600',
    text: 'text-violet-400',
    bg: 'bg-violet-500/10',
    order: 1,
  },
  Rare: {
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
    border: 'border-blue-500/40',
    badge: 'bg-gradient-to-r from-blue-500 to-cyan-600',
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    order: 2,
  },
  Uncommon: {
    glow: 'shadow-[0_0_15px_rgba(34,197,94,0.25)]',
    border: 'border-green-500/30',
    badge: 'bg-gradient-to-r from-green-500 to-emerald-600',
    text: 'text-green-400',
    bg: 'bg-green-500/10',
    order: 3,
  },
  Common: {
    glow: '',
    border: 'border-white/10',
    badge: 'bg-gray-600',
    text: 'text-gray-400',
    bg: 'bg-white/5',
    order: 4,
  },
};

function getScarcity(s: string) {
  return SCARCITY_CONFIG[s] || SCARCITY_CONFIG.Common;
}

function formatXKI(amount: string | number): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/* ── NFT Card ── */
function NftCard({ nft }: { nft: any }) {
  const cfg = getScarcity(nft.scarcity);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className={`
      relative rounded-xl overflow-hidden
      bg-white/5 backdrop-blur-sm border ${cfg.border}
      ${cfg.glow}
      transition-all duration-300 hover:scale-[1.03] hover:brightness-110
      group
    `}>
      {/* Image */}
      <div className="aspect-square overflow-hidden bg-white/5 relative">
        {!imgLoaded && (
          <div className="absolute inset-0 animate-pulse bg-white/10" />
        )}
        <img
          src={nft.image}
          alt={nft.name}
          className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
        />
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-white truncate">{nft.name}</span>
          <span className={`${cfg.badge} text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0`}>
            {nft.scarcity}
          </span>
        </div>
        {nft.personality && (
          <div className="text-xs text-white/40">{nft.personality} · {nft.geographical}</div>
        )}
        <div className={`text-lg font-bold ${cfg.text}`}>
          {formatXKI(nft.allocation)} <span className="text-xs font-normal opacity-60">$XKI</span>
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton Grid ── */
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden bg-white/5 border border-white/10 animate-pulse">
          <div className="aspect-square bg-white/10" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-white/10 rounded w-3/4" />
            <div className="h-6 bg-white/10 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Summary Bar ── */
function SummaryBar({ summary, onClaim }: { summary: any; onClaim: () => void }) {
  const scarcityOrder = ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
      {/* Total */}
      <div className="text-center">
        <div className="text-sm text-white/50 uppercase tracking-wider mb-1">Total Allocation</div>
        <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
          {formatXKI(summary.total_allocation)} <span className="text-lg">$XKI</span>
        </div>
        <div className="text-sm text-white/40 mt-1">{summary.total_nfts} NFTs</div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {scarcityOrder.map(s => {
          const data = summary.by_scarcity?.[s];
          if (!data) return null;
          const cfg = getScarcity(s);
          return (
            <div key={s} className={`${cfg.bg} rounded-lg p-2 text-center`}>
              <div className={`text-xs font-semibold ${cfg.text}`}>{s}</div>
              <div className="text-white font-bold">{data.count}</div>
              <div className="text-xs text-white/40">{formatXKI(data.subtotal)}</div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <button
        onClick={onClaim}
        className="w-full py-3 rounded-xl font-bold text-black bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] text-lg"
      >
        Claim {formatXKI(summary.total_allocation)} $XKI →
      </button>
    </div>
  );
}

/* ── Empty State ── */
function EmptyState({ address }: { address: string }) {
  return (
    <div className="text-center py-20 space-y-4">
      <div className="text-6xl">🔍</div>
      <h2 className="text-2xl font-bold text-white">No Cosmon NFTs Found</h2>
      <p className="text-white/50 max-w-md mx-auto">
        The wallet <span className="font-mono text-sm text-white/70 break-all">{address}</span> does
        not hold any eligible Cosmon NFTs.
      </p>
      <p className="text-white/30 text-sm">
        Only CosmonNFT holders are eligible for this airdrop.
      </p>
    </div>
  );
}

/* ── Already Claimed State ── */
function ClaimedState({ claim }: { claim: any }) {
  const statusColors: Record<string, string> = {
    pending: 'text-yellow-400',
    processing: 'text-blue-400',
    completed: 'text-green-400',
    failed: 'text-red-400',
  };

  return (
    <div className="text-center py-20 space-y-4">
      <div className="text-6xl">{claim.status === 'completed' ? '✅' : '⏳'}</div>
      <h2 className="text-2xl font-bold text-white">Claim Submitted</h2>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-lg mx-auto space-y-3 text-left">
        <div className="flex justify-between">
          <span className="text-white/50">Status</span>
          <span className={`font-bold uppercase ${statusColors[claim.status] || 'text-white'}`}>
            {claim.status}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Allocation</span>
          <span className="text-white font-bold">{formatXKI(claim.total_allocation)} $XKI</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">NFTs</span>
          <span className="text-white">{claim.nft_count}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">ETH Address</span>
          <span className="text-white/70 font-mono text-sm">{claim.eth_address.slice(0, 8)}...{claim.eth_address.slice(-6)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Submitted</span>
          <span className="text-white/70">{new Date(claim.created_at).toLocaleDateString()}</span>
        </div>
        {claim.tx_hash && (
          <div className="flex justify-between">
            <span className="text-white/50">Transaction</span>
            <a href={`https://etherscan.io/tx/${claim.tx_hash}`} target="_blank" rel="noopener noreferrer"
               className="text-amber-400 hover:underline font-mono text-sm">
              {claim.tx_hash.slice(0, 10)}...
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Filter Tabs ── */
function FilterTabs({ active, counts, onChange }: {
  active: string; counts: Record<string, number>; onChange: (s: string) => void;
}) {
  const tabs = ['All', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map(t => {
        const count = t === 'All' ? Object.values(counts).reduce((a, b) => a + b, 0) : (counts[t] || 0);
        if (t !== 'All' && !count) return null;
        const isActive = active === t;
        const cfg = t !== 'All' ? getScarcity(t) : null;
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              isActive
                ? cfg ? `${cfg.badge} text-white` : 'bg-white text-black'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
            }`}
          >
            {t} <span className="opacity-60 ml-1">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Main Page ── */
export default function NftClaimPage() {
  const { address, isConnected, connect, isLoading: walletLoading, error: walletError } = useKeplrWallet();
  const [portfolio, setPortfolio] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [step, setStep] = useState<'connect' | 'portfolio' | 'claim'>('connect');

  // Load config on mount
  useEffect(() => {
    api.getNftConfig().then(setConfig).catch(() => {});
  }, []);

  // Load portfolio when connected
  useEffect(() => {
    if (!address) return;
    setLoading(true);
    setError(null);
    api.getNftPortfolio(address)
      .then(data => {
        setPortfolio(data);
        setStep('portfolio');
      })
      .catch(err => {
        if (err.message.includes('404') || err.message.includes('No NFTs')) {
          setPortfolio({ nfts: [], summary: null });
        } else {
          setError('Failed to load portfolio. Please try again.');
        }
      })
      .finally(() => setLoading(false));
  }, [address]);

  // Filter NFTs
  const filteredNfts = portfolio?.nfts?.filter((n: any) =>
    filter === 'All' ? true : n.scarcity === filter
  ) || [];

  const scarcityCounts: Record<string, number> = {};
  portfolio?.nfts?.forEach((n: any) => {
    scarcityCounts[n.scarcity] = (scarcityCounts[n.scarcity] || 0) + 1;
  });

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative pt-32 pb-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center space-y-4 mb-12">
            <div className="inline-block px-4 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-4">
              NFT Holders Airdrop
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
              Claim Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">$XKI</span>
            </h1>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              Cosmon NFT holders are eligible for a share of the 5,000,000 $XKI airdrop pool.
              Connect your Ki Chain wallet to see your allocation.
            </p>

            {/* Global Stats */}
            {config?.stats && (
              <div className="flex justify-center gap-8 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{config.stats.total_nfts?.toLocaleString()}</div>
                  <div className="text-xs text-white/40">Eligible NFTs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{config.stats.total_wallets?.toLocaleString()}</div>
                  <div className="text-xs text-white/40">Wallets</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">{config.stats.claims_percentage || 0}%</div>
                  <div className="text-xs text-white/40">Claimed</div>
                </div>
              </div>
            )}

            {/* Allocation Table */}
            {config?.allocations && (
              <div className="flex justify-center gap-3 mt-6 flex-wrap">
                {['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'].map(s => {
                  const cfg = getScarcity(s);
                  const amount = config.allocations[s];
                  if (!amount || amount === '0') return null;
                  return (
                    <div key={s} className={`${cfg.bg} border ${cfg.border} rounded-lg px-3 py-2 text-center`}>
                      <div className={`text-xs font-bold ${cfg.text}`}>{s}</div>
                      <div className="text-white font-bold text-sm">{formatXKI(amount)}</div>
                      <div className="text-[10px] text-white/30">per NFT</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Connect Button */}
          {!isConnected && (
            <div className="text-center">
              <button
                onClick={connect}
                disabled={walletLoading}
                className="px-8 py-4 rounded-xl font-bold text-black bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] text-lg disabled:opacity-50"
              >
                {walletLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Connecting...
                  </span>
                ) : (
                  '🔗 Connect Keplr Wallet'
                )}
              </button>
              {walletError && (
                <p className="text-red-400 text-sm mt-3">{walletError}</p>
              )}
            </div>
          )}

          {/* Loading */}
          {isConnected && loading && (
            <div className="space-y-6">
              <div className="text-center text-white/50">
                Loading portfolio for <span className="font-mono text-white/70">{address?.slice(0, 12)}...{address?.slice(-6)}</span>
              </div>
              <SkeletonGrid />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center py-12">
              <div className="text-red-400 text-lg">{error}</div>
              <button onClick={() => window.location.reload()} className="mt-4 text-white/50 hover:text-white underline">
                Retry
              </button>
            </div>
          )}

          {/* Empty */}
          {isConnected && !loading && portfolio?.nfts?.length === 0 && (
            <EmptyState address={address!} />
          )}

          {/* Already claimed */}
          {portfolio?.existing_claim && (
            <ClaimedState claim={portfolio.existing_claim} />
          )}

          {/* Portfolio */}
          {isConnected && !loading && portfolio?.nfts?.length > 0 && !portfolio?.existing_claim && (
            <div className="space-y-6">
              {/* Wallet info */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-sm">🔑</div>
                  <div>
                    <div className="text-xs text-white/40">Connected Wallet</div>
                    <div className="font-mono text-sm text-white/70">{address?.slice(0, 16)}...{address?.slice(-8)}</div>
                  </div>
                </div>
                <button onClick={() => { setPortfolio(null); setStep('connect'); }} className="text-white/30 hover:text-white/60 text-sm underline">
                  Disconnect
                </button>
              </div>

              {/* Summary */}
              {portfolio.summary && (
                <SummaryBar
                  summary={portfolio.summary}
                  onClaim={() => setStep('claim')}
                />
              )}

              {/* Filters */}
              <FilterTabs active={filter} counts={scarcityCounts} onChange={setFilter} />

              {/* Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredNfts.map((nft: any) => (
                  <NftCard key={`${nft.collection}-${nft.token_id}`} nft={nft} />
                ))}
              </div>

              {/* Bottom summary (mobile sticky) */}
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-xl border-t border-white/10 md:hidden z-50">
                <button
                  onClick={() => setStep('claim')}
                  className="w-full py-3 rounded-xl font-bold text-black bg-gradient-to-r from-yellow-400 to-amber-500 text-lg"
                >
                  Claim {formatXKI(portfolio.summary?.total_allocation || 0)} $XKI
                </button>
              </div>
              {/* Spacer for mobile sticky bar */}
              <div className="h-20 md:hidden" />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
