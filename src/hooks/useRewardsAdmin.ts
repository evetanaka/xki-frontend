import { useReadContract, useReadContracts } from 'wagmi'
import { type Address } from 'viem'
import {
  XKI_REWARD_DISTRIBUTOR,
  XKI_STAKING,
  XKI_TOKEN,
  TREASURY_SAFE,
  xkiRewardDistributorAbi,
  xkiTokenAbi,
  xkiStakingAbi,
} from '../config/contracts'

const erc20MetaAbi = [
  { type: 'function', name: 'symbol', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'string' }] },
  { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint8' }] },
] as const

export interface RewardTokenInfo {
  address: Address
  symbol: string
  decimals: number
}

export function useRewardTokenList() {
  const { data: tokenAddresses, isLoading: listLoading } = useReadContract({
    address: XKI_REWARD_DISTRIBUTOR,
    abi: xkiRewardDistributorAbi,
    functionName: 'getRewardTokens',
  })

  const addresses = (tokenAddresses as Address[] | undefined) ?? []

  const { data: metaResults, isLoading: metaLoading } = useReadContracts({
    contracts: addresses.flatMap((addr) => [
      { address: addr, abi: erc20MetaAbi, functionName: 'symbol' },
      { address: addr, abi: erc20MetaAbi, functionName: 'decimals' },
    ]),
    query: { enabled: addresses.length > 0 },
  })

  const tokens: RewardTokenInfo[] = addresses.map((addr, i) => ({
    address: addr,
    symbol: (metaResults?.[i * 2]?.result as string) ?? '???',
    decimals: (metaResults?.[i * 2 + 1]?.result as number) ?? 18,
  }))

  return { tokens, addresses, isLoading: listLoading || metaLoading }
}

export function useRewardState(tokenAddress: Address | undefined) {
  return useReadContract({
    address: XKI_REWARD_DISTRIBUTOR,
    abi: xkiRewardDistributorAbi,
    functionName: 'rewardState',
    args: tokenAddress ? [tokenAddress] : undefined,
    query: { enabled: !!tokenAddress },
  })
}

export function useTreasuryBalance(tokenAddress: Address | undefined) {
  return useReadContract({
    address: tokenAddress,
    abi: xkiTokenAbi,
    functionName: 'balanceOf',
    args: [TREASURY_SAFE],
    query: { enabled: !!tokenAddress },
  })
}

export function useTreasuryAllowance(tokenAddress: Address | undefined) {
  return useReadContract({
    address: tokenAddress,
    abi: xkiTokenAbi,
    functionName: 'allowance',
    args: [TREASURY_SAFE, XKI_REWARD_DISTRIBUTOR],
    query: { enabled: !!tokenAddress },
  })
}

export function useTreasuryAddress() {
  return useReadContract({
    address: XKI_REWARD_DISTRIBUTOR,
    abi: xkiRewardDistributorAbi,
    functionName: 'treasury',
  })
}

export function useTVL() {
  return useReadContract({
    address: XKI_TOKEN,
    abi: xkiTokenAbi,
    functionName: 'balanceOf',
    args: [XKI_STAKING],
  })
}

export function useTotalWeight() {
  return useReadContract({
    address: XKI_STAKING,
    abi: xkiStakingAbi,
    functionName: 'totalWeight',
  })
}

export function useEarnedLookup(userAddress: Address | undefined, tokenAddresses: Address[]) {
  return useReadContracts({
    contracts: tokenAddresses.map((token) => ({
      address: XKI_REWARD_DISTRIBUTOR,
      abi: xkiRewardDistributorAbi,
      functionName: 'earned',
      args: [userAddress!, token],
    })),
    query: { enabled: !!userAddress && tokenAddresses.length > 0 },
  })
}

export function useMultiRewardState(tokenAddresses: Address[]) {
  return useReadContracts({
    contracts: tokenAddresses.map((token) => ({
      address: XKI_REWARD_DISTRIBUTOR,
      abi: xkiRewardDistributorAbi,
      functionName: 'rewardState',
      args: [token],
    })),
    query: { enabled: tokenAddresses.length > 0 },
  })
}

export function useMultiTreasuryBalance(tokenAddresses: Address[]) {
  return useReadContracts({
    contracts: tokenAddresses.map((token) => ({
      address: token,
      abi: xkiTokenAbi,
      functionName: 'balanceOf',
      args: [TREASURY_SAFE],
    })),
    query: { enabled: tokenAddresses.length > 0 },
  })
}

export function useMultiTreasuryAllowance(tokenAddresses: Address[]) {
  return useReadContracts({
    contracts: tokenAddresses.map((token) => ({
      address: token,
      abi: xkiTokenAbi,
      functionName: 'allowance',
      args: [TREASURY_SAFE, XKI_REWARD_DISTRIBUTOR],
    })),
    query: { enabled: tokenAddresses.length > 0 },
  })
}
