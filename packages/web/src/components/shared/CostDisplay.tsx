import { useState } from 'react';
import { CaretDown, CurrencyDollar, Coins, Check } from '@phosphor-icons/react';
import { ProviderLogo } from '../ProviderLogos';
import type { AIProvider } from '../../services/api-keys';
import {
  formatCost,
  formatTokens,
  getCostCategory,
  type CostBreakdown,
  type CostEstimate,
  type ProviderComparison,
} from '../../utils/aiCostCalculator';
import { getPricingForProvider } from '../../data/ai-token-pricing';

// ============================================================================
// Cost Estimate Card - Shows estimated cost before analysis
// ============================================================================

interface CostEstimateCardProps {
  estimate: CostEstimate | null;
  comparisons?: ProviderComparison[];
  charCount?: number;
  fileCount?: number;
  onProviderChange?: (provider: AIProvider) => void;
}

export function CostEstimateCard({
  estimate,
  comparisons,
  charCount,
  fileCount,
  onProviderChange,
}: CostEstimateCardProps) {
  const [showComparison, setShowComparison] = useState(false);

  if (!estimate) return null;

  const category = getCostCategory(estimate.estimatedCostUSD);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CurrencyDollar size={18} weight="duotone" className="text-gray-500" />
          <span className="text-sm font-medium text-gray-900">Estimated Analysis Cost</span>
        </div>
        {estimate.confidence !== 'high' && (
          <span className={`text-[10px] px-2 py-0.5 rounded ${
            estimate.confidence === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {estimate.confidence === 'medium' ? 'Moderate confidence' : 'Rough estimate'}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-3 mb-3">
        <span className={`text-2xl font-semibold ${
          category === 'cheap' ? 'text-emerald-600' :
          category === 'moderate' ? 'text-amber-600' : 'text-red-600'
        }`}>
          ~{formatCost(estimate.estimatedCostUSD, estimate.estimatedCostMYR)}
        </span>
        <span className="text-xs text-gray-500">
          ~{formatTokens(estimate.estimatedTokens)} tokens
        </span>
      </div>

      {/* Context info */}
      {(charCount || fileCount) && (
        <p className="text-xs text-gray-500 mb-3">
          Based on {fileCount && `${fileCount} files`}
          {charCount && fileCount && ', '}
          {charCount && `~${(charCount / 1000).toFixed(1)}k characters`}
        </p>
      )}

      {/* Provider comparison toggle */}
      {comparisons && comparisons.length > 1 && (
        <div className="border-t border-gray-100 pt-3 mt-3">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="flex items-center gap-2 text-xs text-[#253ff6] hover:text-[#1e35d9] font-medium"
          >
            Compare Providers
            <CaretDown
              size={12}
              className={`transition-transform ${showComparison ? 'rotate-180' : ''}`}
            />
          </button>

          {showComparison && (
            <div className="mt-3 space-y-2">
              {comparisons.map((comp) => (
                <button
                  key={comp.provider}
                  onClick={() => onProviderChange?.(comp.provider)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                    comp.isSelected
                      ? 'border-[#253ff6]/30 bg-[#253ff6]/5'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ProviderLogo provider={comp.provider} size={16} />
                    <span className="text-xs font-medium text-gray-700">{comp.displayName}</span>
                    {comp.isSelected && (
                      <Check size={12} className="text-[#253ff6]" />
                    )}
                  </div>
                  <span className={`text-xs font-medium ${
                    comp.isSelected ? 'text-[#253ff6]' : 'text-gray-600'
                  }`}>
                    ~${comp.estimatedCostUSD.toFixed(3)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Real-time Cost Tracker - Shows cost during analysis
// ============================================================================

interface RealTimeCostTrackerProps {
  currentCost: number;
  provider: AIProvider;
  modelName?: string;
  isRunning: boolean;
}

export function RealTimeCostTracker({
  currentCost,
  provider: _provider,
  modelName: _modelName,
  isRunning,
}: RealTimeCostTrackerProps) {
  // Suppress unused var warning - these props are for future display enhancements
  void _provider;
  void _modelName;
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
      <Coins size={14} className="text-gray-500" />
      <span className="text-xs font-medium text-gray-700">
        ${currentCost.toFixed(4)}
      </span>
      {isRunning && (
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
          <span className="text-[10px] text-gray-500">Analyzing...</span>
        </span>
      )}
    </div>
  );
}

// ============================================================================
// Cost Summary - Shows full breakdown after analysis
// ============================================================================

interface CostSummaryProps {
  breakdown: CostBreakdown;
  otherProvidersCost?: ProviderComparison[];
  className?: string;
}

export function CostSummary({
  breakdown,
  otherProvidersCost,
  className = '',
}: CostSummaryProps) {
  const [showDetails, setShowDetails] = useState(false);

  const pricing = getPricingForProvider(breakdown.provider);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Coins size={18} weight="duotone" className="text-emerald-600" />
          <span className="text-sm font-medium text-gray-900">Analysis Cost</span>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          {showDetails ? 'Hide' : 'Show'} breakdown
          <CaretDown
            size={12}
            className={`transition-transform ${showDetails ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Total cost */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-xl font-semibold text-gray-900">
          ${breakdown.totalCostUSD.toFixed(4)}
        </span>
        <span className="text-sm text-gray-500">
          (MYR {breakdown.totalCostMYR.toFixed(4)})
        </span>
      </div>

      {/* Provider info */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
        <ProviderLogo provider={breakdown.provider} size={14} />
        <span>{breakdown.modelName}</span>
      </div>

      {/* Detailed breakdown */}
      {showDetails && pricing && (
        <div className="border-t border-gray-100 pt-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">
              Input: {formatTokens(breakdown.inputTokens)} tokens × ${pricing.inputPricePerMillion}/1M
            </span>
            <span className="text-gray-900 font-medium">${breakdown.inputCost.toFixed(4)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">
              Output: {formatTokens(breakdown.outputTokens)} tokens × ${pricing.outputPricePerMillion}/1M
            </span>
            <span className="text-gray-900 font-medium">${breakdown.outputCost.toFixed(4)}</span>
          </div>

          {/* Other providers comparison */}
          {otherProvidersCost && otherProvidersCost.length > 0 && (
            <div className="pt-2 mt-2 border-t border-gray-100">
              <p className="text-[10px] text-gray-500 mb-1.5">With other providers:</p>
              <div className="flex flex-wrap gap-2">
                {otherProvidersCost
                  .filter(p => !p.isSelected)
                  .map((p) => (
                    <span
                      key={p.provider}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded text-[10px] text-gray-600"
                    >
                      <ProviderLogo provider={p.provider} size={10} />
                      {p.displayName}: ~${p.estimatedCostUSD.toFixed(3)}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Provider Selector - Enhanced with pricing info
// ============================================================================

interface ProviderSelectorProps {
  selectedProvider: AIProvider;
  providers: AIProvider[];
  hasKey: Record<AIProvider, boolean>;
  onSelect: (provider: AIProvider) => void;
}

export function ProviderSelector({
  selectedProvider,
  providers,
  hasKey,
  onSelect,
}: ProviderSelectorProps) {
  return (
    <div className="space-y-2">
      {providers.map((provider) => {
        const pricing = getPricingForProvider(provider);
        const isSelected = selectedProvider === provider;
        const hasApiKey = hasKey[provider];

        return (
          <button
            key={provider}
            onClick={() => hasApiKey && onSelect(provider)}
            disabled={!hasApiKey}
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
              isSelected
                ? 'border-[#253ff6]/30 bg-[#253ff6]/5'
                : hasApiKey
                  ? 'border-gray-200 hover:border-gray-300'
                  : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-3">
              <ProviderLogo provider={provider} size={20} />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">
                  {pricing?.displayName ?? provider}
                </p>
                {pricing && (
                  <p className="text-[10px] text-gray-500">
                    ${pricing.inputPricePerMillion}/M in, ${pricing.outputPricePerMillion}/M out
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasApiKey && isSelected && (
                <Check size={16} className="text-[#253ff6]" />
              )}
              {!hasApiKey && (
                <span className="text-[10px] text-gray-400">No key</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Inline Cost Badge - Small indicator for showing cost inline
// ============================================================================

interface InlineCostBadgeProps {
  cost: number;
  label?: string;
}

export function InlineCostBadge({ cost, label }: InlineCostBadgeProps) {
  const category = getCostCategory(cost);

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
      category === 'cheap' ? 'bg-emerald-50 text-emerald-700' :
      category === 'moderate' ? 'bg-amber-50 text-amber-700' :
      'bg-red-50 text-red-700'
    }`}>
      {label && <span>{label}:</span>}
      ${cost.toFixed(3)}
    </span>
  );
}
