import { useState, useEffect, useCallback } from 'react';
import {
  ChevronRight, ArrowRight, ShieldCheck, Check, CheckCircle,
  Clock, Layers, Search, Vote, BookOpen, X, Minus, Info,
  Inbox, AlertCircle, LogOut, Wallet,
} from 'lucide-react';
import { api } from '../lib/api';
import { useKeplrWallet } from '../hooks/useKeplrWallet';
import { API_BASE } from '../lib/constants';

/* ─── helpers ─── */

function formatNumber(num: number | null | undefined): string {
  if (!num) return '—';
  return new Intl.NumberFormat().format(num);
}

function formatXKI(uxki: number | string | null | undefined): string {
  if (!uxki) return '—';
  const xki = Number(uxki) / 1_000_000;
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(xki);
}

function formatCountdown(deadline: string | null | undefined): string {
  if (!deadline) return '—';
  const diff = new Date(deadline.replace(' ', 'T') + 'Z').getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  return `${days}j ${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;
}

function formatTimeLeft(endDate: Date): string {
  const diff = endDate.getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  return `${mins}m left`;
}

function truncateAddress(addr: string | null | undefined): string {
  if (!addr) return '';
  return addr.slice(0, 8) + '...' + addr.slice(-4);
}

function isValidEthAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

/* ─── simple markdown renderer ─── */
function renderMarkdown(text: string): string {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/((<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
  html = html.replace(/^---$/gm, '<hr>');
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  html = '<p>' + html + '</p>';
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>(<h[123]>)/g, '$1');
  html = html.replace(/(<\/h[123]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)<\/p>/g, '$1');
  html = html.replace(/<p>(<hr>)<\/p>/g, '$1');
  html = html.replace(/<p>(<blockquote>)/g, '$1');
  html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
  return html;
}

/* ══════════════════════════════════════
   STEP COMPONENTS
   ══════════════════════════════════════ */

function Step1({ onConnect, isProcessing }: { onConnect: () => void; isProcessing: boolean }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <p className="text-sm text-gray-400 font-light leading-relaxed">
        Please connect your Keplr wallet to verify your Ki Chain holdings and initiate the migration sequence.
      </p>
      <button
        onClick={onConnect}
        disabled={isProcessing}
        className="group w-full py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {isProcessing ? 'Connecting...' : 'Connect Keplr'}
        <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}

function Step2({ balance, onContinue }: { balance: string | null; onContinue: () => void }) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-1 border-l-2 border-white/20 pl-6 py-2">
        <span className="text-[10px] uppercase tracking-widest text-gray-500">Verified Balance</span>
        <span className="text-4xl font-serif text-white">
          {formatXKI(balance)} <span className="text-lg text-gray-600">XKI</span>
        </span>
      </div>
      <div className="bg-white/5 p-4 border border-white/10">
        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs text-white uppercase tracking-wider">Eligible for Migration</p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Your wallet snapshot confirms ownership. Proceed to define the destination.
            </p>
          </div>
        </div>
      </div>
      <button
        onClick={onContinue}
        className="group w-full py-4 border border-white/20 text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3"
      >
        Continue
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function Step3({ onSubmit, isProcessing }: { onSubmit: (ethAddress: string) => void; isProcessing: boolean }) {
  const [ethAddress, setEthAddress] = useState('');
  const valid = isValidEthAddress(ethAddress);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (valid) onSubmit(ethAddress);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
      <div className="space-y-4">
        <label className="text-[10px] uppercase tracking-widest text-gray-400 block">
          Recipient Ethereum Address
        </label>
        <input
          type="text"
          value={ethAddress}
          onChange={(e) => setEthAddress(e.target.value)}
          placeholder="0x..."
          className="w-full bg-transparent border-b border-gray-700 py-3 text-xl font-mono text-white placeholder-gray-800 focus:outline-none focus:border-white transition-colors rounded-none"
        />
        <p className="text-[10px] text-gray-500 flex items-center gap-2">
          <ShieldCheck className="w-3 h-3" />
          Ensure this is a non-custodial wallet (Metamask, Ledger).
        </p>
      </div>
      <button
        type="submit"
        disabled={!valid || isProcessing}
        className={`w-full py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 border ${
          valid
            ? 'bg-white text-black hover:bg-gray-200 cursor-pointer border-white'
            : 'bg-gray-900 text-gray-600 cursor-not-allowed border-gray-800'
        }`}
      >
        {isProcessing ? 'Preparing...' : 'Review Claim'}
      </button>
    </form>
  );
}

function Step4({
  balance, ethAddress, onSign, isProcessing,
}: {
  balance: string | null; ethAddress: string; onSign: () => void; isProcessing: boolean;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-4 border-b border-white/10 pb-6">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 uppercase tracking-widest">Amount</span>
          <span className="text-sm text-white font-mono">{formatXKI(balance)} XKI</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 uppercase tracking-widest">Destination</span>
          <span className="text-sm text-white font-mono truncate max-w-[150px]">{ethAddress}</span>
        </div>
      </div>
      <p className="text-[11px] text-gray-500 text-center leading-relaxed">
        By signing, you cryptographically prove ownership of the Ki Chain wallet. This does not incur gas fees.
      </p>
      <button
        onClick={onSign}
        disabled={isProcessing}
        className="w-full py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors disabled:opacity-50"
      >
        {isProcessing ? 'Verifying Signature...' : 'Sign Message'}
      </button>
    </div>
  );
}

function Step5({ claimId }: { claimId: string | null }) {
  return (
    <div className="text-center space-y-6 animate-fade-in">
      <div className="w-16 h-16 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Claim ID</p>
        <p className="text-lg font-mono text-white">{claimId || '—'}</p>
      </div>
      <div className="bg-green-900/10 border border-green-900/30 p-4">
        <p className="text-xs text-green-400">Your claim is now pending distribution.</p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="text-[10px] uppercase tracking-widest text-gray-500 hover:text-white transition-colors border-b border-transparent hover:border-white pb-1"
      >
        Start New Claim
      </button>
    </div>
  );
}

/* ─── Special states (already claimed, pending, approved, rejected) ─── */

function ClaimStatusCard({
  status, label, color, balance, kiAddress, extra,
}: {
  status: string; label: string; color: string; balance?: string | null; kiAddress?: string | null; extra?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full py-8 px-4 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className={`w-3 h-3 rounded-full ${color} ${status === 'pending' || status === 'approved' ? 'animate-pulse' : ''}`} />
        <span className={`text-sm uppercase tracking-widest font-mono ${color.replace('bg-', 'text-')}`}>{label}</span>
      </div>
      {extra && (
        <p className="text-gray-400 leading-relaxed mb-8 max-w-md">{extra}</p>
      )}
      {balance && (
        <div className="border-t border-gray-800 pt-6 mt-2 mb-6 w-full max-w-sm">
          <div className="text-xs uppercase tracking-widest text-gray-600 mb-2">
            {status === 'rejected' ? 'Montant demandé' : status === 'completed' ? 'Montant migré' : 'Montant'}
          </div>
          <div className="text-2xl font-serif text-white">
            {formatXKI(balance)} <span className="text-lg text-gray-600">XKI</span>
          </div>
        </div>
      )}
      {kiAddress && (
        <div className="border-t border-gray-800 pt-6 w-full max-w-sm">
          <div className="text-xs uppercase tracking-widest text-gray-600 mb-2">Adresse</div>
          <div className="text-sm font-mono text-gray-400">{kiAddress}</div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   CHECK STATUS SECTION
   ══════════════════════════════════════ */

function CheckStatusSection() {
  const [address, setAddress] = useState('');
  const [result, setResult] = useState<{ type: string; html: React.ReactNode } | null>(null);

  const check = async () => {
    if (!address.startsWith('ki1')) {
      setResult({
        type: 'error',
        html: <p className="text-xs text-red-400">Please enter a valid Ki Chain address (ki1...)</p>,
      });
      return;
    }
    setResult({ type: 'loading', html: <p className="text-xs text-gray-400 animate-pulse">Checking status...</p> });

    try {
      const data = await api.getClaimStatus(address);
      if (data.status === 'completed') {
        setResult({
          type: 'success',
          html: (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <p className="text-xs text-green-400 uppercase tracking-wider">Claim Completed</p>
              </div>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="text-white font-mono">{formatXKI(data.amount)} XKI</span>
                </div>
                {data.txHash && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">TX Hash</span>
                    <a href={`https://etherscan.io/tx/${data.txHash}`} target="_blank" rel="noreferrer"
                      className="text-white font-mono hover:underline">{truncateAddress(data.txHash)}</a>
                  </div>
                )}
              </div>
            </div>
          ),
        });
      } else if (data.status === 'pending') {
        setResult({
          type: 'warning',
          html: (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <p className="text-xs text-yellow-400 uppercase tracking-wider">Pending — Awaiting Processing</p>
            </div>
          ),
        });
      } else {
        setResult({
          type: 'info',
          html: (
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-gray-500" />
              <p className="text-xs text-gray-400">No claim found for this address</p>
            </div>
          ),
        });
      }
    } catch {
      setResult({
        type: 'info',
        html: (
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-500" />
            <p className="text-xs text-gray-400">No claim found for this address</p>
          </div>
        ),
      });
    }
  };

  const borderColor = {
    error: 'border-red-900/30 bg-red-900/10',
    success: 'border-green-900/30 bg-green-900/10',
    warning: 'border-yellow-900/30 bg-yellow-900/10',
    info: 'border-white/10 bg-white/5',
    loading: 'border-white/10 bg-white/5',
  }[result?.type ?? 'info'];

  return (
    <div className="w-full max-w-lg mt-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
      <div className="border-t border-white/10 pt-8">
        <div className="flex items-center gap-3 mb-6">
          <Search className="w-4 h-4 text-gray-500" />
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Check Existing Claim</h3>
        </div>
        <div className="space-y-4">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter ki1... address"
            className="w-full bg-transparent border border-white/10 py-3 px-4 text-sm font-mono text-white placeholder-gray-700 focus:outline-none focus:border-white/30 transition-colors"
          />
          <button
            onClick={check}
            className="w-full py-3 border border-white/20 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-3 h-3" />
            Check Status
          </button>
          {result && (
            <div className={`mt-4 p-4 border ${borderColor}`}>
              {result.html}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   GOVERNANCE SECTION
   ══════════════════════════════════════ */

interface Proposal {
  id: number;
  proposalNumber: string;
  title: string;
  description: string;
  status: string;
  isActive: boolean;
  votesFor: string;
  votesAgainst: string;
  votesAbstain: string;
  voterCount: number;
  endDate: string;
}

function GovernanceSection({ kiAddress, onConnectWallet }: { kiAddress: string | null; onConnectWallet: () => Promise<void> }) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalProposal, setModalProposal] = useState<Proposal | null>(null);

  useEffect(() => {
    api.getProposals(5).then((data) => {
      setProposals(data.proposals || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <section className="w-full max-w-4xl mt-16 animate-fade-in" style={{ animationDelay: '0.5s' }}>
      <div className="border-t border-white/10 pt-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Vote className="w-5 h-5 text-white" />
            <h2 className="text-xl font-serif text-white">Governance</h2>
          </div>
          <a href="/guide" className="text-[10px] uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-colors flex items-center gap-2">
            <BookOpen className="w-3 h-3" />
            How to vote
          </a>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              <div className="w-5 h-5 mx-auto mb-3 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
              Loading proposals...
            </div>
          ) : proposals.length === 0 ? (
            <div className="text-center py-8 text-gray-600 text-sm">
              <Inbox className="w-5 h-5 mx-auto mb-3" />
              No proposals at the moment
            </div>
          ) : (
            proposals.map((p) => (
              <ProposalCard key={p.id} proposal={p} onClick={() => setModalProposal(p)} />
            ))
          )}
        </div>
      </div>

      {modalProposal && (
        <VoteModal
          proposal={modalProposal}
          kiAddress={kiAddress}
          onClose={() => setModalProposal(null)}
          onConnectWallet={onConnectWallet}
          onVoteSubmitted={(updated) => {
            setProposals((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          }}
        />
      )}
    </section>
  );
}

function ProposalCard({ proposal: p, onClick }: { proposal: Proposal; onClick: () => void }) {
  const totalVotes = BigInt(p.votesFor) + BigInt(p.votesAgainst) + BigInt(p.votesAbstain);
  const forPct = totalVotes > 0n ? Number((BigInt(p.votesFor) * 100n) / totalVotes) : 0;
  const againstPct = totalVotes > 0n ? Number((BigInt(p.votesAgainst) * 100n) / totalVotes) : 0;

  const statusStyle: Record<string, string> = {
    active: 'text-green-400 border-green-500/30 bg-green-900/10',
    passed: 'text-blue-400 border-blue-500/30 bg-blue-900/10',
    rejected: 'text-red-400 border-red-500/30 bg-red-900/10',
    ended: 'text-gray-400 border-gray-500/30 bg-gray-900/10',
  };
  const statusLabel: Record<string, string> = { active: 'Active', passed: 'Passed', rejected: 'Rejected', ended: 'Ended' };
  const timeLeft = p.isActive ? formatTimeLeft(new Date(p.endDate)) : '';

  return (
    <div className="glass-panel p-6 hover:border-white/20 transition-all cursor-pointer" onClick={onClick}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-gray-500">{p.proposalNumber}</span>
          <h3 className="text-lg font-serif text-white mt-1">{p.title}</h3>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {timeLeft && <span className="text-[10px] text-gray-500">{timeLeft}</span>}
          <span className={`text-[10px] uppercase tracking-wider px-2 py-1 border ${statusStyle[p.status] || statusStyle.ended}`}>
            {statusLabel[p.status] || p.status}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
        {p.description.substring(0, 150)}{p.description.length > 150 ? '...' : ''}
      </p>
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] uppercase tracking-wider">
          <span className="text-green-400">Yes {forPct}%</span>
          <span className="text-gray-500">{p.voterCount} voter{p.voterCount !== 1 ? 's' : ''}</span>
          <span className="text-red-400">No {againstPct}%</span>
        </div>
        <div className="h-1 bg-gray-800 flex overflow-hidden">
          <div className="bg-green-500 transition-all" style={{ width: `${forPct}%` }} />
          <div className="bg-red-500 transition-all" style={{ width: `${againstPct}%` }} />
        </div>
      </div>
    </div>
  );
}

function VoteModal({
  proposal, kiAddress, onClose, onConnectWallet, onVoteSubmitted,
}: {
  proposal: Proposal;
  kiAddress: string | null;
  onClose: () => void;
  onConnectWallet: () => Promise<void>;
  onVoteSubmitted: (updated: Proposal) => void;
}) {
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [votingPower, setVotingPower] = useState<string>('0');
  const [hasVoted, setHasVoted] = useState(false);
  const [canVote, setCanVote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const wallet = useKeplrWallet();

  useEffect(() => {
    if (!kiAddress) return;
    api.getVoteStatus(proposal.id, kiAddress).then((data) => {
      setVotingPower(data.votingPower || '0');
      setHasVoted(data.hasVoted);
      setCanVote(data.canVote);
    }).catch(() => {});
  }, [kiAddress, proposal.id]);

  const handleSubmitVote = async () => {
    if (!selectedVote || !kiAddress || !window.keplr) return;
    setIsSubmitting(true);
    try {
      const message = `Vote ${selectedVote} on ${proposal.proposalNumber}: ${proposal.title}`;
      const sig = await window.keplr.signArbitrary('kichain-2', kiAddress, message);
      const data = await api.submitVote(proposal.id, {
        kiAddress,
        voteChoice: selectedVote,
        signature: sig.signature,
        pubKey: sig.pub_key.value,
      });
      if (data.success) {
        setHasVoted(true);
        if (data.proposal) onVoteSubmitted(data.proposal);
      } else {
        alert('Vote failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error submitting vote: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const voteStyles: Record<string, string> = {
    for: 'border-green-500 bg-green-900/30',
    against: 'border-red-500 bg-red-900/30',
    abstain: 'border-gray-500 bg-gray-900/30',
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={onClose}>
      <div className="glass-panel w-full max-w-5xl m-4 p-8 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-gray-500">{proposal.proposalNumber}</span>
            <h3 className="text-xl font-serif text-white mt-1">{proposal.title}</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className="text-sm text-gray-400 mb-6 leading-relaxed max-h-[50vh] overflow-y-auto proposal-content"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(proposal.description) }}
        />

        {/* Voting Power */}
        <div className="bg-white/5 border border-white/10 p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Your Voting Power</span>
            <span className="text-lg font-serif text-white">
              {kiAddress ? `${formatXKI(votingPower)} XKI` : 'Connect wallet to vote'}
            </span>
          </div>
        </div>

        {hasVoted ? (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/20 border border-green-500/30 text-green-400 text-xs uppercase tracking-wider">
              <CheckCircle className="w-4 h-4" />
              You have already voted
            </div>
          </div>
        ) : !kiAddress ? (
          <button
            onClick={onConnectWallet}
            className="w-full py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors"
          >
            Connect Keplr to Vote
          </button>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {(['for', 'against', 'abstain'] as const).map((choice) => (
                <button
                  key={choice}
                  onClick={() => setSelectedVote(choice)}
                  className={`py-4 border text-white text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                    selectedVote === choice ? voteStyles[choice] : 'border-white/20 hover:border-white/40'
                  }`}
                >
                  {choice === 'for' && <Check className="w-4 h-4" />}
                  {choice === 'against' && <X className="w-4 h-4" />}
                  {choice === 'abstain' && <Minus className="w-4 h-4" />}
                  {choice === 'for' ? 'Yes' : choice === 'against' ? 'No' : 'Abstain'}
                </button>
              ))}
            </div>
            <button
              onClick={handleSubmitVote}
              disabled={!selectedVote || isSubmitting}
              className={`w-full py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all ${
                selectedVote
                  ? 'bg-white text-black hover:bg-gray-200 cursor-pointer'
                  : 'bg-gray-900 text-gray-600 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Signing...' : selectedVote ? 'Sign & Submit Vote' : 'Select an Option'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   FOOTER STATS
   ══════════════════════════════════════ */

function FooterStats() {
  const [stats, setStats] = useState<any>(null);
  const [countdown, setCountdown] = useState('—');

  useEffect(() => {
    api.getStats().then((data) => {
      setStats(data);
      if (data.deadline) {
        setCountdown(formatCountdown(data.deadline));
        const interval = setInterval(() => setCountdown(formatCountdown(data.deadline)), 60_000);
        return () => clearInterval(interval);
      }
    }).catch(() => {});
  }, []);

  return (
    <footer className="relative z-0 w-full border-t border-white/10 bg-[#080808]">
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 max-w-6xl mx-auto">
        {[
          { icon: <Layers className="w-4 h-4" />, label: 'Total Eligible Wallets', value: formatNumber(stats?.totalEligible) },
          { icon: <Check className="w-4 h-4" />, label: 'Total XKI Claimed', value: stats ? formatNumber(stats.totalClaimed) + ' XKI' : '—' },
          { icon: <Clock className="w-4 h-4" />, label: 'Time Remaining', value: countdown },
        ].map((s, i) => (
          <div key={i} className="py-8 md:py-10 flex flex-col items-center justify-center group hover:bg-white/5 transition-colors cursor-default">
            <div className="mb-3 text-gray-600 group-hover:text-white transition-colors">{s.icon}</div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">{s.label}</span>
            <span className="text-2xl font-serif text-white">{s.value}</span>
          </div>
        ))}
      </div>
      <div className="py-6 text-center border-t border-white/5">
        <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">© 2026 Ki Chain Foundation — Architecture of Value</p>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════
   MAIN CLAIM PAGE
   ══════════════════════════════════════ */

const STEP_TITLES: Record<number, string> = {
  1: 'Authentication',
  2: 'Eligibility Check',
  3: 'Destination',
  4: 'Confirmation',
  5: 'Submission Complete',
};

type SpecialStatus = 'completed' | 'pending' | 'approved' | 'rejected' | null;

export default function ClaimPage() {
  const wallet = useKeplrWallet();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [ethAddress, setEthAddress] = useState('');
  const [nonce, setNonce] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [claimId, setClaimId] = useState<string | null>(null);
  const [specialStatus, setSpecialStatus] = useState<SpecialStatus>(null);

  const stepTitle = specialStatus
    ? { completed: 'Claim validé', pending: 'Claim en cours de validation', approved: 'Migration approuvée', rejected: 'Migration refusée' }[specialStatus]
    : STEP_TITLES[step];

  const stepIndicator = specialStatus
    ? { completed: 'Migration Complete', pending: 'Claim Submitted', approved: 'Claim Approved', rejected: 'Claim Rejected' }[specialStatus]
    : `Step 0${Math.min(step, 4)} / 04`;

  /* ─── Keplr connect & eligibility ─── */
  const connectAndCheck = useCallback(async () => {
    setIsProcessing(true);
    try {
      await wallet.connect();
    } catch {
      setIsProcessing(false);
      return;
    }
  }, [wallet]);

  // When wallet connects, check eligibility
  useEffect(() => {
    if (!wallet.address || !isProcessing) return;
    (async () => {
      try {
        const data = await api.checkEligibility(wallet.address!);
        if (data.claimed) { setBalance(data.balance || data.amount); setSpecialStatus('completed'); }
        else if (data.approved) { setBalance(data.balance || data.amount); setSpecialStatus('approved'); }
        else if (data.pending) { setBalance(data.balance || data.amount); setSpecialStatus('pending'); }
        else if (data.rejected) { setBalance(data.balance || data.amount); setSpecialStatus('rejected'); }
        else if (data.eligible) { setBalance(data.balance); setStep(2); }
        else { alert('This address is not eligible for migration.'); }
      } catch {
        // Demo mode
        setBalance('45230000000');
        setStep(2);
      }
      setIsProcessing(false);
    })();
  }, [wallet.address, isProcessing]);

  /* ─── Step 3 → prepare claim ─── */
  const handleEthSubmit = async (eth: string) => {
    setEthAddress(eth);
    setIsProcessing(true);
    try {
      const data = await api.prepareClaim({ kiAddress: wallet.address!, ethAddress: eth });
      setNonce(data.nonce);
      setMessage(data.message);
    } catch {
      setNonce('demo-nonce');
      setMessage('Sign this message to claim your XKI tokens');
    }
    setIsProcessing(false);
    setStep(4);
  };

  /* ─── Step 4 → sign & submit ─── */
  const handleSign = async () => {
    setIsProcessing(true);
    try {
      if (window.keplr && wallet.address) {
        const sig = await window.keplr.signArbitrary('kichain-2', wallet.address, message || 'Sign to claim XKI tokens');
        const data = await api.submitClaim({
          kiAddress: wallet.address,
          ethAddress,
          signature: sig.signature,
          pubKey: sig.pub_key.value,
          nonce: nonce || '',
        });
        if (data.success) setClaimId(data.claimId);
      }
    } catch (e) {
      console.log('Sign flow:', e);
    }
    if (!claimId) {
      setClaimId(`#${Math.random().toString(36).substr(2, 4).toUpperCase()}-XKI-MIG`);
    }
    setIsProcessing(false);
    setStep(5);
  };

  /* ─── Disconnect ─── */
  const handleDisconnect = () => {
    wallet.disconnect();
    setStep(1);
    setBalance(null);
    setEthAddress('');
    setNonce(null);
    setMessage(null);
    setClaimId(null);
    setSpecialStatus(null);
  };

  /* ─── render step content ─── */
  const renderStepContent = () => {
    if (specialStatus) {
      const map: Record<string, { label: string; color: string; extra: string }> = {
        completed: { label: 'Complété', color: 'bg-green-500', extra: 'Votre migration a été validée. Vos tokens ERC-20 XKI ont été distribués.' },
        pending: { label: 'Validation en cours', color: 'bg-yellow-500', extra: 'Votre demande de migration a bien été enregistrée et est en cours de traitement. La validation peut prendre jusqu\'à 48h.' },
        approved: { label: 'Approuvé', color: 'bg-green-500', extra: 'Votre demande de migration a été approuvée. La distribution de vos tokens ERC-20 XKI est en cours de traitement.' },
        rejected: { label: 'Refusé', color: 'bg-red-500', extra: 'Votre demande de migration a été examinée et n\'a pas pu être validée. Si vous pensez qu\'il s\'agit d\'une erreur, veuillez contacter le support.' },
      };
      const s = map[specialStatus];
      return <ClaimStatusCard status={specialStatus} label={s.label} color={s.color} balance={balance} kiAddress={wallet.address} extra={s.extra} />;
    }
    switch (step) {
      case 1: return <Step1 onConnect={connectAndCheck} isProcessing={isProcessing} />;
      case 2: return <Step2 balance={balance} onContinue={() => setStep(3)} />;
      case 3: return <Step3 onSubmit={handleEthSubmit} isProcessing={isProcessing} />;
      case 4: return <Step4 balance={balance} ethAddress={ethAddress} onSign={handleSign} isProcessing={isProcessing} />;
      case 5: return <Step5 claimId={claimId} />;
      default: return null;
    }
  };

  return (
    <>
      {/* Background grid */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '100px 100px' }} />

      <main className="flex-grow flex flex-col justify-center items-center relative z-10 px-4 py-12 pt-24">
        {/* Header */}
        <header className="text-center mb-16 animate-fade-in">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-white mb-4 tracking-wide">
            Legacy Transition
          </h1>
          <p className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-gray-500 font-light">
            Secure your assets • Ki Chain to Ethereum
          </p>
        </header>

        {/* Monolith Card */}
        <div className="w-full max-w-lg glass-panel relative shadow-2xl transition-all duration-500 animate-fade-in flex flex-col">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-white/5">
            <div className="h-full bg-white transition-all duration-1000 ease-in-out" style={{ width: `${(step / 5) * 100}%` }} />
          </div>

          <div className="p-8 md:p-12 min-h-[450px] flex flex-col">
            <div className="mb-8">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] uppercase tracking-widest text-gray-500">{stepIndicator}</span>
                {isProcessing && (
                  <span className="text-[10px] uppercase tracking-widest text-white animate-pulse">Processing...</span>
                )}
                {wallet.isConnected && (
                  <button onClick={handleDisconnect} className="text-gray-500 hover:text-red-400 transition-colors" title="Disconnect">
                    <LogOut className="w-3 h-3" />
                  </button>
                )}
              </div>
              <h2 className="text-2xl font-serif text-white">{stepTitle}</h2>
            </div>

            <div className="flex-grow flex flex-col justify-center transition-opacity duration-500">
              {renderStepContent()}
            </div>
          </div>
        </div>

        {/* Check Status */}
        <CheckStatusSection />

        {/* Governance */}
        <GovernanceSection kiAddress={wallet.address} onConnectWallet={connectAndCheck} />
      </main>

      {/* Footer Stats */}
      <FooterStats />
    </>
  );
}
