import { useMemo } from 'react';
import {
  Package,
  Stack,
  Check,
  X,
  Minus,
  Code,
  Gauge,
  Info,
} from '@phosphor-icons/react';
import type { ReportData } from '../../utils/reportEncoder';
import type { Tier, TierLimit } from '../../data/tiers';
import type { Feature } from '../../data/features';

interface EngineerReportProps {
  reportData: ReportData;
}

// Helper to check if a tier is the "highlighted" one (popular choice)
function isHighlightedTier(tier: Tier): boolean {
  return tier.id === 'basic' || tier.id === 'pro';
}

// Helper to get tier access for a feature
function getFeatureAccessForTier(feature: Feature, tier: Tier): 'none' | 'unlimited' | number | string {
  // Check if feature is excluded
  if (tier.excludedFeatures?.includes(feature.id)) {
    return 'none';
  }

  // Check if feature is included
  if (!tier.includedFeatures?.includes(feature.id)) {
    return 'none';
  }

  // Check for limit
  const limit = tier.limits?.find((l: TierLimit) => l.featureId === feature.id);
  if (limit) {
    if (limit.limit === 'unlimited') return 'unlimited';
    if (typeof limit.limit === 'boolean') return limit.limit ? 'unlimited' : 'none';
    return limit.limit;
  }

  // Feature included but no specific limit = unlimited
  return 'unlimited';
}

// Helper to get a specific limit from tier
function getTierLimit(tier: Tier, featureId: string): number | string | null {
  const limit = tier.limits?.find((l: TierLimit) => l.featureId === featureId);
  if (!limit) return null;
  if (limit.limit === 'unlimited') return null;
  if (typeof limit.limit === 'boolean') return null;
  return limit.limit;
}

export function EngineerReport({ reportData }: EngineerReportProps) {
  const { state } = reportData;
  const { features, tiers } = state;

  // Group features by category
  const featuresByCategory = useMemo(() => {
    const grouped: Record<string, typeof features> = {};
    features.forEach((feature) => {
      if (!grouped[feature.category]) {
        grouped[feature.category] = [];
      }
      grouped[feature.category].push(feature);
    });
    return grouped;
  }, [features]);

  // Get active tiers
  const activeTiers = tiers.filter((t) => t.status === 'active');

  // Format access for display
  const formatAccess = (access: 'none' | 'unlimited' | number | string) => {
    if (access === 'none') {
      return { icon: X, text: '—', color: 'text-gray-300' };
    }
    if (access === 'unlimited') {
      return { icon: Check, text: 'Unlimited', color: 'text-emerald-600' };
    }
    return { icon: Minus, text: String(access), color: 'text-blue-600' };
  };

  // Category display names
  const categoryNames: Record<string, string> = {
    invoicing: 'Invoicing & Billing',
    document_management: 'Document Management',
    ai_extraction: 'AI Document Extraction',
    accounting_ai: 'AI Accounting',
    email: 'Email System',
    payments: 'Payment Processing',
    team: 'Team & Access Control',
    reporting: 'Reporting & Analytics',
    integrations: 'Integrations & API',
    support: 'Support & Services',
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 print:grid-cols-2">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Package size={18} className="text-violet-600" />
            <span className="text-sm text-gray-500">Total Features</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{features.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Stack size={18} className="text-blue-600" />
            <span className="text-sm text-gray-500">Active Tiers</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{activeTiers.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Code size={18} className="text-emerald-600" />
            <span className="text-sm text-gray-500">Categories</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {Object.keys(featuresByCategory).length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Gauge size={18} className="text-amber-600" />
            <span className="text-sm text-gray-500">Utilization Rate</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {((state.utilizationRate || 0.7) * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Tier Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 report-section">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Stack size={18} className="text-violet-600" />
          Tier Configuration
        </h3>
        <div className="grid grid-cols-4 gap-4 print:grid-cols-2">
          {activeTiers.map((tier) => {
            const highlighted = isHighlightedTier(tier);
            return (
              <div
                key={tier.id}
                className={`p-4 rounded-lg border-2 ${
                  highlighted
                    ? 'border-[#253ff6] bg-[rgba(37,63,246,0.04)]'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{tier.name}</h4>
                  {highlighted && (
                    <span className="text-[10px] bg-[#253ff6] text-white px-1.5 py-0.5 rounded font-medium">
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900 font-mono">
                  {tier.monthlyPriceMYR === 0 ? 'Free' : `MYR ${tier.monthlyPriceMYR}`}
                </p>
                <p className="text-xs text-gray-500 mt-1">{tier.targetAudience}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Matrix by Category */}
      {Object.entries(featuresByCategory).map(([category, categoryFeatures]) => (
        <div key={category} className="bg-white rounded-lg border border-gray-200 overflow-hidden report-section print:overflow-visible">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">
              {categoryNames[category] || category}
            </h3>
            <p className="text-sm text-gray-500">{categoryFeatures.length} features</p>
          </div>
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-1/3">Feature</th>
                  {activeTiers.map((tier) => (
                    <th key={tier.id} className="text-center px-4 py-3 font-medium text-gray-600">
                      {tier.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categoryFeatures.map((feature) => (
                  <tr key={feature.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{feature.name}</p>
                        {feature.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{feature.description}</p>
                        )}
                      </div>
                    </td>
                    {activeTiers.map((tier) => {
                      const access = getFeatureAccessForTier(feature, tier);
                      const { icon: Icon, text, color } = formatAccess(access);
                      return (
                        <td key={tier.id} className="px-4 py-3 text-center">
                          <div className={`inline-flex items-center gap-1 ${color}`}>
                            <Icon size={14} weight="bold" />
                            <span className="text-xs font-medium">{text}</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Tier Limits Detail */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 report-section">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Gauge size={18} className="text-amber-600" />
          Tier Limits & Quotas
        </h3>
        <div className="grid grid-cols-2 gap-6 print:grid-cols-2">
          {activeTiers.map((tier) => {
            const docsLimit = getTierLimit(tier, 'invoice_create');
            const storageLimit = getTierLimit(tier, 'dataroom_storage');
            const teamLimit = getTierLimit(tier, 'team_members');
            const ocrLimit = getTierLimit(tier, 'ocr_extraction');

            return (
              <div key={tier.id} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">{tier.name}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Invoices per month</span>
                    <span className="font-medium text-gray-900">
                      {docsLimit === null ? 'Unlimited' : docsLimit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Storage (GB)</span>
                    <span className="font-medium text-gray-900">
                      {storageLimit === null ? 'Unlimited' : storageLimit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Team members</span>
                    <span className="font-medium text-gray-900">
                      {teamLimit === null ? 'Unlimited' : teamLimit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">OCR extractions per month</span>
                    <span className="font-medium text-gray-900">
                      {ocrLimit === null ? 'Unlimited' : ocrLimit}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Implementation Notes */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 report-section">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Info size={18} className="text-blue-600" />
          Implementation Notes
        </h3>
        <div className="prose prose-sm max-w-none text-gray-600">
          <ul className="space-y-2">
            <li>
              <strong>Feature Flags:</strong> Each feature should have a corresponding feature flag
              that checks the user's tier and current usage against limits.
            </li>
            <li>
              <strong>Metering:</strong> Track usage for quota-limited features (invoices, OCR extractions,
              storage) and enforce soft/hard limits based on tier configuration.
            </li>
            <li>
              <strong>Upgrade Prompts:</strong> When users hit limits, display contextual upgrade
              prompts showing what they'd get with the next tier.
            </li>
            <li>
              <strong>Grace Period:</strong> Consider implementing a grace period for users who
              slightly exceed limits to avoid disrupting workflows.
            </li>
            <li>
              <strong>Utilization Rate:</strong> Current estimate is {((state.utilizationRate || 0.7) * 100).toFixed(0)}%
              of limits being used. Plan infrastructure accordingly.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
