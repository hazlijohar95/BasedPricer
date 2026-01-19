/**
 * Tests for useFeaturesState hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFeaturesState, type FeaturesStateInitialValues } from './useFeaturesState';
import { type Feature } from '../data/features';

// Test fixtures
const createTestFeature = (overrides: Partial<Feature> = {}): Feature => ({
  id: `feature-${Date.now()}-${Math.random()}`,
  name: 'Test Feature',
  description: 'A test feature',
  category: 'invoicing',
  complexity: 'medium',
  source: 'manual',
  valueProposition: 'Test value',
  hasLimit: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

const createInitialValues = (features: Feature[] = []): FeaturesStateInitialValues => ({
  features,
});

describe('useFeaturesState', () => {
  describe('initialization', () => {
    it('initializes with empty features array', () => {
      const { result } = renderHook(() => useFeaturesState(createInitialValues()));
      expect(result.current.features).toEqual([]);
    });

    it('initializes with provided features', () => {
      const features = [createTestFeature({ id: 'f1' }), createTestFeature({ id: 'f2' })];
      const { result } = renderHook(() => useFeaturesState(createInitialValues(features)));
      expect(result.current.features).toHaveLength(2);
      expect(result.current.features[0].id).toBe('f1');
    });
  });

  describe('setFeatures', () => {
    it('replaces all features', () => {
      const { result } = renderHook(() => useFeaturesState(createInitialValues([createTestFeature()])));

      const newFeatures = [createTestFeature({ id: 'new1' }), createTestFeature({ id: 'new2' })];
      act(() => {
        result.current.setFeatures(newFeatures);
      });

      expect(result.current.features).toHaveLength(2);
      expect(result.current.features[0].id).toBe('new1');
    });
  });

  describe('addFeature', () => {
    it('adds a feature to the list', () => {
      const { result } = renderHook(() => useFeaturesState(createInitialValues()));

      const newFeature = createTestFeature({ id: 'added', name: 'Added Feature' });
      act(() => {
        result.current.addFeature(newFeature);
      });

      expect(result.current.features).toHaveLength(1);
      expect(result.current.features[0].name).toBe('Added Feature');
    });

    it('appends to existing features', () => {
      const initial = [createTestFeature({ id: 'existing' })];
      const { result } = renderHook(() => useFeaturesState(createInitialValues(initial)));

      act(() => {
        result.current.addFeature(createTestFeature({ id: 'new' }));
      });

      expect(result.current.features).toHaveLength(2);
      expect(result.current.features[1].id).toBe('new');
    });
  });

  describe('updateFeature', () => {
    it('updates a specific feature', () => {
      const features = [createTestFeature({ id: 'f1', name: 'Original' })];
      const { result } = renderHook(() => useFeaturesState(createInitialValues(features)));

      act(() => {
        result.current.updateFeature('f1', { name: 'Updated' });
      });

      expect(result.current.features[0].name).toBe('Updated');
    });

    it('only updates the specified feature', () => {
      const features = [
        createTestFeature({ id: 'f1', name: 'First' }),
        createTestFeature({ id: 'f2', name: 'Second' }),
      ];
      const { result } = renderHook(() => useFeaturesState(createInitialValues(features)));

      act(() => {
        result.current.updateFeature('f1', { name: 'Updated First' });
      });

      expect(result.current.features[0].name).toBe('Updated First');
      expect(result.current.features[1].name).toBe('Second');
    });

    it('does nothing for non-existent feature', () => {
      const features = [createTestFeature({ id: 'f1' })];
      const { result } = renderHook(() => useFeaturesState(createInitialValues(features)));

      act(() => {
        result.current.updateFeature('nonexistent', { name: 'Updated' });
      });

      expect(result.current.features).toHaveLength(1);
      expect(result.current.features[0].id).toBe('f1');
    });
  });

  describe('removeFeature', () => {
    it('removes a feature by id', () => {
      const features = [
        createTestFeature({ id: 'f1' }),
        createTestFeature({ id: 'f2' }),
      ];
      const { result } = renderHook(() => useFeaturesState(createInitialValues(features)));

      act(() => {
        result.current.removeFeature('f1');
      });

      expect(result.current.features).toHaveLength(1);
      expect(result.current.features[0].id).toBe('f2');
    });

    it('does nothing for non-existent feature', () => {
      const features = [createTestFeature({ id: 'f1' })];
      const { result } = renderHook(() => useFeaturesState(createInitialValues(features)));

      act(() => {
        result.current.removeFeature('nonexistent');
      });

      expect(result.current.features).toHaveLength(1);
    });
  });

  describe('importCodebaseFeatures', () => {
    it('replaces codebase features while keeping manual features', () => {
      const initial = [
        createTestFeature({ id: 'codebase1', source: 'codebase' }),
        createTestFeature({ id: 'manual1', source: 'manual' }),
      ];
      const { result } = renderHook(() => useFeaturesState(createInitialValues(initial)));

      const newCodebaseFeatures = [
        createTestFeature({ id: 'newCodebase1', source: 'codebase' }),
        createTestFeature({ id: 'newCodebase2', source: 'codebase' }),
      ];

      act(() => {
        result.current.importCodebaseFeatures(newCodebaseFeatures);
      });

      expect(result.current.features).toHaveLength(3);
      expect(result.current.features.filter(f => f.source === 'codebase')).toHaveLength(2);
      expect(result.current.features.filter(f => f.source === 'manual')).toHaveLength(1);
    });

    it('preserves all manual features', () => {
      const manualFeatures = [
        createTestFeature({ id: 'manual1', source: 'manual' }),
        createTestFeature({ id: 'manual2', source: 'manual' }),
      ];
      const { result } = renderHook(() => useFeaturesState(createInitialValues(manualFeatures)));

      act(() => {
        result.current.importCodebaseFeatures([createTestFeature({ id: 'cb1', source: 'codebase' })]);
      });

      const manual = result.current.features.filter(f => f.source === 'manual');
      expect(manual).toHaveLength(2);
      expect(manual.map(f => f.id)).toContain('manual1');
      expect(manual.map(f => f.id)).toContain('manual2');
    });
  });
});
