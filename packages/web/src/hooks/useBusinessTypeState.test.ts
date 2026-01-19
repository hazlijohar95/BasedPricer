/**
 * Tests for useBusinessTypeState hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBusinessTypeState, type BusinessTypeStateInitialValues } from './useBusinessTypeState';

const createInitialValues = (
  overrides: Partial<BusinessTypeStateInitialValues> = {}
): BusinessTypeStateInitialValues => ({
  businessType: null,
  businessTypeConfidence: 0,
  pricingModelType: 'feature_tiered',
  utilizationRate: 0.7,
  ...overrides,
});

describe('useBusinessTypeState', () => {
  describe('initialization', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useBusinessTypeState(createInitialValues()));

      expect(result.current.businessType).toBeNull();
      expect(result.current.businessTypeConfidence).toBe(0);
      expect(result.current.pricingModelType).toBe('feature_tiered');
      expect(result.current.utilizationRate).toBe(0.7);
    });

    it('initializes with provided values', () => {
      const { result } = renderHook(() =>
        useBusinessTypeState(
          createInitialValues({
            businessType: 'saas',
            businessTypeConfidence: 0.85,
            pricingModelType: 'usage_based',
            utilizationRate: 0.5,
          })
        )
      );

      expect(result.current.businessType).toBe('saas');
      expect(result.current.businessTypeConfidence).toBe(0.85);
      expect(result.current.pricingModelType).toBe('usage_based');
      expect(result.current.utilizationRate).toBe(0.5);
    });
  });

  describe('setBusinessType', () => {
    it('sets business type and confidence', () => {
      const { result } = renderHook(() => useBusinessTypeState(createInitialValues()));

      act(() => {
        result.current.setBusinessType('saas', 0.9);
      });

      expect(result.current.businessType).toBe('saas');
      expect(result.current.businessTypeConfidence).toBe(0.9);
    });

    it('updates pricing model type based on business type', () => {
      const { result } = renderHook(() => useBusinessTypeState(createInitialValues()));

      act(() => {
        result.current.setBusinessType('marketplace', 0.8);
      });

      // Marketplace should use take_rate pricing model
      expect(result.current.pricingModelType).toBe('take_rate');
    });

    it('handles different business types', () => {
      const { result } = renderHook(() => useBusinessTypeState(createInitialValues()));

      act(() => {
        result.current.setBusinessType('api_service', 0.75);
      });

      expect(result.current.businessType).toBe('api_service');
      expect(result.current.pricingModelType).toBe('usage_based');
    });
  });

  describe('setPricingModelType', () => {
    it('sets pricing model type directly', () => {
      const { result } = renderHook(() => useBusinessTypeState(createInitialValues()));

      act(() => {
        result.current.setPricingModelType('usage_based');
      });

      expect(result.current.pricingModelType).toBe('usage_based');
    });

    it('allows all valid pricing model types', () => {
      const { result } = renderHook(() => useBusinessTypeState(createInitialValues()));

      const modelTypes = ['feature_tiered', 'usage_based', 'seat_based', 'take_rate', 'hybrid', 'freemium'] as const;

      for (const model of modelTypes) {
        act(() => {
          result.current.setPricingModelType(model);
        });
        expect(result.current.pricingModelType).toBe(model);
      }
    });
  });

  describe('setUtilizationRate', () => {
    it('sets utilization rate', () => {
      const { result } = renderHook(() => useBusinessTypeState(createInitialValues()));

      act(() => {
        result.current.setUtilizationRate(0.5);
      });

      expect(result.current.utilizationRate).toBe(0.5);
    });

    it('clamps utilization rate to minimum 0', () => {
      const { result } = renderHook(() => useBusinessTypeState(createInitialValues()));

      act(() => {
        result.current.setUtilizationRate(-0.5);
      });

      expect(result.current.utilizationRate).toBe(0);
    });

    it('clamps utilization rate to maximum 1', () => {
      const { result } = renderHook(() => useBusinessTypeState(createInitialValues()));

      act(() => {
        result.current.setUtilizationRate(1.5);
      });

      expect(result.current.utilizationRate).toBe(1);
    });

    it('allows boundary values', () => {
      const { result } = renderHook(() => useBusinessTypeState(createInitialValues()));

      act(() => {
        result.current.setUtilizationRate(0);
      });
      expect(result.current.utilizationRate).toBe(0);

      act(() => {
        result.current.setUtilizationRate(1);
      });
      expect(result.current.utilizationRate).toBe(1);
    });
  });

  describe('getBusinessTypeTemplate', () => {
    it('returns tier templates for business type', () => {
      const { result } = renderHook(() => useBusinessTypeState(createInitialValues()));

      let template: ReturnType<typeof result.current.getBusinessTypeTemplate>;
      act(() => {
        template = result.current.getBusinessTypeTemplate('saas');
      });

      expect(template!.tiers).toBeDefined();
      expect(Array.isArray(template!.tiers)).toBe(true);
      expect(template!.tierDisplayConfigs).toBeDefined();
      expect(template!.pricingModelType).toBeDefined();
    });

    it('returns display configs matching tiers', () => {
      const { result } = renderHook(() => useBusinessTypeState(createInitialValues()));

      let template: ReturnType<typeof result.current.getBusinessTypeTemplate>;
      act(() => {
        template = result.current.getBusinessTypeTemplate('saas');
      });

      // Each tier should have a corresponding display config
      for (const tier of template!.tiers) {
        expect(template!.tierDisplayConfigs[tier.id]).toBeDefined();
      }
    });

    it('does not mutate state', () => {
      const { result } = renderHook(() =>
        useBusinessTypeState(createInitialValues({ businessType: 'ecommerce' }))
      );

      act(() => {
        result.current.getBusinessTypeTemplate('saas');
      });

      // Original business type should be unchanged
      expect(result.current.businessType).toBe('ecommerce');
    });
  });
});
