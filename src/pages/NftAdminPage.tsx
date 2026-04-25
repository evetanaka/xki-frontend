import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import {
  RefreshCw, Download, Search, ChevronLeft, ChevronRight,
  Loader2, AlertCircle, Check, Edit3, Save, X,
} from 'lucide-react';

const ADMIN_KEY_STORAGE = 'xki_nft_admin_key';

/* ── Helpers ── */
function fmt(n: number | string): string {
  const v = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(v)) return '0';
  return v >= 1000 ? v.toLocaleString('en-US', { maximumFractionDigits: 0 }) : v.toLocaleString('en-US', { maximumFractionDigits: 2 });
}
function truncAddr(s: string, len = 12): string {
  if (!s || s.length <= len) return s || '';
  return s.slice(0, len / 2 + 2) + '...' + s.slice(-len / 2);
}

/* ── Admin API wrapper with X-Admin-Key ── */
function adminFetch(path: string, options?: RequestInit) {
  const key = localStorage.getItem(ADMIN_KEY_STORAGE) || '';
  return fetch(`${(import.meta as any).env?.VITE_API_BASE || 'https://api.foundation.ki/api'}${path}`, {
    headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key, ...options?.headers },
    ...options,
  }).then(async res => {
    if (!res.ok) {
      const body = await res.text();
      throw new Error(body || `HTTP ${res.status}`);
    }
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('text/csv')) return res.blob();
    return res.json();
  });
}

/* ── Status badge ── */
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:    { bg: 'rgba(212,175,55,0.15)', text: '#D4AF37' },
  processing: { bg: 'rgba(120,180,255,0.15)', text: '#78B4FF' },
  completed:  { bg: 'rgba(120,220,160,0.15)', text: '#78DCA0' },
  failed:     { bg: 'rgba(255,100,100,0.15)', text: '#FF6B6B' },
};
function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span className="px-2.5 py-1 text-[9px] uppercase tracking-[0.15em] font-light rounded-sm"
          style={{ background: c.bg, color: c.text }}>{status}</span>
  );
}

/* ── Auth Gate ── */
function AuthGate({ onAuth }: { onAuth: (key: string) => void }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(false);
    localStorage.setItem(ADMIN_KEY_STORAGE, key);
    try {
      await adminFetch('/nft/admin/stats');
      onAuth(key);
    } catch {
      setError(true);
      localStorage.removeItem(ADMIN_KEY_STORAGE);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
      <div className="glass-panel w-full max-w-sm" style={{ padding: '2.5rem' }}>
        <h1 className="text-xl font-serif text-white text-center mb-6 tracking-wide">NFT Admin</h1>
        <input
          type="password"
          value={key}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Admin API Key"
          className="w-full px-4 py-3 text-sm bg-transparent text-white font-mono placeholder-white/15 outline-none mb-4"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}
        />
        {error && <p className="text-[11px] text-red-400/70 mb-3 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Invalid key</p>}
        <button onClick={submit} disabled={loading || !key}
          className="w-full py-3 text-[10px] uppercase tracking-[0.2em] font-bold disabled:opacity-30"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #B8941F)', color: '#000' }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Authenticate'}
        </button>
      </div>
    </div>
  );
}

/* ── Pool Editor ── */
function PoolEditor({ currentPool, scarcityCounts, onSaved }: {
  currentPool: number; scarcityCounts: Record<string, number>; onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(currentPool));
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const doPreview = async (pool: number) => {
    setLoading(true);
    try {
      const data = await adminFetch('/nft/admin/pool/preview', {
        method: 'POST', body: JSON.stringify({ pool_total: pool }),
      });
      setPreview(data);
    } catch { setPreview(null); }
    finally { setLoading(false); }
  };

  const doSave = async () => {
    setSaving(true);
    try {
      await adminFetch('/nft/admin/pool', {
        method: 'PATCH', body: JSON.stringify({ pool_total: parseFloat(value), recalculate_claims: true }),
      });
      setEditing(false);
      setPreview(null);
      onSaved();
    } catch {}
    finally { setSaving(false); }
  };

  const rarityOrder = ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];
  const RARITY_DOTS: Record<string, string> = {
    Legendary: '#FFD700', Epic: '#B4A0FF', Rare: '#78B4FF', Uncommon: '#78DCA0', Common: '#666',
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-light">Pool Configuration</h3>
        {!editing && (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-white/30 hover:text-white/60 transition-colors">
            <Edit3 className="w-3 h-3" /> Edit
          </button>
        )}
      </div>

      {!editing ? (
        <>
          <div className="text-2xl font-serif text-white tracking-wide mb-4">{fmt(currentPool)} <span className="text-xs text-white/30 font-sans font-light">$XKI Pool</span></div>
          {/* Current allocation table */}
          <div className="space-y-1.5">
            {rarityOrder.map(s => {
              const count = scarcityCounts[s] || 0;
              if (!count) return null;
              return (
                <div key={s} className="flex items-center justify-between py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: RARITY_DOTS[s] || '#666' }} />
                    <span className="text-[10px] uppercase tracking-[0.1em] text-white/40 font-light">{s}</span>
                  </div>
                  <span className="text-xs text-white/25 font-light tabular-nums">×{count.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-3">
            <input type="number" value={value} onChange={e => setValue(e.target.value)}
              className="flex-1 px-3 py-2.5 text-sm bg-transparent text-white font-mono outline-none"
              style={{ border: '1px solid rgba(255,255,255,0.15)' }} />
            <button onClick={() => doPreview(parseFloat(value))} disabled={loading || !value}
              className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] font-light disabled:opacity-30"
              style={{ border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Preview'}
            </button>
          </div>

          {preview && (
            <div className="space-y-2">
              <div className="text-[9px] uppercase tracking-[0.3em] text-white/20 font-light">Preview — {fmt(preview.pool_total)} $XKI</div>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th className="text-left py-2 text-[9px] uppercase tracking-[0.15em] text-white/25 font-light">Rarity</th>
                    <th className="text-right py-2 text-[9px] uppercase tracking-[0.15em] text-white/25 font-light">Count</th>
                    <th className="text-right py-2 text-[9px] uppercase tracking-[0.15em] text-white/25 font-light">Per NFT</th>
                    <th className="text-right py-2 text-[9px] uppercase tracking-[0.15em] text-white/25 font-light">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {rarityOrder.map(s => {
                    const d = preview.breakdown?.[s];
                    if (!d || !d.count) return null;
                    return (
                      <tr key={s} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td className="py-2 text-white/50 font-light flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: RARITY_DOTS[s] }} />{s}
                        </td>
                        <td className="py-2 text-right text-white/30 font-light tabular-nums">{d.count.toLocaleString()}</td>
                        <td className="py-2 text-right text-white font-light tabular-nums">{fmt(d.per_nft)}</td>
                        <td className="py-2 text-right text-white/50 font-light tabular-nums">{fmt(d.subtotal)}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <td className="py-2 text-white/40 font-light" colSpan={3}>Total</td>
                    <td className="py-2 text-right text-white font-serif">{fmt(preview.total_distributed)}</td>
                  </tr>
                </tbody>
              </table>
              {preview.existing_claims > 0 && (
                <p className="text-[10px] text-yellow-400/60 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {preview.existing_claims} existing claim(s) will be recalculated
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { setEditing(false); setPreview(null); setValue(String(currentPool)); }}
              className="flex-1 py-2.5 text-[10px] uppercase tracking-[0.15em] font-light flex items-center justify-center gap-1.5"
              style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>
              <X className="w-3 h-3" /> Cancel
            </button>
            <button onClick={doSave} disabled={saving || !preview}
              className="flex-1 py-2.5 text-[10px] uppercase tracking-[0.15em] font-bold flex items-center justify-center gap-1.5 disabled:opacity-30"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #B8941F)', color: '#000' }}>
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Save className="w-3 h-3" /> Apply</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── KPI Card ── */
function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="glass-panel text-center" style={{ padding: '1.25rem' }}>
      <div className="text-xl font-serif text-white tracking-wide">{value}</div>
      <div className="text-[8px] uppercase tracking-[0.3em] text-white/25 font-light mt-1">{label}</div>
      {sub && <div className="text-[10px] text-white/15 font-light mt-0.5">{sub}</div>}
    </div>
  );
}

/* ── Status Update Modal ── */
function StatusModal({ claimIds, onClose, onSaved }: { claimIds: number[]; onClose: () => void; onSaved: () => void }) {
  const [status, setStatus] = useState('processing');
  const [txHash, setTxHash] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      if (claimIds.length === 1) {
        await adminFetch(`/nft/admin/claims/${claimIds[0]}/status`, {
          method: 'PATCH', body: JSON.stringify({ status, tx_hash: txHash || undefined }),
        });
      } else {
        await adminFetch('/nft/admin/claims/batch-status', {
          method: 'PATCH', body: JSON.stringify({ ids: claimIds, status, tx_hash: txHash || undefined }),
        });
      }
      onSaved();
      onClose();
    } catch {}
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="glass-panel w-full max-w-sm" style={{ padding: '2rem' }}>
        <h3 className="text-sm font-serif text-white mb-4">Update Status — {claimIds.length} claim(s)</h3>
        <div className="space-y-3">
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-transparent text-white outline-none"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            {['pending', 'processing', 'completed', 'failed'].map(s => (
              <option key={s} value={s} style={{ background: '#111' }}>{s}</option>
            ))}
          </select>
          <input type="text" value={txHash} onChange={e => setTxHash(e.target.value)}
            placeholder="tx_hash (optional)" className="w-full px-3 py-2.5 text-sm bg-transparent text-white font-mono placeholder-white/15 outline-none"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 text-[10px] uppercase tracking-[0.15em] font-light"
            style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 text-[10px] uppercase tracking-[0.15em] font-bold disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #B8941F)', color: '#000' }}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Admin Page ── */
export default function NftAdminPage() {
  const [authed, setAuthed] = useState(!!localStorage.getItem(ADMIN_KEY_STORAGE));
  const [stats, setStats] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadStats = useCallback(async () => {
    try { setStats(await adminFetch('/nft/admin/stats')); } catch {}
  }, []);

  const loadClaims = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const data = await adminFetch(`/nft/admin/claims?${params}`);
      setClaims(data.claims);
      setPagination(data.pagination);
      setSelected([]);
    } catch {}
    finally { setLoading(false); }
  }, [statusFilter, search]);

  useEffect(() => { if (authed) { loadStats(); loadClaims(); } }, [authed, loadStats, loadClaims]);

  const exportCsv = async () => {
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const blob = await adminFetch(`/nft/admin/claims/export${params}`);
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'nft-claims-export.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const refresh = () => { loadStats(); loadClaims(pagination.page); };
  const toggleSelect = (id: number) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(s => s.length === claims.length ? [] : claims.map(c => c.id));

  if (!authed) return <AuthGate onAuth={() => setAuthed(true)} />;

  return (
    <main className="flex-1" style={{ background: '#050505' }}>
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-[0.5em] text-white/25 font-light">Administration</p>
            <h1 className="text-2xl font-serif text-white tracking-wide mt-1">NFT Claims</h1>
          </div>
          <button onClick={refresh} className="p-2 text-white/20 hover:text-white/50 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Pool Editor */}
        {stats && (
          <PoolEditor
            currentPool={stats.pool_total}
            scarcityCounts={stats.scarcity_counts || {}}
            onSaved={refresh}
          />
        )}

        {/* KPIs */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Total NFTs" value={fmt(stats.total_nfts)} />
            <KpiCard label="Eligible Wallets" value={fmt(stats.total_wallets)} />
            <KpiCard label="Claims Submitted" value={fmt(stats.total_claims)} />
            <KpiCard label="Claimed" value={`${stats.claims_percentage}%`} sub={`${fmt(stats.total_allocation_claimed)} $XKI`} />
          </div>
        )}

        {/* Progress bar */}
        {stats && stats.pool_total > 0 && (
          <div className="glass-panel" style={{ padding: '1rem 1.5rem' }}>
            <div className="flex justify-between text-[9px] uppercase tracking-[0.2em] text-white/25 font-light mb-2">
              <span>Allocation Progress</span>
              <span>{fmt(stats.total_allocation_claimed)} / {fmt(stats.pool_total)} $XKI</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, (stats.total_allocation_claimed / stats.pool_total) * 100)}%`, background: 'linear-gradient(90deg, #D4AF37, #B8941F)' }} />
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <Search className="w-3.5 h-3.5 text-white/20 ml-3" />
            <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') setSearch(searchInput); }}
              placeholder="Search ki1... or 0x..."
              className="flex-1 px-2 py-2.5 text-xs bg-transparent text-white placeholder-white/15 outline-none font-mono" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 text-[10px] uppercase tracking-[0.1em] bg-transparent text-white/50 outline-none"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <option value="" style={{ background: '#111' }}>All Status</option>
            {['pending', 'processing', 'completed', 'failed'].map(s => (
              <option key={s} value={s} style={{ background: '#111' }}>{s}</option>
            ))}
          </select>
          {selected.length > 0 && (
            <button onClick={() => setShowModal(true)}
              className="px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] font-light"
              style={{ border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>
              Update {selected.length} selected
            </button>
          )}
          <button onClick={exportCsv}
            className="flex items-center gap-1.5 px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] font-light text-white/30 hover:text-white/60 transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <Download className="w-3 h-3" /> CSV
          </button>
        </div>

        {/* Table */}
        <div className="glass-panel overflow-x-auto" style={{ padding: 0 }}>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-5 h-5 animate-spin text-white/20" />
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-20 text-sm text-white/20 font-light">No claims yet</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox" checked={selected.length === claims.length && claims.length > 0}
                      onChange={toggleAll} className="accent-amber-500" />
                  </th>
                  <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.15em] text-white/25 font-light">ID</th>
                  <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.15em] text-white/25 font-light">Ki Address</th>
                  <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.15em] text-white/25 font-light">ETH Address</th>
                  <th className="px-4 py-3 text-right text-[9px] uppercase tracking-[0.15em] text-white/25 font-light">Allocation</th>
                  <th className="px-4 py-3 text-right text-[9px] uppercase tracking-[0.15em] text-white/25 font-light">NFTs</th>
                  <th className="px-4 py-3 text-center text-[9px] uppercase tracking-[0.15em] text-white/25 font-light">Status</th>
                  <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.15em] text-white/25 font-light">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {claims.map(c => (
                  <tr key={c.id} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} className="accent-amber-500" />
                    </td>
                    <td className="px-4 py-3 text-white/30 font-mono">{c.id}</td>
                    <td className="px-4 py-3 text-white/50 font-mono text-[11px]">{truncAddr(c.ki_address, 16)}</td>
                    <td className="px-4 py-3 text-white/50 font-mono text-[11px]">{truncAddr(c.eth_address, 14)}</td>
                    <td className="px-4 py-3 text-right text-white font-light tabular-nums">{fmt(c.total_allocation)}</td>
                    <td className="px-4 py-3 text-right text-white/30 font-light">{c.nft_count}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-white/20 font-light text-[10px]">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setSelected([c.id]); setShowModal(true); }}
                        className="text-white/15 hover:text-white/40 transition-colors">
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/20 font-light">
              Page {pagination.page} of {pagination.pages} · {pagination.total} total
            </span>
            <div className="flex gap-2">
              <button onClick={() => loadClaims(pagination.page - 1)} disabled={pagination.page <= 1}
                className="p-2 text-white/20 hover:text-white/50 disabled:opacity-20 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => loadClaims(pagination.page + 1)} disabled={pagination.page >= pagination.pages}
                className="p-2 text-white/20 hover:text-white/50 disabled:opacity-20 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Status Modal */}
        {showModal && (
          <StatusModal claimIds={selected} onClose={() => setShowModal(false)} onSaved={refresh} />
        )}
      </div>
    </main>
  );
}
