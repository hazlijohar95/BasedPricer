/**
 * Margin Calculator
 * Core calculations for gross margin, operating margin, and margin health status
 */

import type { MarginStatus, MarginHealth, MarginInfo } from '../types';
import { MARGIN_THRESHOLDS, OPERATING_MARGIN_THRESHOLDS } from '../data';

// ============================================================================
// Margin Calculations
// ============================================================================

/**
 * Calculate gross margin percentage
 * Margin = (Price - COGS) / Price * 100
 */
export function calculateGrossMargin(price: number, cogs: number): number {
  if (price <= 0) return 0;
  return ((price - cogs) / price) * 100;
}

/**
 * Calculate profit per customer
 */
export function calculateProfit(price: number, cogs: number): number {
  return price - cogs;
}

/**
 * Calculate operating margin
 * Operating Margin = (Revenue - COGS - Operating Expenses) / Revenue * 100
 */
export function calculateOperatingMargin(
  revenue: number,
  cogs: number,
  operatingExpenses: number
): number {
  if (revenue <= 0) return 0;
  return ((revenue - cogs - operatingExpenses) / revenue) * 100;
}

/**
 * Calculate tier margin
 * Same formula as gross margin but named for tier context
 */
export function calculateTierMargin(tierPrice: number, tierCogs: number): number {
  return calculateGrossMargin(tierPrice, tierCogs);
}

// ============================================================================
// Margin Status Functions
// ============================================================================

/**
 * Get margin status based on centralized thresholds
 * >= HEALTHY (70%) = great
 * >= ACCEPTABLE (50%) = ok
 * < ACCEPTABLE (50%) = low
 */
export function getMarginStatus(margin: number): MarginStatus {
  if (margin >= MARGIN_THRESHOLDS.HEALTHY) return 'great';
  if (margin >= MARGIN_THRESHOLDS.ACCEPTABLE) return 'ok';
  return 'low';
}

/**
 * Get margin health using more descriptive terms
 */
export function getMarginHealth(margin: number): MarginHealth {
  if (margin >= MARGIN_THRESHOLDS.HEALTHY) return 'healthy';
  if (margin >= MARGIN_THRESHOLDS.ACCEPTABLE) return 'acceptable';
  return 'low';
}

/**
 * Get gross margin health status (alias for consistency)
 */
export function getGrossMarginHealth(margin: number): MarginHealth {
  return getMarginHealth(margin);
}

/**
 * Get operating margin health status
 * Uses different thresholds: >= 20% healthy, >= 0% acceptable, < 0% low
 */
export function getOperatingMarginHealth(margin: number): MarginHealth {
  if (margin >= OPERATING_MARGIN_THRESHOLDS.HEALTHY) return 'healthy';
  if (margin >= OPERATING_MARGIN_THRESHOLDS.ACCEPTABLE) return 'acceptable';
  return 'low';
}

/**
 * Get tier margin health (same as gross margin)
 */
export function getTierMarginHealth(margin: number): MarginHealth {
  return getMarginHealth(margin);
}

// ============================================================================
// Combined Margin Info
// ============================================================================

/**
 * Get complete margin information for a price point
 */
export function getMarginInfo(price: number, cogs: number): MarginInfo {
  const margin = calculateGrossMargin(price, cogs);
  const profit = calculateProfit(price, cogs);
  const status = getMarginStatus(margin);

  return { margin, profit, status };
}

/**
 * Calculate margin info with full breakdown
 */
export function calculateMarginBreakdown(params: {
  price: number;
  variableCostPerCustomer: number;
  fixedCostPerCustomer: number;
}): {
  grossMargin: number;
  grossMarginHealth: MarginHealth;
  profit: number;
  cogs: number;
} {
  const { price, variableCostPerCustomer, fixedCostPerCustomer } = params;
  const cogs = variableCostPerCustomer + fixedCostPerCustomer;
  const grossMargin = calculateGrossMargin(price, cogs);
  const profit = calculateProfit(price, cogs);

  return {
    grossMargin,
    grossMarginHealth: getMarginHealth(grossMargin),
    profit,
    cogs,
  };
}

// ============================================================================
// Margin Comparison
// ============================================================================

/**
 * Compare margins across different price points
 */
export function comparePricePoints(
  pricePoints: number[],
  cogs: number
): Array<{
  price: number;
  margin: number;
  profit: number;
  status: MarginStatus;
}> {
  return pricePoints.map((price) => ({
    price,
    margin: calculateGrossMargin(price, cogs),
    profit: calculateProfit(price, cogs),
    status: getMarginStatus(calculateGrossMargin(price, cogs)),
  }));
}

/**
 * Find minimum price for target margin
 */
export function findMinimumPriceForMargin(
  cogs: number,
  targetMargin: number
): number {
  // margin = (price - cogs) / price * 100
  // margin * price / 100 = price - cogs
  // margin * price / 100 - price = -cogs
  // price * (margin / 100 - 1) = -cogs
  // price = cogs / (1 - margin / 100)
  if (targetMargin >= 100) return Infinity;
  return cogs / (1 - targetMargin / 100);
}

/**
 * Check if margin is healthy
 */
export function isMarginHealthy(margin: number): boolean {
  return margin >= MARGIN_THRESHOLDS.HEALTHY;
}

/**
 * Check if margin is acceptable
 */
export function isMarginAcceptable(margin: number): boolean {
  return margin >= MARGIN_THRESHOLDS.ACCEPTABLE;
}
