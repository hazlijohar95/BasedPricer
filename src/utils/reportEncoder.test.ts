/**
 * Report Encoder Tests
 * Tests for data compression and encoding for shareable links
 */

import { describe, it, expect } from 'vitest';
import {
  encodeReportCompressed,
  decodeReportCompressed,
  createPortableReportUrl,
  storeReport,
  retrieveReport,
  isValidReportData,
  type ReportData,
} from './reportEncoder';

// Mock PricingState for tests
const mockState = {
  variableCosts: [],
  fixedCosts: [],
  customerCount: 100,
  selectedPrice: 50,
  tiers: [],
  tierDisplayConfigs: {},
  features: [],
  utilizationRate: 1,
  tierDistribution: {},
  businessType: null,
  businessTypeConfidence: 0,
  pricingModelType: 'feature_tiered' as const,
};

const sampleData: ReportData = {
  projectName: 'Test Project',
  createdAt: new Date().toISOString(),
  state: mockState,
  notes: {
    investor: 'Investment ready',
  },
};

describe('reportEncoder', () => {
  describe('encodeReportCompressed and decodeReportCompressed', () => {
    it('should encode and decode data correctly', () => {
      const encoded = encodeReportCompressed(sampleData);
      const decoded = decodeReportCompressed(encoded);

      expect(decoded.projectName).toEqual(sampleData.projectName);
      expect(decoded.notes).toEqual(sampleData.notes);
    });

    it('should produce compressed output', () => {
      const encoded = encodeReportCompressed(sampleData);

      // Encoded should be reasonably sized
      expect(encoded.length).toBeGreaterThan(0);
      expect(typeof encoded).toBe('string');
    });

    it('should handle complex nested data', () => {
      const complexData: ReportData = {
        ...sampleData,
        notes: {
          investor: 'Complex notes with special chars: $€¥',
          engineer: 'Technical specs',
        },
      };

      const encoded = encodeReportCompressed(complexData);
      const decoded = decodeReportCompressed(encoded);

      expect(decoded.notes).toEqual(complexData.notes);
    });
  });

  describe('decodeReportCompressed error handling', () => {
    it('should throw for invalid encoded data', () => {
      expect(() => decodeReportCompressed('invalid-data-123')).toThrow();
    });

    it('should throw for empty string', () => {
      expect(() => decodeReportCompressed('')).toThrow();
    });
  });

  describe('createPortableReportUrl', () => {
    it('should create a valid URL with encoded data', () => {
      const url = createPortableReportUrl('https://example.com', sampleData, 'investor');

      expect(url).toContain('/report/investor');
      expect(url).toContain('d=');
    });

    it('should create URL for different stakeholder types', () => {
      const stakeholders = ['investor', 'accountant', 'engineer', 'marketer'] as const;

      stakeholders.forEach(stakeholder => {
        const url = createPortableReportUrl('https://example.com', sampleData, stakeholder);
        expect(url).toContain(`/report/${stakeholder}`);
      });
    });
  });

  describe('storeReport and retrieveReport', () => {
    it('should store and retrieve report from localStorage', () => {
      const id = storeReport(sampleData);

      expect(id).toHaveLength(8);

      const retrieved = retrieveReport(id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.projectName).toBe(sampleData.projectName);
    });

    it('should return null for non-existent report', () => {
      const retrieved = retrieveReport('nonexistent');
      expect(retrieved).toBeNull();
    });
  });

  describe('isValidReportData', () => {
    it('should validate correct report data', () => {
      expect(isValidReportData(sampleData)).toBe(true);
    });

    it('should reject null', () => {
      expect(isValidReportData(null)).toBe(false);
    });

    it('should reject non-objects', () => {
      expect(isValidReportData('string')).toBe(false);
      expect(isValidReportData(123)).toBe(false);
    });

    it('should reject missing required fields', () => {
      expect(isValidReportData({ projectName: 'Test' })).toBe(false);
      expect(isValidReportData({ createdAt: 'now' })).toBe(false);
    });
  });
});
