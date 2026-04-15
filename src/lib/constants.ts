export const API_BASE = 'https://api.foundation.ki/api';

export const MULTIPLIERS: Record<number, number> = {
  3: 1,
  6: 2,
  12: 3,
  24: 4,
  36: 5,
};

export const TIER_NAMES: Record<number, string> = {
  3: 'Explorer',
  6: 'Builder',
  12: 'Architect',
  24: 'Founder',
  36: 'Visionary',
};

export const TIER_EMOJIS: Record<number, string> = {
  3: '🧭',
  6: '🔨',
  12: '🏛️',
  24: '👑',
  36: '🌟',
};

export const DURATIONS = [3, 6, 12, 24, 36] as const;

export const BASE_APY = 0.124; // 12.4% (legacy, unused)

// Reward distribution parameters
export const DAR_POOL_TOTAL = 2_000_000; // 2M $DAR distributed over 3 years
export const DAR_POOL_MONTHS = 36;
export const DAR_MONTHLY_POOL = DAR_POOL_TOTAL / DAR_POOL_MONTHS; // ~55,556 $DAR/month
export const ASSUMED_TOTAL_STAKED = 400_000_000; // 400M XKI staked assumption
export const ASSUMED_AVG_MULTIPLIER = 2.5; // average multiplier across all stakers
export const TOTAL_EFFECTIVE_POWER = ASSUMED_TOTAL_STAKED * ASSUMED_AVG_MULTIPLIER; // 1B

export const CHAIN_ID = 'kichain-2';

export const TOTAL_SUPPLY = 1_200_000_000;

export const TOKENOMICS = [
  { label: 'Community Airdrop', amount: 500_000_000, pct: 41.7, color: 'text-white' },
  { label: 'Team & Advisors', amount: 100_000_000, pct: 8.3, color: 'text-gray-400' },
  { label: 'Treasury & Ecosystem', amount: 600_000_000, pct: 50.0, color: 'text-gray-500' },
];
