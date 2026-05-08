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
})

export default function Web3ModalProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}
