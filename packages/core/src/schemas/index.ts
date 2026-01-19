/**
 * Zod schemas for runtime validation
 * All schemas are framework-agnostic
 */

import { z } from 'zod';

// ============================================================================
// Cost Schemas
// ============================================================================

export const VariableCostItemSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
  unit: z.string().min(1, 'Unit is required'),
  costPerUnit: z.number().nonnegative('Cost per unit must be non-negative'),
  usagePerCustomer: z.number().nonnegative('Usage per customer must be non-negative'),
  description: z.string(),
});

export const FixedCostItemSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
  monthlyCost: z.number().nonnegative('Monthly cost must be non-negative'),
  description: z.string(),
});

export const CostBreakdownSchema = z.object({
  variableTotal: z.number().nonnegative(),
  fixedTotal: z.number().nonnegative(),
  fixedPerCustomer: z.number().nonnegative(),
  totalCOGS: z.number().nonnegative(),
});

// ============================================================================
// Margin Schemas
// ============================================================================

export const MarginStatusSchema = z.enum(['great', 'ok', 'low']);

export const MarginInfoSchema = z.object({
  margin: z.number(),
  profit: z.number(),
  status: MarginStatusSchema,
});

// ============================================================================
// Tier Schemas
// ============================================================================

export const TierStatusSchema = z.enum(['active', 'coming_soon', 'internal']);

export const TierLimitSchema = z.object({
  featureId: z.string(),
  limit: z.union([z.number(), z.literal('unlimited')]),
  unit: z.string().optional(),
});

export const TierSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  monthlyPriceMYR: z.number().nonnegative(),
  annualPriceMYR: z.number().nonnegative().optional(),
  description: z.string().optional(),
  features: z.array(z.string()),
  limits: z.array(TierLimitSchema),
  status: TierStatusSchema,
  isHighlighted: z.boolean().optional(),
  ctaText: z.string().optional(),
});

// ============================================================================
// Feature Schemas
// ============================================================================

export const FeatureComplexitySchema = z.enum(['low', 'medium', 'high']);

export const FeatureSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
  complexity: FeatureComplexitySchema,
  hasLimit: z.boolean(),
  costDriver: z.string().optional(),
  valueProposition: z.string().optional(),
  source: z.enum(['detected', 'manual']).optional(),
});

// ============================================================================
// Business Type & Pricing Model Schemas
// ============================================================================

export const BusinessTypeSchema = z.enum([
  'api_service',
  'marketplace',
  'fintech',
  'ai_ml_saas',
  'developer_tools',
  'b2b_saas',
  'consumer_saas',
  'generic',
]);

export const PricingModelTypeSchema = z.enum([
  'usage_based',
  'seat_based',
  'feature_tiered',
  'take_rate',
  'hybrid',
  'freemium',
]);

// ============================================================================
// AI Provider Schemas
// ============================================================================

export const AIProviderSchema = z.enum([
  'openai',
  'anthropic',
  'openrouter',
  'minimax',
  'glm',
  'groq',
]);

// ============================================================================
// Currency Schemas
// ============================================================================

export const CurrencyCodeSchema = z.enum(['MYR', 'USD', 'SGD', 'EUR', 'GBP', 'AUD']);

export const CurrencySchema = z.object({
  code: z.string(),
  symbol: z.string(),
  name: z.string(),
  rate: z.number().positive(),
  position: z.enum(['before', 'after']),
  decimalPlaces: z.number().int().nonnegative(),
  thousandsSeparator: z.string(),
  decimalSeparator: z.string(),
});

// ============================================================================
// Report Schemas
// ============================================================================

export const StakeholderTypeSchema = z.enum(['investor', 'accountant', 'engineer', 'marketer']);

export const ReportDataSchema = z.object({
  projectName: z.string().min(1),
  createdAt: z.string(),
  businessType: BusinessTypeSchema.optional(),
  pricingModel: PricingModelTypeSchema.optional(),
  costs: z.object({
    variable: z.array(VariableCostItemSchema),
    fixed: z.array(FixedCostItemSchema),
  }),
  tiers: z.array(TierSchema),
  features: z.array(FeatureSchema),
  metrics: z.object({
    mrr: z.number().optional(),
    arr: z.number().optional(),
    paidCustomers: z.number().optional(),
    arpu: z.number().optional(),
  }).optional(),
  notes: z.record(StakeholderTypeSchema, z.string()).optional(),
});

// ============================================================================
// Collection Schemas
// ============================================================================

export const VariableCostItemsSchema = z.array(VariableCostItemSchema);
export const FixedCostItemsSchema = z.array(FixedCostItemSchema);
export const TiersSchema = z.array(TierSchema);
export const FeaturesSchema = z.array(FeatureSchema);

// ============================================================================
// Validation Helpers
// ============================================================================

export type ValidationResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

/**
 * Validate data against a schema and return a typed result
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.issues[0]?.message ?? 'Invalid data' };
}

/**
 * Validate a variable cost item
 */
export function validateVariableCostItem(data: unknown) {
  return validate(VariableCostItemSchema, data);
}

/**
 * Validate a fixed cost item
 */
export function validateFixedCostItem(data: unknown) {
  return validate(FixedCostItemSchema, data);
}

/**
 * Validate a tier
 */
export function validateTier(data: unknown) {
  return validate(TierSchema, data);
}

/**
 * Validate a feature
 */
export function validateFeature(data: unknown) {
  return validate(FeatureSchema, data);
}

/**
 * Validate report data
 */
export function validateReportData(data: unknown) {
  return validate(ReportDataSchema, data);
}
