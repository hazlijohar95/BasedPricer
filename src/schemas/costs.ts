/**
 * Zod schemas for cost-related data structures
 * Provides runtime validation for variable and fixed cost items
 */

import { z } from 'zod';

// ============================================================================
// Variable Cost Item Schema
// ============================================================================

export const VariableCostItemSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
  unit: z.string().min(1, 'Unit is required'),
  costPerUnit: z.number().nonnegative('Cost per unit must be non-negative'),
  usagePerCustomer: z.number().nonnegative('Usage per customer must be non-negative'),
  description: z.string(),
});

export type VariableCostItem = z.infer<typeof VariableCostItemSchema>;

// ============================================================================
// Fixed Cost Item Schema
// ============================================================================

export const FixedCostItemSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
  monthlyCost: z.number().nonnegative('Monthly cost must be non-negative'),
  description: z.string(),
});

export type FixedCostItem = z.infer<typeof FixedCostItemSchema>;

// ============================================================================
// Cost Breakdown Schema
// ============================================================================

export const CostBreakdownSchema = z.object({
  variableTotal: z.number().nonnegative(),
  fixedTotal: z.number().nonnegative(),
  fixedPerCustomer: z.number().nonnegative(),
  totalCOGS: z.number().nonnegative(),
});

export type CostBreakdown = z.infer<typeof CostBreakdownSchema>;

// ============================================================================
// Margin Info Schema
// ============================================================================

export const MarginStatusSchema = z.enum(['great', 'ok', 'low']);
export type MarginStatus = z.infer<typeof MarginStatusSchema>;

export const MarginInfoSchema = z.object({
  margin: z.number(),
  profit: z.number(),
  status: MarginStatusSchema,
});

export type MarginInfo = z.infer<typeof MarginInfoSchema>;

// ============================================================================
// Collection Schemas
// ============================================================================

export const VariableCostItemsSchema = z.array(VariableCostItemSchema);
export const FixedCostItemsSchema = z.array(FixedCostItemSchema);

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate a variable cost item, returning a result object
 */
export function validateVariableCostItem(data: unknown): {
  success: boolean;
  data?: VariableCostItem;
  error?: string;
} {
  const result = VariableCostItemSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.issues[0]?.message ?? 'Invalid data' };
}

/**
 * Validate a fixed cost item, returning a result object
 */
export function validateFixedCostItem(data: unknown): {
  success: boolean;
  data?: FixedCostItem;
  error?: string;
} {
  const result = FixedCostItemSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.issues[0]?.message ?? 'Invalid data' };
}

/**
 * Validate an array of variable cost items
 */
export function validateVariableCostItems(data: unknown): {
  success: boolean;
  data?: VariableCostItem[];
  error?: string;
} {
  const result = VariableCostItemsSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.issues[0]?.message ?? 'Invalid data' };
}

/**
 * Validate an array of fixed cost items
 */
export function validateFixedCostItems(data: unknown): {
  success: boolean;
  data?: FixedCostItem[];
  error?: string;
} {
  const result = FixedCostItemsSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.issues[0]?.message ?? 'Invalid data' };
}
