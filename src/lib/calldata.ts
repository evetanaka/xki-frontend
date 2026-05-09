import { encodeFunctionData, type Address, type Hex } from 'viem'
import { xkiTokenAbi, xkiStakingAbi, xkiRewardDistributorAbi } from '../config/contracts'

export function encodeApprove(spender: Address, amount: bigint): Hex {
  return encodeFunctionData({ abi: xkiTokenAbi, functionName: 'approve', args: [spender, amount] })
}

export function encodeNotifyReward(token: Address, amount: bigint, duration: bigint): Hex {
  return encodeFunctionData({ abi: xkiRewardDistributorAbi, functionName: 'notifyReward', args: [token, amount, duration] })
}

export function encodeAddRewardToken(token: Address): Hex {
  return encodeFunctionData({ abi: xkiRewardDistributorAbi, functionName: 'addRewardToken', args: [token] })
}

export function encodeSetFeeRouter(router: Address, approved: boolean): Hex {
  return encodeFunctionData({ abi: xkiRewardDistributorAbi, functionName: 'setFeeRouter', args: [router, approved] })
}

export function encodeTransfer(to: Address, amount: bigint): Hex {
  return encodeFunctionData({ abi: xkiTokenAbi, functionName: 'transfer', args: [to, amount] })
}

export function encodeSetRewardDistributor(distributor: Address): Hex {
  return encodeFunctionData({ abi: xkiStakingAbi, functionName: 'setRewardDistributor', args: [distributor] })
}

export function encodeUpdateReward(user: Address): Hex {
  return encodeFunctionData({ abi: xkiRewardDistributorAbi, functionName: 'updateReward', args: [user] })
}

export interface SafeTx {
  to: string
  value: string
  data: string
  description?: string
}

export function generateSafeBatchJson(transactions: SafeTx[], chainId = '1'): string {
  return JSON.stringify({
    version: '1.0',
    chainId,
    createdAt: Date.now(),
    meta: { name: 'XKI Reward Distribution', description: 'Batch transaction for reward distribution', txBuilderVersion: '1.16.5' },
    transactions: transactions.map(({ to, value, data }) => ({
      to,
      value,
      data: data || '0x',
      contractMethod: null,
      contractInputsValues: null,
    })),
  }, null, 2)
}
