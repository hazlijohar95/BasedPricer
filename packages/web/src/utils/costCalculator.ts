/**
 * Cost Calculator Utilities
 *
 * This module re-exports core calculation functions from @basedpricer/core
 * and adds web-specific display/styling utilities.
 *
 * All calculation logic is centralized in @basedpricer/core for consistency.
 */

import { getMarginStyleFromThreshold } from '../constants';

// ============================================================================
// Re-export types from core
// ============================================================================

export type {
  VariableCostItem,
  FixedCostItem,
  CostBreakdown,
  MarginStatus,
  MarginInfo,
} from '@basedpricer/core';

// ============================================================================
// Re-export calculation functions from core
// These are the canonical implementations - do not duplicate
// ============================================================================

export {
  // Rounding utilities
  roundCurrency,
  roundCustomers,
  roundPercentage,

  // Variable cost calculations
  calculateVariableCosts,
  calculateTotalVariableCosts,

  // Fixed cost calculations
  calculateTotalFixedCosts,
  calculateFixedCostPerCustomer,

  // COGS calculations
  calculateCOGSBreakdown,
  calculateTotalCOGS,
  calculateCOGSPerCustomer,

  // MRR calculations
  calculateMRR,
  calculateTotalVariableCostsForDistribution,

  // Break-even calculations
  calculateBreakEvenCustomers,
  calculateMonthlyProfit,

  // Margin calculations
  calculateGrossMargin as calculateMargin,
  calculateProfit,
  getMarginStatus,
  getMarginInfo,
} from '@basedpricer/core';

// ============================================================================
// Web-specific utilities (display/styling)
// ============================================================================

/**
 * Format currency for display with proper rounding
 * Note: This is for simple display formatting. For locale-aware formatting,
 * use the formatCurrency from @basedpricer/core with currency code.
 */
export function formatCurrencyDisplay(value: number, decimals: number = 2): string {
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(value * factor) / factor;
  return rounded.toFixed(decimals);
}

// Backward compatibility alias
export { formatCurrencyDisplay as formatCurrency };

/**
 * Calculate margin styling based on centralized thresholds
 * Web-specific: returns Tailwind CSS classes
 */
export function getMarginStyle(margin: number): {
  dot: string;
  text: string;
  bg: string;
} {
  const style = getMarginStyleFromThreshold(margin);
  return { dot: style.dot, text: style.text, bg: style.bg };
}

/**
 * Calculate total variable costs across all customers
 * @deprecated Use calculateTotalVariableCostsForDistribution from core instead
 */
export function calculateTotalVariableCostsForCustomers(
  variableCostPerCustomer: number,
  tierDistribution: Record<string, number>,
  utilizationRate: number = 1
): number {
  const totalCustomers = Object.values(tierDistribution).reduce((a, b) => a + b, 0);
  return variableCostPerCustomer * totalCustomers * utilizationRate;
}
