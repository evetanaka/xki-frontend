import { defaultWagmiConfig } from '@web3modal/wagmi'
import { mainnet } from 'wagmi/chains'

export const projectId = '960bf6c7fb73e1c916257fecf5cda9fd'

const metadata = {
  name: 'Ki Foundation',
  description: 'XKI Staking & Vesting',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://foundation.ki',
  icons: ['https://foundation.ki/favicon.ico'],
}

const chains = [mainnet] as const

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
})
