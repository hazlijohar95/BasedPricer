/**
 * Internal state management hook for business type
 * Used by PricingContext to manage business type-related state
 */

import { useState, useCallback } from 'react';
import { type BusinessType, type PricingModelType, BUSINESS_TYPES } from '../data/business-types';
import { type Tier } from '../data/tiers';
import { getTierTemplatesForBusinessType, convertTemplatesToTiers } from '../data/tier-templates';
import {
  type TierDisplayConfig,
  createTierDisplayConfigsFromTiers,
} from './useTiersState';

// ============================================================================
// Types
// ============================================================================

export interface BusinessTypeStateValue {
  // State
  businessType: BusinessType | null;
  businessTypeConfidence: number;
  pricingModelType: PricingModelType;
  utilizationRate: number;

  // Actions
  setBusinessType: (type: BusinessType, confidence: number) => void;
  setPricingModelType: (model: PricingModelType) => void;
  setUtilizationRate: (rate: number) => void;

  // Template action (returns new tiers for the caller to apply)
  getBusinessTypeTemplate: (businessType: BusinessType) => {
    tiers: Tier[];
    tierDisplayConfigs: Record<string, TierDisplayConfig>;
    pricingModelType: PricingModelType;
  };
}

export interface BusinessTypeStateInitialValues {
  businessType: BusinessType | null;
  businessTypeConfidence: number;
  pricingModelType: PricingModelType;
  utilizationRate: number;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Internal hook for managing business type state
 * Contains all the business type-related state management logic
 */
export function useBusinessTypeState(initialValues: BusinessTypeStateInitialValues): BusinessTypeStateValue {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  const [businessType, setBusinessTypeState] = useState<BusinessType | null>(
    initialValues.businessType
  );
  const [businessTypeConfidence, setBusinessTypeConfidenceState] = useState<number>(
    initialValues.businessTypeConfidence
  );
  const [pricingModelType, setPricingModelTypeState] = useState<PricingModelType>(
    initialValues.pricingModelType
  );
  const [utilizationRate, setUtilizationRateState] = useState<number>(
    initialValues.utilizationRate
  );

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const setBusinessType = useCallback((type: BusinessType, confidence: number) => {
    setBusinessTypeState(type);
    setBusinessTypeConfidenceState(confidence);
    setPricingModelTypeState(BUSINESS_TYPES[type]?.pricingModel ?? 'feature_tiered');
  }, []);

  const setPricingModelType = useCallback((model: PricingModelType) => {
    setPricingModelTypeState(model);
  }, []);

  const setUtilizationRate = useCallback((rate: number) => {
    setUtilizationRateState(Math.min(1, Math.max(0, rate)));
  }, []);

  /**
   * Get tier templates for a business type
   * Returns new data that the caller can apply to their state
   */
  const getBusinessTypeTemplate = useCallback((bt: BusinessType) => {
    const templateSet = getTierTemplatesForBusinessType(bt);
    const newTiers = convertTemplatesToTiers(templateSet.tiers, bt);
    const newConfigs = createTierDisplayConfigsFromTiers(newTiers);
    const newPricingModel = BUSINESS_TYPES[bt]?.pricingModel ?? 'feature_tiered';

    return {
      tiers: newTiers,
      tierDisplayConfigs: newConfigs,
      pricingModelType: newPricingModel,
    };
  }, []);

  // -------------------------------------------------------------------------
  // Return value
  // -------------------------------------------------------------------------

  return {
    // State
    businessType,
    businessTypeConfidence,
    pricingModelType,
    utilizationRate,

    // Actions
    setBusinessType,
    setPricingModelType,
    setUtilizationRate,
    getBusinessTypeTemplate,
  };
}
