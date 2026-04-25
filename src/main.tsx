import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import HomePage from './pages/HomePage';
import StakePage from './pages/StakePage';
import ClaimPage from './pages/ClaimPage';
import GuidePage from './pages/GuidePage';
import AdminPage from './pages/AdminPage';
import NftClaimPage from './pages/NftClaimPage';
import NftAdminPage from './pages/NftAdminPage';
import './index.css';

function AdminWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#050505] text-[#E0E0E0] font-sans antialiased selection:bg-white selection:text-black overflow-x-hidden min-h-screen">
      {children}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Pages with shared Nav + Footer */}
        <Route element={<App />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/stake" element={<StakePage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        {/* Claim: shared Nav, custom footer (FooterStats inside ClaimPage) */}
        <Route element={<App navOnly />}>
          <Route path="/claim" element={<ClaimPage />} />
          <Route path="/nft-claim" element={<NftClaimPage />} />
        </Route>
        {/* Admin: completely standalone layout */}
        <Route path="/admin" element={<AdminWrapper><AdminPage /></AdminWrapper>} />
        <Route path="/admin/nft" element={<AdminWrapper><NftAdminPage /></AdminWrapper>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
