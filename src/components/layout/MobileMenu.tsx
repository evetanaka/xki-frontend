import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useEffect } from 'react';

const NAV_LINKS = [
  { to: '/#ecosystem', label: 'Ecosystem', external: true },
  { to: '/#staking', label: 'Staking', external: true },
  { to: '/#tokenomics', label: 'Tokenomics', external: true },
  { to: '/claim', label: 'Claim' },
  { to: '/nft-claim', label: 'NFT Claim', highlight: true },
  { to: '/stake', label: 'Stake XKI', primary: true },
  { to: '/wallet', label: 'My Wallet' },
];

export default function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation();

  // Close on route change
  useEffect(() => { onClose(); }, [location.pathname]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="absolute inset-y-0 right-0 w-full max-w-xs bg-[#050505] border-l border-white/5 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Menu</span>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.to;

            if (link.primary) {
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className="block w-full px-4 py-4 mt-4 bg-white text-black text-[10px] uppercase tracking-widest font-bold text-center hover:bg-gray-200 transition-colors"
                >
                  {link.label}
                </Link>
              );
            }

            if (link.external) {
              return (
                <a
                  key={link.to}
                  href={link.to}
                  onClick={onClose}
                  className="block px-4 py-3.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors rounded"
                >
                  {link.label}
                </a>
              );
            }

            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={`block px-4 py-3.5 text-sm transition-colors rounded ${
                  link.highlight
                    ? 'text-amber-500/70 hover:text-amber-400 hover:bg-amber-500/5'
                    : isActive
                      ? 'text-white bg-white/5'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
