import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, LogOut, ArrowLeftRight, PlusCircle, Copy, ChevronRight,
  Layers, Gift, Download, Clock, Zap, Info, AlertCircle, ArrowDown, X
} from 'lucide-react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useStakingSimulator } from '../hooks/useStakingSimulator';
import { MULTIPLIERS, DURATIONS, TIER_NAMES, TIER_EMOJIS } from '../lib/constants';
import ComingSoonModal from '../components/ComingSoonModal';

const tiers = [
  { emoji: '🔭', duration: '3 months', name: 'Explorer', mult: '1x', cooldown: '3 months', benefit: 'Base rewards from all ecosystem projects', highlight: false },
  { emoji: '🏗️', duration: '6 months', name: 'Builder', mult: '2x', cooldown: '6 months', benefit: 'Early access to ecosystem projects', highlight: false },
  { emoji: '⚖️', duration: '12 months', name: 'Architect', mult: '3x', cooldown: '12 months', benefit: 'Governance voting power', highlight: true },
  { emoji: '🔑', duration: '24 months', name: 'Founder', mult: '4x', cooldown: '24 months', benefit: 'Ecosystem projects private sale access', highlight: false },
  { emoji: '🚀', duration: '36 months', name: 'Visionary', mult: '5x', cooldown: '36 months', benefit: 'Ecosystem projects TGE Airdrops', highlight: false },
];

// Tier index for stake form: maps 0-4 to duration months
const TIER_DURATIONS = [3, 6, 12, 24, 36];

export default function StakePage() {
  const navigate = useNavigate();
  const [showComingSoon, setShowComingSoon] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress] = useState('0x3B...96');
  const [showHardUnstakeModal, setShowHardUnstakeModal] = useState(false);
  const [showCooldownModal, setShowCooldownModal] = useState(false);
  const [stakeTier, setStakeTier] = useState(2); // default 12m
  const [stakeAmount, setStakeAmount] = useState('');
  const sim = useStakingSimulator();

  const headerRef = useIntersectionObserver<HTMLDivElement>();
  const statsRef = useIntersectionObserver<HTMLDivElement>();

  const connectWallet = () => setIsConnected(true);
  const disconnectWallet = () => setIsConnected(false);

  return (
    <div className="bg-[#050505]">
      <ComingSoonModal isOpen={showComingSoon} onClose={() => { setShowComingSoon(false); navigate('/'); }} />
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
            {[
              { label: 'Total Value Locked', value: '—' },
              { label: 'Average APY', value: '—' },
              { label: 'Total Stakers', value: '—' },
              { label: 'Reward Tokens', value: '—' },
            ].map((s) => (
              <div key={s.label} className="glass-panel p-5 text-center">
                <p className="text-[9px] uppercase tracking-[0.3em] text-gray-600 mb-2">{s.label}</p>
                <p className="text-xl font-serif text-white">{s.value}</p>
              </div>
            ))}
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
                  <span className="text-[9px] font-mono text-gray-600">0xa342...1466</span>
                  <button className="text-gray-600 hover:text-white transition-colors">
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
              <p className="text-xs text-gray-500 font-light mb-8">Connect with MetaMask or any EVM wallet to view your positions, stake, and claim rewards.</p>
              <button onClick={connectWallet} className="group px-8 py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-all flex items-center justify-center gap-3 mx-auto">
                Connect Wallet
                <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
              </button>
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
                  <p className="text-xl font-serif text-white">150,000 XKI</p>
                  <p className="text-[10px] text-gray-600 mt-1 font-mono">~$12,000</p>
                </div>
                <div className="glass-panel p-5">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-gray-600 mb-2">Effective Weight</p>
                  <p className="text-xl font-serif text-white">450,000</p>
                  <p className="text-[10px] text-gray-600 mt-1">weighted power</p>
                </div>
                <div className="glass-panel p-5">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-gray-600 mb-2">Current Tier</p>
                  <p className="text-xl font-serif text-white">⚖️ Architect</p>
                  <p className="text-[10px] text-gray-600 mt-1">3x multiplier</p>
                </div>
                <div className="glass-panel p-5 relative">
                  <div className="absolute top-3 right-3 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-[9px] uppercase tracking-[0.3em] text-gray-600 mb-2">Total Claimable</p>
                  <p className="text-xl font-serif text-white">~$42.50</p>
                  <p className="text-[10px] text-gray-600 mt-1">across 2 tokens</p>
                </div>
              </div>

              <div className="mt-4 glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Wallet className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-400">Available in wallet:</span>
                  <span className="text-sm font-mono text-white">50,000 XKI</span>
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
                <span className="text-[10px] uppercase tracking-widest text-gray-500">2 active</span>
              </div>

              <div className="space-y-4">
                {/* Position 1 — Earning */}
                <div className="glass-panel p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-[10px] uppercase tracking-widest text-gray-400 bg-white/5 px-2 py-1">Position #1</span>
                        <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20">Earning</span>
                        <span className="text-[9px] uppercase tracking-wider text-gray-500">⚖️ Architect · 3x</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        <div><p className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">Amount</p><p className="text-sm font-mono text-white">100,000 XKI</p></div>
                        <div><p className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">Tier</p><p className="text-sm text-white">12 months · 3x</p></div>
                        <div><p className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">Staked Since</p><p className="text-sm text-gray-400">15 Apr 2026</p></div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <Info className="w-3 h-3" />
                        <span>Cooldown to unstake: <strong className="text-white">12 months</strong> · Or hard unstake now (10% burn)</span>
                      </div>
                    </div>
                    <div className="flex flex-row lg:flex-col gap-2 lg:min-w-[160px]">
                      <button className="flex-1 lg:flex-none py-2.5 px-4 bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors text-center">Claim Rewards</button>
                      <button onClick={() => setShowCooldownModal(true)} className="flex-1 lg:flex-none py-2.5 px-4 border border-white/20 text-gray-400 text-[10px] uppercase tracking-widest hover:text-white hover:border-white/40 transition-colors text-center flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" /> Cooldown
                      </button>
                      <button onClick={() => setShowHardUnstakeModal(true)} className="flex-1 lg:flex-none py-2.5 px-4 border border-white/10 text-gray-600 text-[10px] uppercase tracking-widest hover:text-red-400 hover:border-red-900 transition-colors text-center flex items-center justify-center gap-1">
                        <Zap className="w-3 h-3" /> Hard Unstake
                      </button>
                    </div>
                  </div>
                </div>

                {/* Position 2 — Cooldown */}
                <div className="glass-panel p-6 border-yellow-500/10">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-[10px] uppercase tracking-widest text-gray-400 bg-white/5 px-2 py-1">Position #2</span>
                        <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Cooldown</span>
                        <span className="text-[9px] uppercase tracking-wider text-gray-500">🏗️ Builder · 2x</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        <div><p className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">Amount</p><p className="text-sm font-mono text-white">50,000 XKI</p></div>
                        <div><p className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">Tier</p><p className="text-sm text-white">6 months · 2x</p></div>
                        <div><p className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">Cooldown Ends</p><p className="text-sm text-yellow-400">1 Nov 2026</p></div>
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-grow h-1.5 bg-white/5 rounded-sm overflow-hidden">
                          <div className="h-full bg-yellow-500/40 rounded-sm" style={{ width: '35%' }} />
                        </div>
                        <span className="text-[10px] font-mono text-yellow-500 whitespace-nowrap">~4 months left</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-yellow-500/60">
                        <AlertCircle className="w-3 h-3" />
                        <span>No rewards during cooldown · Weight removed</span>
                      </div>
                    </div>
                    <div className="flex flex-row lg:flex-col gap-2 lg:min-w-[160px]">
                      <button disabled className="flex-1 lg:flex-none py-2.5 px-4 bg-gray-900 text-gray-600 text-[10px] font-bold uppercase tracking-widest cursor-not-allowed text-center">Waiting...</button>
                      <button onClick={() => setShowHardUnstakeModal(true)} className="flex-1 lg:flex-none py-2.5 px-4 border border-white/10 text-gray-600 text-[10px] uppercase tracking-widest hover:text-red-400 hover:border-red-900 transition-colors text-center flex items-center justify-center gap-1">
                        <Zap className="w-3 h-3" /> Hard Unstake Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Rewards Panel */}
          <section className="py-8 px-6 md:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <Gift className="w-4 h-4 text-gray-500" />
                <h2 className="text-lg font-serif text-white">Rewards</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Claimable */}
                <div className="lg:col-span-2 glass-panel p-6">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-4">Claimable Rewards</p>
                  <div className="space-y-3 mb-6">
                    {[
                      { token: '$DAR', project: 'Dar Society', amount: '1,250', usd: '~$31.25', letter: 'D' },
                      { token: '$GDN', project: 'Gordon.fi', amount: '180', usd: '~$11.25', letter: 'G' },
                    ].map((r) => (
                      <div key={r.token} className="flex items-center justify-between py-3 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold text-white">{r.letter}</div>
                          <div>
                            <p className="text-sm text-white font-mono">{r.amount} {r.token}</p>
                            <p className="text-[10px] text-gray-600">{r.project}</p>
                          </div>
                        </div>
                        <span className="text-sm font-mono text-gray-400">{r.usd}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-gray-400 uppercase tracking-wider">Total</span>
                      <span className="text-lg font-mono text-white">~$42.50</span>
                    </div>
                  </div>
                  <button className="w-full py-3 bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                    <Download className="w-3 h-3" />
                    Claim All Rewards
                  </button>
                </div>

                {/* History */}
                <div className="glass-panel p-6">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-4">Recent Claims</p>
                  <div className="space-y-4">
                    {[
                      { token: '+520 $DAR', time: '2 days ago', usd: '~$13.00' },
                      { token: '+85 $GDN', time: '5 days ago', usd: '~$5.31' },
                      { token: '+410 $DAR', time: '1 week ago', usd: '~$10.25' },
                    ].map((h, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-white font-mono">{h.token}</p>
                          <p className="text-[9px] text-gray-600">{h.time}</p>
                        </div>
                        <span className="text-[10px] font-mono text-gray-500">{h.usd}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] uppercase tracking-widest text-gray-600">All-time earned</span>
                      <span className="text-sm font-mono text-white">~$284.50</span>
                    </div>
                  </div>
                </div>
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
                    <button className="text-[9px] uppercase tracking-widest text-gray-500 hover:text-white transition-colors border border-white/10 px-2 py-0.5">MAX</button>
                  </div>
                  <div className="flex items-center border-b border-white/20 pb-2 gap-3">
                    <input type="number" placeholder="0" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} className="flex-grow bg-transparent text-2xl font-mono text-white placeholder-gray-800 focus:outline-none" />
                    <span className="text-sm text-gray-500 font-mono">XKI</span>
                  </div>
                  <p className="text-[10px] text-gray-600 mt-2">Balance: <span className="font-mono">50,000 XKI</span></p>
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
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500">Est. APY</span>
                    <span className="text-sm font-mono text-white">~12.4%</span>
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

                <button disabled={!stakeAmount || Number(stakeAmount) <= 0} className="w-full py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors flex items-center justify-center gap-3 disabled:bg-gray-900 disabled:text-gray-600 disabled:cursor-not-allowed">
                  {stakeAmount && Number(stakeAmount) > 0 ? `Stake ${Number(stakeAmount).toLocaleString()} XKI` : 'Enter Amount to Stake'}
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
                <div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest text-gray-500">Staked Amount</span><span className="text-sm font-mono text-white">100,000 XKI</span></div>
                <div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest text-red-400">Burn (10%)</span><span className="text-sm font-mono text-red-400">-10,000 XKI</span></div>
                <div className="h-[1px] bg-white/10" />
                <div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest text-gray-500">You Receive (90%)</span><span className="text-lg font-mono text-white">90,000 XKI</span></div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowHardUnstakeModal(false)} className="flex-1 py-3 border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-colors">Cancel</button>
              <button className="flex-1 py-3 bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/30 transition-colors">Burn 10% & Withdraw</button>
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
                <div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest text-gray-500">Staked Amount</span><span className="text-sm font-mono text-white">100,000 XKI</span></div>
                <div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest text-gray-500">Cooldown Period</span><span className="text-sm font-mono text-yellow-400">12 months</span></div>
                <div className="h-[1px] bg-white/10" />
                <div className="flex justify-between items-center"><span className="text-[10px] uppercase tracking-widest text-gray-500">You Receive</span><span className="text-lg font-mono text-green-400">100,000 XKI (100%)</span></div>
              </div>
              <div className="bg-yellow-500/5 border border-yellow-500/15 p-3 flex items-start gap-2">
                <AlertCircle className="w-3 h-3 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-yellow-500/80 leading-relaxed">Your staking weight will be removed immediately. <strong>No rewards during cooldown.</strong></p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCooldownModal(false)} className="flex-1 py-3 border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-colors">Cancel</button>
              <button className="flex-1 py-3 bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors">Start Cooldown</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
