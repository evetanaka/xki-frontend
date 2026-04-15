import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import ComingSoonModal from '../ComingSoonModal';

export default function CtaFinal() {
  const [showModal, setShowModal] = useState(false);
  const ref = useIntersectionObserver<HTMLDivElement>();

  return (
    <section className="relative py-24 md:py-36 border-t border-white/5">
      <div ref={ref} className="max-w-3xl mx-auto px-6 md:px-8 text-center parallax-section">
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif text-white mb-6 leading-[1.15]">
          The ecosystem is awaking.<br />
          <span className="text-gray-500">Your seat is waiting.</span>
        </h2>
        <p className="text-sm text-gray-500 font-light mb-12 max-w-xl mx-auto">
          Join the infrastructure layer. Stake $XKI and start earning from every project in the ecosystem.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <button onClick={() => setShowModal(true)} className="group px-8 py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-all flex items-center gap-3">
            Stake XKI
            <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
          </button>
          <a href="#" className="px-8 py-4 border border-white/20 text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-white/5 transition-all flex items-center gap-3">
            Join the Community
          </a>
        </div>
        <ComingSoonModal isOpen={showModal} onClose={() => setShowModal(false)} />
        {/* Social Links */}
        <div className="flex items-center justify-center gap-6">
          <a href="https://x.com/ki_foundation" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-white transition-colors"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
        </div>
      </div>
    </section>
  );
}
