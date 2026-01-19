// Investor metrics calculations for SaaS valuation and milestones

import { MARGIN_THRESHOLDS } from '../constants';

export interface ValuationProjection {
  currentARR: number;
  valuationLow: number;   // 5x ARR
  valuationMid: number;   // 10x ARR
  valuationHigh: number;  // 15x ARR
}

export interface MilestoneTarget {
  label: string;
  targetARR: number;
  customersNeeded: number;
  monthsToReach: number | null; // null if growth rate is 0
}

export interface InvestorMetrics {
  // Current state
  mrr: number;
  arr: number;
  paidCustomers: number;
  arpu: number;

  // Valuation
  valuation: ValuationProjection;

  // Milestones
  milestones: MilestoneTarget[];

  // Break-even
  breakEvenCustomers: number;
  currentPaidCustomers: number;
  customersToBreakEven: number;
  monthsToBreakEven: number | null;

  // Health indicators
  grossMarginHealth: 'healthy' | 'acceptable' | 'concerning';
  ltvCacRatio: number | null; // null if CAC is 0
  paybackPeriodMonths: number | null;
}

/**
 * Calculate valuation projections based on ARR multiples
 * Standard SaaS multiples: 5x (conservative), 10x (typical), 15x (high growth)
 */
export function calculateValuation(arr: number): ValuationProjection {
  return {
    currentARR: arr,
    valuationLow: arr * 5,
    valuationMid: arr * 10,
    valuationHigh: arr * 15,
  };
}

/**
 * Calculate customers needed for specific ARR milestones
 * Standard milestones: $100K, $500K, $1M ARR (converted to MYR)
 */
export function calculateMilestones(
  arpu: number,
  currentPaidCustomers: number,
  monthlyGrowthRate: number // e.g., 0.05 = 5% monthly growth
): MilestoneTarget[] {
  // MYR milestones
  const milestones = [
    { label: 'MYR 100K ARR', targetARR: 100000 },
    { label: 'MYR 500K ARR', targetARR: 500000 },
    { label: 'MYR 1M ARR', targetARR: 1000000 },
    { label: 'MYR 5M ARR', targetARR: 5000000 },
  ];

  const monthlyARPU = arpu; // ARPU is already monthly

  return milestones.map(({ label, targetARR }) => {
    // ARR = (customers × ARPU) × 12
    // So customers = targetARR / (ARPU × 12)
    const customersNeeded = monthlyARPU > 0
      ? Math.ceil(targetARR / (monthlyARPU * 12))
      : 0;

    // Months to reach = ln(targetCustomers / currentCustomers) / ln(1 + growthRate)
    let monthsToReach: number | null = null;
    if (monthlyGrowthRate > 0 && currentPaidCustomers > 0 && customersNeeded > currentPaidCustomers) {
      monthsToReach = Math.ceil(
        Math.log(customersNeeded / currentPaidCustomers) / Math.log(1 + monthlyGrowthRate)
      );
    } else if (currentPaidCustomers >= customersNeeded) {
      monthsToReach = 0; // Already achieved
    }

    return {
      label,
      targetARR,
      customersNeeded,
      monthsToReach,
    };
  });
}

/**
 * Calculate months to break-even based on growth rate
 */
export function calculateBreakEvenTimeline(
  currentPaidCustomers: number,
  breakEvenCustomers: number,
  monthlyGrowthRate: number // e.g., 0.05 = 5% monthly growth
): number | null {
  if (currentPaidCustomers >= breakEvenCustomers) {
    return 0; // Already at break-even
  }

  if (monthlyGrowthRate <= 0 || currentPaidCustomers <= 0) {
    return null; // Can't calculate without growth
  }

  // Months = ln(target / current) / ln(1 + growthRate)
  return Math.ceil(
    Math.log(breakEvenCustomers / currentPaidCustomers) / Math.log(1 + monthlyGrowthRate)
  );
}

/**
 * Determine gross margin health status
 * Uses centralized MARGIN_THRESHOLDS from constants
 */
export function getGrossMarginHealth(grossMargin: number): 'healthy' | 'acceptable' | 'concerning' {
  if (grossMargin >= MARGIN_THRESHOLDS.HEALTHY) return 'healthy';
  if (grossMargin >= MARGIN_THRESHOLDS.ACCEPTABLE) return 'acceptable';
  return 'concerning';
}

/**
 * Calculate LTV:CAC ratio
 * Target: 3:1 to 5:1 for healthy SaaS
 */
export function calculateLtvCacRatio(ltv: number, cac: number): number | null {
  if (cac <= 0) return null;
  return ltv / cac;
}

/**
 * Calculate payback period in months
 * How long to recover CAC from a customer
 */
export function calculatePaybackPeriod(arpu: number, grossMargin: number, cac: number): number | null {
  if (arpu <= 0 || grossMargin <= 0 || cac <= 0) return null;

  const monthlyContribution = arpu * (grossMargin / 100);
  return Math.ceil(cac / monthlyContribution);
}

/**
 * Calculate complete investor metrics
 */
export function calculateInvestorMetrics(params: {
  mrr: number;
  paidCustomers: number;
  arpu: number;
  grossMargin: number;
  breakEvenCustomers: number;
  monthlyGrowthRate: number;
  ltv: number;
  estimatedCac?: number; // Optional - if provided, calculate LTV:CAC
}): InvestorMetrics {
  const {
    mrr,
    paidCustomers,
    arpu,
    grossMargin,
    breakEvenCustomers,
    monthlyGrowthRate,
    ltv,
    estimatedCac = 0,
  } = params;

  const arr = mrr * 12;
  const valuation = calculateValuation(arr);
  const milestones = calculateMilestones(arpu, paidCustomers, monthlyGrowthRate);
  const customersToBreakEven = Math.max(0, breakEvenCustomers - paidCustomers);
  const monthsToBreakEven = calculateBreakEvenTimeline(paidCustomers, breakEvenCustomers, monthlyGrowthRate);
  const grossMarginHealth = getGrossMarginHealth(grossMargin);
  const ltvCacRatio = calculateLtvCacRatio(ltv, estimatedCac);
  const paybackPeriodMonths = calculatePaybackPeriod(arpu, grossMargin, estimatedCac);

  return {
    mrr,
    arr,
    paidCustomers,
    arpu,
    valuation,
    milestones,
    breakEvenCustomers,
    currentPaidCustomers: paidCustomers,
    customersToBreakEven,
    monthsToBreakEven,
    grossMarginHealth,
    ltvCacRatio,
    paybackPeriodMonths,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number, currency: string = 'MYR'): string {
  if (value >= 1000000) {
    return `${currency} ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${currency} ${(value / 1000).toFixed(0)}K`;
  }
  return `${currency} ${value.toFixed(0)}`;
}

/**
 * Format valuation range for display
 */
export function formatValuationRange(valuation: ValuationProjection): string {
  return `${formatCurrency(valuation.valuationLow)} - ${formatCurrency(valuation.valuationHigh)}`;
}
