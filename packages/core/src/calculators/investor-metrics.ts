/**
 * Investor Metrics Calculator
 * Calculations for SaaS valuation, LTV, CAC, and growth milestones
 */

import type { ValuationProjection, MilestoneTarget, InvestorMetrics } from '../types';
import { MARGIN_THRESHOLDS } from '../data';

// ============================================================================
// Valuation Calculations
// ============================================================================

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
 * Calculate ARR from MRR
 */
export function calculateARR(mrr: number): number {
  return mrr * 12;
}

/**
 * Calculate MRR from customer count and ARPU
 */
export function calculateMRRFromCustomers(customerCount: number, arpu: number): number {
  return customerCount * arpu;
}

// ============================================================================
// LTV/CAC Calculations
// ============================================================================

/**
 * Calculate Customer Lifetime Value (LTV)
 * LTV = ARPU * Gross Margin % * (1 / Churn Rate)
 * Or simplified: LTV = ARPU * Average Customer Lifetime in Months * Gross Margin %
 */
export function calculateLTV(
  arpu: number,
  grossMarginPercent: number,
  averageLifetimeMonths: number
): number {
  return arpu * (grossMarginPercent / 100) * averageLifetimeMonths;
}

/**
 * Calculate LTV from churn rate
 * Average Lifetime = 1 / Monthly Churn Rate
 */
export function calculateLTVFromChurn(
  arpu: number,
  grossMarginPercent: number,
  monthlyChurnRate: number
): number {
  if (monthlyChurnRate <= 0) return Infinity;
  const averageLifetimeMonths = 1 / monthlyChurnRate;
  return calculateLTV(arpu, grossMarginPercent, averageLifetimeMonths);
}

/**
 * Calculate LTV:CAC ratio
 * Target: 3:1 to 5:1 for healthy SaaS
 */
export function calculateLTVCACRatio(ltv: number, cac: number): number | null {
  if (cac <= 0) return null;
  return ltv / cac;
}

/**
 * Get LTV:CAC health status
 */
export function getLTVCACHealth(ratio: number | null): 'healthy' | 'acceptable' | 'concerning' {
  if (ratio === null) return 'concerning';
  if (ratio >= 3) return 'healthy';
  if (ratio >= 1) return 'acceptable';
  return 'concerning';
}

/**
 * Calculate payback period in months
 * How long to recover CAC from a customer
 */
export function calculatePaybackPeriod(
  arpu: number,
  grossMarginPercent: number,
  cac: number
): number | null {
  if (arpu <= 0 || grossMarginPercent <= 0 || cac <= 0) return null;

  const monthlyContribution = arpu * (grossMarginPercent / 100);
  return Math.ceil(cac / monthlyContribution);
}

/**
 * Get payback period health status
 * Target: < 12 months is healthy
 */
export function getPaybackHealth(months: number | null): 'healthy' | 'acceptable' | 'concerning' {
  if (months === null) return 'concerning';
  if (months <= 12) return 'healthy';
  if (months <= 24) return 'acceptable';
  return 'concerning';
}

// ============================================================================
// Milestone Calculations
// ============================================================================

/**
 * Calculate customers needed for specific ARR milestones
 */
export function calculateMilestones(
  arpu: number,
  currentPaidCustomers: number,
  monthlyGrowthRate: number
): MilestoneTarget[] {
  const milestones = [
    { label: 'MYR 100K ARR', targetARR: 100000 },
    { label: 'MYR 500K ARR', targetARR: 500000 },
    { label: 'MYR 1M ARR', targetARR: 1000000 },
    { label: 'MYR 5M ARR', targetARR: 5000000 },
  ];

  return milestones.map(({ label, targetARR }) => {
    // ARR = (customers * ARPU) * 12
    // customers = targetARR / (ARPU * 12)
    const customersNeeded = arpu > 0 ? Math.ceil(targetARR / (arpu * 12)) : 0;

    // Months to reach = ln(targetCustomers / currentCustomers) / ln(1 + growthRate)
    let monthsToReach: number | null = null;
    if (monthlyGrowthRate > 0 && currentPaidCustomers > 0 && customersNeeded > currentPaidCustomers) {
      monthsToReach = Math.ceil(
        Math.log(customersNeeded / currentPaidCustomers) / Math.log(1 + monthlyGrowthRate)
      );
    } else if (currentPaidCustomers >= customersNeeded) {
      monthsToReach = 0;
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
 * Calculate months to reach a target customer count
 */
export function calculateMonthsToTarget(
  currentCustomers: number,
  targetCustomers: number,
  monthlyGrowthRate: number
): number | null {
  if (currentCustomers >= targetCustomers) return 0;
  if (monthlyGrowthRate <= 0 || currentCustomers <= 0) return null;

  return Math.ceil(
    Math.log(targetCustomers / currentCustomers) / Math.log(1 + monthlyGrowthRate)
  );
}

// ============================================================================
// Break-even Timeline
// ============================================================================

/**
 * Calculate months to break-even based on growth rate
 */
export function calculateBreakEvenTimeline(
  currentPaidCustomers: number,
  breakEvenCustomers: number,
  monthlyGrowthRate: number
): number | null {
  if (currentPaidCustomers >= breakEvenCustomers) return 0;
  if (monthlyGrowthRate <= 0 || currentPaidCustomers <= 0) return null;

  return Math.ceil(
    Math.log(breakEvenCustomers / currentPaidCustomers) / Math.log(1 + monthlyGrowthRate)
  );
}

// ============================================================================
// Gross Margin Health
// ============================================================================

/**
 * Determine gross margin health status
 */
export function getGrossMarginHealth(grossMargin: number): 'healthy' | 'acceptable' | 'concerning' {
  if (grossMargin >= MARGIN_THRESHOLDS.HEALTHY) return 'healthy';
  if (grossMargin >= MARGIN_THRESHOLDS.ACCEPTABLE) return 'acceptable';
  return 'concerning';
}

// ============================================================================
// Complete Investor Metrics
// ============================================================================

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
  estimatedCac?: number;
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
  const monthsToBreakEven = calculateBreakEvenTimeline(
    paidCustomers,
    breakEvenCustomers,
    monthlyGrowthRate
  );
  const grossMarginHealth = getGrossMarginHealth(grossMargin);
  const ltvCacRatio = calculateLTVCACRatio(ltv, estimatedCac);
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

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Format currency for display (compact notation)
 */
export function formatCurrencyCompact(value: number, currency: string = 'MYR'): string {
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
  return `${formatCurrencyCompact(valuation.valuationLow)} - ${formatCurrencyCompact(valuation.valuationHigh)}`;
}
