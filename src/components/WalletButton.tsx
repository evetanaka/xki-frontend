import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount, useDisconnect } from 'wagmi'
import { LogOut } from 'lucide-react'

export default function WalletButton() {
  const { address, isConnected } = useAccount()
  const { open } = useWeb3Modal()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    const short = `${address.slice(0, 6)}...${address.slice(-4)}`
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => open({ view: 'Account' })}
          className="text-[10px] font-mono text-gray-400 hover:text-white transition-colors hidden sm:inline px-3 py-2 border border-white/10 hover:border-white/30"
        >
          {short}
        </button>
        <button
          onClick={() => disconnect()}
          className="p-2 border border-white/10 text-gray-500 hover:text-white hover:border-white/30 transition-colors"
          title="Disconnect"
        >
          <LogOut className="w-3 h-3" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => open()}
      className="px-4 py-2 bg-white text-black text-[10px] uppercase tracking-widest font-bold hover:bg-gray-200 transition-colors"
    >
      Connect Wallet
    </button>
  )
}
