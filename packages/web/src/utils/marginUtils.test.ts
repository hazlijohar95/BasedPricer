/**
 * Tests for margin and color utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  getGrossMarginHealth,
  getGrossMarginTextColor,
  getGrossMarginBgColor,
  getGrossMarginBorderColor,
  getGrossMarginColors,
  getOperatingMarginHealth,
  getOperatingMarginTextColor,
  getOperatingMarginBgColor,
  getOperatingMarginBorderColor,
  getTierMarginHealth,
  getTierMarginTextColor,
  getTierMarginBgColor,
  getComplexityTextColor,
  getComplexityBgColor,
  getComplexityBadgeClass,
  getTierStatusBadgeClass,
  getTierStatusLabel,
  getProfitLossTextColor,
  getProfitLossBgColor,
  getPriceSensitivityStatusClass,
  getPriceSensitivityStatusLabel,
} from './marginUtils';

// ============================================================================
// Gross Margin Tests
// ============================================================================

describe('getGrossMarginHealth', () => {
  it('returns healthy for margin >= 70', () => {
    expect(getGrossMarginHealth(70)).toBe('healthy');
    expect(getGrossMarginHealth(85)).toBe('healthy');
    expect(getGrossMarginHealth(100)).toBe('healthy');
  });

  it('returns acceptable for margin 50-69', () => {
    expect(getGrossMarginHealth(50)).toBe('acceptable');
    expect(getGrossMarginHealth(60)).toBe('acceptable');
    expect(getGrossMarginHealth(69)).toBe('acceptable');
  });

  it('returns low for margin < 50', () => {
    expect(getGrossMarginHealth(0)).toBe('low');
    expect(getGrossMarginHealth(30)).toBe('low');
    expect(getGrossMarginHealth(49)).toBe('low');
    expect(getGrossMarginHealth(-10)).toBe('low');
  });
});

describe('getGrossMarginTextColor', () => {
  it('returns emerald for healthy margins', () => {
    expect(getGrossMarginTextColor(70)).toBe('text-emerald-600');
    expect(getGrossMarginTextColor(85)).toBe('text-emerald-600');
  });

  it('returns amber for acceptable margins', () => {
    expect(getGrossMarginTextColor(50)).toBe('text-amber-600');
    expect(getGrossMarginTextColor(65)).toBe('text-amber-600');
  });

  it('returns red for low margins', () => {
    expect(getGrossMarginTextColor(49)).toBe('text-red-600');
    expect(getGrossMarginTextColor(0)).toBe('text-red-600');
  });
});

describe('getGrossMarginBgColor', () => {
  it('returns correct background colors', () => {
    expect(getGrossMarginBgColor(75)).toBe('bg-emerald-50');
    expect(getGrossMarginBgColor(55)).toBe('bg-amber-50');
    expect(getGrossMarginBgColor(40)).toBe('bg-red-50');
  });
});

describe('getGrossMarginBorderColor', () => {
  it('returns correct border colors', () => {
    expect(getGrossMarginBorderColor(75)).toBe('border-l-emerald-500');
    expect(getGrossMarginBorderColor(55)).toBe('border-l-amber-500');
    expect(getGrossMarginBorderColor(40)).toBe('border-l-red-500');
  });
});

describe('getGrossMarginColors', () => {
  it('returns all colors for healthy margin', () => {
    const colors = getGrossMarginColors(80);
    expect(colors.text).toBe('text-emerald-600');
    expect(colors.bg).toBe('bg-emerald-50');
    expect(colors.border).toBe('border-l-emerald-500');
    expect(colors.icon).toBe('text-emerald-600');
  });

  it('returns all colors for acceptable margin', () => {
    const colors = getGrossMarginColors(60);
    expect(colors.text).toBe('text-amber-600');
    expect(colors.bg).toBe('bg-amber-50');
    expect(colors.border).toBe('border-l-amber-500');
    expect(colors.icon).toBe('text-amber-600');
  });

  it('returns all colors for low margin', () => {
    const colors = getGrossMarginColors(30);
    expect(colors.text).toBe('text-red-600');
    expect(colors.bg).toBe('bg-red-50');
    expect(colors.border).toBe('border-l-red-500');
    expect(colors.icon).toBe('text-red-600');
  });
});

// ============================================================================
// Operating Margin Tests
// ============================================================================

describe('getOperatingMarginHealth', () => {
  it('returns healthy for margin >= 20', () => {
    expect(getOperatingMarginHealth(20)).toBe('healthy');
    expect(getOperatingMarginHealth(35)).toBe('healthy');
  });

  it('returns acceptable for margin 0-19', () => {
    expect(getOperatingMarginHealth(0)).toBe('acceptable');
    expect(getOperatingMarginHealth(15)).toBe('acceptable');
  });

  it('returns low for negative margin', () => {
    expect(getOperatingMarginHealth(-1)).toBe('low');
    expect(getOperatingMarginHealth(-20)).toBe('low');
  });
});

describe('getOperatingMarginTextColor', () => {
  it('returns correct colors', () => {
    expect(getOperatingMarginTextColor(25)).toBe('text-emerald-600');
    expect(getOperatingMarginTextColor(10)).toBe('text-amber-600');
    expect(getOperatingMarginTextColor(-5)).toBe('text-red-600');
  });
});

describe('getOperatingMarginBgColor', () => {
  it('returns correct background colors', () => {
    expect(getOperatingMarginBgColor(25)).toBe('bg-emerald-50');
    expect(getOperatingMarginBgColor(10)).toBe('bg-amber-50');
    expect(getOperatingMarginBgColor(-5)).toBe('bg-red-50');
  });
});

describe('getOperatingMarginBorderColor', () => {
  it('returns correct border colors', () => {
    expect(getOperatingMarginBorderColor(25)).toBe('border-l-emerald-500');
    expect(getOperatingMarginBorderColor(10)).toBe('border-l-amber-500');
    expect(getOperatingMarginBorderColor(-5)).toBe('border-l-red-500');
  });
});

// ============================================================================
// Tier Margin Tests
// ============================================================================

describe('getTierMarginHealth', () => {
  it('returns healthy for margin >= 70', () => {
    expect(getTierMarginHealth(70)).toBe('healthy');
    expect(getTierMarginHealth(80)).toBe('healthy');
  });

  it('returns acceptable for margin 50-69', () => {
    expect(getTierMarginHealth(50)).toBe('acceptable');
    expect(getTierMarginHealth(65)).toBe('acceptable');
  });

  it('returns low for margin < 50', () => {
    expect(getTierMarginHealth(40)).toBe('low');
    expect(getTierMarginHealth(0)).toBe('low');
  });
});

describe('getTierMarginTextColor', () => {
  it('returns correct colors', () => {
    expect(getTierMarginTextColor(70)).toBe('text-emerald-600');
    expect(getTierMarginTextColor(55)).toBe('text-amber-600');
    expect(getTierMarginTextColor(40)).toBe('text-red-600');
  });
});

describe('getTierMarginBgColor', () => {
  it('returns correct background colors', () => {
    expect(getTierMarginBgColor(70)).toBe('bg-emerald-50');
    expect(getTierMarginBgColor(55)).toBe('bg-amber-50');
    expect(getTierMarginBgColor(40)).toBe('bg-red-50');
  });
});

// ============================================================================
// Complexity Color Tests
// ============================================================================

describe('getComplexityTextColor', () => {
  it('returns red for high complexity', () => {
    expect(getComplexityTextColor('high')).toBe('text-red-600');
  });

  it('returns amber for medium complexity', () => {
    expect(getComplexityTextColor('medium')).toBe('text-amber-600');
  });

  it('returns emerald for low complexity', () => {
    expect(getComplexityTextColor('low')).toBe('text-emerald-600');
  });
});

describe('getComplexityBgColor', () => {
  it('returns correct background colors', () => {
    expect(getComplexityBgColor('high')).toBe('bg-red-50');
    expect(getComplexityBgColor('medium')).toBe('bg-amber-50');
    expect(getComplexityBgColor('low')).toBe('bg-emerald-50');
  });
});

describe('getComplexityBadgeClass', () => {
  it('returns combined classes for each complexity', () => {
    expect(getComplexityBadgeClass('high')).toBe('bg-red-50 text-red-600');
    expect(getComplexityBadgeClass('medium')).toBe('bg-amber-50 text-amber-600');
    expect(getComplexityBadgeClass('low')).toBe('bg-emerald-50 text-emerald-600');
  });
});

// ============================================================================
// Tier Status Tests
// ============================================================================

describe('getTierStatusBadgeClass', () => {
  it('returns correct classes for each status', () => {
    expect(getTierStatusBadgeClass('active')).toBe('bg-emerald-50 text-emerald-600');
    expect(getTierStatusBadgeClass('coming_soon')).toBe('bg-amber-50 text-amber-600');
    expect(getTierStatusBadgeClass('internal')).toBe('bg-gray-100 text-gray-500');
  });
});

describe('getTierStatusLabel', () => {
  it('returns correct labels for each status', () => {
    expect(getTierStatusLabel('active')).toBe('Active');
    expect(getTierStatusLabel('coming_soon')).toBe('Soon');
    expect(getTierStatusLabel('internal')).toBe('Internal');
  });
});

// ============================================================================
// Profit/Loss Tests
// ============================================================================

describe('getProfitLossTextColor', () => {
  it('returns emerald for positive values', () => {
    expect(getProfitLossTextColor(100)).toBe('text-emerald-600');
    expect(getProfitLossTextColor(0)).toBe('text-emerald-600');
  });

  it('returns red for negative values', () => {
    expect(getProfitLossTextColor(-1)).toBe('text-red-600');
    expect(getProfitLossTextColor(-100)).toBe('text-red-600');
  });
});

describe('getProfitLossBgColor', () => {
  it('returns emerald for positive values', () => {
    expect(getProfitLossBgColor(100)).toBe('bg-emerald-50');
  });

  it('returns red for negative values', () => {
    expect(getProfitLossBgColor(-100)).toBe('bg-red-50');
  });
});

// ============================================================================
// Price Sensitivity Tests
// ============================================================================

describe('getPriceSensitivityStatusClass', () => {
  it('returns correct classes for healthy margin', () => {
    expect(getPriceSensitivityStatusClass(75)).toBe('bg-emerald-50 text-emerald-600');
  });

  it('returns correct classes for acceptable margin', () => {
    expect(getPriceSensitivityStatusClass(55)).toBe('bg-amber-50 text-amber-600');
  });

  it('returns correct classes for low margin', () => {
    expect(getPriceSensitivityStatusClass(40)).toBe('bg-red-50 text-red-600');
  });
});

describe('getPriceSensitivityStatusLabel', () => {
  it('returns Healthy for >= 70', () => {
    expect(getPriceSensitivityStatusLabel(70)).toBe('Healthy');
    expect(getPriceSensitivityStatusLabel(85)).toBe('Healthy');
  });

  it('returns OK for 50-69', () => {
    expect(getPriceSensitivityStatusLabel(50)).toBe('OK');
    expect(getPriceSensitivityStatusLabel(65)).toBe('OK');
  });

  it('returns Low for < 50', () => {
    expect(getPriceSensitivityStatusLabel(49)).toBe('Low');
    expect(getPriceSensitivityStatusLabel(0)).toBe('Low');
  });
});
