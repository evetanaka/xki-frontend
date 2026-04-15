import { useState } from 'react';
import { ChevronRight, Send } from 'lucide-react';
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
          <a href="#" className="text-gray-600 hover:text-white transition-colors"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
          <a href="#" className="text-gray-600 hover:text-white transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" /></svg>
          </a>
          <a href="#" className="text-gray-600 hover:text-white transition-colors"><Send className="w-5 h-5" /></a>
        </div>
      </div>
    </section>
  );
}
