import { useMemo } from 'react';
import {
  Star,
  ArrowRight,
  Users,
  Target,
  Sparkle,
  CheckCircle,
  Lightning,
  Crown,
} from '@phosphor-icons/react';
import type { ReportData } from '../../utils/reportEncoder';
import type { Tier } from '../../data/tiers';
import type { Feature } from '../../data/features';

interface MarketerReportProps {
  reportData: ReportData;
}

// Helper to check if a tier is the "highlighted" one (popular choice)
function isHighlightedTier(tier: Tier): boolean {
  return tier.id === 'basic';
}

// Helper to check if feature is available in a tier
function isFeatureInTier(feature: Feature, tier: Tier): boolean {
  if (tier.excludedFeatures?.includes(feature.id)) return false;
  return tier.includedFeatures?.includes(feature.id) ?? false;
}

export function MarketerReport({ reportData }: MarketerReportProps) {
  const { state } = reportData;
  const { features, tiers } = state;

  // Get active tiers sorted by price
  const activeTiers = useMemo(() => {
    return tiers
      .filter((t: Tier) => t.status === 'active')
      .sort((a: Tier, b: Tier) => a.monthlyPriceMYR - b.monthlyPriceMYR);
  }, [tiers]);

  // Get highlight features per tier (features enabled in this tier but not in previous)
  const tierHighlights = useMemo(() => {
    const highlights: Record<string, Feature[]> = {};

    activeTiers.forEach((tier: Tier, index: number) => {
      const previousTier = index > 0 ? activeTiers[index - 1] : null;

      highlights[tier.id] = features.filter((feature: Feature) => {
        const inThisTier = isFeatureInTier(feature, tier);
        const inPrevTier = previousTier ? isFeatureInTier(feature, previousTier) : false;

        // Feature is a highlight if it's in this tier but not in the previous tier
        return inThisTier && !inPrevTier;
      });
    });

    return highlights;
  }, [activeTiers, features]);

  // Get tier icon based on position
  const getTierIcon = (index: number) => {
    switch (index) {
      case 0: return Users;
      case 1: return Star;
      case 2: return Lightning;
      case 3: return Crown;
      default: return Star;
    }
  };

  // Calculate annual savings
  const getAnnualSavings = (tier: Tier) => {
    if (!tier.annualPriceMYR || !tier.monthlyPriceMYR) return 0;
    const monthlyTotal = tier.monthlyPriceMYR * 12;
    return monthlyTotal - tier.annualPriceMYR;
  };

  return (
    <div className="space-y-6">
      {/* Positioning Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 report-section">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target size={18} className="text-violet-600" />
          Tier Positioning
        </h3>
        <div className="grid grid-cols-4 gap-4 print:grid-cols-2">
          {activeTiers.map((tier: Tier, index: number) => {
            const Icon = getTierIcon(index);
            const savings = getAnnualSavings(tier);
            const highlighted = isHighlightedTier(tier);

            return (
              <div
                key={tier.id}
                className={`relative p-5 rounded-lg border-2 ${
                  highlighted
                    ? 'border-[#253ff6] bg-[rgba(37,63,246,0.04)]'
                    : 'border-gray-200'
                }`}
              >
                {highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#253ff6] text-white text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    highlighted ? 'bg-[#253ff6] text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon size={16} weight="bold" />
                  </div>
                  <span className="font-semibold text-gray-900">{tier.name}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 font-mono mb-1">
                  {tier.monthlyPriceMYR === 0 ? 'Free' : `MYR ${tier.monthlyPriceMYR}`}
                  {tier.monthlyPriceMYR > 0 && (
                    <span className="text-sm font-normal text-gray-500">/mo</span>
                  )}
                </p>
                {savings > 0 && (
                  <p className="text-xs text-emerald-600 font-medium">
                    Save MYR {savings}/year on annual
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-2">{tier.targetAudience}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Highlights per Tier */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 report-section">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkle size={18} className="text-amber-500" />
          Key Features by Tier
        </h3>
        <div className="grid grid-cols-2 gap-6 print:grid-cols-2">
          {activeTiers.map((tier: Tier, index: number) => {
            const highlights = tierHighlights[tier.id] || [];
            const Icon = getTierIcon(index);
            const highlighted = isHighlightedTier(tier);

            return (
              <div key={tier.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    highlighted ? 'bg-[#253ff6] text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon size={12} weight="bold" />
                  </div>
                  <span className="font-medium text-gray-900">{tier.name}</span>
                  <span className="text-sm text-gray-500">
                    ({tier.monthlyPriceMYR === 0 ? 'Free' : `MYR ${tier.monthlyPriceMYR}/mo`})
                  </span>
                </div>
                <div className="pl-8 space-y-2">
                  {highlights.length > 0 ? (
                    highlights.slice(0, 5).map((feature) => (
                      <div key={feature.id} className="flex items-start gap-2">
                        <CheckCircle size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" weight="fill" />
                        <span className="text-sm text-gray-600">{feature.name}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      {index === 0 ? 'Basic features to get started' : 'All features from previous tier'}
                    </p>
                  )}
                  {highlights.length > 5 && (
                    <p className="text-xs text-gray-400">
                      +{highlights.length - 5} more features
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upgrade Path Messaging */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 report-section">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ArrowRight size={18} className="text-blue-600" />
          Upgrade Path Messaging
        </h3>
        <div className="space-y-4">
          {activeTiers.slice(0, -1).map((tier: Tier, index: number) => {
            const nextTier = activeTiers[index + 1];
            const highlights = tierHighlights[nextTier.id] || [];
            const priceDiff = nextTier.monthlyPriceMYR - tier.monthlyPriceMYR;

            return (
              <div
                key={tier.id}
                className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-700">{tier.name}</span>
                  <ArrowRight size={14} className="text-gray-400" />
                  <span className="font-medium text-blue-600">{nextTier.name}</span>
                  {priceDiff > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-auto">
                      +MYR {priceDiff}/mo
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Suggested CTA:</strong> "Upgrade to {nextTier.name} to unlock..."
                </p>
                <div className="flex flex-wrap gap-2">
                  {highlights.slice(0, 3).map((feature) => (
                    <span
                      key={feature.id}
                      className="text-xs bg-white border border-gray-200 px-2 py-1 rounded"
                    >
                      {feature.name}
                    </span>
                  ))}
                  {highlights.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{highlights.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Value Proposition Cards */}
      <div className="grid grid-cols-2 gap-6 print:grid-cols-1">
        {activeTiers.filter((t: Tier) => t.monthlyPriceMYR > 0).map((tier: Tier, index: number) => {
          const Icon = getTierIcon(index + 1); // +1 because we filtered out free
          const highlights = tierHighlights[tier.id] || [];
          const highlighted = isHighlightedTier(tier);

          return (
            <div
              key={tier.id}
              className={`rounded-lg border-2 overflow-hidden ${
                highlighted
                  ? 'border-[#253ff6]'
                  : 'border-gray-200'
              }`}
            >
              <div className={`p-4 ${
                highlighted
                  ? 'bg-[#253ff6] text-white'
                  : 'bg-gray-50 text-gray-900'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={20} weight="bold" />
                    <span className="font-semibold">{tier.name}</span>
                  </div>
                  <span className="font-bold font-mono">
                    MYR {tier.monthlyPriceMYR}/mo
                  </span>
                </div>
              </div>
              <div className="p-4 bg-white">
                <p className="text-sm text-gray-600 mb-3">{tier.tagline}</p>
                <p className="text-xs font-medium text-gray-500 mb-2">PERFECT FOR:</p>
                <p className="text-sm text-gray-700 mb-4">{tier.targetAudience}</p>
                <p className="text-xs font-medium text-gray-500 mb-2">KEY FEATURES:</p>
                <ul className="space-y-1.5">
                  {highlights.slice(0, 4).map((feature) => (
                    <li key={feature.id} className="flex items-start gap-2 text-sm">
                      <CheckCircle size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" weight="fill" />
                      <span className="text-gray-600">{feature.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Competitive Positioning */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-6 text-white report-section print:bg-gray-100 print:text-gray-900 print:border print:border-gray-300">
        <h3 className="font-semibold mb-4 flex items-center gap-2 print:text-gray-900">
          <Target size={18} />
          Marketing Quick Reference
        </h3>
        <div className="grid grid-cols-3 gap-6 print:grid-cols-3">
          <div>
            <p className="text-sm text-gray-400 print:text-gray-600 mb-2">Price Range</p>
            <p className="text-xl font-bold print:text-gray-900">
              {activeTiers[0]?.monthlyPriceMYR === 0 ? 'Free' : `MYR ${activeTiers[0]?.monthlyPriceMYR}`}
              {' - '}
              MYR {activeTiers[activeTiers.length - 1]?.monthlyPriceMYR}
            </p>
            <p className="text-xs text-gray-400 print:text-gray-600 mt-1">per month</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 print:text-gray-600 mb-2">Total Features</p>
            <p className="text-xl font-bold print:text-gray-900">{features.length}</p>
            <p className="text-xs text-gray-400 print:text-gray-600 mt-1">across all tiers</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 print:text-gray-600 mb-2">Recommended Tier</p>
            <p className="text-xl font-bold print:text-gray-900">
              {activeTiers.find((t: Tier) => isHighlightedTier(t))?.name || activeTiers[1]?.name || 'Basic'}
            </p>
            <p className="text-xs text-gray-400 print:text-gray-600 mt-1">best value for most users</p>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-700 print:border-gray-300">
          <p className="text-sm text-gray-400 print:text-gray-600 mb-2">Suggested Headlines</p>
          <ul className="space-y-2">
            <li className="text-sm print:text-gray-900">
              "Start free, scale as you grow"
            </li>
            <li className="text-sm print:text-gray-900">
              "Pricing that grows with your business"
            </li>
            <li className="text-sm print:text-gray-900">
              "{features.length}+ features, one simple price"
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
