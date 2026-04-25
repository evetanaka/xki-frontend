import { useState, useCallback } from 'react';
import { api } from '../../lib/api';
import { ChevronRight, Check, AlertCircle, Loader2, Wallet, PenTool, Send } from 'lucide-react';

/* ── Types ── */
interface ClaimFlowProps {
  kiAddress: string;
  totalAllocation: string | number;
  nftCount: number;
  onSign: (message: string) => Promise<{ signature: string; pub_key: { value: string } }>;
  onComplete: (claim: any) => void;
  onCancel: () => void;
}

type Step = 'eth-address' | 'signing' | 'submitting' | 'success' | 'error';

/* ── Helpers ── */
function formatXKI(amount: string | number): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function isValidEthAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

/* ── Step Indicator ── */
function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { key: 'eth-address', label: 'ETH Address', icon: Wallet },
    { key: 'signing', label: 'Sign', icon: PenTool },
    { key: 'submitting', label: 'Submit', icon: Send },
  ];
  const currentIdx = steps.findIndex(s => s.key === current);
  const isComplete = current === 'success';

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {steps.map((s, i) => {
        const done = isComplete || i < currentIdx;
        const active = s.key === current;
        const Icon = s.icon;
        return (
          <div key={s.key} className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500"
                style={{
                  border: `1px solid ${done ? '#D4AF37' : active ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  background: done ? 'rgba(212,175,55,0.15)' : 'transparent',
                }}
              >
                {done ? (
                  <Check className="w-3.5 h-3.5" style={{ color: '#D4AF37' }} />
                ) : (
                  <Icon className="w-3.5 h-3.5" style={{ color: active ? '#D4AF37' : 'rgba(255,255,255,0.2)' }} />
                )}
              </div>
              <span
                className="text-[9px] uppercase tracking-[0.15em] font-light hidden sm:inline"
                style={{ color: done || active ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)' }}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-6 sm:w-10 h-px" style={{ background: done ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.06)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Component ── */
export default function ClaimFlow({ kiAddress, totalAllocation, onSign, onComplete, onCancel }: Omit<ClaimFlowProps, 'nftCount'>) {
  const [step, setStep] = useState<Step>('eth-address');
  const [ethAddress, setEthAddress] = useState('');
  const [ethError, setEthError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [claim, setClaim] = useState<any>(null);
  const [detecting, setDetecting] = useState(false);

  /* ── MetaMask detection ── */
  const detectMetaMask = useCallback(async () => {
    const eth = (window as any).ethereum;
    if (!eth) {
      setEthError('MetaMask not detected. Please enter your address manually.');
      return;
    }
    setDetecting(true);
    setEthError(null);
    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      if (accounts?.[0]) {
        setEthAddress(accounts[0]);
      }
    } catch (err: any) {
      setEthError(err.message || 'Failed to connect MetaMask');
    } finally {
      setDetecting(false);
    }
  }, []);

  /* ── Submit flow ── */
  const handleSubmit = useCallback(async () => {
    if (!isValidEthAddress(ethAddress)) {
      setEthError('Invalid Ethereum address format');
      return;
    }
    setEthError(null);
    setError(null);

    try {
      // Step 1: Get nonce
      setStep('signing');
      const nonceData = await api.getNftNonce(kiAddress);

      // Step 2: Sign with Keplr
      const sigResult = await onSign(nonceData.message);

      // Step 3: Submit claim
      setStep('submitting');
      const result = await api.submitNftClaim({
        ki_address: kiAddress,
        eth_address: ethAddress,
        signature: sigResult.signature,
        pub_key: sigResult.pub_key.value,
        nonce: nonceData.nonce,
        signed_message: nonceData.message,
      });

      setClaim(result);
      setStep('success');
      onComplete(result);
    } catch (err: any) {
      let msg = 'An error occurred. Please try again.';
      try {
        const parsed = JSON.parse(err.message);
        msg = parsed.error || msg;
      } catch {
        msg = err.message || msg;
      }
      setError(msg);
      setStep('error');
    }
  }, [ethAddress, kiAddress, onSign, onComplete]);

  return (
    <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '540px', margin: '0 auto' }}>
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-[9px] uppercase tracking-[0.5em] text-white/25 font-light mb-3">NFT Claim</p>
        <h2 className="text-2xl font-serif text-white tracking-wide">
          {step === 'success' ? 'Claim Submitted' : 'Claim Your Allocation'}
        </h2>
      </div>

      {/* Steps indicator */}
      {step !== 'success' && step !== 'error' && (
        <div className="mb-8">
          <StepIndicator current={step} />
        </div>
      )}

      {/* ── ETH Address Step ── */}
      {step === 'eth-address' && (
        <div className="space-y-6">
          {/* Summary reminder */}
          <div className="flex items-center justify-between py-3 px-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-light">Allocation</span>
            <span className="text-lg font-serif text-white">{formatXKI(totalAllocation)} <span className="text-xs text-white/30 font-sans font-light">$XKI</span></span>
          </div>

          {/* ETH input */}
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-light block">
              Ethereum Receiving Address
            </label>
            <input
              type="text"
              value={ethAddress}
              onChange={e => { setEthAddress(e.target.value); setEthError(null); }}
              placeholder="0x..."
              className="w-full px-4 py-3.5 text-sm font-mono bg-transparent text-white placeholder-white/15 outline-none transition-all duration-300"
              style={{
                border: `1px solid ${ethError ? 'rgba(255,100,100,0.3)' : ethAddress && isValidEthAddress(ethAddress) ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.1)'}`,
              }}
            />
            {ethError && (
              <p className="text-[11px] text-red-400/70 font-light flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3" /> {ethError}
              </p>
            )}
            {ethAddress && isValidEthAddress(ethAddress) && !ethError && (
              <p className="text-[11px] text-white/20 font-light flex items-center gap-1.5">
                <Check className="w-3 h-3" style={{ color: '#D4AF37' }} /> Valid address
              </p>
            )}
          </div>

          {/* MetaMask button */}
          <button
            onClick={detectMetaMask}
            disabled={detecting}
            className="w-full py-3 text-[10px] uppercase tracking-[0.15em] font-light transition-all duration-300 flex items-center justify-center gap-2"
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.4)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            {detecting ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting...</>
            ) : (
              <><Wallet className="w-3.5 h-3.5" /> Connect MetaMask</>
            )}
          </button>

          {/* Info */}
          <p className="text-[10px] text-white/15 font-light leading-relaxed text-center">
            Your $XKI tokens will be distributed to this Ethereum address after the claim period ends.
            Double-check the address — this cannot be changed after submission.
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3.5 text-[10px] uppercase tracking-[0.15em] font-light transition-all duration-300"
              style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!ethAddress || !isValidEthAddress(ethAddress)}
              className="flex-1 py-3.5 text-[10px] uppercase tracking-[0.15em] font-bold transition-all duration-500 flex items-center justify-center gap-2 disabled:opacity-20"
              style={{
                background: 'linear-gradient(135deg, #D4AF37, #B8941F)',
                color: '#000',
              }}
            >
              Sign & Claim <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            </button>
          </div>
        </div>
      )}

      {/* ── Signing Step ── */}
      {step === 'signing' && (
        <div className="text-center py-8 space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ border: '1px solid rgba(212,175,55,0.2)' }}>
            <PenTool className="w-6 h-6 animate-pulse" style={{ color: '#D4AF37' }} />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-white font-light">Sign with Keplr</p>
            <p className="text-[11px] text-white/25 font-light max-w-sm mx-auto">
              Please approve the signature request in your Keplr wallet to prove ownership of your Ki Chain address.
            </p>
          </div>
          <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: 'rgba(255,255,255,0.2)' }} />
        </div>
      )}

      {/* ── Submitting Step ── */}
      {step === 'submitting' && (
        <div className="text-center py-8 space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ border: '1px solid rgba(212,175,55,0.2)' }}>
            <Send className="w-6 h-6 animate-pulse" style={{ color: '#D4AF37' }} />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-white font-light">Submitting Claim</p>
            <p className="text-[11px] text-white/25 font-light">Verifying signature and registering your claim...</p>
          </div>
          <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: 'rgba(255,255,255,0.2)' }} />
        </div>
      )}

      {/* ── Success ── */}
      {step === 'success' && claim && (
        <div className="text-center py-4 space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.08)' }}>
            <Check className="w-7 h-7" style={{ color: '#D4AF37' }} />
          </div>

          <div className="space-y-1">
            <p className="text-3xl font-serif text-white tracking-wide">{formatXKI(claim.total_allocation)}</p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/25 font-light">$XKI Claimed</p>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
            {[
              { label: 'Status', value: 'Pending Distribution', color: '#D4AF37' },
              { label: 'NFTs', value: `${claim.nft_count} Cosmon NFTs` },
              { label: 'ETH Address', value: `${claim.eth_address.slice(0, 10)}...${claim.eth_address.slice(-6)}`, mono: true },
            ].map(({ label, value, color, mono }: any) => (
              <div key={label} className="flex justify-between items-center py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="text-[10px] uppercase tracking-[0.15em] text-white/25 font-light">{label}</span>
                <span className={`text-sm font-light ${mono ? 'font-mono text-[11px]' : ''}`} style={{ color: color || 'rgba(255,255,255,0.6)' }}>{value}</span>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-white/15 font-light leading-relaxed max-w-sm mx-auto">
            Your claim has been registered. $XKI tokens will be distributed to your Ethereum address after the claim period ends on July 1, 2026.
          </p>

          <button
            onClick={onCancel}
            className="px-8 py-3 text-[10px] uppercase tracking-[0.2em] font-light mx-auto"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
          >
            Back to Portfolio
          </button>
        </div>
      )}

      {/* ── Error ── */}
      {step === 'error' && (
        <div className="text-center py-8 space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ border: '1px solid rgba(255,100,100,0.2)' }}>
            <AlertCircle className="w-6 h-6" style={{ color: '#FF6B6B' }} />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-white font-light">Claim Failed</p>
            <p className="text-[11px] text-red-400/60 font-light max-w-sm mx-auto">{error}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onCancel}
              className="px-6 py-3 text-[10px] uppercase tracking-[0.15em] font-light"
              style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}
            >
              Cancel
            </button>
            <button
              onClick={() => setStep('eth-address')}
              className="px-6 py-3 text-[10px] uppercase tracking-[0.15em] font-light"
              style={{ border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
