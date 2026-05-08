import { defaultWagmiConfig } from '@web3modal/wagmi'
import { mainnet } from 'wagmi/chains'

export const projectId = 'e9d25f804bc56e498f7498fd3145200e'

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
