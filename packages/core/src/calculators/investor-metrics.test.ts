/**
 * Investor Metrics Calculator Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  calculateValuation,
  calculateARR,
  calculateMRRFromCustomers,
  calculateLTV,
  calculateLTVFromChurn,
  calculateLTVCACRatio,
  getLTVCACHealth,
  calculatePaybackPeriod,
  getPaybackHealth,
  calculateMilestones,
  calculateMonthsToTarget,
  calculateBreakEvenTimeline,
  calculateInvestorMetrics,
  formatCurrencyCompact,
  formatValuationRange,
} from './investor-metrics';

// ============================================================================
// Valuation Tests
// ============================================================================

describe('calculateValuation', () => {
  it('calculates valuation multiples correctly', () => {
    const result = calculateValuation(1000000); // 1M ARR

    expect(result.currentARR).toBe(1000000);
    expect(result.valuationLow).toBe(5000000); // 5x
    expect(result.valuationMid).toBe(10000000); // 10x
    expect(result.valuationHigh).toBe(15000000); // 15x
  });

  it('handles zero ARR', () => {
    const result = calculateValuation(0);

    expect(result.currentARR).toBe(0);
    expect(result.valuationLow).toBe(0);
    expect(result.valuationMid).toBe(0);
    expect(result.valuationHigh).toBe(0);
  });
});

describe('calculateARR', () => {
  it('calculates ARR from MRR', () => {
    expect(calculateARR(10000)).toBe(120000); // 10K * 12
  });

  it('handles zero MRR', () => {
    expect(calculateARR(0)).toBe(0);
  });
});

describe('calculateMRRFromCustomers', () => {
  it('calculates MRR correctly', () => {
    expect(calculateMRRFromCustomers(100, 50)).toBe(5000); // 100 * 50
  });

  it('handles zero customers', () => {
    expect(calculateMRRFromCustomers(0, 50)).toBe(0);
  });
});

// ============================================================================
// LTV/CAC Tests
// ============================================================================

describe('calculateLTV', () => {
  it('calculates LTV correctly', () => {
    // ARPU: 100, Gross Margin: 70%, Lifetime: 24 months
    // LTV = 100 * 0.7 * 24 = 1680
    const result = calculateLTV(100, 70, 24);
    expect(result).toBe(1680);
  });

  it('handles zero ARPU', () => {
    expect(calculateLTV(0, 70, 24)).toBe(0);
  });

  it('handles zero margin', () => {
    expect(calculateLTV(100, 0, 24)).toBe(0);
  });
});

describe('calculateLTVFromChurn', () => {
  it('calculates LTV from churn rate', () => {
    // ARPU: 100, Gross Margin: 70%, Churn: 5% monthly
    // Lifetime = 1 / 0.05 = 20 months
    // LTV = 100 * 0.7 * 20 = 1400
    const result = calculateLTVFromChurn(100, 70, 0.05);
    expect(result).toBe(1400);
  });

  it('returns Infinity for zero churn', () => {
    expect(calculateLTVFromChurn(100, 70, 0)).toBe(Infinity);
  });

  it('returns Infinity for negative churn', () => {
    expect(calculateLTVFromChurn(100, 70, -0.05)).toBe(Infinity);
  });
});

describe('calculateLTVCACRatio', () => {
  it('calculates ratio correctly', () => {
    expect(calculateLTVCACRatio(3000, 1000)).toBe(3);
    expect(calculateLTVCACRatio(5000, 1000)).toBe(5);
  });

  it('returns null for zero CAC', () => {
    expect(calculateLTVCACRatio(3000, 0)).toBeNull();
  });
});

describe('getLTVCACHealth', () => {
  it('returns "healthy" for ratio >= 3', () => {
    expect(getLTVCACHealth(3)).toBe('healthy');
    expect(getLTVCACHealth(5)).toBe('healthy');
  });

  it('returns "acceptable" for ratio >= 1 and < 3', () => {
    expect(getLTVCACHealth(1)).toBe('acceptable');
    expect(getLTVCACHealth(2)).toBe('acceptable');
    expect(getLTVCACHealth(2.99)).toBe('acceptable');
  });

  it('returns "concerning" for ratio < 1', () => {
    expect(getLTVCACHealth(0.5)).toBe('concerning');
    expect(getLTVCACHealth(0)).toBe('concerning');
  });

  it('returns "concerning" for null', () => {
    expect(getLTVCACHealth(null)).toBe('concerning');
  });
});

// ============================================================================
// Payback Period Tests
// ============================================================================

describe('calculatePaybackPeriod', () => {
  it('calculates payback period correctly', () => {
    // ARPU: 100, Gross Margin: 70%, CAC: 500
    // Monthly contribution: 100 * 0.7 = 70
    // Payback: 500 / 70 = 7.14 -> 8 months
    const result = calculatePaybackPeriod(100, 70, 500);
    expect(result).toBe(8);
  });

  it('returns null for zero ARPU', () => {
    expect(calculatePaybackPeriod(0, 70, 500)).toBeNull();
  });

  it('returns null for zero margin', () => {
    expect(calculatePaybackPeriod(100, 0, 500)).toBeNull();
  });

  it('returns null for zero CAC', () => {
    expect(calculatePaybackPeriod(100, 70, 0)).toBeNull();
  });
});

describe('getPaybackHealth', () => {
  it('returns "healthy" for <= 12 months', () => {
    expect(getPaybackHealth(6)).toBe('healthy');
    expect(getPaybackHealth(12)).toBe('healthy');
  });

  it('returns "acceptable" for 13-24 months', () => {
    expect(getPaybackHealth(13)).toBe('acceptable');
    expect(getPaybackHealth(24)).toBe('acceptable');
  });

  it('returns "concerning" for > 24 months', () => {
    expect(getPaybackHealth(25)).toBe('concerning');
    expect(getPaybackHealth(36)).toBe('concerning');
  });

  it('returns "concerning" for null', () => {
    expect(getPaybackHealth(null)).toBe('concerning');
  });
});

// ============================================================================
// Milestone Tests
// ============================================================================

describe('calculateMilestones', () => {
  it('calculates milestones correctly', () => {
    // ARPU: 50, 100 customers, 10% growth
    const result = calculateMilestones(50, 100, 0.1);

    expect(result).toHaveLength(4);

    // First milestone: 100K ARR
    // Customers needed: 100000 / (50 * 12) = 166.67 -> 167
    expect(result[0].label).toBe('MYR 100K ARR');
    expect(result[0].targetARR).toBe(100000);
    expect(result[0].customersNeeded).toBe(167);
    expect(result[0].monthsToReach).toBeGreaterThan(0);
  });

  it('returns 0 months for achieved milestones', () => {
    // 1000 customers at 100 ARPU = 1.2M ARR
    const result = calculateMilestones(100, 1000, 0.1);

    // Should have achieved 100K and 500K
    expect(result[0].monthsToReach).toBe(0);
    expect(result[1].monthsToReach).toBe(0);
  });

  it('handles zero ARPU', () => {
    const result = calculateMilestones(0, 100, 0.1);
    expect(result[0].customersNeeded).toBe(0);
  });

  it('returns null months for zero growth rate', () => {
    const result = calculateMilestones(50, 100, 0);
    expect(result[0].monthsToReach).toBeNull();
  });
});

describe('calculateMonthsToTarget', () => {
  it('calculates months correctly', () => {
    // 100 -> 200 at 10% growth
    // 200/100 = 2, ln(2) / ln(1.1) = ~7.27 -> 8
    const result = calculateMonthsToTarget(100, 200, 0.1);
    expect(result).toBe(8);
  });

  it('returns 0 if already at target', () => {
    expect(calculateMonthsToTarget(200, 100, 0.1)).toBe(0);
    expect(calculateMonthsToTarget(100, 100, 0.1)).toBe(0);
  });

  it('returns null for zero growth', () => {
    expect(calculateMonthsToTarget(100, 200, 0)).toBeNull();
  });

  it('returns null for zero current customers', () => {
    expect(calculateMonthsToTarget(0, 200, 0.1)).toBeNull();
  });
});

// ============================================================================
// Break-even Timeline Tests
// ============================================================================

describe('calculateBreakEvenTimeline', () => {
  it('calculates timeline correctly', () => {
    const result = calculateBreakEvenTimeline(50, 100, 0.1);
    expect(result).toBeGreaterThan(0);
  });

  it('returns 0 if already at break-even', () => {
    expect(calculateBreakEvenTimeline(100, 50, 0.1)).toBe(0);
    expect(calculateBreakEvenTimeline(100, 100, 0.1)).toBe(0);
  });

  it('returns null for zero growth', () => {
    expect(calculateBreakEvenTimeline(50, 100, 0)).toBeNull();
  });

  it('returns null for zero current customers', () => {
    expect(calculateBreakEvenTimeline(0, 100, 0.1)).toBeNull();
  });
});

// ============================================================================
// Complete Metrics Tests
// ============================================================================

describe('calculateInvestorMetrics', () => {
  it('calculates complete metrics', () => {
    const result = calculateInvestorMetrics({
      mrr: 10000,
      paidCustomers: 200,
      arpu: 50,
      grossMargin: 70,
      breakEvenCustomers: 100,
      monthlyGrowthRate: 0.05,
      ltv: 1500,
      estimatedCac: 500,
    });

    expect(result.mrr).toBe(10000);
    expect(result.arr).toBe(120000);
    expect(result.paidCustomers).toBe(200);
    expect(result.arpu).toBe(50);
    expect(result.valuation.currentARR).toBe(120000);
    expect(result.milestones).toHaveLength(4);
    expect(result.breakEvenCustomers).toBe(100);
    expect(result.currentPaidCustomers).toBe(200);
    expect(result.customersToBreakEven).toBe(0);
    expect(result.monthsToBreakEven).toBe(0);
    expect(result.grossMarginHealth).toBe('healthy');
    expect(result.ltvCacRatio).toBe(3);
    expect(result.paybackPeriodMonths).toBeGreaterThan(0);
  });

  it('handles no CAC provided', () => {
    const result = calculateInvestorMetrics({
      mrr: 10000,
      paidCustomers: 200,
      arpu: 50,
      grossMargin: 70,
      breakEvenCustomers: 100,
      monthlyGrowthRate: 0.05,
      ltv: 1500,
    });

    expect(result.ltvCacRatio).toBeNull();
    expect(result.paybackPeriodMonths).toBeNull();
  });
});

// ============================================================================
// Formatting Tests
// ============================================================================

describe('formatCurrencyCompact', () => {
  it('formats millions', () => {
    expect(formatCurrencyCompact(5000000)).toBe('MYR 5.0M');
    expect(formatCurrencyCompact(1500000, 'USD')).toBe('USD 1.5M');
  });

  it('formats thousands', () => {
    expect(formatCurrencyCompact(500000)).toBe('MYR 500K');
    expect(formatCurrencyCompact(1000)).toBe('MYR 1K');
  });

  it('formats small values', () => {
    expect(formatCurrencyCompact(500)).toBe('MYR 500');
    expect(formatCurrencyCompact(50)).toBe('MYR 50');
  });
});

describe('formatValuationRange', () => {
  it('formats valuation range', () => {
    const valuation = calculateValuation(1000000);
    const result = formatValuationRange(valuation);

    expect(result).toContain('5.0M');
    expect(result).toContain('15.0M');
    expect(result).toContain('-');
  });
});
