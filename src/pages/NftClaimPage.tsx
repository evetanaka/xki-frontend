import { useState, useEffect, useRef } from 'react';
import { useKeplrWallet } from '../hooks/useKeplrWallet';
import { api } from '../lib/api';
import { ChevronRight } from 'lucide-react';
import ClaimFlow from '../components/nft/ClaimFlow';

/* ── Intersection observer for parallax ── */
function useParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add('visible'); },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ── Rarity config — minimal, monochrome with subtle accents ── */
const RARITY: Record<string, { label: string; accent: string; dot: string; order: number }> = {
  Legendary: { label: 'Legendary', accent: 'rgba(255,215,0,0.15)', dot: '#FFD700', order: 0 },
  Epic:      { label: 'Epic',      accent: 'rgba(180,160,255,0.10)', dot: '#B4A0FF', order: 1 },
  Rare:      { label: 'Rare',      accent: 'rgba(120,180,255,0.08)', dot: '#78B4FF', order: 2 },
  Uncommon:  { label: 'Uncommon',  accent: 'rgba(120,220,160,0.08)', dot: '#78DCA0', order: 3 },
  Common:    { label: 'Common',    accent: 'rgba(255,255,255,0.03)', dot: '#666',    order: 4 },
};

function getRarity(s: string) {
  return RARITY[s] || RARITY.Common;
}

function formatXKI(amount: string | number): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/* ── NFT Card — glass-panel style ── */
function NftCard({ nft }: { nft: any }) {
  const r = getRarity(nft.scarcity);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className="glass-panel hover-lift group" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Image */}
      <div className="aspect-square overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.03)' }}>
        {!imgLoaded && (
          <div className="absolute inset-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="absolute inset-0 animate-pulse" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)' }} />
          </div>
        )}
        <img
          src={nft.image}
          alt={nft.name}
          className={`w-full h-full object-cover transition-opacity duration-700 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
        />
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-white font-light tracking-wide truncate">{nft.name}</span>
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: r.dot }} />
            <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-light">{r.label}</span>
          </span>
        </div>
        {nft.personality && (
          <div className="text-[11px] text-white/25 font-light tracking-wide">{nft.personality} · {nft.geographical}</div>
        )}
        <div className="text-lg text-white font-serif tracking-wide">
          {formatXKI(nft.allocation)} <span className="text-xs text-white/30 font-sans font-light">$XKI</span>
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton Grid ── */
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="aspect-square" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="w-full h-full animate-pulse" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)' }} />
          </div>
          <div className="p-4 space-y-3">
            <div className="h-3 rounded-sm w-3/4" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="h-5 rounded-sm w-1/2" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Summary Section ── */
function SummarySection({ summary, onClaim }: { summary: any; onClaim: () => void }) {
  const ref = useParallax<HTMLDivElement>();
  const scarcityOrder = ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];

  return (
    <div ref={ref} className="parallax-section">
      <div className="glass-panel" style={{ padding: '2.5rem' }}>
        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-6 sm:gap-8 items-center">
          {/* Total allocation */}
          <div className="text-center md:text-left">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.4em] sm:tracking-[0.5em] text-white/30 font-light mb-2 sm:mb-3">Total Allocation</p>
            <p className="text-3xl sm:text-4xl md:text-5xl font-serif text-white tracking-wide">
              {formatXKI(summary.total_allocation)}
            </p>
            <p className="text-sm text-white/30 font-light mt-1">{summary.total_nfts} NFTs · $XKI</p>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-24" style={{ background: 'rgba(255,255,255,0.08)' }} />

          {/* Breakdown */}
          <div className="space-y-2">
            {scarcityOrder.map(s => {
              const data = summary.by_scarcity?.[s];
              if (!data) return null;
              const r = getRarity(s);
              return (
                <div key={s} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: r.dot }} />
                    <span className="text-xs uppercase tracking-[0.15em] text-white/50 font-light">{s}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-white/25 font-light">×{data.count}</span>
                    <span className="text-sm text-white font-light tabular-nums">{formatXKI(data.subtotal)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={onClaim}
            className="w-full py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 group"
            style={{
              background: 'linear-gradient(135deg, #D4AF37, #B8941F)',
              color: '#000',
            }}
          >
            Claim {formatXKI(summary.total_allocation)} $XKI
            <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Empty State ── */
function EmptyState({ address }: { address: string }) {
  const ref = useParallax<HTMLDivElement>();
  return (
    <div ref={ref} className="parallax-section text-center py-32 space-y-6">
      <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <span className="text-white/20 text-2xl">∅</span>
      </div>
      <h2 className="text-2xl font-serif text-white tracking-wide">No Eligible NFTs</h2>
      <p className="text-sm text-white/30 font-light max-w-md mx-auto leading-relaxed">
        The wallet <span className="font-mono text-[11px] text-white/50 break-all">{address}</span> does
        not hold any eligible Cosmon NFTs from the Ki Chain.
      </p>
    </div>
  );
}

/* ── Already Claimed State ── */
function ClaimedState({ claim }: { claim: any }) {
  const ref = useParallax<HTMLDivElement>();
  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: '#D4AF37' },
    processing: { label: 'Processing', color: '#78B4FF' },
    completed: { label: 'Completed', color: '#78DCA0' },
    failed: { label: 'Failed', color: '#FF6B6B' },
  };
  const st = statusMap[claim.status] || statusMap.pending;

  return (
    <div ref={ref} className="parallax-section text-center py-20 space-y-8">
      <p className="text-[10px] uppercase tracking-[0.5em] text-white/30 font-light">Claim Status</p>
      <h2 className="text-3xl font-serif text-white tracking-wide">Claim Submitted</h2>

      <div className="glass-panel max-w-lg mx-auto" style={{ padding: '2rem' }}>
        <div className="space-y-4">
          {[
            { label: 'Status', value: st.label, color: st.color, mono: false },
            { label: 'Allocation', value: `${formatXKI(claim.total_allocation)} $XKI`, color: '#fff', mono: false },
            { label: 'NFTs', value: String(claim.nft_count), color: '#fff', mono: false },
            { label: 'ETH Address', value: `${claim.eth_address.slice(0, 8)}...${claim.eth_address.slice(-6)}`, color: 'rgba(255,255,255,0.5)', mono: true },
            { label: 'Submitted', value: new Date(claim.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), color: 'rgba(255,255,255,0.5)', mono: false },
          ].map(({ label, value, color, mono }) => (
            <div key={label} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="text-xs uppercase tracking-[0.15em] text-white/30 font-light">{label}</span>
              <span className={`text-sm font-light ${mono ? 'font-mono text-[11px]' : ''}`} style={{ color }}>{value}</span>
            </div>
          ))}
          {claim.tx_hash && (
            <div className="flex justify-between items-center py-2">
              <span className="text-xs uppercase tracking-[0.15em] text-white/30 font-light">Transaction</span>
              <a href={`https://etherscan.io/tx/${claim.tx_hash}`} target="_blank" rel="noopener noreferrer"
                 className="text-[11px] font-mono text-white/50 hover:text-white transition-colors underline underline-offset-2">
                {claim.tx_hash.slice(0, 12)}...
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Filter Tabs — minimal ── */
function FilterTabs({ active, counts, onChange }: {
  active: string; counts: Record<string, number>; onChange: (s: string) => void;
}) {
  const tabs = ['All', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];
  return (
    <div className="flex flex-wrap gap-1">
      {tabs.map(t => {
        const count = t === 'All' ? Object.values(counts).reduce((a, b) => a + b, 0) : (counts[t] || 0);
        if (t !== 'All' && !count) return null;
        const isActive = active === t;
        const r = t !== 'All' ? getRarity(t) : null;
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            className="px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-light transition-all duration-300"
            style={{
              background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.3)',
              border: `1px solid ${isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'}`,
            }}
          >
            {r && <span className="inline-block w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: isActive ? r.dot : 'rgba(255,255,255,0.15)' }} />}
            {t} <span style={{ opacity: 0.4 }}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Allocation Table (pre-connect) ── */
function AllocationTable({ allocations }: { allocations: Record<string, string> }) {
  const scarcityOrder = ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];
  return (
    <div className="flex justify-center px-4">
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-px w-full max-w-xl sm:max-w-none sm:w-auto sm:inline-grid" style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
        {scarcityOrder.map(s => {
          const amount = allocations[s];
          if (!amount || amount === '0') return null;
          const r = getRarity(s);
          return (
            <div key={s} className="px-3 sm:px-5 py-3 sm:py-4 text-center" style={{ background: r.accent }}>
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-1">
                <span className="w-1 h-1 rounded-full" style={{ backgroundColor: r.dot }} />
                <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white/40 font-light">{s}</span>
              </div>
              <div className="text-sm sm:text-base text-white font-serif tracking-wide">{formatXKI(amount)}</div>
              <div className="text-[8px] sm:text-[9px] text-white/20 font-light tracking-wider mt-0.5">per NFT</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function NftClaimPage() {
  const { address, isConnected, connect, isLoading: walletLoading, error: walletError, signMessage } = useKeplrWallet();
  const [portfolio, setPortfolio] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');
  const [step, setStep] = useState<'connect' | 'portfolio' | 'claim'>('connect');

  const heroRef = useParallax<HTMLDivElement>();
  const statsRef = useParallax<HTMLDivElement>();
  const allocRef = useParallax<HTMLDivElement>();

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
      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
        {/* Subtle radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none"
             style={{ background: 'radial-gradient(ellipse, rgba(212,175,55,0.03) 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div ref={heroRef} className="parallax-section space-y-8">
            <p className="text-[10px] uppercase tracking-[0.6em] text-white/30 font-light">NFT Holders Airdrop</p>

            <h1 className="text-2xl sm:text-4xl md:text-[3.5rem] font-serif text-white tracking-wide !leading-tight gradient-text">
              Claim Your $XKI
            </h1>

            <p className="max-w-xl mx-auto text-xs sm:text-sm md:text-base text-white/30 font-light leading-relaxed px-2">
              Cosmon NFT holders are eligible for a share of the 5,000,000 $XKI airdrop pool.
              Connect your Ki Chain wallet to see your allocation.
            </p>
          </div>

          {/* Stats */}
          {config?.stats && (
            <div ref={statsRef} className="parallax-section visible mt-16">
              <div className="flex justify-center gap-8 sm:gap-16 flex-wrap">
                {[
                  { value: config.stats.total_nfts?.toLocaleString(), label: 'Eligible NFTs' },
                  { value: config.stats.total_wallets?.toLocaleString(), label: 'Wallets' },
                  { value: `${config.stats.claims_percentage || 0}%`, label: 'Claimed' },
                ].map(({ value, label }) => (
                  <div key={label} className="text-center">
                    <div className="text-xl sm:text-2xl md:text-3xl font-serif text-white tracking-wide">{value}</div>
                    <div className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/25 font-light mt-1 sm:mt-2">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Allocation table */}
          {config?.allocations && (
            <div ref={allocRef} className="parallax-section visible mt-12">
              <AllocationTable allocations={config.allocations} />
            </div>
          )}

          {/* Divider */}
          <div className="w-12 h-px mx-auto mt-16 mb-12" style={{ background: 'rgba(255,255,255,0.1)' }} />

          {/* Connect / Portfolio / States */}
          {!isConnected && (
            <div className="parallax-section visible space-y-4">
              <button
                onClick={connect}
                disabled={walletLoading}
                className="group px-6 sm:px-10 py-4 text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all duration-500 flex items-center gap-3 mx-auto disabled:opacity-30"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37, #B8941F)',
                  color: '#000',
                }}
              >
                {walletLoading ? (
                  <span className="flex items-center gap-3">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Connecting
                  </span>
                ) : (
                  <>
                    Connect Keplr Wallet
                    <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              {walletError && (
                <p className="text-sm text-red-400/70 font-light">{walletError}</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Portfolio Section ── */}
      {isConnected && (
        <section className="max-w-6xl mx-auto px-6 pb-32">
          {/* Loading */}
          {loading && (
            <div className="space-y-8">
              <div className="text-center text-sm text-white/30 font-light">
                Loading portfolio for <span className="font-mono text-[11px] text-white/50">{address?.slice(0, 12)}...{address?.slice(-6)}</span>
              </div>
              <SkeletonGrid />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center py-20 space-y-4">
              <p className="text-sm text-red-400/70 font-light">{error}</p>
              <button onClick={() => window.location.reload()} className="text-xs text-white/30 hover:text-white/60 underline underline-offset-4 tracking-wider uppercase font-light">
                Retry
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && portfolio?.nfts?.length === 0 && (
            <EmptyState address={address!} />
          )}

          {/* Already claimed */}
          {portfolio?.existing_claim && (
            <ClaimedState claim={portfolio.existing_claim} />
          )}

          {/* Claim Flow */}
          {step === 'claim' && portfolio?.summary && !portfolio?.existing_claim && (
            <div className="space-y-10">
              <ClaimFlow
                kiAddress={address!}
                totalAllocation={portfolio.summary.total_allocation}
                nftCount={portfolio.summary.total_nfts}
                onSign={signMessage}
                onComplete={(claim) => {
                  setPortfolio((p: any) => ({ ...p, existing_claim: claim }));
                  setStep('portfolio');
                }}
                onCancel={() => setStep('portfolio')}
              />
            </div>
          )}

          {/* Portfolio content */}
          {!loading && portfolio?.nfts?.length > 0 && !portfolio?.existing_claim && step !== 'claim' && (
            <div className="space-y-10">
              {/* Wallet bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#D4AF37' }} />
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-[0.3em] text-white/25 font-light">Connected</div>
                    <div className="font-mono text-[11px] text-white/50">{address?.slice(0, 16)}...{address?.slice(-8)}</div>
                  </div>
                </div>
                <button onClick={() => { setPortfolio(null); setStep('connect'); }}
                        className="text-[10px] uppercase tracking-[0.2em] text-white/20 hover:text-white/50 font-light transition-colors">
                  Disconnect
                </button>
              </div>

              {/* Summary */}
              {portfolio.summary && (
                <SummarySection
                  summary={portfolio.summary}
                  onClaim={() => setStep('claim')}
                />
              )}

              {/* Filters + count */}
              <div className="flex items-end justify-between flex-wrap gap-4">
                <FilterTabs active={filter} counts={scarcityCounts} onChange={setFilter} />
                <span className="text-[10px] text-white/20 font-light tracking-wider uppercase">
                  {filteredNfts.length} {filteredNfts.length === 1 ? 'NFT' : 'NFTs'}
                </span>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
                {filteredNfts.map((nft: any) => (
                  <NftCard key={`${nft.collection}-${nft.token_id}`} nft={nft} />
                ))}
              </div>

              {/* Mobile sticky CTA */}
              <div className="fixed bottom-0 left-0 right-0 p-4 md:hidden z-50"
                   style={{ background: 'rgba(5,5,5,0.9)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  onClick={() => setStep('claim')}
                  className="w-full py-3 text-xs font-bold uppercase tracking-[0.2em]"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #B8941F)', color: '#000' }}
                >
                  Claim {formatXKI(portfolio.summary?.total_allocation || 0)} $XKI
                </button>
              </div>
              <div className="h-20 md:hidden" />
            </div>
          )}
        </section>
      )}
    </main>
  );
}
