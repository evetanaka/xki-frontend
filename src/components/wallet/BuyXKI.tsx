import { ExternalLink } from 'lucide-react';
import { XKI_TOKEN } from '../../config/contracts';

const UNISWAP_URL = `https://app.uniswap.org/swap?outputCurrency=${XKI_TOKEN}&chain=ethereum`;

export default function BuyXKI() {
  return (
    <div className="glass-panel p-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-xl">💱</span>
        <h2 className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold">Buy $XKI</h2>
      </div>

      <div className="border border-white/8 rounded bg-white/[0.02] p-8 flex flex-col items-center gap-6 text-center">
        <div className="w-12 h-12 rounded-full bg-[#FF007A]/10 flex items-center justify-center">
          <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
            <path d="M15.54 6.82c-.36-.05-.37-.06-.08-.06.27-.01.71.04 1 .1l-.92-.04zm1.89.26c.17.08.17.09-.03.04-.12-.03-.26-.07-.32-.08-.06-.01.1.01.35.04zm.68.17c.06.04-.01.04-.2 0l-.22-.05.21.02c.11.01.2.03.21.03zm.42.1l.27.06-.22-.03c-.24-.04-.27-.04-.05-.03zm8.01 3.14c-3.53 2.14-5.26 4.72-5.67 8.47-.12 1.12-.05 3 .14 3.87.07.29.06.29-.15.03-.54-.67-1.13-1.94-1.37-2.97-.18-.76-.2-1.02-.2-2.17 0-1.12.03-1.42.18-2.07.65-2.8 2.5-5.14 5.52-6.97.63-.38 2.21-1.18 2.3-1.16.02 0-.32.42-.75.97z" fill="#FF007A"/>
            <path d="M29.14 13.03c.1 1.36.37 2.29.92 3.19.29.47.36.66.22.57-.33-.22-1.05-1.09-1.35-1.63-.53-.95-.8-1.94-.85-3.13l-.03-.63.04-.26c.03.01.04.39.05.89z" fill="#FF007A"/>
            <path d="M12.5 14.28c-.04.16-.08.28-.1.26-.05-.05.05-.52.12-.58.06-.04.05.04-.02.32z" fill="#FF007A"/>
            <path d="M33.34 16.59c1.56 1.66 2.55 3.68 2.95 5.98.14.8.14 2.91 0 3.75-.46 2.87-1.75 5.16-3.96 7.01-.33.28-.66.53-.72.57-.09.04.01-.13.35-.63 1.17-1.7 1.68-3.31 1.68-5.27 0-2.07-.59-3.73-2.1-5.9-.34-.49-1.12-1.47-1.68-2.1-1.39-1.56-1.81-2.15-2.27-3.19-.52-1.16-.7-2.01-.7-3.3 0-.86.02-1.05.14-1.67.08-.39.23-.93.31-1.18l.16-.47.42.5c.23.27.88.99 1.42 1.58z" fill="#FF007A"/>
          </svg>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-300">Swap ETH or any token for $XKI</p>
          <p className="text-[10px] text-gray-600">Powered by Uniswap · Ethereum Mainnet</p>
        </div>

        <a
          href={UNISWAP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black text-[10px] uppercase tracking-widest font-bold hover:bg-gray-200 transition-colors"
        >
          Open Uniswap
          <ExternalLink className="w-3 h-3" />
        </a>

        <p className="text-[9px] font-mono text-gray-600">
          Token: {XKI_TOKEN.slice(0, 6)}...{XKI_TOKEN.slice(-4)}
        </p>
      </div>
    </div>
  );
}
