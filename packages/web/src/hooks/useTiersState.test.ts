/**
 * Tests for useTiersState hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTiersState, type TiersStateInitialValues } from './useTiersState';
import { type Tier } from '../data/tiers';

// Test fixtures
const createTestTier = (overrides: Partial<Tier> = {}): Tier => ({
  id: `tier-${Date.now()}-${Math.random()}`,
  name: 'Test Tier',
  tagline: 'A test tier',
  targetAudience: 'Test audience',
  monthlyPriceMYR: 25,
  annualPriceMYR: 250,
  annualDiscount: 17,
  status: 'active',
  limits: [],
  includedFeatures: [],
  excludedFeatures: [],
  highlightFeatures: [],
  ...overrides,
});

const createInitialValues = (
  overrides: Partial<TiersStateInitialValues> = {}
): TiersStateInitialValues => ({
  tiers: [],
  tierDisplayConfigs: {},
  tierDistribution: {},
  ...overrides,
});

describe('useTiersState', () => {
  describe('initialization', () => {
    it('initializes with empty values', () => {
      const { result } = renderHook(() => useTiersState(createInitialValues()));

      expect(result.current.tiers).toEqual([]);
      expect(result.current.tierDisplayConfigs).toEqual({});
      expect(result.current.tierDistribution).toEqual({});
    });

    it('initializes with provided tiers', () => {
      const tiers = [createTestTier({ id: 't1' }), createTestTier({ id: 't2' })];
      const { result } = renderHook(() => useTiersState(createInitialValues({ tiers })));

      expect(result.current.tiers).toHaveLength(2);
      expect(result.current.tiers[0].id).toBe('t1');
    });
  });

  describe('setTiers', () => {
    it('replaces all tiers', () => {
      const { result } = renderHook(() => useTiersState(createInitialValues()));

      const newTiers = [createTestTier({ id: 'new1' }), createTestTier({ id: 'new2' })];
      act(() => {
        result.current.setTiers(newTiers);
      });

      expect(result.current.tiers).toHaveLength(2);
      expect(result.current.tiers.map(t => t.id)).toEqual(['new1', 'new2']);
    });
  });

  describe('updateTier', () => {
    it('updates a specific tier', () => {
      const tiers = [createTestTier({ id: 't1', name: 'Original' })];
      const { result } = renderHook(() => useTiersState(createInitialValues({ tiers })));

      act(() => {
        result.current.updateTier('t1', { name: 'Updated' });
      });

      expect(result.current.tiers[0].name).toBe('Updated');
    });

    it('preserves other tier properties', () => {
      const tiers = [createTestTier({ id: 't1', name: 'Original', monthlyPriceMYR: 50 })];
      const { result } = renderHook(() => useTiersState(createInitialValues({ tiers })));

      act(() => {
        result.current.updateTier('t1', { name: 'Updated' });
      });

      expect(result.current.tiers[0].monthlyPriceMYR).toBe(50);
    });

    it('only updates the specified tier', () => {
      const tiers = [
        createTestTier({ id: 't1', name: 'First' }),
        createTestTier({ id: 't2', name: 'Second' }),
      ];
      const { result } = renderHook(() => useTiersState(createInitialValues({ tiers })));

      act(() => {
        result.current.updateTier('t1', { name: 'Updated First' });
      });

      expect(result.current.tiers[0].name).toBe('Updated First');
      expect(result.current.tiers[1].name).toBe('Second');
    });
  });

  describe('setTierDistribution', () => {
    it('sets tier distribution', () => {
      const { result } = renderHook(() => useTiersState(createInitialValues()));

      act(() => {
        result.current.setTierDistribution({ freemium: 80, basic: 15, pro: 5 });
      });

      expect(result.current.tierDistribution).toEqual({ freemium: 80, basic: 15, pro: 5 });
    });
  });

  describe('setTierCount', () => {
    it('adds tiers when increasing count', () => {
      const tiers = [createTestTier({ id: 't1' })];
      const { result } = renderHook(() => useTiersState(createInitialValues({ tiers })));

      act(() => {
        result.current.setTierCount(3);
      });

      expect(result.current.tiers).toHaveLength(3);
    });

    it('removes tiers when decreasing count', () => {
      const tiers = [
        createTestTier({ id: 't1' }),
        createTestTier({ id: 't2' }),
        createTestTier({ id: 't3' }),
      ];
      const { result } = renderHook(() => useTiersState(createInitialValues({ tiers })));

      act(() => {
        result.current.setTierCount(2);
      });

      expect(result.current.tiers).toHaveLength(2);
    });

    it('does not allow count below 1', () => {
      const tiers = [createTestTier({ id: 't1' })];
      const { result } = renderHook(() => useTiersState(createInitialValues({ tiers })));

      act(() => {
        result.current.setTierCount(0);
      });

      expect(result.current.tiers).toHaveLength(1);
    });

    it('does not allow count above 6', () => {
      const tiers = [createTestTier({ id: 't1' })];
      const { result } = renderHook(() => useTiersState(createInitialValues({ tiers })));

      act(() => {
        result.current.setTierCount(10);
      });

      expect(result.current.tiers).toHaveLength(1);
    });
  });

  describe('addTier', () => {
    it('adds a new tier', () => {
      const { result } = renderHook(() => useTiersState(createInitialValues()));

      act(() => {
        result.current.addTier();
      });

      expect(result.current.tiers).toHaveLength(1);
    });

    it('creates display config for new tier', () => {
      const { result } = renderHook(() => useTiersState(createInitialValues()));

      act(() => {
        result.current.addTier();
      });

      const newTierId = result.current.tiers[0].id;
      expect(result.current.tierDisplayConfigs[newTierId]).toBeDefined();
    });

    it('appends to existing tiers', () => {
      const tiers = [createTestTier({ id: 't1' })];
      const { result } = renderHook(() => useTiersState(createInitialValues({ tiers })));

      act(() => {
        result.current.addTier();
      });

      expect(result.current.tiers).toHaveLength(2);
      expect(result.current.tiers[0].id).toBe('t1');
    });
  });

  describe('removeTier', () => {
    it('removes a tier by id', () => {
      const tiers = [
        createTestTier({ id: 't1' }),
        createTestTier({ id: 't2' }),
      ];
      const { result } = renderHook(() => useTiersState(createInitialValues({ tiers })));

      act(() => {
        result.current.removeTier('t1');
      });

      expect(result.current.tiers).toHaveLength(1);
      expect(result.current.tiers[0].id).toBe('t2');
    });

    it('does not remove last tier', () => {
      const tiers = [createTestTier({ id: 't1' })];
      const { result } = renderHook(() => useTiersState(createInitialValues({ tiers })));

      act(() => {
        result.current.removeTier('t1');
      });

      expect(result.current.tiers).toHaveLength(1);
    });

    it('removes display config for removed tier', () => {
      const tiers = [
        createTestTier({ id: 't1' }),
        createTestTier({ id: 't2' }),
      ];
      const configs = {
        t1: { highlighted: false, highlightedFeatures: [], ctaText: '', ctaStyle: 'primary' as const, badgeText: '', showLimits: true, maxVisibleFeatures: 6, monthlyPrice: 0, annualPrice: 0, tagline: '' },
        t2: { highlighted: false, highlightedFeatures: [], ctaText: '', ctaStyle: 'primary' as const, badgeText: '', showLimits: true, maxVisibleFeatures: 6, monthlyPrice: 0, annualPrice: 0, tagline: '' },
      };
      const { result } = renderHook(() =>
        useTiersState(createInitialValues({ tiers, tierDisplayConfigs: configs }))
      );

      act(() => {
        result.current.removeTier('t1');
      });

      expect(result.current.tierDisplayConfigs['t1']).toBeUndefined();
      expect(result.current.tierDisplayConfigs['t2']).toBeDefined();
    });
  });

  describe('initializeTierDisplayConfigs', () => {
    it('creates display configs for all existing tiers', () => {
      const tiers = [
        createTestTier({ id: 't1' }),
        createTestTier({ id: 't2' }),
      ];
      const { result } = renderHook(() => useTiersState(createInitialValues({ tiers })));

      act(() => {
        result.current.initializeTierDisplayConfigs();
      });

      expect(result.current.tierDisplayConfigs['t1']).toBeDefined();
      expect(result.current.tierDisplayConfigs['t2']).toBeDefined();
    });
  });

  describe('setTierDisplayConfig', () => {
    it('updates display config for a tier', () => {
      const tiers = [createTestTier({ id: 't1' })];
      const configs = {
        t1: { highlighted: false, highlightedFeatures: [], ctaText: 'Original', ctaStyle: 'primary' as const, badgeText: '', showLimits: true, maxVisibleFeatures: 6, monthlyPrice: 0, annualPrice: 0, tagline: '' },
      };
      const { result } = renderHook(() =>
        useTiersState(createInitialValues({ tiers, tierDisplayConfigs: configs }))
      );

      act(() => {
        result.current.setTierDisplayConfig('t1', { ctaText: 'Updated' });
      });

      expect(result.current.tierDisplayConfigs['t1'].ctaText).toBe('Updated');
    });

    it('preserves other config properties', () => {
      const tiers = [createTestTier({ id: 't1' })];
      const configs = {
        t1: { highlighted: true, highlightedFeatures: [], ctaText: 'Original', ctaStyle: 'primary' as const, badgeText: 'Badge', showLimits: true, maxVisibleFeatures: 6, monthlyPrice: 0, annualPrice: 0, tagline: '' },
      };
      const { result } = renderHook(() =>
        useTiersState(createInitialValues({ tiers, tierDisplayConfigs: configs }))
      );

      act(() => {
        result.current.setTierDisplayConfig('t1', { ctaText: 'Updated' });
      });

      expect(result.current.tierDisplayConfigs['t1'].highlighted).toBe(true);
      expect(result.current.tierDisplayConfigs['t1'].badgeText).toBe('Badge');
    });
  });

  describe('setTierDisplayConfigs', () => {
    it('replaces all display configs', () => {
      const { result } = renderHook(() => useTiersState(createInitialValues()));

      const newConfigs = {
        t1: { highlighted: true, highlightedFeatures: [], ctaText: 'New', ctaStyle: 'secondary' as const, badgeText: '', showLimits: true, maxVisibleFeatures: 6, monthlyPrice: 0, annualPrice: 0, tagline: '' },
      };

      act(() => {
        result.current.setTierDisplayConfigs(newConfigs);
      });

      expect(result.current.tierDisplayConfigs).toEqual(newConfigs);
    });
  });
});
