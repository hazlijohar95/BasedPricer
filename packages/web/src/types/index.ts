/**
 * Centralized Type Definitions
 *
 * This module serves as the single source of truth for types in the web package.
 * It re-exports types from @basedpricer/core and web-specific schema files.
 *
 * Usage:
 * import type { VariableCostItem, Tier, Feature } from '../types';
 */

// ============================================================================
// Core Types (from @basedpricer/core)
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

  // Currency
  Currency,
  CurrencyCode,

  // AI
  AIProvider,

  // Business Types & Pricing Models
  BusinessType,
  PricingModelType,

  // Investor Metrics
  ValuationProjection,
  MilestoneTarget,
  InvestorMetrics,

  // Validation
  ValidationResult,
} from '@basedpricer/core';

// ============================================================================
// Web-Specific Types (from schemas)
// ============================================================================

// Tier types
export type {
  Tier,
  TierStatus,
  TierLimit,
  TierLimitValue,
  TierDisplayConfig,
  CtaStyle,
} from '../schemas/tiers';

// Feature types
export type {
  Feature,
  FeatureCategory,
  FeatureComplexity,
  FeatureSource,
  FeaturePriority,
  FeatureCategoryInfo,
  BusinessTypeFeatureConfig,
} from '../schemas/features';

// Report types
export type {
  ReportData,
  ReportNotes,
  ReportSettings,
  PricingState,
  StakeholderType,
} from '../schemas/reports';

// ============================================================================
// UI-Specific Types
// ============================================================================

export type { MarginColors } from '../utils/marginUtils';
