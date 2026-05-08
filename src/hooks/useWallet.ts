import { useReadContract, useReadContracts } from 'wagmi'
import { type Address } from 'viem'
import {
  XKI_TOKEN, XKI_STAKING, XKI_REWARD_DISTRIBUTOR, VESTING_CONTRACTS,
  xkiTokenAbi, xkiStakingAbi, xkiRewardDistributorAbi, vestingAbi,
} from '../config/contracts'

export function useXKIBalance(address: Address | undefined) {
  return useReadContract({
    address: XKI_TOKEN,
    abi: xkiTokenAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
}

export function useAllowance(address: Address | undefined) {
  return useReadContract({
    address: XKI_TOKEN,
    abi: xkiTokenAbi,
    functionName: 'allowance',
    args: address ? [address, XKI_STAKING] : undefined,
    query: { enabled: !!address },
  })
}

export function useStakingPositions(address: Address | undefined) {
  return useReadContract({
    address: XKI_STAKING,
    abi: xkiStakingAbi,
    functionName: 'getUserStakes',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
}

export function useEffectiveWeight(address: Address | undefined) {
  return useReadContract({
    address: XKI_STAKING,
    abi: xkiStakingAbi,
    functionName: 'getEffectiveWeight',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
}

export function useTotalWeight() {
  return useReadContract({
    address: XKI_STAKING,
    abi: xkiStakingAbi,
    functionName: 'totalWeight',
  })
}

export function useTotalStaked() {
  return useReadContract({
    address: XKI_TOKEN,
    abi: xkiTokenAbi,
    functionName: 'balanceOf',
    args: [XKI_STAKING],
  })
}

export function useRewardTokens() {
  return useReadContract({
    address: XKI_REWARD_DISTRIBUTOR,
    abi: xkiRewardDistributorAbi,
    functionName: 'getRewardTokens',
  })
}

export function useEarnedRewards(address: Address | undefined, tokenAddresses: readonly Address[] | undefined) {
  const contracts = (tokenAddresses ?? []).map((token) => ({
    address: XKI_REWARD_DISTRIBUTOR as Address,
    abi: xkiRewardDistributorAbi,
    functionName: 'earned' as const,
    args: [address!, token] as const,
  }))

  return useReadContracts({
    contracts,
    query: { enabled: !!address && !!tokenAddresses && tokenAddresses.length > 0 },
  })
}

export function useRewardTokenSymbols(tokenAddresses: readonly Address[] | undefined) {
  const contracts = (tokenAddresses ?? []).map((token) => ({
    address: token,
    abi: xkiTokenAbi,
    functionName: 'symbol' as const,
  }))

  return useReadContracts({
    contracts,
    query: { enabled: !!tokenAddresses && tokenAddresses.length > 0 },
  })
}

export function useVestingInfo(address: Address | undefined) {
  // Read beneficiary() from all 4 vesting contracts
  const beneficiaryContracts = VESTING_CONTRACTS.map((vc) => ({
    address: vc as Address,
    abi: vestingAbi,
    functionName: 'beneficiary' as const,
  }))

  const { data: beneficiaryResults } = useReadContracts({
    contracts: beneficiaryContracts,
    query: { enabled: !!address },
  })

  // Find which vesting contract belongs to this address
  const matchIndex = beneficiaryResults?.findIndex(
    (r) => r.status === 'success' && (r.result as string).toLowerCase() === address?.toLowerCase()
  ) ?? -1
  const vestingAddress = matchIndex >= 0 ? VESTING_CONTRACTS[matchIndex] as Address : undefined

  // Read all vesting data from the matched contract
  const detailContracts = vestingAddress ? [
    { address: vestingAddress, abi: vestingAbi, functionName: 'totalAllocation' as const },
    { address: vestingAddress, abi: vestingAbi, functionName: 'released' as const },
    { address: vestingAddress, abi: vestingAbi, functionName: 'releasable' as const },
    { address: vestingAddress, abi: vestingAbi, functionName: 'lockedBalance' as const },
    { address: vestingAddress, abi: vestingAbi, functionName: 'start' as const },
    { address: vestingAddress, abi: vestingAbi, functionName: 'cliff' as const },
    { address: vestingAddress, abi: vestingAbi, functionName: 'vestingEnd' as const },
  ] : []

  const { data: details, isLoading } = useReadContracts({
    contracts: detailContracts,
    query: { enabled: !!vestingAddress },
  })

  if (!vestingAddress || !details) {
    return { vestingAddress: undefined, data: undefined, isLoading }
  }

  const val = (i: number) => details[i]?.status === 'success' ? details[i].result as bigint : 0n

  return {
    vestingAddress,
    data: {
      totalAllocation: val(0),
      released: val(1),
      releasable: val(2),
      lockedBalance: val(3),
      start: val(4),
      cliff: val(5),
      vestingEnd: val(6),
    },
    isLoading,
  }
}
