/**
 * COGS (Cost of Goods Sold) Calculator
 * Core calculations for variable costs, fixed costs, and COGS breakdown
 */

import type { VariableCostItem, FixedCostItem, CostBreakdown } from '../types';

// ============================================================================
// Rounding Utilities
// ============================================================================

/**
 * Round to specified decimal places (default: 2 for currency)
 */
export function roundCurrency(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
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
// Variable Cost Calculations
// ============================================================================

/**
 * Calculate cost per customer for a single variable cost item
 */
export function calculateItemCostPerCustomer(
  item: VariableCostItem,
  utilizationRate: number = 1
): number {
  return item.costPerUnit * item.usagePerCustomer * utilizationRate;
}

/**
 * Calculate total variable costs per customer
 */
export function calculateVariableCosts(
  costs: VariableCostItem[],
  utilizationRate: number = 1
): number {
  return costs.reduce(
    (sum, item) => sum + calculateItemCostPerCustomer(item, utilizationRate),
    0
  );
}

/**
 * Calculate total variable costs for all customers
 */
export function calculateTotalVariableCosts(
  costs: VariableCostItem[],
  customerCount: number,
  utilizationRate: number = 1
): number {
  return calculateVariableCosts(costs, utilizationRate) * customerCount;
}

// ============================================================================
// Fixed Cost Calculations
// ============================================================================

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
  return calculateTotalFixedCosts(fixedCosts) / customerCount;
}

// ============================================================================
// COGS Calculations
// ============================================================================

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
  return calculateCOGSBreakdown(
    variableCosts,
    fixedCosts,
    customerCount,
    utilizationRate
  ).totalCOGS;
}

/**
 * Calculate COGS per customer with rounded result
 */
export function calculateCOGSPerCustomer(params: {
  variableCostPerCustomer: number;
  totalFixedCosts: number;
  customerCount: number;
}): number {
  const { variableCostPerCustomer, totalFixedCosts, customerCount } = params;
  if (customerCount <= 0) return variableCostPerCustomer;
  return variableCostPerCustomer + (totalFixedCosts / customerCount);
}

// ============================================================================
// MRR/Revenue Calculations
// ============================================================================

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
 * Calculate total variable costs across all customers in tier distribution
 */
export function calculateTotalVariableCostsForDistribution(
  variableCostPerCustomer: number,
  tierDistribution: Record<string, number>,
  utilizationRate: number = 1
): number {
  const totalCustomers = Object.values(tierDistribution).reduce((a, b) => a + b, 0);
  return variableCostPerCustomer * totalCustomers * utilizationRate;
}

// ============================================================================
// Break-even Calculations
// ============================================================================

/**
 * Calculate break-even customer count
 * Break-even = Fixed Costs / (Price - Variable Cost per Customer)
 */
export function calculateBreakEvenCustomers(
  totalFixedCosts: number,
  pricePerCustomer: number,
  variableCostPerCustomer: number
): number {
  const contribution = pricePerCustomer - variableCostPerCustomer;
  if (contribution <= 0) return Infinity;
  return Math.ceil(totalFixedCosts / contribution);
}

/**
 * Calculate monthly profit
 */
export function calculateMonthlyProfit(
  mrr: number,
  totalVariableCosts: number,
  totalFixedCosts: number
): number {
  return mrr - totalVariableCosts - totalFixedCosts;
}
