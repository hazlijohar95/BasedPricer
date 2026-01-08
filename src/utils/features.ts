import { features } from '../data/features';
import type { Tier } from '../data/tiers';

export function getFeatureName(featureId: string): string {
  return features.find(f => f.id === featureId)?.name || featureId;
}

export function getFeatureCategory(featureId: string): string {
  return features.find(f => f.id === featureId)?.category || '';
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
