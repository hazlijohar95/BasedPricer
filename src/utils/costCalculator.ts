// Unified cost calculation utilities
// Single source of truth for all COGS, margin, and pricing calculations

export interface VariableCostItem {
  id: string;
  name: string;
  unit: string;
  costPerUnit: number;
  usagePerCustomer: number;
  description: string;
}

export interface FixedCostItem {
  id: string;
  name: string;
  monthlyCost: number;
  description: string;
}

export interface CostBreakdown {
  variableTotal: number;
  fixedTotal: number;
  fixedPerCustomer: number;
  totalCOGS: number;
}

export interface MarginInfo {
  margin: number;
  profit: number;
  status: 'great' | 'ok' | 'low';
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
 * Get margin status based on thresholds
 * >= 70% = great (healthy SaaS margin)
 * >= 50% = ok (acceptable)
 * < 50% = low (concerning)
 */
export function getMarginStatus(margin: number): 'great' | 'ok' | 'low' {
  if (margin >= 70) return 'great';
  if (margin >= 50) return 'ok';
  return 'low';
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
 * Calculate margin styling based on status
 */
export function getMarginStyle(margin: number): {
  dot: string;
  text: string;
  bg: string;
} {
  if (margin >= 70) {
    return { dot: 'bg-teal-500', text: 'text-teal-700', bg: 'bg-teal-50' };
  }
  if (margin >= 50) {
    return { dot: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50' };
  }
  return { dot: 'bg-rose-400', text: 'text-rose-600', bg: 'bg-rose-50' };
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
