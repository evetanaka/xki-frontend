import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield, Wallet, Clock, CheckCircle, Coins, Percent,
  RefreshCw, Download, Upload, Database, Inbox, X, Save,
  Plus, Vote, Edit, Trash2, CheckCircle2,
} from 'lucide-react';
import { API_BASE, CHAIN_ID } from '../lib/constants';
import { useKeplrWallet } from '../hooks/useKeplrWallet';

/* ─── helpers ─── */

const ADMIN_WALLET = 'ki1ypnke0r4uk6u82w4gh73kc5tz0qsn0ahek0653';

function formatNumber(n: number): string { return new Intl.NumberFormat().format(n); }
function formatXKI(uxki: number | string | null): string {
  if (!uxki) return '—';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(Number(uxki) / 1_000_000);
}
function formatDate(d: string): string {
  const date = new Date(d);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function truncate(s: string | null, len: number): string {
  if (!s) return '';
  if (s.length <= len) return s;
  return s.slice(0, len / 2) + '...' + s.slice(-len / 2);
}

/* ─── API with auth ─── */

async function apiCall(endpoint: string, token: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers },
  });
  if (res.status === 401) { sessionStorage.removeItem('xki_admin_auth'); location.reload(); return; }
  return res.json();
}

/* ══════════════════════════════════════
   AUTH SCREEN
   ══════════════════════════════════════ */

function AuthScreen({ onAuth }: { onAuth: (token: string, address: string) => void }) {
  const wallet = useKeplrWallet();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const authenticate = async () => {
    setError(null);
    setBusy(true);
    try {
      if (!window.keplr) { setError('Keplr wallet not found'); setBusy(false); return; }
      await window.keplr.enable(CHAIN_ID);
      const signer = (window.keplr as any).getOfflineSigner(CHAIN_ID);
      const accounts = await signer.getAccounts();
      const address = accounts[0]?.address;
      if (address !== ADMIN_WALLET) { setError('Access denied. This wallet is not authorized.'); setBusy(false); return; }

      const timestamp = Date.now();
      const message = `XKI Migration Admin Auth\nTimestamp: ${timestamp}`;
      const sig = await window.keplr.signArbitrary(CHAIN_ID, address, message);

      const res = await fetch(`${API_BASE}/admin/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, message, signature: sig.signature, pubKey: sig.pub_key.value, timestamp }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Authentication failed'); }
      const data = await res.json();
      sessionStorage.setItem('xki_admin_auth', JSON.stringify({ address, token: data.token }));
      onAuth(data.token, address);
    } catch (e: any) {
      setError(e.message);
    }
    setBusy(false);
  };

  return (
    <section className="flex items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="w-full max-w-md glass-panel p-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-serif text-white mb-2">Admin Access</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Authenticate with your Keplr wallet</p>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-gray-400 text-center leading-relaxed">
            Connect your authorized Keplr wallet to access the admin dashboard.
          </p>
          <button onClick={authenticate} disabled={busy}
            className="w-full py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors flex items-center justify-center gap-3 disabled:opacity-50">
            <Wallet className="w-4 h-4" />
            {busy ? 'Connecting...' : 'Connect Keplr'}
          </button>
          {error && <p className="text-xs text-red-400 text-center">{error}</p>}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════
   STATS GRID
   ══════════════════════════════════════ */

function StatsGrid({ token }: { token: string }) {
  const [stats, setStats] = useState<any>({});
  useEffect(() => { apiCall('/admin/stats', token).then(setStats).catch(() => {}); }, [token]);

  const items = [
    { icon: <Clock className="w-4 h-4 text-amber-400" />, label: 'Pending', value: stats.pending ?? '--', color: 'text-amber-400' },
    { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, label: 'Completed', value: stats.completed ?? '--', color: 'text-emerald-400' },
    { icon: <Coins className="w-4 h-4 text-white" />, label: 'Distributed', value: stats.distributed ? formatNumber(stats.distributed) : '--', color: 'text-white' },
    { icon: <Percent className="w-4 h-4 text-blue-400" />, label: 'Claim Rate', value: stats.rate ? stats.rate.toFixed(1) + '%' : '--', color: 'text-blue-400' },
  ];

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((s, i) => (
        <div key={i} className="glass-panel p-6 hover:border-white/20 transition-all">
          <div className="flex items-center gap-3 mb-4">
            {s.icon}
            <span className="text-[10px] uppercase tracking-widest text-gray-500">{s.label}</span>
          </div>
          <p className={`text-3xl font-serif ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </section>
  );
}

/* ══════════════════════════════════════
   IMPORT SECTION
   ══════════════════════════════════════ */

function ImportSection({ token }: { token: string }) {
  const [csvUrl, setCsvUrl] = useState('https://claim.foundation.ki/snapshot.csv');
  const [eligible, setEligible] = useState('--');
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiCall('/admin/import-stats', token).then((d) => setEligible(formatNumber(d.eligibleAddresses || 0))).catch(() => {});
  }, [token]);

  const doImport = async () => {
    setBusy(true); setResult(null);
    try {
      const data = await apiCall('/admin/import-snapshot', token, {
        method: 'POST', body: JSON.stringify({ csvUrl, minBalance: 0 }),
      });
      setResult({ ok: !!data.success, text: data.success ? `✓ ${data.message}` : `✗ ${data.error || 'Import failed'}` });
      if (data.success) apiCall('/admin/import-stats', token).then((d) => setEligible(formatNumber(d.eligibleAddresses || 0)));
    } catch (e: any) { setResult({ ok: false, text: `✗ ${e.message}` }); }
    setBusy(false);
  };

  return (
    <section className="glass-panel p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-serif text-white">Snapshot Import</h3>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-gray-500">{eligible} addresses loaded</span>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <input value={csvUrl} onChange={(e) => setCsvUrl(e.target.value)}
          className="flex-1 min-w-[300px] bg-transparent border border-white/10 py-2 px-4 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition-colors" />
        <button onClick={doImport} disabled={busy}
          className="px-4 py-2 bg-purple-600 text-white text-[10px] uppercase tracking-widest hover:bg-purple-500 transition-all flex items-center gap-2 disabled:opacity-50">
          <Upload className="w-3 h-3" />
          {busy ? 'Importing...' : 'Import Snapshot'}
        </button>
      </div>
      {result && <p className={`mt-4 text-sm ${result.ok ? 'text-emerald-400' : 'text-red-400'}`}>{result.text}</p>}
    </section>
  );
}

/* ══════════════════════════════════════
   CLAIMS TABLE
   ══════════════════════════════════════ */

interface Claim {
  id: number; kiAddress: string; ethAddress: string; amount: number;
  status: string; txHash?: string; signature?: string; adminNotes?: string; createdAt: string;
}

function statusColor(s: string): string {
  return { pending: 'text-amber-400', approved: 'text-blue-400', completed: 'text-emerald-400', rejected: 'text-red-400' }[s] || 'text-gray-400';
}

function ClaimsTable({ token }: { token: string }) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState<Claim | null>(null);
  const [lastUpdated, setLastUpdated] = useState('--');

  const load = useCallback(async () => {
    const url = filter === 'all' ? '/admin/claims' : `/admin/claims?status=${filter}`;
    const data = await apiCall(url, token);
    setClaims(Array.isArray(data) ? data : []);
    setLastUpdated(new Date().toLocaleTimeString());
  }, [filter, token]);

  useEffect(() => { load(); }, [load]);

  const exportCSV = async () => {
    const all = await apiCall('/admin/claims', token);
    const rows = [
      'ID,Ki Address,ETH Address,Amount (XKI),Status,TX Hash,Created',
      ...(all as Claim[]).map((c) =>
        [c.id, c.kiAddress, c.ethAddress, (c.amount / 1e6).toFixed(6), c.status, c.txHash || '', c.createdAt].join(',')
      ),
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
    a.download = `xki-claims-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <>
      {/* Header */}
      <header className="flex items-end justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-serif text-white mb-2">Claims Management</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Monitor and manage XKI migration claims</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-gray-600">Last updated</p>
          <p className="text-sm text-gray-400">{lastUpdated}</p>
        </div>
      </header>

      {/* Filters */}
      <section className="flex flex-wrap items-center gap-4">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="bg-transparent border border-white/20 py-2 px-4 text-sm text-white focus:outline-none cursor-pointer">
          {['pending', 'approved', 'completed', 'rejected', 'all'].map((v) => (
            <option key={v} value={v} className="bg-[#0a0a0a]">{v.charAt(0).toUpperCase() + v.slice(1)}{v === 'all' ? ' Claims' : ''}</option>
          ))}
        </select>
        <button onClick={load} className="px-4 py-2 border border-white/20 text-white text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center gap-2">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
        <button onClick={exportCSV} className="px-4 py-2 border border-white/20 text-white text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center gap-2">
          <Download className="w-3 h-3" /> Export CSV
        </button>
      </section>

      {/* Table */}
      <section className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {['ID', 'Ki Address', 'ETH Address', 'Amount', 'Status', 'Created', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-4 px-6 text-[10px] uppercase tracking-widest text-gray-500 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {claims.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-4 px-6 text-sm text-gray-400">#{c.id}</td>
                  <td className="py-4 px-6 font-mono text-xs text-gray-300" title={c.kiAddress}>{truncate(c.kiAddress, 18)}</td>
                  <td className="py-4 px-6 font-mono text-xs text-gray-300" title={c.ethAddress}>{truncate(c.ethAddress, 18)}</td>
                  <td className="py-4 px-6 text-sm text-white font-medium">{formatXKI(c.amount)} XKI</td>
                  <td className="py-4 px-6">
                    <span className={`text-[10px] uppercase tracking-widest font-bold ${statusColor(c.status)}`}>{c.status}</span>
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-500">{formatDate(c.createdAt)}</td>
                  <td className="py-4 px-6">
                    <button onClick={() => setSelected(c)}
                      className="px-3 py-1 border border-white/10 text-[10px] uppercase tracking-widest text-gray-400 hover:bg-white hover:text-black transition-all">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {claims.length === 0 && (
          <div className="py-16 text-center">
            <Inbox className="w-8 h-8 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No claims found</p>
          </div>
        )}
      </section>

      {/* Detail Modal */}
      {selected && (
        <ClaimDetailModal claim={selected} token={token} onClose={() => setSelected(null)} onUpdated={() => { setSelected(null); load(); }} />
      )}
    </>
  );
}

/* ─── Claim Detail Modal ─── */

function ClaimDetailModal({ claim, token, onClose, onUpdated }: { claim: Claim; token: string; onClose: () => void; onUpdated: () => void }) {
  const [status, setStatus] = useState(claim.status);
  const [txHash, setTxHash] = useState(claim.txHash || '');
  const [notes, setNotes] = useState(claim.adminNotes || '');
  const [busy, setBusy] = useState(false);

  const update = async () => {
    if (status === 'completed' && !txHash) { alert('TX Hash is required for completed claims'); return; }
    setBusy(true);
    const res = await fetch(`${API_BASE}/admin/claims/${claim.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, txHash, adminNotes: notes }),
    });
    if (res.ok) { alert('Claim updated successfully'); onUpdated(); } else { const e = await res.json(); alert('Error: ' + (e.error || 'Unknown error')); }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-panel w-full max-w-xl max-h-[90vh] overflow-y-auto animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-serif text-white">Claim Details</h2>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">ID: <span className="text-white">{claim.id}</span></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center border border-white/20 hover:bg-white hover:text-black transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          {/* Addresses */}
          {[{ label: 'Ki Chain Address', value: claim.kiAddress }, { label: 'Ethereum Address', value: claim.ethAddress }].map((a) => (
            <div key={a.label} className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-gray-500">{a.label}</label>
              <p className="font-mono text-sm text-white bg-white/5 p-3 border border-white/10 break-all">{a.value}</p>
            </div>
          ))}
          {/* Amount & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] uppercase tracking-widest text-gray-500">Amount</label>
              <p className="text-2xl font-serif text-white">{formatXKI(claim.amount)} <span className="text-sm text-gray-500">XKI</span></p></div>
            <div><label className="text-[10px] uppercase tracking-widest text-gray-500">Current Status</label>
              <p className={`text-lg font-bold uppercase tracking-widest ${statusColor(claim.status)}`}>{claim.status}</p></div>
          </div>
          {claim.signature && (
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-gray-500">Signature</label>
              <p className="font-mono text-xs text-gray-400 bg-white/5 p-3 border border-white/10 break-all">{claim.signature}</p>
            </div>
          )}
          <div className="space-y-2"><label className="text-[10px] uppercase tracking-widest text-gray-500">Created</label>
            <p className="text-sm text-gray-400">{formatDate(claim.createdAt)}</p></div>

          {/* Update form */}
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-sm font-serif text-white mb-4">Update Claim</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-transparent border border-white/20 py-3 px-4 text-sm text-white focus:outline-none cursor-pointer mt-1">
                  {['pending', 'approved', 'completed', 'rejected'].map((v) => (
                    <option key={v} value={v} className="bg-[#0a0a0a]">{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500">TX Hash <span className="text-gray-600">(for completed)</span></label>
                <input value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="0x..."
                  className="w-full bg-transparent border border-white/10 py-3 px-4 text-sm font-mono text-white placeholder-gray-700 focus:outline-none focus:border-white/30 mt-1" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500">Admin Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Add notes..."
                  className="w-full bg-transparent border border-white/10 py-3 px-4 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-white/30 resize-none mt-1" />
              </div>
              <button onClick={update} disabled={busy}
                className="w-full py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors flex items-center justify-center gap-3 disabled:opacity-50">
                <Save className="w-4 h-4" /> {busy ? 'Updating...' : 'Update Claim'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   GOVERNANCE ADMIN
   ══════════════════════════════════════ */

interface Proposal {
  id: number; proposalNumber: string; title: string; description: string;
  status: string; startDate: string; endDate: string;
  votesFor: string; votesAgainst: string; votesAbstain: string; voterCount: number;
  isActive: boolean;
}

function GovernanceAdmin({ token }: { token: string }) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [editModal, setEditModal] = useState<Proposal | 'new' | null>(null);
  const [detailModal, setDetailModal] = useState<Proposal | null>(null);

  const load = useCallback(async () => {
    const data = await apiCall('/governance/admin/proposals', token);
    setProposals(data.proposals || []);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  return (
    <section className="border-t border-white/10 pt-8 mt-8">
      <header className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl font-serif text-white mb-2">Governance</h2>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Manage community proposals and votes</p>
        </div>
        <button onClick={() => setEditModal('new')}
          className="px-4 py-2 bg-white text-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2">
          <Plus className="w-3 h-3" /> New Proposal
        </button>
      </header>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {['Number', 'Title', 'Status', 'Votes', 'End Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-4 px-6 text-[10px] uppercase tracking-widest text-gray-500 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {proposals.map((p) => {
                const total = BigInt(p.votesFor) + BigInt(p.votesAgainst) + BigInt(p.votesAbstain);
                const forPct = total > 0n ? Number((BigInt(p.votesFor) * 100n) / total) : 0;
                const againstPct = total > 0n ? Number((BigInt(p.votesAgainst) * 100n) / total) : 0;
                const sc: Record<string, string> = {
                  draft: 'text-gray-400 bg-gray-900/50', active: 'text-green-400 bg-green-900/30',
                  ended: 'text-yellow-400 bg-yellow-900/30', passed: 'text-blue-400 bg-blue-900/30', rejected: 'text-red-400 bg-red-900/30',
                };
                return (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setDetailModal(p)}>
                    <td className="py-4 px-6 text-sm font-mono text-gray-400">{p.proposalNumber}</td>
                    <td className="py-4 px-6 text-sm text-white">{p.title}</td>
                    <td className="py-4 px-6"><span className={`text-[10px] uppercase tracking-wider px-2 py-1 ${sc[p.status] || sc.draft}`}>{p.status}</span></td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-400">{forPct}%</span>
                        <div className="w-16 h-1 bg-gray-800 flex overflow-hidden">
                          <div className="bg-green-500" style={{ width: `${forPct}%` }} />
                          <div className="bg-red-500" style={{ width: `${againstPct}%` }} />
                        </div>
                        <span className="text-xs text-red-400">{againstPct}%</span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">{p.voterCount} voters</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-400">{formatDate(p.endDate)}</td>
                    <td className="py-4 px-6">
                      <button onClick={(e) => { e.stopPropagation(); setEditModal(p); }}
                        className="px-3 py-1 text-[10px] uppercase tracking-wider border border-white/20 text-gray-400 hover:text-white transition-all mr-2">Edit</button>
                      <button onClick={(e) => { e.stopPropagation(); setDetailModal(p); }}
                        className="px-3 py-1 text-[10px] uppercase tracking-wider border border-white/20 text-gray-400 hover:text-white transition-all">View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {proposals.length === 0 && (
          <div className="py-16 text-center">
            <Vote className="w-8 h-8 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No proposals yet</p>
          </div>
        )}
      </div>

      {editModal && (
        <ProposalEditModal
          proposal={editModal === 'new' ? null : editModal}
          token={token}
          onClose={() => setEditModal(null)}
          onSaved={() => { setEditModal(null); load(); }}
        />
      )}
      {detailModal && (
        <ProposalDetailModal
          proposal={detailModal} token={token}
          onClose={() => setDetailModal(null)}
          onEdit={() => { setDetailModal(null); setEditModal(detailModal); }}
          onFinalized={() => { setDetailModal(null); load(); }}
        />
      )}
    </section>
  );
}

/* ─── Proposal Edit Modal ─── */

function ProposalEditModal({ proposal, token, onClose, onSaved }: { proposal: Proposal | null; token: string; onClose: () => void; onSaved: () => void }) {
  const isNew = !proposal;
  const [title, setTitle] = useState(proposal?.title || '');
  const [description, setDescription] = useState(proposal?.description || '');
  const [status, setStatus] = useState(proposal?.status || 'draft');
  const [startDate, setStartDate] = useState(proposal?.startDate?.slice(0, 16) || new Date().toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState(proposal?.endDate?.slice(0, 16) || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!title || !description) { alert('Please fill in all required fields'); return; }
    setBusy(true);
    const body = { title, description, startDate: new Date(startDate).toISOString(), endDate: new Date(endDate).toISOString(), status };
    const endpoint = isNew ? '/governance/admin/proposals' : `/governance/admin/proposals/${proposal!.id}`;
    const method = isNew ? 'POST' : 'PUT';
    const result = await apiCall(endpoint, token, { method, body: JSON.stringify(body) });
    if (result.success) onSaved(); else alert('Error: ' + (result.error || 'Unknown'));
    setBusy(false);
  };

  const del = async () => {
    if (!proposal || !confirm('Delete this proposal?')) return;
    await apiCall(`/governance/admin/proposals/${proposal.id}`, token, { method: 'DELETE' });
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-panel w-full max-w-xl max-h-[90vh] overflow-y-auto animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-serif text-white">{isNew ? 'New Proposal' : 'Edit Proposal'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center border border-white/20 hover:bg-white hover:text-black transition-all"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-6">
          <div><label className="text-[10px] uppercase tracking-widest text-gray-500">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-transparent border border-white/10 py-3 px-4 text-sm text-white focus:outline-none focus:border-white/30 mt-1" /></div>
          <div><label className="text-[10px] uppercase tracking-widest text-gray-500">Description *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className="w-full bg-transparent border border-white/10 py-3 px-4 text-sm text-white focus:outline-none focus:border-white/30 resize-none mt-1" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] uppercase tracking-widest text-gray-500">Start Date</label>
              <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-transparent border border-white/10 py-3 px-4 text-sm text-white focus:outline-none mt-1" /></div>
            <div><label className="text-[10px] uppercase tracking-widest text-gray-500">End Date</label>
              <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-transparent border border-white/10 py-3 px-4 text-sm text-white focus:outline-none mt-1" /></div>
          </div>
          <div><label className="text-[10px] uppercase tracking-widest text-gray-500">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-transparent border border-white/20 py-3 px-4 text-sm text-white focus:outline-none cursor-pointer mt-1">
              {[['draft', 'Draft (not visible)'], ['active', 'Active (open for voting)'], ['ended', 'Ended (voting closed)']].map(([v, l]) => (
                <option key={v} value={v} className="bg-[#0a0a0a]">{l}</option>
              ))}
            </select></div>
          <div className="flex gap-4">
            <button onClick={save} disabled={busy}
              className="flex-1 py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors flex items-center justify-center gap-3 disabled:opacity-50">
              <Save className="w-4 h-4" /> {busy ? 'Saving...' : 'Save Proposal'}
            </button>
            {!isNew && proposal?.status === 'draft' && (
              <button onClick={del} className="px-6 py-4 bg-red-900/30 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-[0.2em] hover:bg-red-900/50 transition-colors flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Proposal Detail Modal ─── */

function ProposalDetailModal({ proposal, token, onClose, onEdit, onFinalized }: {
  proposal: Proposal; token: string; onClose: () => void; onEdit: () => void; onFinalized: () => void;
}) {
  const [votes, setVotes] = useState<any[]>([]);

  useEffect(() => {
    apiCall(`/governance/proposals/${proposal.id}/votes`, token).then((d) => setVotes(d.votes || [])).catch(() => {});
  }, [proposal.id, token]);

  const total = BigInt(proposal.votesFor) + BigInt(proposal.votesAgainst) + BigInt(proposal.votesAbstain);
  const forPct = total > 0n ? Number((BigInt(proposal.votesFor) * 100n) / total) : 0;
  const againstPct = total > 0n ? Number((BigInt(proposal.votesAgainst) * 100n) / total) : 0;
  const abstainPct = total > 0n ? Number((BigInt(proposal.votesAbstain) * 100n) / total) : 0;

  const finalize = async () => {
    if (!confirm('Finalize this proposal?')) return;
    const result = await apiCall(`/governance/admin/proposals/${proposal.id}/finalize`, token, { method: 'POST' });
    if (result.success) { alert('Proposal finalized as: ' + result.proposal.status.toUpperCase()); onFinalized(); }
    else alert('Error: ' + (result.error || 'Unknown'));
  };

  const voteColor: Record<string, string> = { for: 'text-green-400', against: 'text-red-400', abstain: 'text-gray-400' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-gray-500">{proposal.proposalNumber}</span>
            <h2 className="text-xl font-serif text-white mt-1">{proposal.title}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center border border-white/20 hover:bg-white hover:text-black transition-all"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-6">
          {/* Vote stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'For', value: proposal.votesFor, pct: forPct, cls: 'green' },
              { label: 'Against', value: proposal.votesAgainst, pct: againstPct, cls: 'red' },
              { label: 'Abstain', value: proposal.votesAbstain, pct: abstainPct, cls: 'gray' },
            ].map((v) => (
              <div key={v.label} className={`text-center p-4 bg-${v.cls}-900/20 border border-${v.cls}-500/30`}>
                <p className={`text-[10px] uppercase tracking-widest text-${v.cls}-400 mb-2`}>{v.label}</p>
                <p className={`text-2xl font-serif text-${v.cls}-400`}>{formatXKI(v.value)}</p>
                <p className={`text-xs text-${v.cls}-400/70 mt-1`}>{v.pct}%</p>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Voters: <span className="text-white">{proposal.voterCount}</span></span>
            <span className="text-gray-500">Total Power: <span className="text-white">{formatXKI(total.toString())} XKI</span></span>
          </div>

          {/* Votes list */}
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-sm font-serif text-white mb-4">Recent Votes</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {votes.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No votes yet</p>
              ) : (
                votes.slice(0, 20).map((v, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="font-mono text-xs text-gray-400">{truncate(v.kiAddress, 20)}</span>
                    <span className={`text-xs uppercase tracking-wider ${voteColor[v.voteChoice] || 'text-gray-400'}`}>{v.voteChoice}</span>
                    <span className="text-xs text-gray-500">{formatXKI(v.votingPower)} XKI</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 border-t border-white/10 pt-6">
            <button onClick={onEdit}
              className="flex-1 py-3 border border-white/20 text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2">
              <Edit className="w-4 h-4" /> Edit
            </button>
            {(proposal.status === 'ended' || proposal.status === 'active') && (
              <button onClick={finalize}
                className="flex-1 py-3 bg-blue-600 text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-blue-500 transition-all flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Finalize Result
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN ADMIN PAGE
   ══════════════════════════════════════ */

export default function AdminPage() {
  const [auth, setAuth] = useState<{ token: string; address: string } | null>(null);

  // Restore session
  useEffect(() => {
    const stored = sessionStorage.getItem('xki_admin_auth');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.address === ADMIN_WALLET && data.token) setAuth(data);
      } catch { sessionStorage.removeItem('xki_admin_auth'); }
    }
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '100px 100px' }} />

      {/* Nav bar */}
      <nav className="relative z-10 w-full px-8 py-6 flex justify-between items-center border-b border-white/10">
        <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-serif font-bold text-lg">K</div>
          <span className="text-sm tracking-[0.2em] uppercase font-light text-gray-400">Foundation</span>
        </a>
        <div className="flex items-center gap-6">
          <span className="text-[10px] uppercase tracking-widest text-gray-500">Admin Dashboard</span>
          <div className={`px-3 py-1 border text-[10px] uppercase tracking-widest transition-all ${
            auth ? 'text-emerald-400 border-emerald-900 bg-emerald-900/10' : 'text-gray-400 border-white/20'
          }`}>
            {auth ? truncate(auth.address, 16) : 'Disconnected'}
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-8">
        {!auth ? (
          <AuthScreen onAuth={(token, address) => setAuth({ token, address })} />
        ) : (
          <div className="space-y-8 animate-fade-in">
            <StatsGrid token={auth.token} />
            <ImportSection token={auth.token} />
            <ClaimsTable token={auth.token} />
            <GovernanceAdmin token={auth.token} />
          </div>
        )}
      </main>

      <footer className="relative z-10 border-t border-white/10 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center">
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">© 2026 Ki Chain Foundation — Admin Panel</p>
        </div>
      </footer>
    </>
  );
}
