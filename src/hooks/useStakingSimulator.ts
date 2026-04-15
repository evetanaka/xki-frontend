import { useState, useMemo } from 'react';
import { MULTIPLIERS, TIER_NAMES, DURATIONS, DAR_MONTHLY_POOL, TOTAL_EFFECTIVE_POWER } from '../lib/constants';

export function useStakingSimulator(initialAmount = 10000, initialDuration = 12) {
  const [amount, setAmount] = useState(initialAmount);
  const [duration, setDuration] = useState<number>(initialDuration);

  const result = useMemo(() => {
    const multiplier = MULTIPLIERS[duration] || 1;
    const power = amount * multiplier;
    const monthlyDAR = (power / TOTAL_EFFECTIVE_POWER) * DAR_MONTHLY_POOL;
    const tierName = TIER_NAMES[duration] || '';

    return { multiplier, power, monthlyDAR, tierName };
  }, [amount, duration]);

  return {
    amount,
    setAmount,
    duration,
    setDuration,
    durations: DURATIONS,
    ...result,
  };
}
