import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useDisconnect } from 'wagmi';
import { Wallet, ArrowLeftRight, LogOut } from 'lucide-react';

export default function WalletDropdown() {
  const { address, isConnected } = useAccount();
  const { open } = useWeb3Modal();
  const { disconnect } = useDisconnect();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  if (!isConnected || !address) {
    return (
      <button
        onClick={() => open()}
        className="px-4 py-2 bg-white text-black text-[10px] uppercase tracking-widest font-bold hover:bg-gray-200 transition-colors"
      >
        Connect Wallet
      </button>
    );
  }

  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const items = [
    {
      icon: <Wallet className="w-3 h-3" />,
      label: 'My Wallet',
      action: () => { navigate('/wallet'); setIsOpen(false); },
    },
    {
      icon: <ArrowLeftRight className="w-3 h-3" />,
      label: 'Switch Network',
      action: () => { open({ view: 'Networks' }); setIsOpen(false); },
    },
    {
      icon: <LogOut className="w-3 h-3" />,
      label: 'Disconnect',
      action: () => { disconnect(); setIsOpen(false); },
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-[10px] font-mono text-gray-400 hover:text-white transition-colors px-3 py-2 border border-white/10 hover:border-white/30 flex items-center gap-2"
      >
        {short}
        <svg className={`w-2.5 h-2.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 10 6">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Desktop dropdown */}
      {isOpen && (
        <>
          {/* Mobile overlay */}
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />

          {/* Desktop: absolute dropdown / Mobile: bottom sheet */}
          <div className="fixed bottom-0 left-0 right-0 md:absolute md:bottom-auto md:left-auto md:right-0 md:top-full md:mt-2 min-w-[180px] glass-panel border border-white/12 p-2 z-50 md:rounded rounded-t-xl">
            {items.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-3.5 md:py-2.5 text-[10px] uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-colors rounded"
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            {/* Mobile close handle */}
            <div className="md:hidden flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
