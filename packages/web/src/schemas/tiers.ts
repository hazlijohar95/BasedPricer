/**
 * Zod schemas for tier-related data structures
 * Provides runtime validation for pricing tiers and tier configurations
 */

import { z } from 'zod';

// ============================================================================
// Tier Limit Schema
// ============================================================================

export const TierLimitValueSchema = z.union([
  z.number(),
  z.literal('unlimited'),
  z.boolean(),
]);

export type TierLimitValue = z.infer<typeof TierLimitValueSchema>;

export const TierLimitSchema = z.object({
  featureId: z.string().min(1, 'Feature ID is required'),
  limit: TierLimitValueSchema,
  unit: z.string().optional(),
});

export type TierLimit = z.infer<typeof TierLimitSchema>;

// ============================================================================
// Tier Status Schema
// ============================================================================

export const TierStatusSchema = z.enum(['active', 'coming_soon', 'internal']);
export type TierStatus = z.infer<typeof TierStatusSchema>;

// ============================================================================
// Tier Schema
// ============================================================================

export const TierSchema = z.object({
  id: z.string().min(1, 'Tier ID is required'),
  name: z.string().min(1, 'Tier name is required'),
  tagline: z.string(),
  monthlyPriceMYR: z.number().nonnegative('Monthly price must be non-negative'),
  annualPriceMYR: z.number().nonnegative('Annual price must be non-negative'),
  annualDiscount: z.number().min(0).max(100, 'Discount must be between 0 and 100'),
  status: TierStatusSchema,
  targetAudience: z.string(),
  limits: z.array(TierLimitSchema),
  includedFeatures: z.array(z.string()),
  excludedFeatures: z.array(z.string()),
  highlightFeatures: z.array(z.string()),
});

export type Tier = z.infer<typeof TierSchema>;

// ============================================================================
// Tier Display Config Schema
// ============================================================================

export const CtaStyleSchema = z.enum(['primary', 'secondary', 'outline']);
export type CtaStyle = z.infer<typeof CtaStyleSchema>;

export const TierDisplayConfigSchema = z.object({
  highlighted: z.boolean(),
  highlightedFeatures: z.array(z.string()),
  ctaText: z.string(),
  ctaStyle: CtaStyleSchema,
  badgeText: z.string(),
  showLimits: z.boolean(),
  maxVisibleFeatures: z.number().int().positive(),
  monthlyPrice: z.number().nonnegative(),
  annualPrice: z.number().nonnegative(),
  tagline: z.string(),
});

export type TierDisplayConfig = z.infer<typeof TierDisplayConfigSchema>;

// ============================================================================
// Collection Schemas
// ============================================================================

export const TiersSchema = z.array(TierSchema);
export const TierDisplayConfigsSchema = z.record(z.string(), TierDisplayConfigSchema);

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate a single tier
 */
export function validateTier(data: unknown): {
  success: boolean;
  data?: Tier;
  error?: string;
} {
  const result = TierSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.issues[0]?.message ?? 'Invalid tier data' };
}

/**
 * Validate an array of tiers
 */
export function validateTiers(data: unknown): {
  success: boolean;
  data?: Tier[];
  error?: string;
} {
  const result = TiersSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.issues[0]?.message ?? 'Invalid tiers data' };
}

/**
 * Validate tier display config
 */
export function validateTierDisplayConfig(data: unknown): {
  success: boolean;
  data?: TierDisplayConfig;
  error?: string;
} {
  const result = TierDisplayConfigSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.issues[0]?.message ?? 'Invalid display config' };
}

/**
 * Validate tier display configs map
 */
export function validateTierDisplayConfigs(data: unknown): {
  success: boolean;
  data?: Record<string, TierDisplayConfig>;
  error?: string;
} {
  const result = TierDisplayConfigsSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.issues[0]?.message ?? 'Invalid display configs' };
}
