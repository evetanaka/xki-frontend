import { createWeb3Modal } from '@web3modal/wagmi/react'
import { config, projectId } from '../config/wagmi'
import { type ReactNode } from 'react'

// Initialize Web3Modal once at module level
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#ffffff',
    '--w3m-border-radius-master': '0px',
  },
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
    '7674bb4e353bf52886768a3ddc2a4562ce2f4191c80831291c7571e1dba72489', // Keplr
    '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
    '18388be9ac2d02726dbac9777c96efaac06d744b2f6d580fccdd4127a6d01fd1', // Rabby
  ],
  allWallets: 'SHOW',
  enableOnramp: false,
})

export default function Web3ModalProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}
