import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const ADMIN_WALLET = 'ki1ypnke0r4uk6u82w4gh73kc5tz0qsn0ahek0653';

const TABS = [
  { path: '/admin', label: '$XKI Claims' },
  { path: '/admin/nft', label: 'NFT Claims' },
  { path: '/admin/rewards', label: 'Rewards' },
];

export default function AdminNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [keplrAddr, setKeplrAddr] = useState('');

  useEffect(() => {
    const check = () => {
      try {
        const stored = sessionStorage.getItem('xki_admin_auth');
        if (stored) {
          const data = JSON.parse(stored);
          if (data.address === ADMIN_WALLET && data.token) {
            setIsAdmin(true);
            setKeplrAddr(data.address);
          } else {
            setIsAdmin(false);
            setKeplrAddr('');
          }
        } else {
          setIsAdmin(false);
          setKeplrAddr('');
        }
      } catch {
        setIsAdmin(false);
      }
    };
    check();
    // Re-check when storage changes (auth from AdminPage)
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isAdmin) return null;

  return (
    <nav className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-12">
        <div className="flex items-center gap-6">
          <span className="text-sm font-serif text-white tracking-wide">Admin</span>
          <div className="flex gap-1">
            {TABS.map(tab => {
              const active = location.pathname === tab.path;
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] font-light transition-all duration-300"
                  style={{
                    color: active ? '#D4AF37' : 'rgba(255,255,255,0.3)',
                    borderBottom: active ? '1px solid #D4AF37' : '1px solid transparent',
                    marginBottom: '-1px',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
        {keplrAddr && (
          <div className="px-3 py-1 border text-[10px] uppercase tracking-widest text-emerald-400 border-emerald-900 bg-emerald-900/10">
            {keplrAddr.slice(0, 8)}…{keplrAddr.slice(-6)}
          </div>
        )}
      </div>
    </nav>
  );
}
