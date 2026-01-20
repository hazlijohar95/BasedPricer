/**
 * Report Encoder Tests
 * Tests for data compression and encoding for shareable links
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  encodeReportCompressed,
  decodeReportCompressed,
  createPortableReportUrl,
  storeReport,
  retrieveReport,
  isValidReportData,
  getReportIndex,
  cleanupExpiredReports,
  deleteStoredReport,
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

  describe('report settings with growth rate', () => {
    it('should encode and decode report with settings', () => {
      const dataWithSettings: ReportData = {
        ...sampleData,
        settings: {
          monthlyGrowthRate: 0.08, // 8% growth
        },
      };

      const encoded = encodeReportCompressed(dataWithSettings);
      const decoded = decodeReportCompressed(encoded);

      expect(decoded.settings).toBeDefined();
      expect(decoded.settings?.monthlyGrowthRate).toBe(0.08);
    });

    it('should handle report without settings (backwards compatibility)', () => {
      const dataWithoutSettings: ReportData = {
        projectName: 'Legacy Project',
        createdAt: new Date().toISOString(),
        state: mockState,
        notes: {},
      };

      const encoded = encodeReportCompressed(dataWithoutSettings);
      const decoded = decodeReportCompressed(encoded);

      expect(decoded.projectName).toBe('Legacy Project');
      // Settings may or may not be present
    });

    it('should store and retrieve report with settings', () => {
      const dataWithSettings: ReportData = {
        ...sampleData,
        settings: {
          monthlyGrowthRate: 0.10, // 10% growth
        },
      };

      const id = storeReport(dataWithSettings);
      const retrieved = retrieveReport(id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.settings?.monthlyGrowthRate).toBe(0.10);
    });
  });

  describe('getReportIndex', () => {
    it('should return empty array when no reports stored', () => {
      const index = getReportIndex();
      expect(index).toEqual([]);
    });

    it('should include stored reports in index', () => {
      const id = storeReport(sampleData);
      const index = getReportIndex();

      expect(index.length).toBeGreaterThan(0);
      expect(index.find(r => r.id === id)).toBeDefined();
      expect(index.find(r => r.id === id)?.projectName).toBe(sampleData.projectName);
    });

    it('should include expiresAt in index entries', () => {
      const id = storeReport(sampleData);
      const index = getReportIndex();

      const entry = index.find(r => r.id === id);
      expect(entry?.expiresAt).toBeDefined();
      expect(entry?.expiresAt).toBeGreaterThan(Date.now());
    });
  });

  describe('deleteStoredReport', () => {
    it('should delete report from storage', () => {
      const id = storeReport(sampleData);

      // Verify it exists
      expect(retrieveReport(id)).not.toBeNull();

      // Delete it
      deleteStoredReport(id);

      // Verify it's gone
      expect(retrieveReport(id)).toBeNull();
    });

    it('should remove report from index', () => {
      const id = storeReport(sampleData);
      const indexBefore = getReportIndex();
      expect(indexBefore.find(r => r.id === id)).toBeDefined();

      deleteStoredReport(id);

      const indexAfter = getReportIndex();
      expect(indexAfter.find(r => r.id === id)).toBeUndefined();
    });
  });

  describe('TTL and expiration', () => {
    it('should store reports with expiresAt timestamp', () => {
      const id = storeReport(sampleData);
      const stored = localStorage.getItem(`pt-report-${id}`);

      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.expiresAt).toBeDefined();
      expect(parsed.expiresAt).toBeGreaterThan(parsed.createdAt);
    });

    it('should return null for expired reports', () => {
      const id = storeReport(sampleData);

      // Manually set the report as expired
      const stored = localStorage.getItem(`pt-report-${id}`);
      const parsed = JSON.parse(stored!);
      parsed.expiresAt = Date.now() - 1000; // Expired 1 second ago
      localStorage.setItem(`pt-report-${id}`, JSON.stringify(parsed));

      // Should return null and delete the report
      const retrieved = retrieveReport(id);
      expect(retrieved).toBeNull();
    });

    it('should auto-delete expired report when retrieved', () => {
      const id = storeReport(sampleData);

      // Manually set the report as expired
      const stored = localStorage.getItem(`pt-report-${id}`);
      const parsed = JSON.parse(stored!);
      parsed.expiresAt = Date.now() - 1000;
      localStorage.setItem(`pt-report-${id}`, JSON.stringify(parsed));

      // Retrieve (should return null and delete)
      retrieveReport(id);

      // Verify it's deleted from storage
      expect(localStorage.getItem(`pt-report-${id}`)).toBeNull();
    });
  });

  describe('cleanupExpiredReports', () => {
    it('should return 0 when no reports exist', () => {
      const removed = cleanupExpiredReports();
      expect(removed).toBe(0);
    });

    it('should not remove non-expired reports', () => {
      const id = storeReport(sampleData);
      const removed = cleanupExpiredReports();

      expect(removed).toBe(0);
      expect(retrieveReport(id)).not.toBeNull();
    });

    it('should remove expired reports', () => {
      // Store a report
      const id = storeReport(sampleData);

      // Manually expire it
      const stored = localStorage.getItem(`pt-report-${id}`);
      const parsed = JSON.parse(stored!);
      parsed.expiresAt = Date.now() - 1000;
      localStorage.setItem(`pt-report-${id}`, JSON.stringify(parsed));

      // Update index with expired timestamp
      const index = getReportIndex();
      const updatedIndex = index.map(r =>
        r.id === id ? { ...r, expiresAt: Date.now() - 1000 } : r
      );
      localStorage.setItem('pt-reports-index', JSON.stringify(updatedIndex));

      // Cleanup
      const removed = cleanupExpiredReports();
      expect(removed).toBe(1);

      // Verify report is gone
      expect(localStorage.getItem(`pt-report-${id}`)).toBeNull();
    });

    it('should handle mixed expired and non-expired reports', () => {
      // Store two reports
      const id1 = storeReport(sampleData);
      const id2 = storeReport({ ...sampleData, projectName: 'Second Project' });

      // Expire only the first one
      const stored = localStorage.getItem(`pt-report-${id1}`);
      const parsed = JSON.parse(stored!);
      parsed.expiresAt = Date.now() - 1000;
      localStorage.setItem(`pt-report-${id1}`, JSON.stringify(parsed));

      // Update index
      const index = getReportIndex();
      const updatedIndex = index.map(r =>
        r.id === id1 ? { ...r, expiresAt: Date.now() - 1000 } : r
      );
      localStorage.setItem('pt-reports-index', JSON.stringify(updatedIndex));

      // Cleanup
      const removed = cleanupExpiredReports();
      expect(removed).toBe(1);

      // First should be gone, second should remain
      expect(localStorage.getItem(`pt-report-${id1}`)).toBeNull();
      expect(retrieveReport(id2)).not.toBeNull();
    });
  });
});
