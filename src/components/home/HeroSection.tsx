import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import NetworkCanvas from '../canvas/NetworkCanvas';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import ComingSoonModal from '../ComingSoonModal';

export default function HeroSection() {
  const [showModal, setShowModal] = useState(false);
  const ref1 = useIntersectionObserver<HTMLParagraphElement>();
  const ref2 = useIntersectionObserver<HTMLHeadingElement>();
  const ref3 = useIntersectionObserver<HTMLParagraphElement>();
  const ref4 = useIntersectionObserver<HTMLDivElement>();

  return (
    <section className="relative min-h-screen flex flex-col items-center overflow-hidden" style={{ paddingTop: '360px' }}>
      <NetworkCanvas />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <p ref={ref1} className="text-[10px] md:text-xs uppercase tracking-[0.6em] text-gray-500 font-light mb-10 parallax-section">Ki Foundation</p>

        <h1 ref={ref2} className="text-3xl sm:text-4xl md:text-[2.5rem] lg:text-[4.2rem] font-serif text-white mb-8 tracking-wide !leading-[4.5rem] parallax-section gradient-text max-w-5xl">
          <span className="block">Own the infrastructure.</span>
          <span className="block">Earn from everything built on it.</span>
        </h1>

        <p ref={ref3} className="max-w-2xl mx-auto text-sm md:text-lg text-gray-500 font-light leading-relaxed mb-16 parallax-section">
          $XKI is the loyalty layer of an entire ecosystem. Stake once, earn rewards from every project — forever.
        </p>

        <div ref={ref4} className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-24 parallax-section">
          <button onClick={() => setShowModal(true)} className="group px-8 py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-all flex items-center gap-3">
            Stake XKI
            <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
          </button>
          <a href="#philosophy" className="px-8 py-4 border border-white/20 text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-white/5 transition-all flex items-center gap-3">
            Read the Manifesto
          </a>
        </div>
      </div>

      <ComingSoonModal isOpen={showModal} onClose={() => setShowModal(false)} />

      {/* Stats Bar */}
      <div className="relative z-10 w-full border-t border-white/10 bg-[#050505]/60 backdrop-blur-xl mt-auto">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5">
          {[
            { label: 'Total XKI Staked', value: '—' },
            { label: 'Active Projects', value: '—' },
            { label: 'Rewards Distributed', value: '—' },
            { label: 'Average APY', value: '—' },
          ].map((stat) => (
            <div key={stat.label} className="py-6 md:py-8 text-center px-4">
              <p className="text-[9px] uppercase tracking-[0.3em] text-gray-600 mb-2">{stat.label}</p>
              <p className="text-xl md:text-2xl font-serif text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
