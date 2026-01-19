/**
 * Barrel export for all Zod schemas
 * Central export point for type definitions and validation utilities
 */

// ============================================================================
// Cost Schemas
// ============================================================================

export {
  VariableCostItemSchema,
  FixedCostItemSchema,
  CostBreakdownSchema,
  MarginStatusSchema,
  MarginInfoSchema,
  VariableCostItemsSchema,
  FixedCostItemsSchema,
  validateVariableCostItem,
  validateFixedCostItem,
  validateVariableCostItems,
  validateFixedCostItems,
  type VariableCostItem,
  type FixedCostItem,
  type CostBreakdown,
  type MarginStatus,
  type MarginInfo,
} from './costs';

// ============================================================================
// Tier Schemas
// ============================================================================

export {
  TierLimitValueSchema,
  TierLimitSchema,
  TierStatusSchema,
  TierSchema,
  CtaStyleSchema,
  TierDisplayConfigSchema,
  TiersSchema,
  TierDisplayConfigsSchema,
  validateTier,
  validateTiers,
  validateTierDisplayConfig,
  validateTierDisplayConfigs,
  type TierLimitValue,
  type TierLimit,
  type TierStatus,
  type Tier,
  type CtaStyle,
  type TierDisplayConfig,
} from './tiers';

// ============================================================================
// Feature Schemas
// ============================================================================

export {
  FeatureSourceSchema,
  FeaturePrioritySchema,
  FeatureComplexitySchema,
  FeatureCategorySchema,
  FeatureSchema,
  FeatureCategoryInfoSchema,
  BusinessTypeFeatureConfigSchema,
  FeaturesSchema,
  validateFeature,
  validateFeatures,
  isValidFeatureCategory,
  isValidFeatureSource,
  isValidFeatureComplexity,
  type FeatureSource,
  type FeaturePriority,
  type FeatureComplexity,
  type FeatureCategory,
  type Feature,
  type FeatureCategoryInfo,
  type BusinessTypeFeatureConfig,
} from './features';

// ============================================================================
// Report Schemas
// ============================================================================

export {
  BusinessTypeSchema,
  PricingModelTypeSchema,
  PricingStateSchema,
  ReportNotesSchema,
  ReportDataSchema,
  StakeholderTypeSchema,
  validateReportData,
  validatePricingState,
  isValidReportData,
  parseReportDataSafe,
  type BusinessType,
  type PricingModelType,
  type PricingState,
  type ReportNotes,
  type ReportData,
  type StakeholderType,
} from './reports';

// ============================================================================
// API Key Schemas
// ============================================================================

export {
  AIProviderSchema,
  StoredAPIKeySchema,
  APIKeyStorageSchema,
  ProviderInfoSchema,
  OpenAIKeySchema,
  AnthropicKeySchema,
  OpenRouterKeySchema,
  GroqKeySchema,
  MinimaxKeySchema,
  GLMKeySchema,
  GitHubTokenSchema,
  getKeySchemaForProvider,
  validateAPIKey,
  validateGitHubToken,
  validateStoredAPIKey,
  isValidAIProvider,
  getAllAIProviders,
  type AIProvider,
  type StoredAPIKey,
  type APIKeyStorage,
  type ProviderInfo,
} from './api-keys';
