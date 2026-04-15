import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';

const DEADLINE = new Date('2026-05-01T00:00:00Z').getTime();

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export default function CountdownBanner() {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, DEADLINE - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  if (diff <= 0) return null;

  return (
    <>
    <div className="w-full bg-gradient-to-r from-emerald-900/90 via-emerald-800/90 to-green-900/90 border-b border-emerald-500/20 backdrop-blur-sm fixed top-[65px] left-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
        <div className="flex items-center gap-2 text-emerald-300">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold">Migration Deadline</span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-white text-sm leading-none">
          <span className="bg-emerald-950/60 border border-emerald-500/20 px-2 py-1 rounded-sm inline-flex items-center">{pad(days)}<span className="text-[8px] text-emerald-400/60 ml-0.5">d</span></span>
          <span className="text-emerald-500/40">:</span>
          <span className="bg-emerald-950/60 border border-emerald-500/20 px-2 py-1 rounded-sm inline-flex items-center">{pad(hours)}<span className="text-[8px] text-emerald-400/60 ml-0.5">h</span></span>
          <span className="text-emerald-500/40">:</span>
          <span className="bg-emerald-950/60 border border-emerald-500/20 px-2 py-1 rounded-sm inline-flex items-center">{pad(minutes)}<span className="text-[8px] text-emerald-400/60 ml-0.5">m</span></span>
          <span className="text-emerald-500/40">:</span>
          <span className="bg-emerald-950/60 border border-emerald-500/20 px-2 py-1 rounded-sm inline-flex items-center">{pad(seconds)}<span className="text-[8px] text-emerald-400/60 ml-0.5">s</span></span>
        </div>

        <Link to="/claim" className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-emerald-300 hover:text-white transition-colors font-semibold">
          Claim your $XKI
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
    <div className="h-[40px]" />
    </>
  );
}
