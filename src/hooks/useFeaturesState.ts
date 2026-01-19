/**
 * Internal state management hook for features
 * Used by PricingContext to manage feature-related state
 *
 * This hook contains the actual state logic, while useFeatures remains a facade
 * that selects from the context for consumer components.
 */

import { useState, useCallback } from 'react';
import { type Feature } from '../data/features';

// ============================================================================
// Types
// ============================================================================

export interface FeaturesStateValue {
  // State
  features: Feature[];

  // Actions
  setFeatures: (features: Feature[]) => void;
  addFeature: (feature: Feature) => void;
  updateFeature: (featureId: string, updates: Partial<Feature>) => void;
  removeFeature: (featureId: string) => void;
  importCodebaseFeatures: (features: Feature[]) => void;
}

export interface FeaturesStateInitialValues {
  features: Feature[];
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Internal hook for managing feature state
 * Contains all the feature-related state management logic
 */
export function useFeaturesState(initialValues: FeaturesStateInitialValues): FeaturesStateValue {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  const [features, setFeaturesState] = useState<Feature[]>(initialValues.features);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const setFeatures = useCallback((newFeatures: Feature[]) => {
    setFeaturesState(newFeatures);
  }, []);

  const addFeature = useCallback((feature: Feature) => {
    setFeaturesState(prev => [...prev, feature]);
  }, []);

  const updateFeature = useCallback((featureId: string, updates: Partial<Feature>) => {
    setFeaturesState(prev =>
      prev.map(feature => feature.id === featureId ? { ...feature, ...updates } : feature)
    );
  }, []);

  const removeFeature = useCallback((featureId: string) => {
    setFeaturesState(prev => prev.filter(feature => feature.id !== featureId));
  }, []);

  const importCodebaseFeatures = useCallback((newFeatures: Feature[]) => {
    setFeaturesState(prev => {
      // Replace existing codebase features, keep manual features
      const manualFeatures = prev.filter(f => f.source === 'manual');
      return [...newFeatures, ...manualFeatures];
    });
  }, []);

  // -------------------------------------------------------------------------
  // Return value
  // -------------------------------------------------------------------------

  return {
    // State
    features,

    // Actions
    setFeatures,
    addFeature,
    updateFeature,
    removeFeature,
    importCodebaseFeatures,
  };
}
