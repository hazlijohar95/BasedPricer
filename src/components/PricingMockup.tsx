import { useState, useMemo } from 'react';
import {
  DotsSixVertical, Plus, Trash,
  ArrowsClockwise, CurrencyDollar, PaintBrush,
  ListBullets, CaretDown, CaretRight, Eye, EyeSlash,
  ArrowLeft, Star, Crown
} from '@phosphor-icons/react';
import { featureCategories } from '../data/features';
import { PricingCard, FeatureComparisonTable, initializeTierConfigs } from './pricing';
import type { TierConfig, BillingCycle, EditTab } from './pricing';
import { BillingCycleToggle, Toggle, SearchInput } from './shared';
import { getFeatureName, getFeatureLimit, calculateDiscount } from '../utils/features';
import { DISCOUNT_PRESETS } from '../constants';
import { usePricing } from '../context/PricingContext';

export function PricingMockup() {
  // Get tiers and features from context
  const { tiers, features } = usePricing();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [tierConfigs, setTierConfigs] = useState<Record<string, TierConfig>>(initializeTierConfigs);
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [editTab, setEditTab] = useState<EditTab>('pricing');
  const [draggedFeature, setDraggedFeature] = useState<string | null>(null);
  const [featureSearch, setFeatureSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [ctaClicked, setCtaClicked] = useState<string | null>(null);

  const visibleTiers = tiers.filter(t => t.status === 'active' || t.status === 'coming_soon');

  const updateTierConfig = (tierId: string, updates: Partial<TierConfig>) => {
    setTierConfigs(prev => ({ ...prev, [tierId]: { ...prev[tierId], ...updates } }));
  };

  const setHighlightedTier = (tierId: string, highlighted: boolean) => {
    if (highlighted) {
      setTierConfigs(prev => {
        const newConfigs = { ...prev };
        Object.keys(newConfigs).forEach(id => {
          newConfigs[id] = { ...newConfigs[id], highlighted: id === tierId };
        });
        return newConfigs;
      });
    } else {
      updateTierConfig(tierId, { highlighted: false });
    }
  };

  const addFeatureToHighlights = (tierId: string, featureId: string) => {
    const config = tierConfigs[tierId];
    if (!config.highlightedFeatures.includes(featureId)) {
      updateTierConfig(tierId, { highlightedFeatures: [...config.highlightedFeatures, featureId] });
    }
  };

  const removeFeatureFromHighlights = (tierId: string, featureId: string) => {
    const config = tierConfigs[tierId];
    updateTierConfig(tierId, { highlightedFeatures: config.highlightedFeatures.filter(f => f !== featureId) });
  };

  const moveFeature = (tierId: string, fromIndex: number, toIndex: number) => {
    const config = tierConfigs[tierId];
    const newFeatures = [...config.highlightedFeatures];
    const [moved] = newFeatures.splice(fromIndex, 1);
    newFeatures.splice(toIndex, 0, moved);
    updateTierConfig(tierId, { highlightedFeatures: newFeatures });
  };

  const resetTierConfig = (tierId: string) => {
    const tier = tiers.find(t => t.id === tierId);
    if (tier) {
      setTierConfigs(prev => ({
        ...prev,
        [tierId]: {
          ...initializeTierConfigs()[tierId],
          highlighted: prev[tierId].highlighted,
        }
      }));
    }
  };

  const handleDragStart = (featureId: string) => setDraggedFeature(featureId);
  const handleDragEnd = () => setDraggedFeature(null);
  const handleDragOver = (e: React.DragEvent, tierId: string, targetIndex: number) => {
    e.preventDefault();
    if (!draggedFeature) return;
    const config = tierConfigs[tierId];
    const currentIndex = config.highlightedFeatures.indexOf(draggedFeature);
    if (currentIndex !== -1 && currentIndex !== targetIndex) {
      moveFeature(tierId, currentIndex, targetIndex);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const editingTierData = editingTier ? tiers.find(t => t.id === editingTier) : null;
  const editingConfig = editingTier ? tierConfigs[editingTier] : null;

  const filteredAvailableFeatures = useMemo(() => {
    if (!editingTierData || !editingConfig) return {};
    const available = editingTierData.includedFeatures.filter(
      fId => !editingConfig.highlightedFeatures.includes(fId)
    );
    const filtered = featureSearch
      ? available.filter(fId => getFeatureName(fId).toLowerCase().includes(featureSearch.toLowerCase()))
      : available;
    const grouped: Record<string, string[]> = {};
    filtered.forEach(fId => {
      const feature = features.find(f => f.id === fId);
      const cat = feature?.category || '';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(fId);
    });
    return grouped;
  }, [editingTierData, editingConfig, featureSearch, features]);

  const averageDiscount = useMemo(() => {
    const discounts = visibleTiers
      .map(t => tierConfigs[t.id])
      .filter(c => c.monthlyPrice > 0)
      .map(c => calculateDiscount(c.monthlyPrice, c.annualPrice));
    return discounts.length > 0
      ? Math.round(discounts.reduce((a, b) => a + b, 0) / discounts.length)
      : 17;
  }, [tierConfigs, visibleTiers]);

  const handleCtaClick = (tierId: string) => {
    setCtaClicked(tierId);
    setTimeout(() => setCtaClicked(null), 1500);
  };

  // Edit mode view
  if (editingTier && editingTierData && editingConfig) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col -mt-2">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 flex-shrink-0">
          <button
            onClick={() => setEditingTier(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={18} weight="bold" />
            <span className="text-sm font-medium">Back to all tiers</span>
          </button>

          <div className="flex items-center gap-6">
            {/* Quick Tier Switcher */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-[0.2rem]">
              {visibleTiers.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => { setEditingTier(tier.id); setFeatureSearch(''); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-[0.2rem] transition-all ${
                    editingTier === tier.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tier.name}
                </button>
              ))}
            </div>

            <BillingCycleToggle
              value={billingCycle}
              onChange={setBillingCycle}
              discount={averageDiscount}
              size="sm"
            />
          </div>
        </div>

        {/* Main Edit Area */}
        <div className="flex-1 flex gap-10 items-start min-h-0">
          {/* Card Preview */}
          <div className="flex flex-col items-center pt-6">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-3 font-medium">Live Preview</p>
            <PricingCard
              tier={editingTierData}
              config={editingConfig}
              billingCycle={billingCycle}
              isEditMode={true}
              ctaClicked={ctaClicked === editingTier}
              onCtaClick={() => handleCtaClick(editingTier)}
            />
          </div>

          {/* Edit Panel */}
          <div className="flex-1 max-w-lg h-full flex flex-col">
            <div className="bg-white rounded-[0.2rem] border border-gray-200 overflow-hidden shadow-sm flex flex-col h-full">
              {/* Header */}
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${editingConfig.highlighted ? 'bg-[#253ff6]' : 'bg-gray-300'}`} />
                    <h3 className="font-semibold text-gray-900">Edit {editingTierData.name}</h3>
                  </div>
                  <button
                    onClick={() => resetTierConfig(editingTier)}
                    className="p-1.5 hover:bg-gray-200 rounded-[0.2rem] transition-colors text-gray-400 hover:text-gray-600"
                    title="Reset to defaults"
                  >
                    <ArrowsClockwise size={14} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100 flex-shrink-0">
                {[
                  { id: 'pricing' as EditTab, icon: CurrencyDollar, label: 'Pricing' },
                  { id: 'appearance' as EditTab, icon: PaintBrush, label: 'Style' },
                  { id: 'features' as EditTab, icon: ListBullets, label: 'Features' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setEditTab(tab.id)}
                    className={`flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      editTab === tab.id
                        ? 'text-[#253ff6] border-b-2 border-[#253ff6] bg-[rgba(37,63,246,0.02)]'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon size={16} weight={editTab === tab.id ? 'duotone' : 'regular'} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto min-h-0">
                {/* Pricing Tab */}
                {editTab === 'pricing' && (
                  <div className="p-5 space-y-5">
                    {editingTierData.id !== 'enterprise' ? (
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Monthly Price</label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400 font-medium">MYR</span>
                            <input
                              type="number"
                              min="0"
                              value={editingConfig.monthlyPrice}
                              onChange={(e) => updateTierConfig(editingTier, { monthlyPrice: Math.max(0, Number(e.target.value)) })}
                              className="input-field flex-1"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                            <span>Annual Price</span>
                            {editingConfig.monthlyPrice > 0 && (
                              <span className="text-emerald-600 font-semibold">
                                {calculateDiscount(editingConfig.monthlyPrice, editingConfig.annualPrice)}% off
                              </span>
                            )}
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400 font-medium">MYR</span>
                            <input
                              type="number"
                              min="0"
                              value={editingConfig.annualPrice}
                              onChange={(e) => updateTierConfig(editingTier, { annualPrice: Math.max(0, Number(e.target.value)) })}
                              className="input-field flex-1"
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-1.5">
                            = MYR {Math.round(editingConfig.annualPrice / 12)}/mo billed annually
                          </p>
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Quick Annual Discount</label>
                          <div className="flex gap-2">
                            {DISCOUNT_PRESETS.map(discount => {
                              const annualPrice = Math.round(editingConfig.monthlyPrice * 12 * (1 - discount / 100));
                              const isActive = editingConfig.annualPrice === annualPrice;
                              return (
                                <button
                                  key={discount}
                                  onClick={() => updateTierConfig(editingTier, { annualPrice })}
                                  className={`flex-1 py-2 text-sm font-medium rounded-[0.2rem] transition-all ${
                                    isActive ? 'bg-[#253ff6] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  {discount}%
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Crown size={40} weight="duotone" className="text-amber-500 mx-auto mb-3" />
                        <p className="text-base font-medium text-gray-700">Custom Pricing</p>
                        <p className="text-sm mt-1">Enterprise tier uses custom pricing</p>
                      </div>
                    )}
                    <div className="pt-4 border-t border-gray-100">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Tagline</label>
                      <input
                        type="text"
                        value={editingConfig.tagline}
                        onChange={(e) => updateTierConfig(editingTier, { tagline: e.target.value })}
                        className="input-field"
                        placeholder="e.g. Perfect for small teams"
                      />
                    </div>
                  </div>
                )}

                {/* Appearance Tab */}
                {editTab === 'appearance' && (
                  <div className="p-5 space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                          <Star size={12} weight="duotone" className="text-amber-500" />
                          Highlight Badge
                        </label>
                        <p className="text-xs text-gray-400">Mark this tier as recommended</p>
                      </div>
                      <Toggle
                        checked={editingConfig.highlighted}
                        onChange={(checked) => setHighlightedTier(editingTier, checked)}
                      />
                    </div>
                    {editingConfig.highlighted && (
                      <input
                        type="text"
                        value={editingConfig.badgeText}
                        onChange={(e) => updateTierConfig(editingTier, { badgeText: e.target.value })}
                        className="input-field -mt-2"
                        placeholder="Badge text (e.g. Most Popular)"
                      />
                    )}

                    <div className="pt-4 border-t border-gray-100 space-y-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Button Text</label>
                        <input
                          type="text"
                          value={editingConfig.ctaText}
                          onChange={(e) => updateTierConfig(editingTier, { ctaText: e.target.value })}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Button Style</label>
                        <div className="grid grid-cols-3 gap-3">
                          {([
                            { id: 'primary', label: 'Primary', preview: 'bg-[#253ff6]' },
                            { id: 'secondary', label: 'Dark', preview: 'bg-gray-900' },
                            { id: 'outline', label: 'Outline', preview: 'border-2 border-gray-300 bg-white' },
                          ] as const).map(style => (
                            <button
                              key={style.id}
                              onClick={() => updateTierConfig(editingTier, { ctaStyle: style.id })}
                              className={`py-3 text-sm font-medium rounded-[0.2rem] transition-all border-2 ${
                                editingConfig.ctaStyle === style.id
                                  ? 'border-[#253ff6] bg-[rgba(37,63,246,0.04)]'
                                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'
                              }`}
                            >
                              <div className={`w-8 h-2 rounded-[0.2rem] mx-auto mb-2 ${style.preview}`} />
                              {style.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 space-y-4">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Display Options</label>
                      <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-3">
                          {editingConfig.showLimits ? <Eye size={18} className="text-gray-400" /> : <EyeSlash size={18} className="text-gray-400" />}
                          <span className="text-sm text-gray-700">Show feature limits</span>
                        </div>
                        <Toggle
                          checked={editingConfig.showLimits}
                          onChange={(checked) => updateTierConfig(editingTier, { showLimits: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-700">Visible features</span>
                        <div className="flex items-center gap-1.5">
                          {[4, 5, 6, 8].map(num => (
                            <button
                              key={num}
                              onClick={() => updateTierConfig(editingTier, { maxVisibleFeatures: num })}
                              className={`w-9 h-9 text-sm font-medium rounded-[0.2rem] transition-all ${
                                editingConfig.maxVisibleFeatures === num
                                  ? 'bg-[#253ff6] text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Features Tab */}
                {editTab === 'features' && (
                  <div className="flex flex-col h-full">
                    <div className="p-5 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Featured on Card ({editingConfig.highlightedFeatures.length})
                        </span>
                        {editingConfig.highlightedFeatures.length > 0 && (
                          <button
                            onClick={() => updateTierConfig(editingTier, { highlightedFeatures: [] })}
                            className="text-xs text-red-500 hover:text-red-600 font-medium"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                      {editingConfig.highlightedFeatures.length > 0 ? (
                        <div className="space-y-1.5">
                          {editingConfig.highlightedFeatures.map((featureId, index) => {
                            const limit = getFeatureLimit(editingTierData, featureId);
                            return (
                              <div
                                key={featureId}
                                draggable
                                onDragStart={() => handleDragStart(featureId)}
                                onDragOver={(e) => handleDragOver(e, editingTier, index)}
                                onDragEnd={handleDragEnd}
                                className={`flex items-center gap-3 p-2.5 rounded-[0.2rem] bg-gray-50 group transition-all ${
                                  draggedFeature === featureId ? 'opacity-50 ring-1 ring-dashed ring-[#253ff6]' : ''
                                }`}
                              >
                                <DotsSixVertical size={14} className="text-gray-300 cursor-grab flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm text-gray-700 block truncate">{getFeatureName(featureId)}</span>
                                  {limit && <span className="text-xs text-gray-400">{limit}</span>}
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); removeFeatureFromHighlights(editingTier, featureId); }}
                                  className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-[0.2rem] transition-all flex-shrink-0"
                                >
                                  <Trash size={12} className="text-red-500" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-[0.2rem]">
                          <ListBullets size={28} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No features selected</p>
                          <p className="text-xs mt-0.5">Add features from below</p>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 p-5 flex flex-col min-h-0">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Available Features</span>
                        <span className="text-xs text-gray-400">
                          {editingTierData.includedFeatures.length - editingConfig.highlightedFeatures.length} remaining
                        </span>
                      </div>
                      <SearchInput
                        value={featureSearch}
                        onChange={setFeatureSearch}
                        placeholder="Search features..."
                        className="mb-3"
                      />
                      <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
                        {Object.entries(filteredAvailableFeatures).length > 0 ? (
                          Object.entries(filteredAvailableFeatures).map(([categoryId, featureIds]) => {
                            const category = featureCategories[categoryId as keyof typeof featureCategories];
                            const isExpanded = expandedCategories.has(categoryId) || featureSearch.length > 0;
                            return (
                              <div key={categoryId}>
                                <button
                                  onClick={() => toggleCategory(categoryId)}
                                  className="flex items-center gap-2 w-full py-2 px-1 text-left hover:bg-gray-50 rounded-[0.2rem] transition-colors"
                                >
                                  {isExpanded ? <CaretDown size={14} className="text-gray-400" /> : <CaretRight size={14} className="text-gray-400" />}
                                  <span className="text-sm font-medium text-gray-600">{category?.name || categoryId}</span>
                                  <span className="text-xs text-gray-400 ml-auto bg-gray-100 px-1.5 py-0.5 rounded">{featureIds.length}</span>
                                </button>
                                {isExpanded && (
                                  <div className="ml-5 space-y-0.5 mb-2">
                                    {featureIds.map(featureId => {
                                      const limit = getFeatureLimit(editingTierData, featureId);
                                      return (
                                        <button
                                          key={featureId}
                                          onClick={() => addFeatureToHighlights(editingTier, featureId)}
                                          className="flex items-center gap-2 w-full p-2 rounded-[0.2rem] hover:bg-[rgba(37,63,246,0.04)] transition-all text-left group"
                                        >
                                          <Plus size={12} className="text-gray-300 group-hover:text-[#253ff6] flex-shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <span className="text-sm text-gray-600 block truncate">{getFeatureName(featureId)}</span>
                                            {limit && <span className="text-xs text-gray-400">{limit}</span>}
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-6 text-gray-400">
                            <p className="text-sm">{featureSearch ? 'No matching features' : 'All features selected'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default view - all cards
  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900">Pricing Mockup</h1>
        <p className="text-gray-500 mt-2">Click on any card to customize and preview changes</p>
      </div>

      <div className="flex justify-center">
        <BillingCycleToggle
          value={billingCycle}
          onChange={setBillingCycle}
          discount={averageDiscount}
        />
      </div>

      <div className="grid grid-cols-4 gap-5 items-start">
        {visibleTiers.map((tier) => (
          <PricingCard
            key={tier.id}
            tier={tier}
            config={tierConfigs[tier.id]}
            billingCycle={billingCycle}
            ctaClicked={ctaClicked === tier.id}
            onCardClick={() => setEditingTier(tier.id)}
            onCtaClick={() => handleCtaClick(tier.id)}
          />
        ))}
      </div>

      <FeatureComparisonTable tiers={visibleTiers} />
    </div>
  );
}
