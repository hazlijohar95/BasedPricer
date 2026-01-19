/**
 * Calculator exports
 * Re-exports all calculator functions
 */

// COGS Calculator
export {
  roundCurrency,
  roundCustomers,
  roundPercentage,
  calculateItemCostPerCustomer,
  calculateVariableCosts,
  calculateTotalVariableCosts,
  calculateTotalFixedCosts,
  calculateFixedCostPerCustomer,
  calculateCOGSBreakdown,
  calculateTotalCOGS,
  calculateCOGSPerCustomer,
  calculateMRR,
  calculateTotalVariableCostsForDistribution,
  calculateBreakEvenCustomers,
  calculateMonthlyProfit,
} from './cogs';

// Margin Calculator
export {
  calculateGrossMargin,
  calculateProfit,
  calculateOperatingMargin,
  calculateTierMargin,
  getMarginStatus,
  getMarginHealth,
  getGrossMarginHealth,
  getOperatingMarginHealth,
  getTierMarginHealth,
  getMarginInfo,
  calculateMarginBreakdown,
  comparePricePoints,
  findMinimumPriceForMargin,
  isMarginHealthy,
  isMarginAcceptable,
} from './margin';

// Investor Metrics Calculator
export {
  calculateValuation,
  calculateARR,
  calculateMRRFromCustomers,
  calculateLTV,
  calculateLTVFromChurn,
  calculateLTVCACRatio,
  getLTVCACHealth,
  calculatePaybackPeriod,
  getPaybackHealth,
  calculateMilestones,
  calculateMonthsToTarget,
  calculateBreakEvenTimeline,
  calculateInvestorMetrics,
  formatCurrencyCompact,
  formatValuationRange,
} from './investor-metrics';

// AI Cost Calculator
export {
  calculateTokenCost,
  calculateCostForTokens,
  estimateAnalysisCost,
  estimateTokensFromText,
  estimateTokensFromChars,
  compareProviderCosts,
  formatCost,
  formatTokens,
  getCostCategory,
  calculateMonthlyAICostPerCustomer,
} from './ai-cost';

export type {
  TokenUsage,
  AICostBreakdown,
  CostEstimate,
  ProviderComparison,
} from './ai-cost';
