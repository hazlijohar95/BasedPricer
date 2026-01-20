/**
 * Margin and Color Utility Functions
 *
 * This module provides web-specific UI styling utilities for margin displays.
 * Core calculation logic and types are imported from @basedpricer/core.
 *
 * Used across PricingCalculator, TierConfigurator, and FeatureInventory components.
 */

import { MARGIN_THRESHOLDS } from '../constants';

// ============================================================================
// Re-export types and functions from core
// ============================================================================

export type {
  MarginHealth,
  TierStatus,
  FeatureComplexity,
} from '@basedpricer/core';

// Re-export health check functions from core (single source of truth)
export {
  getGrossMarginHealth,
  getOperatingMarginHealth,
  getTierMarginHealth,
} from '@basedpricer/core';

// Backward compatibility: Complexity is now FeatureComplexity in core
export type Complexity = 'low' | 'medium' | 'high';

// ============================================================================
// Margin Color Types (Web-specific)
// ============================================================================

export interface MarginColors {
  text: string;
  bg: string;
  border: string;
  icon: string;
}

// ============================================================================
// Gross Margin Color Utilities (Web-specific UI)
// ============================================================================

/**
 * Get text color class for gross margin display
 */
export function getGrossMarginTextColor(margin: number): string {
  if (margin >= MARGIN_THRESHOLDS.HEALTHY) return 'text-emerald-600';
  if (margin >= MARGIN_THRESHOLDS.ACCEPTABLE) return 'text-amber-600';
  return 'text-red-600';
}

/**
 * Get background color class for gross margin display
 */
export function getGrossMarginBgColor(margin: number): string {
  if (margin >= MARGIN_THRESHOLDS.HEALTHY) return 'bg-emerald-50';
  if (margin >= MARGIN_THRESHOLDS.ACCEPTABLE) return 'bg-amber-50';
  return 'bg-red-50';
}

/**
 * Get border color class for gross margin display
 */
export function getGrossMarginBorderColor(margin: number): string {
  if (margin >= MARGIN_THRESHOLDS.HEALTHY) return 'border-l-emerald-500';
  if (margin >= MARGIN_THRESHOLDS.ACCEPTABLE) return 'border-l-amber-500';
  return 'border-l-red-500';
}

/**
 * Get all margin colors in one call (for efficiency)
 */
export function getGrossMarginColors(margin: number): MarginColors {
  if (margin >= MARGIN_THRESHOLDS.HEALTHY) {
    return {
      text: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-l-emerald-500',
      icon: 'text-emerald-600',
    };
  }
  if (margin >= MARGIN_THRESHOLDS.ACCEPTABLE) {
    return {
      text: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-l-amber-500',
      icon: 'text-amber-600',
    };
  }
  return {
    text: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-l-red-500',
    icon: 'text-red-600',
  };
}

// ============================================================================
// Operating Margin Color Utilities (Web-specific UI)
// Thresholds: >= 20% healthy, >= 0% acceptable, < 0% loss
// ============================================================================

/**
 * Get text color class for operating margin display
 */
export function getOperatingMarginTextColor(margin: number): string {
  if (margin >= 20) return 'text-emerald-600';
  if (margin >= 0) return 'text-amber-600';
  return 'text-red-600';
}

/**
 * Get background color class for operating margin display
 */
export function getOperatingMarginBgColor(margin: number): string {
  if (margin >= 20) return 'bg-emerald-50';
  if (margin >= 0) return 'bg-amber-50';
  return 'bg-red-50';
}

/**
 * Get border color class for operating margin display
 */
export function getOperatingMarginBorderColor(margin: number): string {
  if (margin >= 20) return 'border-l-emerald-500';
  if (margin >= 0) return 'border-l-amber-500';
  return 'border-l-red-500';
}

// ============================================================================
// Tier Margin Color Utilities (Web-specific UI)
// ============================================================================

/**
 * Get text color class for tier margin display
 */
export function getTierMarginTextColor(margin: number): string {
  if (margin >= MARGIN_THRESHOLDS.HEALTHY) return 'text-emerald-600';
  if (margin >= MARGIN_THRESHOLDS.ACCEPTABLE) return 'text-amber-600';
  return 'text-red-600';
}

/**
 * Get background color class for tier margin display
 */
export function getTierMarginBgColor(margin: number): string {
  if (margin >= MARGIN_THRESHOLDS.HEALTHY) return 'bg-emerald-50';
  if (margin >= MARGIN_THRESHOLDS.ACCEPTABLE) return 'bg-amber-50';
  return 'bg-red-50';
}

// ============================================================================
// Complexity Color Utilities (Web-specific UI)
// ============================================================================

/**
 * Get text color class for complexity display
 */
export function getComplexityTextColor(complexity: Complexity): string {
  switch (complexity) {
    case 'high':
      return 'text-red-600';
    case 'medium':
      return 'text-amber-600';
    case 'low':
      return 'text-emerald-600';
  }
}

/**
 * Get background color class for complexity display
 */
export function getComplexityBgColor(complexity: Complexity): string {
  switch (complexity) {
    case 'high':
      return 'bg-red-50';
    case 'medium':
      return 'bg-amber-50';
    case 'low':
      return 'bg-emerald-50';
  }
}

/**
 * Get combined badge classes for complexity display
 */
export function getComplexityBadgeClass(complexity: Complexity): string {
  switch (complexity) {
    case 'high':
      return 'bg-red-50 text-red-600';
    case 'medium':
      return 'bg-amber-50 text-amber-600';
    case 'low':
      return 'bg-emerald-50 text-emerald-600';
  }
}

// ============================================================================
// Status Badge Utilities (Web-specific UI)
// ============================================================================

// Import TierStatus from core, but keep local type for backward compatibility
type LocalTierStatus = 'active' | 'coming_soon' | 'internal';

/**
 * Get badge classes for tier status
 */
export function getTierStatusBadgeClass(status: LocalTierStatus): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-50 text-emerald-600';
    case 'coming_soon':
      return 'bg-amber-50 text-amber-600';
    case 'internal':
      return 'bg-gray-100 text-gray-500';
  }
}

/**
 * Get display label for tier status
 */
export function getTierStatusLabel(status: LocalTierStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'coming_soon':
      return 'Soon';
    case 'internal':
      return 'Internal';
  }
}

// ============================================================================
// Profit/Loss Color Utilities (Web-specific UI)
// ============================================================================

/**
 * Get text color class for profit/loss display
 */
export function getProfitLossTextColor(value: number): string {
  return value >= 0 ? 'text-emerald-600' : 'text-red-600';
}

/**
 * Get background color class for profit/loss display
 */
export function getProfitLossBgColor(value: number): string {
  return value >= 0 ? 'bg-emerald-50' : 'bg-red-50';
}

// ============================================================================
// Price Sensitivity Utilities (Web-specific UI)
// ============================================================================

/**
 * Get status badge class for price sensitivity table
 */
export function getPriceSensitivityStatusClass(grossMargin: number): string {
  if (grossMargin >= MARGIN_THRESHOLDS.HEALTHY) return 'bg-emerald-50 text-emerald-600';
  if (grossMargin >= MARGIN_THRESHOLDS.ACCEPTABLE) return 'bg-amber-50 text-amber-600';
  return 'bg-red-50 text-red-600';
}

/**
 * Get status label for price sensitivity table
 */
export function getPriceSensitivityStatusLabel(grossMargin: number): string {
  if (grossMargin >= MARGIN_THRESHOLDS.HEALTHY) return 'Healthy';
  if (grossMargin >= MARGIN_THRESHOLDS.ACCEPTABLE) return 'OK';
  return 'Low';
}
