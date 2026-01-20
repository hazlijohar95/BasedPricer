import { useState, useMemo, useCallback } from 'react';
import { Copy, DownloadSimple, MagnifyingGlass, Plus, X, Star, Infinity as InfinityIcon, ArrowCounterClockwise, Lightning } from '@phosphor-icons/react';
import { calculateTierVariableCosts, type Tier, type TierLimit } from '../data/tiers';
import { featureCategories, type FeatureCategory } from '../data/features';
import { usePricing } from '../context/PricingContext';
import { useNavigation } from '../context/NavigationContext';
import { deriveCostRatesFromVariableCosts } from '../utils/costRates';
import { BUSINESS_TYPES } from '../data/business-types';
import { getRecommendedTierCount } from '../data/tier-templates';
import { EmptyState, TabToggle, type TabOption } from './shared';
import { TierCardsGrid } from './tiers';
import { MARGIN_THRESHOLDS } from '../constants';

type ViewMode = 'overview' | 'limits' | 'features' | 'highlights';

export function TierConfigurator() {
  // Get tiers, features, and variableCosts from global context
  const {
    tiers,
    setTiers,
    updateTier: contextUpdateTier,
    features,
    variableCosts,
    utilizationRate,
    businessType,
    businessTypeConfidence,
    applyBusinessTypeTemplate,
    setTierCount,
    addTier,
    showToast,
  } = usePricing();
  const { navigateTo } = useNavigation();

  // Derive cost rates from context's variableCosts (single source of truth)
  // This ensures TierConfigurator uses the same rates as COGSCalculator and PricingCalculator
  const costRates = useMemo(() => {
    return deriveCostRatesFromVariableCosts(variableCosts);
  }, [variableCosts]);

  const [selectedTierId, setSelectedTierId] = useState<string>('basic');
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Safely get selected tier, falling back to first tier if selection is invalid
  const selectedTier = tiers.find(t => t.id === selectedTierId) ?? tiers[0];

  // Wrapper to use context's updateTier
  const updateTier = useCallback((tierId: string, updates: Partial<Tier>) => {
    contextUpdateTier(tierId, updates);
  }, [contextUpdateTier]);

  const updateTierLimit = useCallback((tierId: string, featureId: string, limit: number | 'unlimited') => {
    const newTiers = tiers.map(t => {
      if (t.id !== tierId) return t;
      const existingLimitIdx = t.limits.findIndex(l => l.featureId === featureId);
      const feature = features.find(f => f.id === featureId);
      const newLimit: TierLimit = { featureId, limit, unit: feature?.limitUnit };

      if (existingLimitIdx >= 0) {
        const newLimits = [...t.limits];
        newLimits[existingLimitIdx] = newLimit;
        return { ...t, limits: newLimits };
      }
      return { ...t, limits: [...t.limits, newLimit] };
    });
    setTiers(newTiers);
  }, [tiers, setTiers, features]);

  const toggleFeature = useCallback((tierId: string, featureId: string, included: boolean) => {
    const newTiers = tiers.map(t => {
      if (t.id !== tierId) return t;
      if (included) {
        return {
          ...t,
          includedFeatures: [...t.includedFeatures, featureId],
          excludedFeatures: t.excludedFeatures.filter(f => f !== featureId)
        };
      }
      return {
        ...t,
        includedFeatures: t.includedFeatures.filter(f => f !== featureId),
        excludedFeatures: [...t.excludedFeatures, featureId],
        highlightFeatures: t.highlightFeatures.filter(f => f !== featureId)
      };
    });
    setTiers(newTiers);
  }, [tiers, setTiers]);

  const toggleHighlight = useCallback((tierId: string, featureId: string, highlighted: boolean) => {
    const newTiers = tiers.map(t => {
      if (t.id !== tierId) return t;
      if (highlighted) {
        return { ...t, highlightFeatures: [...t.highlightFeatures, featureId] };
      }
      return { ...t, highlightFeatures: t.highlightFeatures.filter(f => f !== featureId) };
    });
    setTiers(newTiers);
  }, [tiers, setTiers]);

  // Memoized cost calculations for selected tier
  // Now uses costRates derived from context to stay in sync with COGS calculator
  const { costs, margin } = useMemo(() => {
    const tierCosts = calculateTierVariableCosts(selectedTier, utilizationRate, costRates);
    const tierMargin = selectedTier.monthlyPriceMYR > 0
      ? ((selectedTier.monthlyPriceMYR - tierCosts.total) / selectedTier.monthlyPriceMYR) * 100
      : 0;
    return { costs: tierCosts, margin: tierMargin };
  }, [selectedTier, utilizationRate, costRates]);

  // Memoized tier costs for all tiers (for the tier cards)
  // Uses the same costRates and utilizationRate for consistency across the app
  const allTierCosts = useMemo(() => {
    const costsMap = new Map<string, { total: number; margin: number }>();
    tiers.forEach(tier => {
      const tierCosts = calculateTierVariableCosts(tier, utilizationRate, costRates);
      const tierMargin = tier.monthlyPriceMYR > 0
        ? ((tier.monthlyPriceMYR - tierCosts.total) / tier.monthlyPriceMYR) * 100
        : 0;
      costsMap.set(tier.id, { total: tierCosts.total, margin: tierMargin });
    });
    return costsMap;
  }, [tiers, utilizationRate, costRates]);

  // Features with limits (from context, updates when features change)
  const featuresWithLimits = useMemo(() => features.filter(f => f.hasLimit), [features]);

  // Memoized filtered features based on search
  const filteredFeatures = useMemo(() =>
    searchQuery
      ? features.filter(f =>
          f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : features,
    [searchQuery, features]
  );

  // Memoized features grouped by category
  const featuresByCategory = useMemo(() =>
    filteredFeatures.reduce((acc, feature) => {
      if (!acc[feature.category]) acc[feature.category] = [];
      acc[feature.category].push(feature);
      return acc;
    }, {} as Record<FeatureCategory, typeof features>),
    [filteredFeatures]
  );

  // Memoized export handlers
  const handleCopyJSON = useCallback(async () => {
    const data = JSON.stringify(tiers, null, 2);
    try {
      await navigator.clipboard.writeText(data);
      showToast('success', 'Copied to clipboard');
    } catch (err) {
      showToast('error', 'Failed to copy');
    }
  }, [tiers, showToast]);

  const handleExport = useCallback(() => {
    const data = JSON.stringify(tiers, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tier-config.json';
    a.click();
    showToast('success', 'Exported tier-config.json');
  }, [tiers, showToast]);

  // Show empty state when no tiers exist
  if (tiers.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Pricing Tiers</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1">Set up what each plan includes and how much it costs</p>
        </div>
        <div className="card">
          <EmptyState
            type="tiers"
            onAnalyze={() => navigateTo('analyze')}
            onAddManually={() => addTier()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Pricing Tiers</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1">Set up what each plan includes and how much it costs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopyJSON} className="btn-secondary text-xs sm:text-sm py-2 px-3 sm:py-2 sm:px-4 touch-manipulation">
            <Copy size={16} weight="duotone" />
            <span className="hidden sm:inline">Copy JSON</span>
            <span className="sm:hidden">Copy</span>
          </button>
          <button onClick={handleExport} className="btn-primary text-xs sm:text-sm py-2 px-3 sm:py-2 sm:px-4 touch-manipulation">
            <DownloadSimple size={16} weight="duotone" />
            Export
          </button>
        </div>
      </div>

      {/* Business Type & Tier Count Controls */}
      <div className="card p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Business Type Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {businessType ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#253ff6]/10 flex items-center justify-center flex-shrink-0">
                  <Lightning size={14} weight="fill" className="text-[#253ff6]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                      {BUSINESS_TYPES[businessType]?.name ?? businessType}
                    </span>
                    {businessTypeConfidence && (
                      <span className="text-[10px] sm:text-xs text-gray-500">
                        ({Math.round(businessTypeConfidence * 100)}%)
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                    {BUSINESS_TYPES[businessType]?.pricingModel ?? 'Feature-tiered pricing'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Lightning size={14} className="text-gray-400" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">No business type detected</span>
                  <p className="text-[10px] sm:text-xs text-gray-500">Analyze a codebase to detect type</p>
                </div>
              </div>
            )}

            {/* Reset to Template Button */}
            {businessType && (
              <button
                onClick={() => applyBusinessTypeTemplate(businessType)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] sm:text-xs font-medium text-[#253ff6] bg-[#253ff6]/10 rounded-lg hover:bg-[#253ff6]/20 active:bg-[#253ff6]/30 transition-colors touch-manipulation whitespace-nowrap"
              >
                <ArrowCounterClockwise size={12} weight="bold" />
                Reset
              </button>
            )}
          </div>

          {/* Tier Count Selector */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm text-gray-500">Tiers:</span>
            <div className="flex gap-1">
              {[2, 3, 4, 5].map((count) => {
                const isActive = tiers.length === count;
                const isRecommended = businessType && getRecommendedTierCount(businessType) === count;
                return (
                  <button
                    key={count}
                    onClick={() => setTierCount(count)}
                    className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs sm:text-sm font-medium transition-all touch-manipulation ${
                      isActive
                        ? 'bg-[#253ff6] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
                    }`}
                  >
                    {count}
                    {isRecommended && !isActive && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
            {businessType && (
              <span className="text-[10px] sm:text-xs text-gray-500 hidden sm:inline">
                (Rec: {getRecommendedTierCount(businessType)})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tier Cards */}
      <TierCardsGrid
        tiers={tiers}
        allTierCosts={allTierCosts}
        selectedTierId={selectedTierId}
        onSelect={setSelectedTierId}
      />

      {/* View Mode Tabs */}
      <TabToggle<ViewMode>
        options={[
          { id: 'overview', label: 'Overview' },
          { id: 'limits', label: 'Usage Limits' },
          { id: 'features', label: 'Feature Access' },
          { id: 'highlights', label: 'Highlights' },
        ] as TabOption<ViewMode>[]}
        value={viewMode}
        onChange={setViewMode}
        fullWidth
      />

      {/* Content based on view mode */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Basic Info */}
          <div className="card p-4 sm:p-6">
            <h3 className="font-medium text-gray-900 text-sm sm:text-base mb-3 sm:mb-4">{selectedTier.name} Details</h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm text-gray-600 mb-1 sm:mb-1.5">Tagline</label>
                <input
                  type="text"
                  value={selectedTier.tagline}
                  onChange={(e) => updateTier(selectedTierId, { tagline: e.target.value })}
                  className="input-field py-2.5 sm:py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-gray-600 mb-1 sm:mb-1.5">Target Audience</label>
                <textarea
                  value={selectedTier.targetAudience}
                  onChange={(e) => updateTier(selectedTierId, { targetAudience: e.target.value })}
                  rows={2}
                  className="input-field resize-none py-2.5 sm:py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm text-gray-600 mb-1 sm:mb-1.5">Monthly (MYR)</label>
                  <input
                    type="number"
                    min="0"
                    value={selectedTier.monthlyPriceMYR}
                    onChange={(e) => updateTier(selectedTierId, { monthlyPriceMYR: Math.max(0, Number(e.target.value)) })}
                    className="input-field py-2.5 sm:py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm text-gray-600 mb-1 sm:mb-1.5">Annual (MYR)</label>
                  <input
                    type="number"
                    min="0"
                    value={selectedTier.annualPriceMYR}
                    onChange={(e) => updateTier(selectedTierId, { annualPriceMYR: Math.max(0, Number(e.target.value)) })}
                    className="input-field py-2.5 sm:py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-gray-600 mb-1 sm:mb-1.5">Status</label>
                <select
                  value={selectedTier.status}
                  onChange={(e) => updateTier(selectedTierId, { status: e.target.value as Tier['status'] })}
                  className="input-field py-2.5 sm:py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="coming_soon">Coming Soon</option>
                  <option value="internal">Internal Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cost Analysis */}
          <div className="card p-4 sm:p-6">
            <h3 className="font-medium text-gray-900 text-sm sm:text-base mb-3 sm:mb-4">Cost Analysis</h3>
            <div className="space-y-2 sm:space-y-3">
              {/* Dynamic cost items from variableCosts */}
              {variableCosts.length > 0 ? (
                variableCosts.map((cost) => {
                  // Calculate estimated cost for this tier based on utilization
                  const estimatedCost = cost.costPerUnit * (cost.usagePerCustomer || 1) * utilizationRate;
                  return (
                    <div key={cost.id} className="flex justify-between py-2 sm:py-2.5 border-b border-[#e4e4e4]">
                      <span className="text-xs sm:text-sm text-gray-600 truncate pr-2">{cost.name}</span>
                      <span className="text-xs sm:text-sm font-medium text-gray-900 flex-shrink-0">MYR {estimatedCost.toFixed(2)}</span>
                    </div>
                  );
                })
              ) : (
                <>
                  {/* Fallback to legacy cost display if no variableCosts defined */}
                  <div className="flex justify-between py-2 sm:py-2.5 border-b border-[#e4e4e4]">
                    <span className="text-xs sm:text-sm text-gray-600">Extraction costs</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-900">MYR {costs.extraction.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 sm:py-2.5 border-b border-[#e4e4e4]">
                    <span className="text-xs sm:text-sm text-gray-600">Email costs</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-900">MYR {costs.email.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 sm:py-2.5 border-b border-[#e4e4e4]">
                    <span className="text-xs sm:text-sm text-gray-600">Storage costs</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-900">MYR {costs.storage.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between py-2.5 sm:py-3 bg-gray-50 rounded-[0.2rem] px-3 sm:px-4 -mx-1 sm:-mx-2">
                <span className="font-medium text-gray-900 text-xs sm:text-sm">Total Variable Cost</span>
                <span className="font-semibold text-[#253ff6] text-xs sm:text-sm">MYR {costs.total.toFixed(2)}</span>
              </div>

              {selectedTier.monthlyPriceMYR > 0 && (
                <>
                  <div className="flex justify-between py-2 sm:py-2.5 border-b border-[#e4e4e4] mt-3 sm:mt-4">
                    <span className="text-xs sm:text-sm text-gray-600">Gross Profit</span>
                    <span className={`text-xs sm:text-sm font-medium ${
                      selectedTier.monthlyPriceMYR - costs.total >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      MYR {(selectedTier.monthlyPriceMYR - costs.total).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 sm:py-3">
                    <span className="font-medium text-gray-900 text-xs sm:text-sm">Gross Margin</span>
                    <span className={`text-2xl sm:text-3xl font-bold ${
                      margin >= MARGIN_THRESHOLDS.HEALTHY ? 'text-emerald-600' : margin >= MARGIN_THRESHOLDS.ACCEPTABLE ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {margin.toFixed(0)}%
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'limits' && (
        <div className="card p-4 sm:p-6">
          <h3 className="font-medium text-gray-900 text-sm sm:text-base mb-4 sm:mb-6">Usage Limits for {selectedTier.name}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {featuresWithLimits.map((feature) => {
              const currentLimit = selectedTier.limits.find(l => l.featureId === feature.id);
              const limitValue = currentLimit?.limit ?? '';
              const isUnlimited = limitValue === 'unlimited';

              return (
                <div key={feature.id} className="p-3 sm:p-4 bg-gray-50 rounded-[0.2rem] border border-[#e4e4e4]">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">{feature.name}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500">{feature.limitUnit}</p>
                    </div>
                    {feature.costDriver && (
                      <span className="text-[10px] sm:text-xs bg-amber-100 text-amber-700 px-1.5 sm:px-2 py-0.5 rounded-[0.2rem] flex-shrink-0 ml-2">
                        ${feature.costDriver}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-3">
                    <input
                      type="number"
                      min="0"
                      value={isUnlimited ? '' : (typeof limitValue === 'number' ? limitValue : '')}
                      onChange={(e) => updateTierLimit(selectedTierId, feature.id, Math.max(0, Number(e.target.value)))}
                      placeholder={isUnlimited ? 'Unlimited' : 'Enter limit'}
                      disabled={isUnlimited}
                      className={`input-field text-xs sm:text-sm py-2 ${isUnlimited ? 'bg-gray-100 text-gray-400' : ''}`}
                    />
                    <button
                      onClick={() => updateTierLimit(
                        selectedTierId,
                        feature.id,
                        isUnlimited ? 0 : 'unlimited'
                      )}
                      className={`px-2 sm:px-3 py-2 rounded-[0.2rem] text-[10px] sm:text-xs font-medium transition-all duration-200 active:scale-95 whitespace-nowrap flex items-center gap-1 sm:gap-1.5 touch-manipulation ${
                        isUnlimited
                          ? 'bg-[#253ff6] text-white'
                          : 'bg-white border border-[#e4e4e4] text-gray-600 hover:border-[#253ff6] active:bg-gray-50'
                      }`}
                    >
                      <InfinityIcon size={12} weight="bold" />
                      <span className="hidden sm:inline">{isUnlimited ? 'Unlimited' : 'Set unlimited'}</span>
                      <span className="sm:hidden">{isUnlimited ? '∞' : 'Set'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'features' && (
        <div className="card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
            <h3 className="font-medium text-gray-900 text-sm sm:text-base">Feature Access for {selectedTier.name}</h3>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              <div className="relative flex-1 sm:flex-none">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" weight="duotone" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search features..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field w-full sm:w-56 pl-9 py-2 text-sm"
                  aria-label="Search features"
                />
              </div>
              <div className="flex gap-2 text-xs sm:text-sm justify-end">
                <button
                  onClick={() => {
                    const allIds = features.map(f => f.id);
                    updateTier(selectedTierId, { includedFeatures: allIds, excludedFeatures: [] });
                  }}
                  className="text-[#253ff6] hover:text-[#1e35d4] active:text-[#1a2eb8] font-medium transition-colors touch-manipulation py-1"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => {
                    updateTier(selectedTierId, { includedFeatures: [], excludedFeatures: features.map(f => f.id) });
                  }}
                  className="text-gray-500 hover:text-gray-700 active:text-gray-800 transition-colors touch-manipulation py-1"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6 sm:space-y-8">
            {Object.entries(featuresByCategory).map(([category, categoryFeatures]) => (
              <div key={category}>
                <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                  {featureCategories[category as FeatureCategory].name}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categoryFeatures.map((feature) => {
                    const isIncluded = selectedTier.includedFeatures.includes(feature.id);
                    return (
                      <label
                        key={feature.id}
                        className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-[0.2rem] cursor-pointer transition-all duration-200 touch-manipulation ${
                          isIncluded
                            ? 'bg-[rgba(37,63,246,0.06)] border border-[rgba(37,63,246,0.2)]'
                            : 'bg-gray-50 border border-transparent hover:bg-gray-100 active:bg-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isIncluded}
                          onChange={(e) => toggleFeature(selectedTierId, feature.id, e.target.checked)}
                          className="w-4 h-4 sm:w-4 sm:h-4 rounded border-gray-300 text-[#253ff6] focus:ring-[#253ff6]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs sm:text-sm font-medium ${isIncluded ? 'text-[#253ff6]' : 'text-gray-700'}`}>
                            {feature.name}
                          </p>
                          <p className="text-[10px] sm:text-xs text-gray-500 truncate">{feature.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'highlights' && (
        <div className="card p-4 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <h3 className="font-medium text-gray-900 text-sm sm:text-base">Highlighted Features for {selectedTier.name}</h3>
            <p className="text-[10px] sm:text-sm text-gray-500 mt-1">
              Select features to highlight in marketing materials. Only included features can be highlighted.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Available to highlight */}
            <div>
              <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Available Features</h4>
              <div className="space-y-2 max-h-80 sm:max-h-96 overflow-y-auto pr-1 sm:pr-2">
                {selectedTier.includedFeatures
                  .filter(id => !selectedTier.highlightFeatures.includes(id))
                  .map(id => {
                    const feature = features.find(f => f.id === id);
                    if (!feature) return null;
                    return (
                      <button
                        key={id}
                        onClick={() => toggleHighlight(selectedTierId, id, true)}
                        className="w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-[0.2rem] text-left transition-all duration-200 active:scale-[0.98] border border-[#e4e4e4] touch-manipulation"
                      >
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[0.2rem] bg-white border border-[#e4e4e4] flex items-center justify-center flex-shrink-0">
                          <Plus size={14} className="text-gray-400" weight="bold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-700">{feature.name}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 truncate">{feature.valueProposition}</p>
                        </div>
                      </button>
                    );
                  })}
                {selectedTier.includedFeatures.filter(id => !selectedTier.highlightFeatures.includes(id)).length === 0 && (
                  <p className="text-xs sm:text-sm text-gray-400 py-6 sm:py-8 text-center">All features are highlighted</p>
                )}
              </div>
            </div>

            {/* Currently highlighted */}
            <div>
              <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                Highlighted ({selectedTier.highlightFeatures.length})
              </h4>
              <div className="space-y-2 max-h-80 sm:max-h-96 overflow-y-auto pr-1 sm:pr-2">
                {selectedTier.highlightFeatures.map(id => {
                  const feature = features.find(f => f.id === id);
                  if (!feature) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-[rgba(37,63,246,0.06)] border border-[rgba(37,63,246,0.2)] rounded-[0.2rem]"
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[0.2rem] bg-[#253ff6] flex items-center justify-center flex-shrink-0">
                        <Star size={14} className="text-white" weight="fill" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-[#253ff6]">{feature.name}</p>
                        <p className="text-[10px] sm:text-xs text-[#253ff6]/70 truncate">{feature.valueProposition}</p>
                      </div>
                      <button
                        onClick={() => toggleHighlight(selectedTierId, id, false)}
                        className="p-1.5 hover:bg-[rgba(37,63,246,0.1)] active:bg-[rgba(37,63,246,0.2)] rounded-[0.2rem] transition-colors touch-manipulation"
                      >
                        <X size={16} className="text-[#253ff6]/60" weight="bold" />
                      </button>
                    </div>
                  );
                })}
                {selectedTier.highlightFeatures.length === 0 && (
                  <p className="text-xs sm:text-sm text-gray-400 py-6 sm:py-8 text-center">No features highlighted yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
