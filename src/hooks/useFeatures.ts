/**
 * Focused hook for feature management
 * Provides a subset of PricingContext for components that only need feature data
 */

import { usePricing } from '../context/PricingContext';
import type { Feature } from '../data/features';

export interface UseFeaturesReturn {
  // State
  features: Feature[];

  // Actions
  setFeatures: (features: Feature[]) => void;
  addFeature: (feature: Feature) => void;
  updateFeature: (featureId: string, updates: Partial<Feature>) => void;
  removeFeature: (featureId: string) => void;
  importCodebaseFeatures: (features: Feature[]) => void;
}

/**
 * Hook for feature-related state and actions
 * Use this instead of usePricing when you only need feature functionality
 */
export function useFeatures(): UseFeaturesReturn {
  const {
    features,
    setFeatures,
    addFeature,
    updateFeature,
    removeFeature,
    importCodebaseFeatures,
  } = usePricing();

  return {
    features,
    setFeatures,
    addFeature,
    updateFeature,
    removeFeature,
    importCodebaseFeatures,
  };
}
