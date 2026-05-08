import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi'
import { mainnet } from 'wagmi/chains'
import { http } from 'wagmi'

const projectId = 'e9d25f804bc56e498f7498fd3145200e'

const metadata = {
  name: 'Ki Foundation',
  description: 'XKI Staking & Vesting',
  url: 'https://foundation.ki',
  icons: ['https://foundation.ki/favicon.ico'],
}

const chains = [mainnet] as const

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
})

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#ffffff',
    '--w3m-border-radius-master': '0px',
  },
})
