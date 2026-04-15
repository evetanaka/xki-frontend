import { Outlet } from 'react-router-dom';
import Nav from './components/layout/Nav';
import Footer from './components/layout/Footer';
import CountdownBanner from './components/CountdownBanner';

export default function App({ navOnly }: { navOnly?: boolean }) {
  return (
    <div className="bg-[#050505] text-[#E0E0E0] font-sans antialiased selection:bg-white selection:text-black overflow-x-hidden min-h-screen flex flex-col">
      <CountdownBanner />
      <Nav />
      <Outlet />
      {!navOnly && <Footer />}
    </div>
  );
}
