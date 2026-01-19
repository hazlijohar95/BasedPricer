/**
 * Focused hook for tier management
 * Provides a subset of PricingContext for components that only need tier data
 */

import { usePricing, type TierDisplayConfig } from '../context/PricingContext';
import type { Tier } from '../data/tiers';

export interface UseTiersReturn {
  // State
  tiers: Tier[];
  tierDisplayConfigs: Record<string, TierDisplayConfig>;
  tierDistribution: Record<string, number>;

  // Actions
  setTiers: (tiers: Tier[]) => void;
  updateTier: (tierId: string, updates: Partial<Tier>) => void;
  setTierDisplayConfig: (tierId: string, config: Partial<TierDisplayConfig>) => void;
  setTierDisplayConfigs: (configs: Record<string, TierDisplayConfig>) => void;
  initializeTierDisplayConfigs: () => void;
  setTierDistribution: (distribution: Record<string, number>) => void;
  setTierCount: (count: number) => void;
  addTier: () => void;
  removeTier: (tierId: string) => void;
}

/**
 * Hook for tier-related state and actions
 * Use this instead of usePricing when you only need tier functionality
 */
export function useTiers(): UseTiersReturn {
  const {
    tiers,
    tierDisplayConfigs,
    tierDistribution,
    setTiers,
    updateTier,
    setTierDisplayConfig,
    setTierDisplayConfigs,
    initializeTierDisplayConfigs,
    setTierDistribution,
    setTierCount,
    addTier,
    removeTier,
  } = usePricing();

  return {
    tiers,
    tierDisplayConfigs,
    tierDistribution,
    setTiers,
    updateTier,
    setTierDisplayConfig,
    setTierDisplayConfigs,
    initializeTierDisplayConfigs,
    setTierDistribution,
    setTierCount,
    addTier,
    removeTier,
  };
}
