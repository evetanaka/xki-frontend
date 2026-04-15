import { Lock, GitBranch, ArrowDownToLine } from 'lucide-react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

const steps = [
  {
    num: '1',
    icon: Lock,
    title: 'Stake XKI',
    desc: 'Lock your tokens. Choose your duration — 3 to 36 months. The longer you commit, the higher your multiplier. Up to 5x.',
  },
  {
    num: '2',
    icon: GitBranch,
    title: 'The Ecosystem Grows',
    desc: 'Every project built on XKI emits its own token and generates fees. More projects, more revenue, more rewards.',
  },
  {
    num: '3',
    icon: ArrowDownToLine,
    title: 'You Capture Everything',
    desc: "Fees from ALL projects are redistributed to stakers in each project's native token. You don't pick winners — you own the layer.",
  },
];

export default function HowItWorks() {
  const titleRef = useIntersectionObserver<HTMLDivElement>();
  const stepsRef = useIntersectionObserver<HTMLDivElement>();
  const flywheelRef = useIntersectionObserver<HTMLDivElement>();

  return (
    <section className="relative py-24 md:py-36 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div ref={titleRef} className="text-center mb-20 parallax-section">
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-500 mb-4">The Model</p>
          <h2 className="text-3xl md:text-5xl font-serif text-white">How It Works</h2>
        </div>

        <div ref={stepsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 stagger-children">
          {steps.map((step) => (
            <div key={step.num} className="glass-panel p-8 hover-lift relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-white/20 to-transparent" />
              <div className="text-6xl font-serif text-white/5 absolute top-4 right-6">{step.num}</div>
              <div className="relative z-10">
                <div className="w-10 h-10 border border-white/20 flex items-center justify-center mb-6">
                  <step.icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-sm uppercase tracking-[0.15em] text-white mb-3 font-serif">{step.title}</h3>
                <p className="text-sm text-gray-500 font-light leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Flywheel */}
        <div ref={flywheelRef} className="flex flex-col items-center parallax-section">
          <div className="relative w-72 h-72 md:w-96 md:h-96 mb-12">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border border-white/5 flywheel-ring">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white/20 rounded-full" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-white/10 rounded-full" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white/10 rounded-full" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white/20 rounded-full" />
            </div>
            {/* Middle ring */}
            <div className="absolute inset-8 md:inset-12 rounded-full border border-white/8 flywheel-ring-reverse">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] uppercase tracking-widest text-gray-500 whitespace-nowrap bg-[#050505] px-2">Projects</div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-[8px] uppercase tracking-widest text-gray-500 whitespace-nowrap bg-[#050505] px-2">Stakers</div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 text-[8px] uppercase tracking-widest text-gray-500 whitespace-nowrap bg-[#050505] px-2">Fees</div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-[8px] uppercase tracking-widest text-gray-500 whitespace-nowrap bg-[#050505] px-2">Treasury</div>
            </div>
            {/* Center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center pulse-glow">
                <span className="font-serif text-white text-lg md:text-xl font-bold">XKI</span>
              </div>
            </div>
          </div>

          <div className="glass-panel px-8 py-6 max-w-xl text-center">
            <p className="text-sm md:text-base text-gray-400 italic font-light leading-relaxed">
              "You don't pick winners. You own the infrastructure."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
