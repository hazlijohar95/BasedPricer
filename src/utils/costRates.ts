/**
 * Centralized Cost Rate Derivation
 * Single source of truth for deriving cost rates from variable costs
 */

import { type VariableCostItem } from './costCalculator';
import { COST_IDS } from '../constants/costIds';

/**
 * Cost rates used for tier variable cost calculations
 */
export interface CostRates {
  extractionCostPerUnit: number; // MYR per extraction/document (OCR)
  emailCostPerUnit: number;      // MYR per email
  storageCostPerGB: number;      // MYR per GB/month
}

/**
 * Default cost rates (fallback values)
 * These should match the ai-saas preset in PricingContext
 */
export const DEFAULT_COST_RATES: CostRates = {
  extractionCostPerUnit: 0.15,  // MYR 0.15 per extraction
  emailCostPerUnit: 0.005,      // MYR 0.005 per email
  storageCostPerGB: 0.07,       // MYR 0.07 per GB/month
};

/**
 * Derive cost rates from variable costs array
 * This ensures TierConfigurator and PricingCalculator use the same rates
 *
 * @param variableCosts - Array of variable cost items from PricingContext
 * @returns CostRates object with current rates
 */
export function deriveCostRatesFromVariableCosts(
  variableCosts: VariableCostItem[]
): CostRates {
  const ocrCost = variableCosts.find(c => c.id === COST_IDS.OCR)?.costPerUnit;
  const emailCost = variableCosts.find(c => c.id === COST_IDS.EMAIL)?.costPerUnit;
  const storageCost = variableCosts.find(c => c.id === COST_IDS.STORAGE)?.costPerUnit;

  return {
    extractionCostPerUnit: ocrCost ?? DEFAULT_COST_RATES.extractionCostPerUnit,
    emailCostPerUnit: emailCost ?? DEFAULT_COST_RATES.emailCostPerUnit,
    storageCostPerGB: storageCost ?? DEFAULT_COST_RATES.storageCostPerGB,
  };
}

/**
 * Get cost rate by ID
 * Useful for getting individual rates for specific features
 *
 * @param variableCosts - Array of variable cost items
 * @param costId - The cost ID to look up
 * @param defaultValue - Fallback value if not found
 */
export function getCostRateById(
  variableCosts: VariableCostItem[],
  costId: string,
  defaultValue: number = 0
): number {
  return variableCosts.find(c => c.id === costId)?.costPerUnit ?? defaultValue;
}
