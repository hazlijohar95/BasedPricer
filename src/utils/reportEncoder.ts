// URL-safe encoding/decoding for shareable report links
// Uses compression + multiple storage strategies for optimal sharing
// Now uses Zod schemas for runtime validation

import LZString from 'lz-string';
import type { PricingState } from '../context/PricingContext';
import {
  type ReportData as SchemaReportData,
  isValidReportData as zodIsValidReportData,
  parseReportDataSafe,
} from '../schemas/reports';

// Re-export the type from schemas for backwards compatibility
export type ReportData = SchemaReportData;

// Storage key prefix for localStorage
const STORAGE_PREFIX = 'pt-report-';
const REPORT_INDEX_KEY = 'pt-reports-index';

// ============================================================================
// Compression-based encoding (for URL sharing)
// ============================================================================

/**
 * Encode report data to a compressed, URL-safe string
 * Uses LZ compression which typically achieves 60-80% reduction
 */
export function encodeReportCompressed(data: ReportData): string {
  try {
    const json = JSON.stringify(data);
    // Use LZ-String's URI-safe compression
    const compressed = LZString.compressToEncodedURIComponent(json);
    return compressed;
  } catch (e) {
    console.error('Failed to encode report:', e);
    throw new Error('Failed to encode report data');
  }
}

/**
 * Decode report data from compressed URL-safe string
 * Includes Zod validation for safety
 */
export function decodeReportCompressed(compressed: string): ReportData {
  try {
    const json = LZString.decompressFromEncodedURIComponent(compressed);
    if (!json) {
      throw new Error('Decompression failed');
    }
    const parsed = JSON.parse(json);

    // Use Zod-based safe parsing which handles legacy data with partial defaults
    const validated = parseReportDataSafe(parsed);
    if (!validated) {
      throw new Error('Invalid report structure');
    }

    return validated;
  } catch (e) {
    console.error('Failed to decode report:', e);
    throw new Error('Invalid report data');
  }
}

// ============================================================================
// Short ID-based storage (localStorage)
// ============================================================================

/**
 * Generate a short, readable ID (8 characters)
 */
function generateShortId(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'; // Removed confusing chars like 0,O,l,1
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

/**
 * Store report data in localStorage and return a short ID
 */
export function storeReport(data: ReportData): string {
  const id = generateShortId();
  const storageKey = STORAGE_PREFIX + id;

  try {
    // Store the report
    localStorage.setItem(storageKey, JSON.stringify({
      data,
      createdAt: Date.now(),
    }));

    // Update the index
    const index = getReportIndex();
    index.push({
      id,
      projectName: data.projectName,
      createdAt: Date.now(),
    });
    localStorage.setItem(REPORT_INDEX_KEY, JSON.stringify(index));

    return id;
  } catch (e) {
    console.error('Failed to store report:', e);
    throw new Error('Failed to store report');
  }
}

/**
 * Retrieve report data from localStorage by ID
 * Includes Zod validation for safety
 */
export function retrieveReport(id: string): ReportData | null {
  const storageKey = STORAGE_PREFIX + id;
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return null;

    const { data } = JSON.parse(stored);

    // Use Zod-based safe parsing which handles legacy data
    const validated = parseReportDataSafe(data);
    return validated;
  } catch (e) {
    console.error('Failed to retrieve report:', e);
    return null;
  }
}

/**
 * Get index of all stored reports
 */
export function getReportIndex(): { id: string; projectName: string; createdAt: number }[] {
  try {
    const index = localStorage.getItem(REPORT_INDEX_KEY);
    return index ? JSON.parse(index) : [];
  } catch {
    return [];
  }
}

/**
 * Delete a stored report
 */
export function deleteStoredReport(id: string): void {
  const storageKey = STORAGE_PREFIX + id;
  localStorage.removeItem(storageKey);

  // Update index
  const index = getReportIndex().filter(r => r.id !== id);
  localStorage.setItem(REPORT_INDEX_KEY, JSON.stringify(index));
}

// ============================================================================
// URL Generation
// ============================================================================

type StakeholderType = 'accountant' | 'investor' | 'engineer' | 'marketer';

/**
 * Create a short URL using localStorage storage
 * Best for: sharing within same browser/device
 */
export function createShortReportUrl(
  baseUrl: string,
  data: ReportData,
  stakeholder: StakeholderType
): { url: string; id: string } {
  const id = storeReport(data);
  return {
    url: `${baseUrl}/r/${id}/${stakeholder}`,
    id,
  };
}

/**
 * Create a portable URL with compressed data
 * Best for: cross-browser/device sharing
 */
export function createPortableReportUrl(
  baseUrl: string,
  data: ReportData,
  stakeholder: StakeholderType
): string {
  const compressed = encodeReportCompressed(data);
  return `${baseUrl}/report/${stakeholder}?d=${compressed}`;
}

/**
 * Generate all stakeholder URLs (both short and portable versions)
 */
export function generateAllReportUrls(
  baseUrl: string,
  data: ReportData
): {
  short: Record<StakeholderType, string>;
  portable: Record<StakeholderType, string>;
  shortId: string;
} {
  // Store once for all short URLs
  const id = storeReport(data);
  const compressed = encodeReportCompressed(data);

  const stakeholders: StakeholderType[] = ['accountant', 'investor', 'engineer', 'marketer'];

  const short: Record<string, string> = {};
  const portable: Record<string, string> = {};

  stakeholders.forEach(s => {
    short[s] = `${baseUrl}/r/${id}/${s}`;
    portable[s] = `${baseUrl}/report/${s}?d=${compressed}`;
  });

  return {
    short: short as Record<StakeholderType, string>,
    portable: portable as Record<StakeholderType, string>,
    shortId: id,
  };
}

// ============================================================================
// Decoding (handles both formats)
// ============================================================================

/**
 * Decode report from either short ID or compressed data
 */
export function decodeReport(idOrCompressed: string, isCompressed: boolean = false): ReportData {
  if (isCompressed) {
    return decodeReportCompressed(idOrCompressed);
  }

  // Try localStorage first
  const stored = retrieveReport(idOrCompressed);
  if (stored) return stored;

  // Fallback: try to decode as compressed (for backwards compatibility)
  try {
    return decodeReportCompressed(idOrCompressed);
  } catch {
    throw new Error('Invalid report data');
  }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Create a ReportData object from current pricing state
 */
export function createReportData(
  projectName: string,
  state: PricingState,
  notes?: ReportData['notes'],
  selectedMockup?: string
): ReportData {
  return {
    projectName,
    createdAt: new Date().toISOString(),
    state,
    notes: notes || {},
    selectedMockup,
  };
}

/**
 * Validate that a report data object has required fields
 * Now uses Zod schema validation for consistency
 */
export function isValidReportData(data: unknown): data is ReportData {
  return zodIsValidReportData(data);
}

/**
 * Estimate compressed URL length
 */
export function estimateCompressedUrlLength(data: ReportData): number {
  const compressed = encodeReportCompressed(data);
  // Add ~30 chars for base URL and path structure
  return compressed.length + 30;
}

/**
 * Check if the portable URL might be too long for some services
 */
export function isUrlTooLong(data: ReportData, maxLength: number = 2000): boolean {
  return estimateCompressedUrlLength(data) > maxLength;
}

/**
 * Get URL length comparison for user feedback
 */
export function getUrlStats(data: ReportData): {
  shortUrlLength: number;
  portableUrlLength: number;
  compressionRatio: number;
} {
  const json = JSON.stringify(data);
  const compressed = encodeReportCompressed(data);

  return {
    shortUrlLength: 35, // approximate: /r/{8-char-id}/{stakeholder}
    portableUrlLength: compressed.length + 30,
    compressionRatio: Math.round((1 - compressed.length / json.length) * 100),
  };
}
