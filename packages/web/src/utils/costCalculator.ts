// Unified cost calculation utilities
// Single source of truth for all COGS, margin, and pricing calculations

import {
  getMarginStatusFromThreshold,
  getMarginStyleFromThreshold,
} from '../constants';

// Import and re-export types from core for consistency
import type {
  VariableCostItem as CoreVariableCostItem,
  FixedCostItem as CoreFixedCostItem,
  CostBreakdown as CoreCostBreakdown,
  MarginStatus,
} from '@basedpricer/core';

// Re-export core types for backwards compatibility
export type VariableCostItem = CoreVariableCostItem;
export type FixedCostItem = CoreFixedCostItem;
export type CostBreakdown = CoreCostBreakdown;

// ============================================================================
// Rounding Utilities
// ============================================================================

/**
 * Round to specified decimal places (default: 2 for currency)
 * Uses banker's rounding (round half to even) for financial calculations
 */
export function roundCurrency(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Format currency for display with proper rounding
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  return roundCurrency(value, decimals).toFixed(decimals);
}

/**
 * Round customer count up (always ceiling for capacity planning)
 */
export function roundCustomers(value: number): number {
  return Math.ceil(value);
}

/**
 * Round percentage for display (default: 1 decimal)
 */
export function roundPercentage(value: number, decimals: number = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// ============================================================================
// Types
// ============================================================================

// MarginInfo type using core's MarginStatus
export interface MarginInfo {
  margin: number;
  profit: number;
  status: MarginStatus;
}

/**
 * Calculate total variable costs per customer
 */
export function calculateVariableCosts(
  costs: VariableCostItem[],
  utilizationRate: number = 1
): number {
  return costs.reduce(
    (sum, item) => sum + item.costPerUnit * item.usagePerCustomer * utilizationRate,
    0
  );
}

/**
 * Calculate total fixed costs (monthly)
 */
export function calculateTotalFixedCosts(fixedCosts: FixedCostItem[]): number {
  return fixedCosts.reduce((sum, item) => sum + item.monthlyCost, 0);
}

/**
 * Calculate fixed cost per customer
 */
export function calculateFixedCostPerCustomer(
  fixedCosts: FixedCostItem[],
  customerCount: number
): number {
  if (customerCount <= 0) return 0;
  const total = calculateTotalFixedCosts(fixedCosts);
  return total / customerCount;
}

/**
 * Calculate complete COGS breakdown
 */
export function calculateCOGSBreakdown(
  variableCosts: VariableCostItem[],
  fixedCosts: FixedCostItem[],
  customerCount: number,
  utilizationRate: number = 1
): CostBreakdown {
  const variableTotal = calculateVariableCosts(variableCosts, utilizationRate);
  const fixedTotal = calculateTotalFixedCosts(fixedCosts);
  const fixedPerCustomer = customerCount > 0 ? fixedTotal / customerCount : 0;
  const totalCOGS = variableTotal + fixedPerCustomer;

  return {
    variableTotal,
    fixedTotal,
    fixedPerCustomer,
    totalCOGS,
  };
}

/**
 * Calculate total COGS per customer
 */
export function calculateTotalCOGS(
  variableCosts: VariableCostItem[],
  fixedCosts: FixedCostItem[],
  customerCount: number,
  utilizationRate: number = 1
): number {
  return calculateCOGSBreakdown(variableCosts, fixedCosts, customerCount, utilizationRate).totalCOGS;
}

/**
 * Calculate gross margin percentage
 * Margin = (Price - COGS) / Price * 100
 */
export function calculateMargin(price: number, cogs: number): number {
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
 * Get margin status based on centralized thresholds
 * >= HEALTHY (70%) = great (healthy SaaS margin)
 * >= ACCEPTABLE (50%) = ok (acceptable)
 * < ACCEPTABLE (50%) = low (concerning)
 */
export function getMarginStatus(margin: number): 'great' | 'ok' | 'low' {
  return getMarginStatusFromThreshold(margin);
}

/**
 * Get complete margin information for a price point
 */
export function getMarginInfo(price: number, cogs: number): MarginInfo {
  const margin = calculateMargin(price, cogs);
  const profit = calculateProfit(price, cogs);
  const status = getMarginStatus(margin);

  return { margin, profit, status };
}

/**
 * Calculate margin styling based on centralized thresholds
 */
export function getMarginStyle(margin: number): {
  dot: string;
  text: string;
  bg: string;
} {
  const style = getMarginStyleFromThreshold(margin);
  return { dot: style.dot, text: style.text, bg: style.bg };
}

/**
 * Calculate MRR (Monthly Recurring Revenue) for a tier distribution
 */
export function calculateMRR(
  tierPrices: Record<string, number>,
  tierDistribution: Record<string, number>
): number {
  return Object.entries(tierDistribution).reduce((total, [tierId, count]) => {
    const price = tierPrices[tierId] || 0;
    return total + price * count;
  }, 0);
}

/**
 * Calculate total variable costs across all customers
 */
export function calculateTotalVariableCostsForCustomers(
  variableCostPerCustomer: number,
  tierDistribution: Record<string, number>,
  utilizationRate: number = 1
): number {
  const totalCustomers = Object.values(tierDistribution).reduce((a, b) => a + b, 0);
  return variableCostPerCustomer * totalCustomers * utilizationRate;
}
