import { useState } from 'react';
import { Link } from 'react-router-dom';
import ComingSoonModal from '../ComingSoonModal';

export default function Nav() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-serif font-bold text-lg">K</div>
            <span className="text-sm tracking-[0.2em] uppercase font-light text-gray-400 hidden sm:inline">Foundation</span>
          </Link>
          <div className="flex items-center gap-4 md:gap-6">
            <a href="/#ecosystem" className="hidden md:block text-[10px] uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Ecosystem</a>
            <a href="/#staking" className="hidden md:block text-[10px] uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Staking</a>
            <a href="/#tokenomics" className="hidden md:block text-[10px] uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Tokenomics</a>
            <Link to="/claim" className="hidden md:block text-[10px] uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Claim</Link>
            <Link to="/nft-claim" className="hidden md:block text-[10px] uppercase tracking-widest text-amber-500/70 hover:text-amber-400 transition-colors">NFT Claim</Link>
            <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-white text-black text-[10px] uppercase tracking-widest font-bold hover:bg-gray-200 transition-colors">
              Stake XKI
            </button>
          </div>
        </div>
      </nav>
      <ComingSoonModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
