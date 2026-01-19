/**
 * Shared margin and color utility functions
 * Used across PricingCalculator, TierConfigurator, and FeatureInventory components
 */

// ============================================================================
// Margin Status Types
// ============================================================================

export type MarginHealth = 'healthy' | 'acceptable' | 'low';

export interface MarginColors {
  text: string;
  bg: string;
  border: string;
  icon: string;
}

// ============================================================================
// Gross Margin Utilities (used in PricingCalculator)
// Thresholds: >= 70% healthy, >= 50% acceptable, < 50% low
// ============================================================================

/**
 * Get margin health status based on gross margin percentage
 * SaaS industry standards: >= 70% is healthy, >= 50% is acceptable, < 50% is low
 */
export function getGrossMarginHealth(margin: number): MarginHealth {
  if (margin >= 70) return 'healthy';
  if (margin >= 50) return 'acceptable';
  return 'low';
}

/**
 * Get text color class for gross margin display
 */
export function getGrossMarginTextColor(margin: number): string {
  if (margin >= 70) return 'text-emerald-600';
  if (margin >= 50) return 'text-amber-600';
  return 'text-red-600';
}

/**
 * Get background color class for gross margin display
 */
export function getGrossMarginBgColor(margin: number): string {
  if (margin >= 70) return 'bg-emerald-50';
  if (margin >= 50) return 'bg-amber-50';
  return 'bg-red-50';
}

/**
 * Get border color class for gross margin display
 */
export function getGrossMarginBorderColor(margin: number): string {
  if (margin >= 70) return 'border-l-emerald-500';
  if (margin >= 50) return 'border-l-amber-500';
  return 'border-l-red-500';
}

/**
 * Get all margin colors in one call (for efficiency)
 */
export function getGrossMarginColors(margin: number): MarginColors {
  if (margin >= 70) {
    return {
      text: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-l-emerald-500',
      icon: 'text-emerald-600',
    };
  }
  if (margin >= 50) {
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
// Operating Margin Utilities (used in PricingCalculator)
// Thresholds: >= 20% healthy, >= 0% acceptable, < 0% loss
// ============================================================================

/**
 * Get operating margin health status
 */
export function getOperatingMarginHealth(margin: number): MarginHealth {
  if (margin >= 20) return 'healthy';
  if (margin >= 0) return 'acceptable';
  return 'low';
}

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
// Tier Margin Utilities (used in TierConfigurator)
// Thresholds: >= 65% healthy, >= 50% acceptable, < 50% low
// ============================================================================

/**
 * Get tier margin health status
 * Tier margins are slightly lower threshold than gross margins
 */
export function getTierMarginHealth(margin: number): MarginHealth {
  if (margin >= 65) return 'healthy';
  if (margin >= 50) return 'acceptable';
  return 'low';
}

/**
 * Get text color class for tier margin display
 */
export function getTierMarginTextColor(margin: number): string {
  if (margin >= 65) return 'text-emerald-600';
  if (margin >= 50) return 'text-amber-600';
  return 'text-red-600';
}

/**
 * Get background color class for tier margin display
 */
export function getTierMarginBgColor(margin: number): string {
  if (margin >= 65) return 'bg-emerald-50';
  if (margin >= 50) return 'bg-amber-50';
  return 'bg-red-50';
}

// ============================================================================
// Complexity Color Utilities (used in FeatureInventory)
// ============================================================================

export type Complexity = 'low' | 'medium' | 'high';

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
// Status Badge Utilities (used across components)
// ============================================================================

export type TierStatus = 'active' | 'coming_soon' | 'internal';

/**
 * Get badge classes for tier status
 */
export function getTierStatusBadgeClass(status: TierStatus): string {
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
export function getTierStatusLabel(status: TierStatus): string {
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
// Profit/Loss Color Utilities
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
// Price Sensitivity Utilities (used in PricingCalculator)
// ============================================================================

/**
 * Get status badge class for price sensitivity table
 */
export function getPriceSensitivityStatusClass(grossMargin: number): string {
  if (grossMargin >= 70) return 'bg-emerald-50 text-emerald-600';
  if (grossMargin >= 50) return 'bg-amber-50 text-amber-600';
  return 'bg-red-50 text-red-600';
}

/**
 * Get status label for price sensitivity table
 */
export function getPriceSensitivityStatusLabel(grossMargin: number): string {
  if (grossMargin >= 70) return 'Healthy';
  if (grossMargin >= 50) return 'OK';
  return 'Low';
}
