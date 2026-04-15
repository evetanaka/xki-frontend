import { Download } from 'lucide-react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

export default function FounderSection() {
  const bookRef = useIntersectionObserver<HTMLDivElement>();
  const textRef = useIntersectionObserver<HTMLDivElement>();

  return (
    <section className="relative py-24 md:py-36 border-t border-white/5">
      <div className="max-w-5xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          {/* Book Mockup */}
          <div ref={bookRef} className="flex justify-center parallax-section">
            <div className="book-3d">
            <div className="book-3d-inner w-56 md:w-64 aspect-[3/4] bg-[#1a2744] border border-[#2a3f6a]/50 shadow-2xl flex flex-col justify-between p-8 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/30 to-transparent" />
              <div className="relative z-10">
                <p className="text-[8px] uppercase tracking-[0.4em] text-[#5a7ab5] mb-4">Ki Foundation</p>
                <h4 className="font-serif text-white text-lg leading-tight">Le Petit<br />Livre Bleu</h4>
              </div>
              <div className="relative z-10">
                <div className="h-[1px] bg-[#2a3f6a] mb-3" />
                <p className="text-[9px] text-[#5a7ab5] tracking-wider">Réda Berrehili</p>
              </div>
              <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
            </div>
            </div>
          </div>

          {/* Text */}
          <div ref={textRef} className="parallax-section">
            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-500 mb-4">The Book</p>
            <h2 className="text-2xl md:text-3xl font-serif text-white mb-6 leading-tight">
              The ideas behind XKI,<br />in one book.
            </h2>
            <p className="text-sm text-gray-400 font-light leading-relaxed mb-8">
              A manifesto on stakeholder capitalism, infrastructure ownership, and why the next wave of value creation will be shared — not extracted. From the philosophy of Klub to the architecture of XKI.
            </p>

            <blockquote className="border-l-2 border-white/20 pl-6 mb-8">
              <p className="text-sm text-gray-300 italic leading-relaxed">
                "The best infrastructure is invisible. You don't see it — you just feel everything working. That's what we're building."
              </p>
            </blockquote>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white font-serif font-bold">R</div>
              <div>
                <p className="text-sm text-white font-semibold">Réda Berrehili</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Founder — Klub, XKI, Dar Society</p>
              </div>
            </div>

            <a href="/le-petit-livre-bleu.pdf" download className="inline-flex items-center gap-3 px-6 py-3 border border-white/20 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all">
              <Download className="w-3 h-3" />
              Download — Le Petit Livre Bleu
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
