/**
 * Zod schemas for report data structures
 * Provides runtime validation for shareable report data
 */

import { z } from 'zod';
import { VariableCostItemsSchema, FixedCostItemsSchema } from './costs';
import { TiersSchema, TierDisplayConfigsSchema, CtaStyleSchema } from './tiers';
import { FeaturesSchema, FeatureCategorySchema } from './features';

// ============================================================================
// Business Type Schema
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
export type BusinessType = z.infer<typeof BusinessTypeSchema>;

// ============================================================================
// Pricing Model Type Schema
// ============================================================================

export const PricingModelTypeSchema = z.enum([
  'usage_based',
  'seat_based',
  'feature_tiered',
  'take_rate',
  'hybrid',
  'freemium',
]);
export type PricingModelType = z.infer<typeof PricingModelTypeSchema>;

// ============================================================================
// Pricing State Schema (minimal validation for flexibility)
// ============================================================================

export const PricingStateSchema = z.object({
  // Cost data
  variableCosts: VariableCostItemsSchema,
  fixedCosts: FixedCostItemsSchema,

  // Pricing settings
  customerCount: z.number().int().positive(),
  selectedPrice: z.number().nonnegative(),

  // Tier data
  tiers: TiersSchema,

  // Feature data
  features: FeaturesSchema,

  // Tier display configs
  tierDisplayConfigs: TierDisplayConfigsSchema,

  // Scenario settings
  utilizationRate: z.number().min(0).max(1),
  tierDistribution: z.record(z.string(), z.number().nonnegative()),

  // Business type
  businessType: BusinessTypeSchema.nullable(),
  businessTypeConfidence: z.number().min(0).max(1),
  pricingModelType: PricingModelTypeSchema,
});

export type PricingState = z.infer<typeof PricingStateSchema>;

// ============================================================================
// Report Notes Schema
// ============================================================================

export const ReportNotesSchema = z.object({
  accountant: z.string().optional(),
  investor: z.string().optional(),
  engineer: z.string().optional(),
  marketer: z.string().optional(),
});

export type ReportNotes = z.infer<typeof ReportNotesSchema>;

// ============================================================================
// Report Data Schema
// ============================================================================

export const ReportDataSchema = z.object({
  projectName: z.string().min(1, 'Project name is required'),
  createdAt: z.string(),
  state: PricingStateSchema,
  notes: ReportNotesSchema,
  selectedMockup: z.string().optional(),
});

export type ReportData = z.infer<typeof ReportDataSchema>;

// ============================================================================
// Stakeholder Type Schema
// ============================================================================

export const StakeholderTypeSchema = z.enum(['accountant', 'investor', 'engineer', 'marketer']);
export type StakeholderType = z.infer<typeof StakeholderTypeSchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate report data with detailed error information
 */
export function validateReportData(data: unknown): {
  success: boolean;
  data?: ReportData;
  error?: string;
  errors?: z.ZodError;
} {
  const result = ReportDataSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.issues[0]?.message ?? 'Invalid report data',
    errors: result.error,
  };
}

/**
 * Validate pricing state
 */
export function validatePricingState(data: unknown): {
  success: boolean;
  data?: PricingState;
  error?: string;
} {
  const result = PricingStateSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.issues[0]?.message ?? 'Invalid pricing state' };
}

/**
 * Check if report data is valid (simple boolean check)
 */
export function isValidReportData(data: unknown): data is ReportData {
  return ReportDataSchema.safeParse(data).success;
}

/**
 * Validate and sanitize report data with defaults for missing optional fields
 */
export function parseReportDataSafe(data: unknown): ReportData | null {
  try {
    // Try strict parsing first
    const result = ReportDataSchema.safeParse(data);
    if (result.success) {
      return result.data;
    }

    // If strict parsing fails, try with partial defaults
    // This handles legacy data that might be missing some fields
    if (data && typeof data === 'object') {
      const partial = data as Record<string, unknown>;

      // Ensure required fields exist
      if (!partial.projectName || !partial.state) {
        return null;
      }

      // Return with defaults for optional fields
      return {
        projectName: String(partial.projectName),
        createdAt: String(partial.createdAt ?? new Date().toISOString()),
        state: partial.state as PricingState,
        notes: (partial.notes as ReportNotes) ?? {},
        selectedMockup: partial.selectedMockup as string | undefined,
      };
    }

    return null;
  } catch {
    return null;
  }
}

// Re-export related schemas for convenience
export { CtaStyleSchema, FeatureCategorySchema };
