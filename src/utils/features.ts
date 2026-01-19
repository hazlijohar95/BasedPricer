import { features, type Feature } from '../data/features';
import type { Tier } from '../data/tiers';

/**
 * Get a feature by ID, returns undefined if not found
 * This is the safe way to look up features - always handle the undefined case
 */
export function getFeatureById(featureId: string): Feature | undefined {
  return features.find(f => f.id === featureId);
}

/**
 * Get feature name with fallback to featureId if not found
 */
export function getFeatureName(featureId: string): string {
  return features.find(f => f.id === featureId)?.name || featureId;
}

/**
 * Get feature category with fallback to empty string if not found
 */
export function getFeatureCategory(featureId: string): string {
  return features.find(f => f.id === featureId)?.category || '';
}

/**
 * Check if a feature exists (useful before performing operations)
 */
export function featureExists(featureId: string): boolean {
  return features.some(f => f.id === featureId);
}

/**
 * Filter feature IDs to only include valid, existing features
 * Useful for cleaning up stale references
 */
export function filterValidFeatureIds(featureIds: string[]): string[] {
  return featureIds.filter(id => featureExists(id));
}

export function getFeatureLimit(tier: Tier, featureId: string): string | null {
  const limit = tier.limits.find(l => l.featureId === featureId);
  if (!limit) return null;
  if (limit.limit === 'unlimited') return 'Unlimited';
  if (typeof limit.limit === 'boolean') return limit.limit ? 'Yes' : 'No';
  return `${limit.limit} ${limit.unit || ''}`.trim();
}

export function calculateDiscount(monthly: number, annual: number): number {
  if (monthly <= 0) return 0;
  const fullYear = monthly * 12;
  return Math.round(((fullYear - annual) / fullYear) * 100);
}
