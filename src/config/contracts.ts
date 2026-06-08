export const XKI_TOKEN = '0xeA8704FA35aAed86Bb19c2bF353F26957513b621' as const
export const XKI_STAKING = '0x2f2950e73d8478cB289F968b5cB015C82F280De5' as const
export const XKI_REWARD_DISTRIBUTOR = '0x22440664CF993bC45a2465bF170Ca2F861217eD8' as const
export const TREASURY_SAFE = '0xD4A52b87248b774B388dB6f6011c062f0BD0Acf5' as const

export const VESTING_CONTRACTS = [
  '0x81DD2709609c64300B3EB2c59489144bDab8bf99',
  '0x5e75bA86a868a647CcCaa5C816e2823193Fcd7D4',
  '0xce3Df1ecA75a5B8A07F38a68A01beED6608A050d',
  '0x317C5f88AF755c9CAA0587a770d8E8bB12BD1701',
  '0x98bfE6E8ebE54e2EE855D56FdD1F46550ce2eE86',
] as const

export const xkiTokenAbi = [
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'symbol', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'string' }] },
  { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint8' }] },
  { type: 'function', name: 'allowance', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
  { type: 'function', name: 'totalSupply', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'transfer', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
] as const

export const xkiStakingAbi = [
  {
    type: 'function', name: 'getUserStakes', stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{
      name: '', type: 'tuple[]', components: [
        { name: 'id', type: 'uint256' },
        { name: 'amount', type: 'uint256' },
        { name: 'lockTier', type: 'uint8' },
        { name: 'startTime', type: 'uint256' },
        { name: 'weight', type: 'uint256' },
        { name: 'fromVesting', type: 'bool' },
        { name: 'active', type: 'bool' },
        { name: 'cooldownActive', type: 'bool' },
        { name: 'cooldownStart', type: 'uint256' },
        { name: 'cooldownEnd', type: 'uint256' },
      ],
    }],
  },
  { type: 'function', name: 'getEffectiveWeight', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'totalWeight', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'MULTIPLIERS', stateMutability: 'view', inputs: [{ name: '', type: 'uint256' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'COOLDOWN_DURATIONS', stateMutability: 'view', inputs: [{ name: '', type: 'uint256' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'stake', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }, { name: 'lockTier', type: 'uint8' }], outputs: [] },
  { type: 'function', name: 'requestUnstake', stateMutability: 'nonpayable', inputs: [{ name: 'stakeId', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'completeUnstake', stateMutability: 'nonpayable', inputs: [{ name: 'stakeId', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'hardUnstake', stateMutability: 'nonpayable', inputs: [{ name: 'stakeId', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'stakeFromVesting', stateMutability: 'nonpayable', inputs: [{ name: 'vestingContract', type: 'address' }, { name: 'amount', type: 'uint256' }, { name: 'lockTier', type: 'uint8' }], outputs: [] },
  { type: 'function', name: 'setRewardDistributor', stateMutability: 'nonpayable', inputs: [{ name: 'distributor', type: 'address' }], outputs: [] },
  { type: 'function', name: 'rewardDistributor', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'address' }] },
] as const

export const xkiRewardDistributorAbi = [
  { type: 'function', name: 'earned', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }, { name: 'token', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'getRewardTokens', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'address[]' }] },
  { type: 'function', name: 'claimRewards', stateMutability: 'nonpayable', inputs: [{ name: 'tokens', type: 'address[]' }], outputs: [] },
  { type: 'function', name: 'rewardState', stateMutability: 'view', inputs: [{ name: 'token', type: 'address' }], outputs: [{ name: 'rewardRate', type: 'uint256' }, { name: 'periodFinish', type: 'uint256' }, { name: 'rewardPerTokenStored', type: 'uint256' }, { name: 'lastUpdateTime', type: 'uint256' }] },
  { type: 'function', name: 'treasury', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'address' }] },
  { type: 'function', name: 'feeRouters', stateMutability: 'view', inputs: [{ name: '', type: 'address' }], outputs: [{ name: '', type: 'bool' }] },
  { type: 'function', name: 'addRewardToken', stateMutability: 'nonpayable', inputs: [{ name: 'token', type: 'address' }], outputs: [] },
  { type: 'function', name: 'notifyReward', stateMutability: 'nonpayable', inputs: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }, { name: 'duration', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'setFeeRouter', stateMutability: 'nonpayable', inputs: [{ name: 'router', type: 'address' }, { name: 'approved', type: 'bool' }], outputs: [] },
  { type: 'function', name: 'updateReward', stateMutability: 'nonpayable', inputs: [{ name: 'user', type: 'address' }], outputs: [] },
] as const

export const vestingAbi = [
  { type: 'function', name: 'beneficiary', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'address' }] },
  { type: 'function', name: 'token', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'address' }] },
  { type: 'function', name: 'start', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'cliff', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'vestingEnd', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'totalAllocation', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'released', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'releasable', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'lockedBalance', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'release', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { type: 'function', name: 'approvedStaking', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'address' }] },
  { type: 'function', name: 'approveStaking', stateMutability: 'nonpayable', inputs: [{ name: 'stakingContract', type: 'address' }], outputs: [] },
] as const
