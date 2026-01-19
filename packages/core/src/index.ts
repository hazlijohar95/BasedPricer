/**
 * @basedpricer/core
 * Core business logic for BasedPricer
 *
 * This package provides framework-agnostic utilities for:
 * - COGS (Cost of Goods Sold) calculations
 * - Margin analysis
 * - Investor metrics (LTV, CAC, ARR)
 * - AI cost estimation
 * - Currency formatting and conversion
 */

// ============================================================================
// Types
// ============================================================================

export type {
  // Costs
  VariableCostItem,
  FixedCostItem,
  CostBreakdown,

  // Margins
  MarginStatus,
  MarginHealth,
  MarginInfo,
  MarginThresholds,

  // Currency
  Currency,
  CurrencyCode,

  // Tiers
  TierStatus,
  TierLimit,
  Tier,
  TierDisplayConfig,

  // Features
  FeatureComplexity,
  Feature,

  // Business Types
  BusinessType,
  PricingModelType,

  // AI
  AIProvider,
  AIModelPricing,
  ProviderPricing,

  // Analysis
  TechStack,
  CodebaseAnalysis,

  // Investor Metrics
  ValuationProjection,
  MilestoneTarget,
  InvestorMetrics,

  // Reports
  StakeholderType,
  ReportData,

  // Cost Drivers
  CostDriverConfig,
} from './types';

// ============================================================================
// Schemas (Zod)
// ============================================================================

export {
  // Cost schemas
  VariableCostItemSchema,
  FixedCostItemSchema,
  CostBreakdownSchema,

  // Margin schemas
  MarginStatusSchema,
  MarginInfoSchema,

  // Tier schemas
  TierStatusSchema,
  TierLimitSchema,
  TierSchema,

  // Feature schemas
  FeatureComplexitySchema,
  FeatureSchema,

  // Business type schemas
  BusinessTypeSchema,
  PricingModelTypeSchema,

  // AI schemas
  AIProviderSchema,

  // Currency schemas
  CurrencyCodeSchema,
  CurrencySchema,

  // Report schemas
  StakeholderTypeSchema,
  ReportDataSchema,

  // Collection schemas
  VariableCostItemsSchema,
  FixedCostItemsSchema,
  TiersSchema,
  FeaturesSchema,

  // Validation helpers
  validate,
  validateVariableCostItem,
  validateFixedCostItem,
  validateTier,
  validateFeature,
  validateReportData,
} from './schemas';

export type { ValidationResult } from './schemas';

// ============================================================================
// Data & Constants
// ============================================================================

export {
  // Thresholds
  MARGIN_THRESHOLDS,

  // Currency
  CURRENCIES,
  DEFAULT_CURRENCY,

  // Pricing defaults
  DEFAULT_PRICES,
  DISCOUNT_PRESETS,
  UNIT_COSTS,
  DEFAULT_USD_TO_MYR_RATE,

  // AI Pricing
  AI_PRICING,

  // Cost drivers
  COST_DRIVERS,
  getCostDriver,
  getAllCostDriverIds,
  costDriverExists,

  // Helpers
  getCurrency,
  getAIPricing,
  getPricingForModel,
  getAllAIModels,
} from './data';

// ============================================================================
// Calculators
// ============================================================================

export {
  // COGS Calculator
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

  // Margin Calculator
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

  // Investor Metrics Calculator
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

  // AI Cost Calculator
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
} from './calculators';

export type {
  TokenUsage,
  AICostBreakdown,
  CostEstimate,
  ProviderComparison,
} from './calculators';

// ============================================================================
// Utilities
// ============================================================================

export {
  // Currency formatting
  formatCurrency,
  convertCurrency,
  convertFromMYR,
  convertToMYR,

  // Validation
  isValidPositiveNumber,
  isValidNonNegativeNumber,
  clamp,
  roundToStep,

  // ID generation
  generateId,
  generateShortId,

  // Percentage utilities
  calculatePercentage,
  formatPercentage,
  applyDiscount,
  calculateAnnualPrice,
} from './utils';
