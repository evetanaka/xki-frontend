import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './config/wagmi';
import Web3ModalProvider from './components/Web3ModalProvider';
import App from './App';
import HomePage from './pages/HomePage';
import StakePage from './pages/StakePage';
import ClaimPage from './pages/ClaimPage';
import GuidePage from './pages/GuidePage';
import AdminPage from './pages/AdminPage';
import NftClaimPage from './pages/NftClaimPage';
import NftAdminPage from './pages/NftAdminPage';
import AdminRewardsPage from './pages/AdminRewardsPage';
import WalletPage from './pages/WalletPage';
import Nav from './components/layout/Nav';
import AdminNav from './components/admin/AdminNav';
import './index.css';

const queryClient = new QueryClient();

function AdminWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#050505] text-[#E0E0E0] font-sans antialiased selection:bg-white selection:text-black overflow-x-hidden min-h-screen">
      <Nav />
      <div className="pt-[72px]">
        <AdminNav />
        {children}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <Web3ModalProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<App />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/stake" element={<StakePage />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/guide" element={<GuidePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
              <Route element={<App navOnly />}>
                <Route path="/claim" element={<ClaimPage />} />
                <Route path="/nft-claim" element={<NftClaimPage />} />
              </Route>
              <Route path="/admin" element={<AdminWrapper><AdminPage /></AdminWrapper>} />
              <Route path="/admin/nft" element={<AdminWrapper><NftAdminPage /></AdminWrapper>} />
              <Route path="/admin/rewards" element={<AdminWrapper><AdminRewardsPage /></AdminWrapper>} />
            </Routes>
          </BrowserRouter>
        </Web3ModalProvider>
      </WagmiProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
