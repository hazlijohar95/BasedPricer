/**
 * Investor Metrics Tests
 * Tests for SaaS valuation, milestones, and growth rate calculations
 */

import { describe, it, expect } from 'vitest';
import {
  calculateValuation,
  calculateMilestones,
  calculateBreakEvenTimeline,
  getGrossMarginHealth,
  calculateLtvCacRatio,
  calculatePaybackPeriod,
  calculateInvestorMetrics,
  formatCurrency,
  formatValuationRange,
} from './investorMetrics';

describe('investorMetrics', () => {
  describe('calculateValuation', () => {
    it('calculates correct valuation multiples', () => {
      const result = calculateValuation(120000); // 120K ARR

      expect(result.currentARR).toBe(120000);
      expect(result.valuationLow).toBe(600000);   // 5x
      expect(result.valuationMid).toBe(1200000);  // 10x
      expect(result.valuationHigh).toBe(1800000); // 15x
    });

    it('handles zero ARR', () => {
      const result = calculateValuation(0);

      expect(result.currentARR).toBe(0);
      expect(result.valuationLow).toBe(0);
      expect(result.valuationMid).toBe(0);
      expect(result.valuationHigh).toBe(0);
    });

    it('handles large ARR values', () => {
      const result = calculateValuation(10000000); // 10M ARR

      expect(result.valuationLow).toBe(50000000);
      expect(result.valuationMid).toBe(100000000);
      expect(result.valuationHigh).toBe(150000000);
    });
  });

  describe('calculateMilestones', () => {
    it('calculates customers needed for milestones', () => {
      const milestones = calculateMilestones(100, 50, 0.05); // ARPU 100, 50 customers, 5% growth

      expect(milestones).toHaveLength(4);
      expect(milestones[0].label).toBe('MYR 100K ARR');
      expect(milestones[0].customersNeeded).toBe(84); // 100000 / (100 * 12) = ~84
    });

    it('calculates months to reach milestones with growth', () => {
      const milestones = calculateMilestones(100, 50, 0.10); // 10% monthly growth

      // Should have months to reach for unachieved milestones
      const firstMilestone = milestones[0];
      expect(firstMilestone.monthsToReach).not.toBeNull();
      expect(firstMilestone.monthsToReach).toBeGreaterThan(0);
    });

    it('returns null for months when growth rate is 0', () => {
      const milestones = calculateMilestones(100, 50, 0); // No growth

      const firstMilestone = milestones[0];
      expect(firstMilestone.monthsToReach).toBeNull();
    });

    it('returns 0 months for already achieved milestones', () => {
      const milestones = calculateMilestones(100, 1000, 0.05); // 1000 customers

      // 1000 customers × 100 ARPU × 12 = 1.2M ARR
      // Should have achieved 100K and 500K milestones
      const firstMilestone = milestones[0]; // 100K ARR
      expect(firstMilestone.monthsToReach).toBe(0);
    });

    it('handles different growth rates', () => {
      const lowGrowth = calculateMilestones(100, 50, 0.02);  // 2%
      const highGrowth = calculateMilestones(100, 50, 0.20); // 20%

      // Higher growth should mean fewer months to reach milestones
      expect(highGrowth[0].monthsToReach).toBeLessThan(lowGrowth[0].monthsToReach!);
    });
  });

  describe('calculateBreakEvenTimeline', () => {
    it('returns 0 when already at break-even', () => {
      const result = calculateBreakEvenTimeline(100, 50, 0.05);
      expect(result).toBe(0);
    });

    it('calculates months to break-even with growth', () => {
      const result = calculateBreakEvenTimeline(50, 100, 0.05); // 5% growth
      expect(result).not.toBeNull();
      expect(result).toBeGreaterThan(0);
    });

    it('returns null when growth rate is 0', () => {
      const result = calculateBreakEvenTimeline(50, 100, 0);
      expect(result).toBeNull();
    });

    it('returns null when current customers is 0', () => {
      const result = calculateBreakEvenTimeline(0, 100, 0.05);
      expect(result).toBeNull();
    });

    it('higher growth means shorter time to break-even', () => {
      const slowGrowth = calculateBreakEvenTimeline(50, 100, 0.03); // 3%
      const fastGrowth = calculateBreakEvenTimeline(50, 100, 0.10); // 10%

      expect(fastGrowth).toBeLessThan(slowGrowth!);
    });
  });

  describe('getGrossMarginHealth', () => {
    it('returns healthy for margins >= 70%', () => {
      expect(getGrossMarginHealth(70)).toBe('healthy');
      expect(getGrossMarginHealth(85)).toBe('healthy');
      expect(getGrossMarginHealth(100)).toBe('healthy');
    });

    it('returns acceptable for margins 50-70%', () => {
      expect(getGrossMarginHealth(50)).toBe('acceptable');
      expect(getGrossMarginHealth(60)).toBe('acceptable');
      expect(getGrossMarginHealth(69.9)).toBe('acceptable');
    });

    it('returns low for margins < 50%', () => {
      expect(getGrossMarginHealth(49)).toBe('low');
      expect(getGrossMarginHealth(30)).toBe('low');
      expect(getGrossMarginHealth(0)).toBe('low');
    });
  });

  describe('calculateLtvCacRatio', () => {
    it('calculates correct LTV:CAC ratio', () => {
      expect(calculateLtvCacRatio(3000, 1000)).toBe(3); // 3:1 ratio
      expect(calculateLtvCacRatio(5000, 1000)).toBe(5); // 5:1 ratio
    });

    it('returns null when CAC is 0', () => {
      expect(calculateLtvCacRatio(3000, 0)).toBeNull();
    });
  });

  describe('calculatePaybackPeriod', () => {
    it('calculates correct payback period', () => {
      // ARPU $100, 70% margin, CAC $500
      // Monthly contribution = 100 * 0.7 = 70
      // Payback = 500 / 70 = ~8 months
      const result = calculatePaybackPeriod(100, 70, 500);
      expect(result).toBe(8);
    });

    it('returns null for invalid inputs', () => {
      expect(calculatePaybackPeriod(0, 70, 500)).toBeNull();
      expect(calculatePaybackPeriod(100, 0, 500)).toBeNull();
      expect(calculatePaybackPeriod(100, 70, 0)).toBeNull();
    });
  });

  describe('calculateInvestorMetrics', () => {
    const baseParams = {
      mrr: 10000,
      paidCustomers: 100,
      arpu: 100,
      grossMargin: 75,
      breakEvenCustomers: 50,
      monthlyGrowthRate: 0.05,
      ltv: 2000,
    };

    it('calculates complete investor metrics', () => {
      const result = calculateInvestorMetrics(baseParams);

      expect(result.mrr).toBe(10000);
      expect(result.arr).toBe(120000);
      expect(result.paidCustomers).toBe(100);
      expect(result.arpu).toBe(100);
    });

    it('includes valuation projections', () => {
      const result = calculateInvestorMetrics(baseParams);

      expect(result.valuation.currentARR).toBe(120000);
      expect(result.valuation.valuationMid).toBe(1200000); // 10x
    });

    it('includes milestones', () => {
      const result = calculateInvestorMetrics(baseParams);

      expect(result.milestones).toHaveLength(4);
      expect(result.milestones[0].label).toBe('MYR 100K ARR');
    });

    it('calculates break-even metrics', () => {
      const result = calculateInvestorMetrics(baseParams);

      expect(result.breakEvenCustomers).toBe(50);
      expect(result.currentPaidCustomers).toBe(100);
      expect(result.customersToBreakEven).toBe(0); // Already above break-even
    });

    it('includes gross margin health', () => {
      const result = calculateInvestorMetrics(baseParams);
      expect(result.grossMarginHealth).toBe('healthy');

      const lowMarginResult = calculateInvestorMetrics({
        ...baseParams,
        grossMargin: 40,
      });
      expect(lowMarginResult.grossMarginHealth).toBe('low');
    });

    it('uses configurable growth rate', () => {
      const slowGrowth = calculateInvestorMetrics({
        ...baseParams,
        monthlyGrowthRate: 0.02, // 2%
      });

      const fastGrowth = calculateInvestorMetrics({
        ...baseParams,
        monthlyGrowthRate: 0.15, // 15%
      });

      // With fast growth, milestones should be reached sooner
      const slowFirstMilestone = slowGrowth.milestones[0];
      const fastFirstMilestone = fastGrowth.milestones[0];

      // Already achieved, so check the next one
      if (slowFirstMilestone.monthsToReach === 0 && fastFirstMilestone.monthsToReach === 0) {
        expect(slowGrowth.milestones[1].monthsToReach).toBeGreaterThan(
          fastGrowth.milestones[1].monthsToReach!
        );
      }
    });

    it('handles zero growth rate', () => {
      const result = calculateInvestorMetrics({
        ...baseParams,
        monthlyGrowthRate: 0,
      });

      // Milestones should have null months to reach
      result.milestones.forEach(milestone => {
        if (milestone.customersNeeded > baseParams.paidCustomers) {
          expect(milestone.monthsToReach).toBeNull();
        }
      });
    });
  });

  describe('formatCurrency', () => {
    it('formats millions correctly', () => {
      expect(formatCurrency(1500000)).toBe('MYR 1.5M');
      expect(formatCurrency(10000000)).toBe('MYR 10.0M');
    });

    it('formats thousands correctly', () => {
      expect(formatCurrency(50000)).toBe('MYR 50K');
      expect(formatCurrency(150000)).toBe('MYR 150K');
    });

    it('formats small values correctly', () => {
      expect(formatCurrency(500)).toBe('MYR 500');
      expect(formatCurrency(999)).toBe('MYR 999');
    });

    it('uses custom currency', () => {
      expect(formatCurrency(1000, 'USD')).toBe('USD 1K');
    });
  });

  describe('formatValuationRange', () => {
    it('formats valuation range correctly', () => {
      const valuation = calculateValuation(1000000);
      const formatted = formatValuationRange(valuation);

      expect(formatted).toBe('MYR 5.0M - MYR 15.0M');
    });
  });
});
