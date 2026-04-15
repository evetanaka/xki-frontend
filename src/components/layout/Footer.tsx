import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#030303]">
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 bg-white text-black flex items-center justify-center font-serif font-bold text-sm">K</div>
              <span className="text-xs tracking-[0.2em] uppercase text-gray-500">Ki Foundation</span>
            </div>
            <p className="text-xs text-gray-600 font-light leading-relaxed">
              Architecture of Value.<br />Building shared infrastructure for a decentralized future.
            </p>
          </div>
          {/* Product */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-4">Product</p>
            <div className="space-y-3">
              <Link to="/claim" className="block text-xs text-gray-600 hover:text-white transition-colors">Migration Portal</Link>
              <Link to="/stake" className="block text-xs text-gray-600 hover:text-white transition-colors">Staking</Link>
              <Link to="/guide" className="block text-xs text-gray-600 hover:text-white transition-colors">Governance Guide</Link>
            </div>
          </div>
          {/* Legal */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-4">Legal</p>
            <div className="space-y-3">
              <a href="#" className="block text-xs text-gray-600 hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="block text-xs text-gray-600 hover:text-white transition-colors">Privacy Policy</a>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-white/5 pt-8 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">Stay Updated</p>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input type="email" placeholder="your@email.com" className="bg-transparent border border-white/10 px-4 py-2 text-xs text-white placeholder-gray-700 focus:outline-none focus:border-white/30 transition-colors w-full md:w-64" />
              <button className="px-4 py-2 bg-white text-black text-[10px] uppercase tracking-widest font-bold hover:bg-gray-200 transition-colors whitespace-nowrap">Subscribe</button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-gray-700 uppercase tracking-[0.2em]">© 2026 Ki Foundation — All rights reserved</p>
          <div className="flex items-center gap-4 text-[9px] text-gray-700 font-mono">
            <span>ERC-20: Ethereum Mainnet</span>
            <span className="text-gray-800">•</span>
            <span>Supply: 1,200,000,000</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
