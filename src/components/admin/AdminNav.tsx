import { useLocation, useNavigate } from 'react-router-dom';

const TABS = [
  { path: '/admin', label: '$XKI Claims' },
  { path: '/admin/nft', label: 'NFT Claims' },
];

export default function AdminNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
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
        <button
          onClick={() => window.location.href = '/'}
          className="text-[10px] uppercase tracking-[0.15em] text-white/20 hover:text-white/40 font-light transition-colors"
        >
          ← Site
        </button>
      </div>
    </nav>
  );
}
