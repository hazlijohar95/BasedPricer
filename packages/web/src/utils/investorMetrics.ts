/**
 * Investor Metrics Utilities
 *
 * Re-exports investor metrics calculations from @basedpricer/core.
 * This ensures a single source of truth for SaaS valuation calculations.
 */

// ============================================================================
// Re-export types from core
// ============================================================================

export type {
  ValuationProjection,
  MilestoneTarget,
  InvestorMetrics,
} from '@basedpricer/core';

// ============================================================================
// Re-export calculation functions from core
// ============================================================================

export {
  // Valuation
  calculateValuation,
  calculateARR,
  calculateMRRFromCustomers,

  // LTV/CAC
  calculateLTV,
  calculateLTVFromChurn,
  calculateLTVCACRatio,
  getLTVCACHealth,
  calculatePaybackPeriod,
  getPaybackHealth,

  // Milestones
  calculateMilestones,
  calculateMonthsToTarget,

  // Break-even
  calculateBreakEvenTimeline,

  // Health status
  getGrossMarginHealth,

  // Complete metrics
  calculateInvestorMetrics,

  // Formatting
  formatCurrencyCompact,
  formatValuationRange,
} from '@basedpricer/core';

// ============================================================================
// Backward compatibility aliases
// ============================================================================

import { formatCurrencyCompact, calculateLTVCACRatio } from '@basedpricer/core';

/**
 * Format currency for display (alias for formatCurrencyCompact)
 * @deprecated Use formatCurrencyCompact from @basedpricer/core instead
 */
export const formatCurrency = formatCurrencyCompact;

/**
 * Calculate LTV:CAC ratio (alias with different casing for backward compatibility)
 * @deprecated Use calculateLTVCACRatio from @basedpricer/core instead
 */
export const calculateLtvCacRatio = calculateLTVCACRatio;
