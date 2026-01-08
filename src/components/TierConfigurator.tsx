import { useState, useMemo, useCallback } from 'react';
import { Copy, DownloadSimple, MagnifyingGlass, Plus, X, Star, Infinity } from '@phosphor-icons/react';
import { calculateTierVariableCosts, type Tier, type TierLimit } from '../data/tiers';
import { featureCategories, type FeatureCategory } from '../data/features';
import { usePricing } from '../context/PricingContext';

type ViewMode = 'overview' | 'limits' | 'features' | 'highlights';

export function TierConfigurator() {
  // Get tiers and features from global context
  const { tiers, setTiers, updateTier: contextUpdateTier, features } = usePricing();

  const [selectedTierId, setSelectedTierId] = useState<string>('basic');
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedTier = tiers.find(t => t.id === selectedTierId)!;

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
  }, [tiers, setTiers]);

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
  const { costs, margin } = useMemo(() => {
    const tierCosts = calculateTierVariableCosts(selectedTier);
    const tierMargin = selectedTier.monthlyPriceMYR > 0
      ? ((selectedTier.monthlyPriceMYR - tierCosts.total) / selectedTier.monthlyPriceMYR) * 100
      : 0;
    return { costs: tierCosts, margin: tierMargin };
  }, [selectedTier]);

  // Memoized tier costs for all tiers (for the tier cards)
  const allTierCosts = useMemo(() => {
    const costsMap = new Map<string, { total: number; margin: number }>();
    tiers.forEach(tier => {
      const tierCosts = calculateTierVariableCosts(tier);
      const tierMargin = tier.monthlyPriceMYR > 0
        ? ((tier.monthlyPriceMYR - tierCosts.total) / tier.monthlyPriceMYR) * 100
        : 0;
      costsMap.set(tier.id, { total: tierCosts.total, margin: tierMargin });
    });
    return costsMap;
  }, [tiers]);

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
  const handleCopyJSON = useCallback(() => {
    const data = JSON.stringify(tiers, null, 2);
    navigator.clipboard.writeText(data);
  }, [tiers]);

  const handleExport = useCallback(() => {
    const data = JSON.stringify(tiers, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tier-config.json';
    a.click();
  }, [tiers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tier Configurator</h1>
          <p className="text-gray-500 text-sm mt-1">Configure limits, features, and highlights for each tier</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopyJSON} className="btn-secondary">
            <Copy size={18} weight="duotone" />
            Copy JSON
          </button>
          <button onClick={handleExport} className="btn-primary">
            <DownloadSimple size={18} weight="duotone" />
            Export
          </button>
        </div>
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-4 gap-4">
        {tiers.map((tier) => {
          const tierData = allTierCosts.get(tier.id);
          const tierCostsTotal = tierData?.total ?? 0;
          const tierMargin = tierData?.margin ?? 0;
          const isSelected = selectedTierId === tier.id;

          return (
            <button
              key={tier.id}
              onClick={() => setSelectedTierId(tier.id)}
              className={`card card-interactive p-5 text-left transition-all duration-200 active:scale-[0.98] ${
                isSelected ? 'ring-2 ring-[#253ff6] ring-offset-2' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900">{tier.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-[0.2rem] ${
                  tier.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                  tier.status === 'coming_soon' ? 'bg-amber-50 text-amber-600' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {tier.status === 'active' ? 'Active' : tier.status === 'coming_soon' ? 'Soon' : 'Internal'}
                </span>
              </div>

              <p className="text-2xl font-semibold text-gray-900">
                {tier.monthlyPriceMYR === 0 && tier.id !== 'freemium' ? (
                  <span className="text-gray-400 text-lg">TBD</span>
                ) : tier.id === 'enterprise' ? (
                  <span className="text-lg">Custom</span>
                ) : (
                  <>MYR {tier.monthlyPriceMYR}</>
                )}
              </p>

              <div className="mt-4 pt-4 border-t border-[#e4e4e4] space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">COGS</span>
                  <span className="font-medium text-gray-700">MYR {tierCostsTotal.toFixed(2)}</span>
                </div>
                {tier.monthlyPriceMYR > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Margin</span>
                    <span className={`font-medium ${
                      tierMargin >= 65 ? 'text-emerald-600' : tierMargin >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {tierMargin.toFixed(0)}%
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Features</span>
                  <span className="font-medium text-gray-700">{tier.includedFeatures.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Highlights</span>
                  <span className="font-medium text-[#253ff6]">{tier.highlightFeatures.length}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* View Mode Tabs */}
      <div className="card p-1.5 flex gap-1">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'limits', label: 'Usage Limits' },
          { id: 'features', label: 'Feature Access' },
          { id: 'highlights', label: 'Highlights' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id as ViewMode)}
            className={`tab-pill flex-1 ${viewMode === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content based on view mode */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="card p-6">
            <h3 className="font-medium text-gray-900 mb-4">{selectedTier.name} Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Tagline</label>
                <input
                  type="text"
                  value={selectedTier.tagline}
                  onChange={(e) => updateTier(selectedTierId, { tagline: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Target Audience</label>
                <textarea
                  value={selectedTier.targetAudience}
                  onChange={(e) => updateTier(selectedTierId, { targetAudience: e.target.value })}
                  rows={2}
                  className="input-field resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Monthly (MYR)</label>
                  <input
                    type="number"
                    min="0"
                    value={selectedTier.monthlyPriceMYR}
                    onChange={(e) => updateTier(selectedTierId, { monthlyPriceMYR: Math.max(0, Number(e.target.value)) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Annual (MYR)</label>
                  <input
                    type="number"
                    min="0"
                    value={selectedTier.annualPriceMYR}
                    onChange={(e) => updateTier(selectedTierId, { annualPriceMYR: Math.max(0, Number(e.target.value)) })}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Status</label>
                <select
                  value={selectedTier.status}
                  onChange={(e) => updateTier(selectedTierId, { status: e.target.value as Tier['status'] })}
                  className="input-field"
                >
                  <option value="active">Active</option>
                  <option value="coming_soon">Coming Soon</option>
                  <option value="internal">Internal Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cost Analysis */}
          <div className="card p-6">
            <h3 className="font-medium text-gray-900 mb-4">Cost Analysis</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2.5 border-b border-[#e4e4e4]">
                <span className="text-sm text-gray-600">Extraction costs</span>
                <span className="text-sm font-medium text-gray-900">MYR {costs.extraction.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-[#e4e4e4]">
                <span className="text-sm text-gray-600">Email costs</span>
                <span className="text-sm font-medium text-gray-900">MYR {costs.email.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-[#e4e4e4]">
                <span className="text-sm text-gray-600">Storage costs</span>
                <span className="text-sm font-medium text-gray-900">MYR {costs.storage.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 bg-gray-50 rounded-[0.2rem] px-4 -mx-2">
                <span className="font-medium text-gray-900">Total Variable COGS</span>
                <span className="font-semibold text-[#253ff6]">MYR {costs.total.toFixed(2)}</span>
              </div>

              {selectedTier.monthlyPriceMYR > 0 && (
                <>
                  <div className="flex justify-between py-2.5 border-b border-[#e4e4e4] mt-4">
                    <span className="text-sm text-gray-600">Gross Profit</span>
                    <span className={`text-sm font-medium ${
                      selectedTier.monthlyPriceMYR - costs.total >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      MYR {(selectedTier.monthlyPriceMYR - costs.total).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="font-medium text-gray-900">Gross Margin</span>
                    <span className={`text-3xl font-bold ${
                      margin >= 65 ? 'text-emerald-600' : margin >= 50 ? 'text-amber-600' : 'text-red-600'
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
        <div className="card p-6">
          <h3 className="font-medium text-gray-900 mb-6">Usage Limits for {selectedTier.name}</h3>
          <div className="grid grid-cols-3 gap-4">
            {featuresWithLimits.map((feature) => {
              const currentLimit = selectedTier.limits.find(l => l.featureId === feature.id);
              const limitValue = currentLimit?.limit ?? '';
              const isUnlimited = limitValue === 'unlimited';

              return (
                <div key={feature.id} className="p-4 bg-gray-50 rounded-[0.2rem] border border-[#e4e4e4]">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{feature.name}</p>
                      <p className="text-xs text-gray-500">{feature.limitUnit}</p>
                    </div>
                    {feature.costDriver && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-[0.2rem]">
                        ${feature.costDriver}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <input
                      type="number"
                      min="0"
                      value={isUnlimited ? '' : (typeof limitValue === 'number' ? limitValue : '')}
                      onChange={(e) => updateTierLimit(selectedTierId, feature.id, Math.max(0, Number(e.target.value)))}
                      placeholder={isUnlimited ? 'Unlimited' : 'Enter limit'}
                      disabled={isUnlimited}
                      className={`input-field text-sm ${isUnlimited ? 'bg-gray-100 text-gray-400' : ''}`}
                    />
                    <button
                      onClick={() => updateTierLimit(
                        selectedTierId,
                        feature.id,
                        isUnlimited ? 0 : 'unlimited'
                      )}
                      className={`px-3 py-2 rounded-[0.2rem] text-xs font-medium transition-all duration-200 active:scale-95 whitespace-nowrap flex items-center gap-1.5 ${
                        isUnlimited
                          ? 'bg-[#253ff6] text-white'
                          : 'bg-white border border-[#e4e4e4] text-gray-600 hover:border-[#253ff6]'
                      }`}
                    >
                      <Infinity size={14} weight="bold" />
                      {isUnlimited ? 'Unlimited' : 'Set unlimited'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'features' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-medium text-gray-900">Feature Access for {selectedTier.name}</h3>
            <div className="flex items-center gap-4">
              <div className="relative">
                <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" weight="duotone" />
                <input
                  type="text"
                  placeholder="Search features..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field w-64 pl-10"
                />
              </div>
              <div className="flex gap-2 text-sm">
                <button
                  onClick={() => {
                    const allIds = features.map(f => f.id);
                    updateTier(selectedTierId, { includedFeatures: allIds, excludedFeatures: [] });
                  }}
                  className="text-[#253ff6] hover:text-[#1e35d4] font-medium transition-colors"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => {
                    updateTier(selectedTierId, { includedFeatures: [], excludedFeatures: features.map(f => f.id) });
                  }}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {Object.entries(featuresByCategory).map(([category, categoryFeatures]) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  {featureCategories[category as FeatureCategory].name}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {categoryFeatures.map((feature) => {
                    const isIncluded = selectedTier.includedFeatures.includes(feature.id);
                    return (
                      <label
                        key={feature.id}
                        className={`flex items-center gap-3 p-3 rounded-[0.2rem] cursor-pointer transition-all duration-200 ${
                          isIncluded
                            ? 'bg-[rgba(37,63,246,0.06)] border border-[rgba(37,63,246,0.2)]'
                            : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isIncluded}
                          onChange={(e) => toggleFeature(selectedTierId, feature.id, e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-[#253ff6] focus:ring-[#253ff6]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isIncluded ? 'text-[#253ff6]' : 'text-gray-700'}`}>
                            {feature.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{feature.description}</p>
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
        <div className="card p-6">
          <div className="mb-6">
            <h3 className="font-medium text-gray-900">Highlighted Features for {selectedTier.name}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Select features to highlight in marketing materials. Only included features can be highlighted.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Available to highlight */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Available Features</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {selectedTier.includedFeatures
                  .filter(id => !selectedTier.highlightFeatures.includes(id))
                  .map(id => {
                    const feature = features.find(f => f.id === id);
                    if (!feature) return null;
                    return (
                      <button
                        key={id}
                        onClick={() => toggleHighlight(selectedTierId, id, true)}
                        className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-[0.2rem] text-left transition-all duration-200 active:scale-[0.98] border border-[#e4e4e4]"
                      >
                        <div className="w-8 h-8 rounded-[0.2rem] bg-white border border-[#e4e4e4] flex items-center justify-center flex-shrink-0">
                          <Plus size={16} className="text-gray-400" weight="bold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700">{feature.name}</p>
                          <p className="text-xs text-gray-500 truncate">{feature.valueProposition}</p>
                        </div>
                      </button>
                    );
                  })}
                {selectedTier.includedFeatures.filter(id => !selectedTier.highlightFeatures.includes(id)).length === 0 && (
                  <p className="text-sm text-gray-400 py-8 text-center">All features are highlighted</p>
                )}
              </div>
            </div>

            {/* Currently highlighted */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Highlighted ({selectedTier.highlightFeatures.length})
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {selectedTier.highlightFeatures.map(id => {
                  const feature = features.find(f => f.id === id);
                  if (!feature) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-3 p-3 bg-[rgba(37,63,246,0.06)] border border-[rgba(37,63,246,0.2)] rounded-[0.2rem]"
                    >
                      <div className="w-8 h-8 rounded-[0.2rem] bg-[#253ff6] flex items-center justify-center flex-shrink-0">
                        <Star size={16} className="text-white" weight="fill" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#253ff6]">{feature.name}</p>
                        <p className="text-xs text-[#253ff6]/70 truncate">{feature.valueProposition}</p>
                      </div>
                      <button
                        onClick={() => toggleHighlight(selectedTierId, id, false)}
                        className="p-1.5 hover:bg-[rgba(37,63,246,0.1)] rounded-[0.2rem] transition-colors"
                      >
                        <X size={16} className="text-[#253ff6]/60" weight="bold" />
                      </button>
                    </div>
                  );
                })}
                {selectedTier.highlightFeatures.length === 0 && (
                  <p className="text-sm text-gray-400 py-8 text-center">No features highlighted yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
