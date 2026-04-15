import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { useStakingSimulator } from '../../hooks/useStakingSimulator';
import { MULTIPLIERS, DURATIONS } from '../../lib/constants';
import ComingSoonModal from '../ComingSoonModal';

const tiers = [
  { emoji: '🔭', duration: '3 months', name: 'Explorer', mult: '1x', cooldown: '3 months', benefit: 'Base rewards from all ecosystem projects', highlight: false },
  { emoji: '🏗️', duration: '6 months', name: 'Builder', mult: '2x', cooldown: '6 months', benefit: 'Early access to ecosystem projects', highlight: false },
  { emoji: '⚖️', duration: '12 months', name: 'Architect', mult: '3x', cooldown: '12 months', benefit: 'Governance voting power', highlight: true },
  { emoji: '🔑', duration: '24 months', name: 'Founder', mult: '4x', cooldown: '24 months', benefit: 'Ecosystem projects private sale access', highlight: false },
  { emoji: '🚀', duration: '36 months', name: 'Visionary', mult: '5x', cooldown: '36 months', benefit: 'Ecosystem projects TGE Airdrops', highlight: false },
];

export default function StakingTiersAndSimulator() {
  const titleRef = useIntersectionObserver<HTMLDivElement>();
  const tableRef = useIntersectionObserver<HTMLDivElement>();
  const simRef = useIntersectionObserver<HTMLDivElement>();
  const [showModal, setShowModal] = useState(false);
  const sim = useStakingSimulator();

  return (
    <section id="staking" className="relative py-24 md:py-36 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div ref={titleRef} className="text-center mb-16 parallax-section">
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-500 mb-4">Commitment Rewarded</p>
          <h2 className="text-3xl md:text-5xl font-serif text-white">Staking Tiers</h2>
        </div>

        {/* Tiers Table */}
        <div ref={tableRef} className="glass-panel overflow-hidden mb-16 parallax-section">
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

        {/* Simulator */}
        <div ref={simRef} className="glass-panel p-8 md:p-12 max-w-2xl mx-auto parallax-section">
          <h3 className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-8 text-center font-serif">Rewards Simulator</h3>

          <div className="space-y-8">
            {/* Amount */}
            <div>
              <div className="flex justify-between items-end mb-3">
                <label className="text-[10px] uppercase tracking-widest text-gray-500">Stake Amount</label>
                <span className="text-lg font-mono text-white">{sim.amount.toLocaleString()} XKI</span>
              </div>
              <input
                type="range"
                min="1000"
                max="10000000"
                value={sim.amount}
                step="1000"
                onChange={(e) => sim.setAmount(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[9px] text-gray-600 mt-1">
                <span>1K</span>
                <span>10M</span>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-3">Lock Duration</label>
              <div className="grid grid-cols-5 gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => sim.setDuration(d)}
                    className={`tier-card py-3 border border-white/10 text-center hover:border-white/30 transition-all ${sim.duration === d ? 'active' : ''}`}
                  >
                    <span className="block text-sm font-mono text-white">{d}m</span>
                    <span className="block text-[9px] text-gray-600 mt-1">{MULTIPLIERS[d]}x</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
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
              <div className="space-y-2 pt-2">
                <p className="text-[9px] uppercase tracking-widest text-gray-600 mb-2">Breakdown by Token</p>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 flex items-center gap-2">
                    <span className="w-2 h-2 bg-white/40 rounded-full inline-block" />$DAR
                  </span>
                  <span className="text-gray-400 font-mono">~{sim.monthlyDAR < 1 ? sim.monthlyDAR.toFixed(2) : Math.round(sim.monthlyDAR).toLocaleString()} $DAR</span>
                </div>
              </div>
            </div>
          </div>

          <button onClick={() => setShowModal(true)} className="mt-8 w-full py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors flex items-center justify-center gap-3">
            Start Staking
            <ArrowRight className="w-4 h-4 opacity-50" />
          </button>
          <ComingSoonModal isOpen={showModal} onClose={() => setShowModal(false)} />
        </div>
      </div>
    </section>
  );
}
