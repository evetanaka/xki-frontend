import { useAccount } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Copy, ExternalLink, Check } from 'lucide-react';
import { useState } from 'react';

function ConnectPrompt() {
  const { open } = useWeb3Modal();

  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-6">
        <div className="text-5xl">👛</div>
        <div className="space-y-2">
          <p className="text-gray-500 text-sm">Connect your wallet to view</p>
          <p className="text-gray-500 text-sm">your $XKI portfolio, staking positions,</p>
          <p className="text-gray-500 text-sm">vesting schedule, and rewards.</p>
        </div>
        <button
          onClick={() => open()}
          className="px-6 py-3 bg-white text-black text-[10px] uppercase tracking-widest font-bold hover:bg-gray-200 transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    </div>
  );
}

function WalletHeader({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">👛</span>
          <h1 className="font-serif text-2xl text-white">My Wallet</h1>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1 ml-11">
          Connected to Ethereum Mainnet
        </p>
      </div>
      <div className="flex items-center gap-2 ml-11 sm:ml-0">
        <span className="font-mono text-sm text-gray-400">{short}</span>
        <button
          onClick={copyAddress}
          className="p-1.5 border border-white/10 text-gray-500 hover:text-white hover:border-white/30 transition-colors"
          title="Copy address"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </button>
        <a
          href={`https://etherscan.io/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 border border-white/10 text-gray-500 hover:text-white hover:border-white/30 transition-colors"
          title="View on Etherscan"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const { address, isConnected } = useAccount();

  if (!isConnected || !address) {
    return <ConnectPrompt />;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      <WalletHeader address={address} />
      {/* Phase 2: OverviewCards + VestingSection */}
      {/* Phase 3: StakingSection */}
      {/* Phase 4: TransactionHistory */}
      {/* Phase 5: BuyXKI */}
    </div>
  );
}
