/**
 * Zod schemas for feature-related data structures
 * Provides runtime validation for features and feature configurations
 */

import { z } from 'zod';

// ============================================================================
// Validation Result Type (matches core's ValidationResult)
// ============================================================================

type ValidationResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

// ============================================================================
// Feature Source Schema
// ============================================================================

export const FeatureSourceSchema = z.enum(['codebase', 'manual']);
export type FeatureSource = z.infer<typeof FeatureSourceSchema>;

// ============================================================================
// Feature Priority Schema
// ============================================================================

export const FeaturePrioritySchema = z.enum(['critical', 'important', 'nice_to_have']);
export type FeaturePriority = z.infer<typeof FeaturePrioritySchema>;

// ============================================================================
// Feature Complexity Schema
// ============================================================================

export const FeatureComplexitySchema = z.enum(['low', 'medium', 'high']);
export type FeatureComplexity = z.infer<typeof FeatureComplexitySchema>;

// ============================================================================
// Feature Category Schema
// ============================================================================

export const FeatureCategorySchema = z.enum([
  'invoicing',
  'document_management',
  'ai_extraction',
  'accounting_ai',
  'email',
  'payments',
  'team',
  'reporting',
  'integrations',
  'support',
]);
export type FeatureCategory = z.infer<typeof FeatureCategorySchema>;

// ============================================================================
// Feature Schema
// ============================================================================

export const FeatureSchema = z.object({
  id: z.string().min(1, 'Feature ID is required'),
  name: z.string().min(1, 'Feature name is required'),
  description: z.string(),
  category: FeatureCategorySchema,
  complexity: FeatureComplexitySchema,
  hasLimit: z.boolean(),
  limitUnit: z.string().optional(),
  costDriver: z.string().optional(),
  valueProposition: z.string(),
  source: FeatureSourceSchema,
  sourceFile: z.string().optional(),
  createdAt: z.string().optional(),
});

export type Feature = z.infer<typeof FeatureSchema>;

// ============================================================================
// Feature Category Info Schema
// ============================================================================

export const FeatureCategoryInfoSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export type FeatureCategoryInfo = z.infer<typeof FeatureCategoryInfoSchema>;

// ============================================================================
// Business Type Feature Config Schema
// ============================================================================

export const BusinessTypeFeatureConfigSchema = z.object({
  relevantCategories: z.array(FeatureCategorySchema),
  criticalCategories: z.array(FeatureCategorySchema),
  suggestedFeatures: z.array(z.string()),
});

export type BusinessTypeFeatureConfig = z.infer<typeof BusinessTypeFeatureConfigSchema>;

// ============================================================================
// Collection Schemas
// ============================================================================

export const FeaturesSchema = z.array(FeatureSchema);

// ============================================================================
// Validation Helpers (standardized ValidationResult type)
// ============================================================================

/**
 * Validate a single feature
 */
export function validateFeature(data: unknown): ValidationResult<Feature> {
  const result = FeatureSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.issues[0]?.message ?? 'Invalid feature data' };
}

/**
 * Validate an array of features
 */
export function validateFeatures(data: unknown): ValidationResult<Feature[]> {
  const result = FeaturesSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.issues[0]?.message ?? 'Invalid features data' };
}

/**
 * Check if a category string is valid
 */
export function isValidFeatureCategory(category: string): category is FeatureCategory {
  return FeatureCategorySchema.safeParse(category).success;
}

/**
 * Check if a source string is valid
 */
export function isValidFeatureSource(source: string): source is FeatureSource {
  return FeatureSourceSchema.safeParse(source).success;
}

/**
 * Check if a complexity string is valid
 */
export function isValidFeatureComplexity(complexity: string): complexity is FeatureComplexity {
  return FeatureComplexitySchema.safeParse(complexity).success;
}
