/**
 * Internal state management hook for tiers
 * Used by PricingContext to manage tier-related state
 *
 * This hook contains the actual state logic, while useTiers remains a facade
 * that selects from the context for consumer components.
 */

import { useState, useCallback } from 'react';
import { type Tier } from '../data/tiers';

// ============================================================================
// Types
// ============================================================================

export type CtaStyle = 'primary' | 'secondary' | 'outline';

export interface TierDisplayConfig {
  highlighted: boolean;
  highlightedFeatures: string[];
  ctaText: string;
  ctaStyle: CtaStyle;
  badgeText: string;
  showLimits: boolean;
  maxVisibleFeatures: number;
  monthlyPrice: number;
  annualPrice: number;
  tagline: string;
}

export interface TiersStateValue {
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

export interface TiersStateInitialValues {
  tiers: Tier[];
  tierDisplayConfigs: Record<string, TierDisplayConfig>;
  tierDistribution: Record<string, number>;
}

// ============================================================================
// Helper Functions
// ============================================================================

function createDefaultTierDisplayConfig(tier: Tier, index: number): TierDisplayConfig {
  const isFirstPaidTier = tier.monthlyPriceMYR > 0 && index <= 1;
  return {
    highlighted: isFirstPaidTier,
    highlightedFeatures: [...tier.highlightFeatures],
    ctaText: tier.monthlyPriceMYR === 0 ? 'Get Started Free'
      : isFirstPaidTier ? 'Start Free Trial'
      : 'Contact Sales',
    ctaStyle: isFirstPaidTier ? 'primary' : tier.monthlyPriceMYR === 0 ? 'outline' : 'secondary',
    monthlyPrice: tier.monthlyPriceMYR,
    annualPrice: tier.annualPriceMYR,
    tagline: tier.tagline,
    badgeText: 'Most Popular',
    showLimits: true,
    maxVisibleFeatures: 6,
  };
}

function createTierDisplayConfigsFromTiers(tiers: Tier[]): Record<string, TierDisplayConfig> {
  const configs: Record<string, TierDisplayConfig> = {};
  tiers.forEach((tier, index) => {
    configs[tier.id] = createDefaultTierDisplayConfig(tier, index);
  });
  return configs;
}

function createNewTier(index: number): Tier {
  return {
    id: `tier-${Date.now()}-${index}`,
    name: `Tier ${index + 1}`,
    tagline: 'Your tagline here',
    targetAudience: 'Target audience',
    monthlyPriceMYR: index * 25,
    annualPriceMYR: index * 250,
    annualDiscount: 20,
    status: 'active',
    limits: [],
    includedFeatures: [],
    excludedFeatures: [],
    highlightFeatures: [],
  };
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Internal hook for managing tier state
 * Contains all the tier-related state management logic
 */
export function useTiersState(initialValues: TiersStateInitialValues): TiersStateValue {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  const [tiers, setTiersState] = useState<Tier[]>(initialValues.tiers);
  const [tierDisplayConfigs, setTierDisplayConfigsState] = useState<Record<string, TierDisplayConfig>>(
    initialValues.tierDisplayConfigs
  );
  const [tierDistribution, setTierDistributionState] = useState<Record<string, number>>(
    initialValues.tierDistribution
  );

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const setTiers = useCallback((newTiers: Tier[]) => {
    setTiersState(newTiers);
  }, []);

  const updateTier = useCallback((tierId: string, updates: Partial<Tier>) => {
    setTiersState(prev =>
      prev.map(tier => tier.id === tierId ? { ...tier, ...updates } : tier)
    );
  }, []);

  const setTierDisplayConfig = useCallback((tierId: string, config: Partial<TierDisplayConfig>) => {
    setTiersState(currentTiers => {
      // Validate that the tier exists
      const tier = currentTiers.find(t => t.id === tierId);
      if (!tier) {
        console.warn(`setTierDisplayConfig: Tier '${tierId}' not found, skipping update`);
        return currentTiers;
      }

      // Update display config in a separate update
      const tierIndex = currentTiers.findIndex(t => t.id === tierId);

      setTierDisplayConfigsState(prevConfigs => {
        const existingConfig = prevConfigs[tierId];
        const baseConfig = existingConfig || createDefaultTierDisplayConfig(tier, tierIndex);

        return {
          ...prevConfigs,
          [tierId]: {
            ...baseConfig,
            ...config,
          },
        };
      });

      return currentTiers;
    });
  }, []);

  const setTierDisplayConfigs = useCallback((configs: Record<string, TierDisplayConfig>) => {
    setTierDisplayConfigsState(configs);
  }, []);

  const initializeTierDisplayConfigs = useCallback(() => {
    setTiersState(currentTiers => {
      setTierDisplayConfigsState(createTierDisplayConfigsFromTiers(currentTiers));
      return currentTiers;
    });
  }, []);

  const setTierDistribution = useCallback((distribution: Record<string, number>) => {
    setTierDistributionState(distribution);
  }, []);

  const setTierCount = useCallback((count: number) => {
    setTiersState(prev => {
      if (count < 1 || count > 6) return prev;

      if (count > prev.length) {
        // Add tiers
        const newTiers = [...prev];
        for (let i = prev.length; i < count; i++) {
          newTiers.push(createNewTier(i));
        }
        // Update display configs for new tiers
        setTierDisplayConfigsState(prevConfigs => ({
          ...prevConfigs,
          ...createTierDisplayConfigsFromTiers(newTiers.slice(prev.length)),
        }));
        return newTiers;
      } else {
        // Remove tiers
        return prev.slice(0, count);
      }
    });
  }, []);

  const addTier = useCallback(() => {
    setTiersState(prev => {
      const newTier = createNewTier(prev.length);
      const newTiers = [...prev, newTier];

      // Add display config for new tier
      setTierDisplayConfigsState(prevConfigs => ({
        ...prevConfigs,
        [newTier.id]: createDefaultTierDisplayConfig(newTier, prev.length),
      }));

      return newTiers;
    });
  }, []);

  const removeTier = useCallback((tierId: string) => {
    setTiersState(prev => {
      if (prev.length <= 1) return prev;

      // Remove display config
      setTierDisplayConfigsState(prevConfigs => {
        const { [tierId]: _, ...rest } = prevConfigs;
        return rest;
      });

      return prev.filter(t => t.id !== tierId);
    });
  }, []);

  // -------------------------------------------------------------------------
  // Return value
  // -------------------------------------------------------------------------

  return {
    // State
    tiers,
    tierDisplayConfigs,
    tierDistribution,

    // Actions
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

// Re-export helper functions for use by PricingContext
export { createDefaultTierDisplayConfig, createTierDisplayConfigsFromTiers };
