import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  DotsSixVertical, Plus, Trash,
  ArrowsClockwise, CurrencyDollar, PaintBrush,
  ListBullets, CaretDown, CaretRight, Eye, EyeSlash,
  ArrowLeft, Star, Crown, Copy, Check
} from '@phosphor-icons/react';
import { featureCategories } from '../data/features';
import { PricingCard, FeatureComparisonTable } from './pricing';
import type { BillingCycle, EditTab } from './pricing';
import { BillingCycleToggle, Toggle, SearchInput } from './shared';
import { getFeatureName, getFeatureLimit, calculateDiscount } from '../utils/features';
import { DISCOUNT_PRESETS } from '../constants';
import { usePricing, type TierDisplayConfig } from '../context/PricingContext';
import { useNavigation } from '../context/NavigationContext';

export function PricingMockup() {
  // Get tiers, features, and tier display configs from context
  const {
    tiers,
    features,
    tierDisplayConfigs,
    setTierDisplayConfig,
    initializeTierDisplayConfigs,
  } = usePricing();
  const { previousTab, navigateTo } = useNavigation();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [editTab, setEditTab] = useState<EditTab>('pricing');
  const [draggedFeature, setDraggedFeature] = useState<string | null>(null);
  const [featureSearch, setFeatureSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [ctaClicked, setCtaClicked] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Initialize tier display configs if tiers exist but configs don't
  useEffect(() => {
    const hasConfigs = Object.keys(tierDisplayConfigs).length > 0;
    const hasTiers = tiers.length > 0;
    if (hasTiers && !hasConfigs) {
      initializeTierDisplayConfigs();
    }
  }, [tiers, tierDisplayConfigs, initializeTierDisplayConfigs]);

  const visibleTiers = tiers.filter(t => t.status === 'active' || t.status === 'coming_soon');

  // Helper to get a tier's display config with fallback
  const getTierConfig = useCallback((tierId: string): TierDisplayConfig => {
    if (tierDisplayConfigs[tierId]) {
      return tierDisplayConfigs[tierId];
    }
    // Create fallback from tier data if config doesn't exist
    const tier = tiers.find(t => t.id === tierId);
    const tierIndex = tiers.findIndex(t => t.id === tierId);
    if (tier) {
      const isFirstPaidTier = tier.monthlyPriceMYR > 0 && tierIndex <= 1;
      return {
        highlighted: isFirstPaidTier,
        highlightedFeatures: [...tier.highlightFeatures],
        ctaText: tier.monthlyPriceMYR === 0 ? 'Get Started Free'
          : isFirstPaidTier ? 'Start Free Trial'
          : 'Contact Sales',
        ctaStyle: isFirstPaidTier ? 'primary' : tier.monthlyPriceMYR === 0 ? 'outline' : 'secondary',
        monthlyPrice: tier.monthlyPriceMYR,
        annualPrice: tier.annualPriceMYR,
        tagline: tier.tagline,
        badgeText: 'Most Popular',
        showLimits: true,
        maxVisibleFeatures: 6,
      };
    }
    // Ultimate fallback for edge cases
    return {
      highlighted: false,
      highlightedFeatures: [],
      ctaText: 'Get Started',
      ctaStyle: 'secondary',
      badgeText: '',
      showLimits: true,
      maxVisibleFeatures: 6,
      monthlyPrice: 0,
      annualPrice: 0,
      tagline: '',
    };
  }, [tierDisplayConfigs, tiers]);

  const updateTierConfig = (tierId: string, updates: Partial<TierDisplayConfig>) => {
    setTierDisplayConfig(tierId, updates);
  };

  const setHighlightedTier = (tierId: string, highlighted: boolean) => {
    if (highlighted) {
      // Only one tier can be highlighted at a time
      Object.keys(tierDisplayConfigs).forEach(id => {
        setTierDisplayConfig(id, { highlighted: id === tierId });
      });
    } else {
      updateTierConfig(tierId, { highlighted: false });
    }
  };

  const addFeatureToHighlights = (tierId: string, featureId: string) => {
    const config = getTierConfig(tierId);
    if (!config.highlightedFeatures.includes(featureId)) {
      updateTierConfig(tierId, { highlightedFeatures: [...config.highlightedFeatures, featureId] });
    }
  };

  const removeFeatureFromHighlights = (tierId: string, featureId: string) => {
    const config = getTierConfig(tierId);
    updateTierConfig(tierId, { highlightedFeatures: config.highlightedFeatures.filter(f => f !== featureId) });
  };

  const moveFeature = (tierId: string, fromIndex: number, toIndex: number) => {
    const config = getTierConfig(tierId);
    const newFeatures = [...config.highlightedFeatures];
    const [moved] = newFeatures.splice(fromIndex, 1);
    newFeatures.splice(toIndex, 0, moved);
    updateTierConfig(tierId, { highlightedFeatures: newFeatures });
  };

  const resetTierConfig = (tierId: string) => {
    const tier = tiers.find(t => t.id === tierId);
    if (tier) {
      const currentConfig = getTierConfig(tierId);
      // Reset to defaults from tier, but keep highlighted status
      updateTierConfig(tierId, {
        highlightedFeatures: [...tier.highlightFeatures],
        ctaText: tier.monthlyPriceMYR === 0 ? 'Get Started Free' : 'Start Free Trial',
        ctaStyle: tier.monthlyPriceMYR === 0 ? 'outline' : 'primary',
        monthlyPrice: tier.monthlyPriceMYR,
        annualPrice: tier.annualPriceMYR,
        tagline: tier.tagline,
        badgeText: 'Most Popular',
        showLimits: true,
        maxVisibleFeatures: 6,
        highlighted: currentConfig.highlighted,
      });
    }
  };

  const handleDragStart = (featureId: string) => setDraggedFeature(featureId);
  const handleDragEnd = () => setDraggedFeature(null);
  const handleDragOver = (e: React.DragEvent, tierId: string, targetIndex: number) => {
    e.preventDefault();
    if (!draggedFeature) return;
    const config = getTierConfig(tierId);
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
  const editingConfig = editingTier ? getTierConfig(editingTier) : null;

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
      .map(t => getTierConfig(t.id))
      .filter(c => c.monthlyPrice > 0)
      .map(c => calculateDiscount(c.monthlyPrice, c.annualPrice));
    return discounts.length > 0
      ? Math.round(discounts.reduce((a, b) => a + b, 0) / discounts.length)
      : 17;
  }, [visibleTiers, getTierConfig]);

  const handleCtaClick = (tierId: string) => {
    setCtaClicked(tierId);
    setTimeout(() => setCtaClicked(null), 1500);
  };

  // Generate and copy pricing HTML
  const copyPricingHTML = async () => {
    const html = generatePricingHTML();
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const generatePricingHTML = () => {
    const tiersHtml = visibleTiers.map(tier => {
      const config = getTierConfig(tier.id);
      const price = billingCycle === 'monthly' ? config.monthlyPrice : config.annualPrice;
      const featuresList = config.highlightedFeatures
        .slice(0, 5)
        .map(f => `      <li>${getFeatureName(f)}</li>`)
        .join('\n');

      return `  <div class="pricing-card${config.highlighted ? ' popular' : ''}">
    <h3>${tier.name}</h3>
    ${config.badgeText ? `<span class="badge">${config.badgeText}</span>` : ''}
    <div class="price">
      <span class="currency">MYR</span>
      <span class="amount">${price}</span>
      <span class="period">/${billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
    </div>
    <a href="#" class="cta-button">${config.ctaText}</a>
    <ul class="features">
${featuresList}
    </ul>
  </div>`;
    }).join('\n\n');

    return `<!-- Pricing Cards - Generated by BasedPricer -->
<div class="pricing-container">
${tiersHtml}
</div>

<style>
.pricing-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
.pricing-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
}
.pricing-card.popular {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1);
}
.pricing-card h3 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; }
.pricing-card .badge { display: inline-block; background: #3b82f6; color: white; font-size: 0.75rem; padding: 0.25rem 0.75rem; border-radius: 9999px; margin-bottom: 1rem; }
.pricing-card .price { margin: 1rem 0; }
.pricing-card .currency { font-size: 1rem; }
.pricing-card .amount { font-size: 2.5rem; font-weight: 700; }
.pricing-card .period { color: #6b7280; }
.pricing-card .cta-button { display: block; padding: 0.75rem 1.5rem; background: #3b82f6; color: white; text-decoration: none; border-radius: 0.5rem; font-weight: 500; margin: 1rem 0; }
.pricing-card .features { list-style: none; padding: 0; text-align: left; }
.pricing-card .features li { padding: 0.5rem 0; border-top: 1px solid #f3f4f6; }
</style>`;
  };

  // Edit mode view
  if (editingTier && editingTierData && editingConfig) {
    return (
      <div className="min-h-[calc(100vh-8rem)] lg:h-[calc(100vh-8rem)] flex flex-col -mt-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-3 flex-shrink-0">
          <button
            onClick={() => setEditingTier(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors touch-manipulation active:text-gray-900"
          >
            <ArrowLeft size={18} weight="bold" />
            <span className="text-xs sm:text-sm font-medium">Back to all tiers</span>
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
            {/* Quick Tier Switcher */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-[0.2rem] overflow-x-auto w-full sm:w-auto">
              {visibleTiers.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => { setEditingTier(tier.id); setFeatureSearch(''); }}
                  className={`px-2 sm:px-3 py-1.5 text-xs font-medium rounded-[0.2rem] transition-all whitespace-nowrap touch-manipulation ${
                    editingTier === tier.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 active:text-gray-700'
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
        <div className="flex-1 flex flex-col lg:flex-row gap-6 lg:gap-10 items-stretch lg:items-start min-h-0 overflow-y-auto lg:overflow-visible">
          {/* Card Preview */}
          <div className="flex flex-col items-center pt-4 lg:pt-6 order-2 lg:order-1 pb-6 lg:pb-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-3 font-medium">Live Preview</p>
            <div className="w-full max-w-[280px] sm:max-w-none">
              <PricingCard
                tier={editingTierData}
                config={editingConfig}
                billingCycle={billingCycle}
                isEditMode={true}
                ctaClicked={ctaClicked === editingTier}
                onCtaClick={() => handleCtaClick(editingTier)}
              />
            </div>
          </div>

          {/* Edit Panel */}
          <div className="flex-1 max-w-full lg:max-w-lg lg:h-full flex flex-col order-1 lg:order-2">
            <div className="bg-white rounded-[0.2rem] border border-gray-200 overflow-hidden shadow-sm flex flex-col lg:h-full">
              {/* Header */}
              <div className="px-4 sm:px-5 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${editingConfig.highlighted ? 'bg-[#253ff6]' : 'bg-gray-300'}`} />
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Edit {editingTierData.name}</h3>
                  </div>
                  <button
                    onClick={() => resetTierConfig(editingTier)}
                    className="p-2 sm:p-1.5 hover:bg-gray-200 rounded-[0.2rem] transition-colors text-gray-400 hover:text-gray-600 touch-manipulation active:bg-gray-200"
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
                    className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1.5 sm:gap-2 touch-manipulation ${
                      editTab === tab.id
                        ? 'text-[#253ff6] border-b-2 border-[#253ff6] bg-[rgba(37,63,246,0.02)]'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:bg-gray-50'
                    }`}
                  >
                    <tab.icon size={16} weight={editTab === tab.id ? 'duotone' : 'regular'} />
                    <span className="hidden xs:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto min-h-0">
                {/* Pricing Tab */}
                {editTab === 'pricing' && (
                  <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
                    {editingTierData.id !== 'enterprise' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Monthly Price</label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm text-gray-400 font-medium">MYR</span>
                            <input
                              type="number"
                              min="0"
                              value={editingConfig.monthlyPrice}
                              onChange={(e) => updateTierConfig(editingTier, { monthlyPrice: Math.max(0, Number(e.target.value)) })}
                              className="input-field flex-1 text-sm touch-manipulation"
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
                            <span className="text-xs sm:text-sm text-gray-400 font-medium">MYR</span>
                            <input
                              type="number"
                              min="0"
                              value={editingConfig.annualPrice}
                              onChange={(e) => updateTierConfig(editingTier, { annualPrice: Math.max(0, Number(e.target.value)) })}
                              className="input-field flex-1 text-sm touch-manipulation"
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-1.5">
                            = MYR {Math.round(editingConfig.annualPrice / 12)}/mo annually
                          </p>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Quick Annual Discount</label>
                          <div className="flex gap-2">
                            {DISCOUNT_PRESETS.map(discount => {
                              const annualPrice = Math.round(editingConfig.monthlyPrice * 12 * (1 - discount / 100));
                              const isActive = editingConfig.annualPrice === annualPrice;
                              return (
                                <button
                                  key={discount}
                                  onClick={() => updateTierConfig(editingTier, { annualPrice })}
                                  className={`flex-1 py-2.5 sm:py-2 text-xs sm:text-sm font-medium rounded-[0.2rem] transition-all touch-manipulation ${
                                    isActive ? 'bg-[#253ff6] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-200'
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
                      <div className="text-center py-6 sm:py-8 text-gray-500">
                        <Crown size={36} weight="duotone" className="text-amber-500 mx-auto mb-3 sm:w-10 sm:h-10" />
                        <p className="text-sm sm:text-base font-medium text-gray-700">Custom Pricing</p>
                        <p className="text-xs sm:text-sm mt-1">Enterprise tier uses custom pricing</p>
                      </div>
                    )}
                    <div className="pt-4 border-t border-gray-100">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Tagline</label>
                      <input
                        type="text"
                        value={editingConfig.tagline}
                        onChange={(e) => updateTierConfig(editingTier, { tagline: e.target.value })}
                        className="input-field text-sm touch-manipulation"
                        placeholder="e.g. Perfect for small teams"
                      />
                    </div>
                  </div>
                )}

                {/* Appearance Tab */}
                {editTab === 'appearance' && (
                  <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
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
                        className="input-field -mt-2 text-sm touch-manipulation"
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
                          className="input-field text-sm touch-manipulation"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Button Style</label>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                          {([
                            { id: 'primary', label: 'Primary', preview: 'bg-[#253ff6]' },
                            { id: 'secondary', label: 'Dark', preview: 'bg-gray-900' },
                            { id: 'outline', label: 'Outline', preview: 'border-2 border-gray-300 bg-white' },
                          ] as const).map(style => (
                            <button
                              key={style.id}
                              onClick={() => updateTierConfig(editingTier, { ctaStyle: style.id })}
                              className={`py-2.5 sm:py-3 text-xs sm:text-sm font-medium rounded-[0.2rem] transition-all border-2 touch-manipulation ${
                                editingConfig.ctaStyle === style.id
                                  ? 'border-[#253ff6] bg-[rgba(37,63,246,0.04)]'
                                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 active:bg-gray-100'
                              }`}
                            >
                              <div className={`w-6 sm:w-8 h-2 rounded-[0.2rem] mx-auto mb-1.5 sm:mb-2 ${style.preview}`} />
                              {style.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 space-y-4">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Display Options</label>
                      <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2 sm:gap-3">
                          {editingConfig.showLimits ? <Eye size={18} className="text-gray-400" /> : <EyeSlash size={18} className="text-gray-400" />}
                          <span className="text-xs sm:text-sm text-gray-700">Show feature limits</span>
                        </div>
                        <Toggle
                          checked={editingConfig.showLimits}
                          onChange={(checked) => updateTierConfig(editingTier, { showLimits: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-xs sm:text-sm text-gray-700">Visible features</span>
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          {[4, 5, 6, 8].map(num => (
                            <button
                              key={num}
                              onClick={() => updateTierConfig(editingTier, { maxVisibleFeatures: num })}
                              className={`w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm font-medium rounded-[0.2rem] transition-all touch-manipulation ${
                                editingConfig.maxVisibleFeatures === num
                                  ? 'bg-[#253ff6] text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-200'
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
                    <div className="p-4 sm:p-5 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Featured ({editingConfig.highlightedFeatures.length})
                        </span>
                        {editingConfig.highlightedFeatures.length > 0 && (
                          <button
                            onClick={() => updateTierConfig(editingTier, { highlightedFeatures: [] })}
                            className="text-xs text-red-500 hover:text-red-600 active:text-red-600 font-medium touch-manipulation p-1"
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
                                className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-[0.2rem] bg-gray-50 group transition-all ${
                                  draggedFeature === featureId ? 'opacity-50 ring-1 ring-dashed ring-[#253ff6]' : ''
                                }`}
                              >
                                <DotsSixVertical size={14} className="text-gray-300 cursor-grab flex-shrink-0 hidden sm:block" />
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs sm:text-sm text-gray-700 block truncate">{getFeatureName(featureId)}</span>
                                  {limit && <span className="text-xs text-gray-400">{limit}</span>}
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); removeFeatureFromHighlights(editingTier, featureId); }}
                                  className="p-2 sm:p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-50 active:bg-red-50 rounded-[0.2rem] transition-all flex-shrink-0 touch-manipulation"
                                >
                                  <Trash size={12} className="text-red-500" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-4 sm:py-6 text-gray-400 bg-gray-50 rounded-[0.2rem]">
                          <ListBullets size={24} className="mx-auto mb-2 opacity-50 sm:w-7 sm:h-7" />
                          <p className="text-xs sm:text-sm">No features selected</p>
                          <p className="text-xs mt-0.5">Add features from below</p>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 p-4 sm:p-5 flex flex-col min-h-0">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Available Features</span>
                        <span className="text-xs text-gray-400">
                          {editingTierData.includedFeatures.length - editingConfig.highlightedFeatures.length} remaining
                        </span>
                      </div>
                      <SearchInput
                        value={featureSearch}
                        onChange={setFeatureSearch}
                        placeholder="Search features..."
                        className="mb-2 sm:mb-3"
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
                                  className="flex items-center gap-2 w-full py-2 px-1 text-left hover:bg-gray-50 active:bg-gray-50 rounded-[0.2rem] transition-colors touch-manipulation"
                                >
                                  {isExpanded ? <CaretDown size={14} className="text-gray-400" /> : <CaretRight size={14} className="text-gray-400" />}
                                  <span className="text-xs sm:text-sm font-medium text-gray-600">{category?.name || categoryId}</span>
                                  <span className="text-xs text-gray-400 ml-auto bg-gray-100 px-1.5 py-0.5 rounded">{featureIds.length}</span>
                                </button>
                                {isExpanded && (
                                  <div className="ml-4 sm:ml-5 space-y-0.5 mb-2">
                                    {featureIds.map(featureId => {
                                      const limit = getFeatureLimit(editingTierData, featureId);
                                      return (
                                        <button
                                          key={featureId}
                                          onClick={() => addFeatureToHighlights(editingTier, featureId)}
                                          className="flex items-center gap-2 w-full p-2 rounded-[0.2rem] hover:bg-[rgba(37,63,246,0.04)] active:bg-[rgba(37,63,246,0.04)] transition-all text-left group touch-manipulation"
                                        >
                                          <Plus size={12} className="text-gray-300 group-hover:text-[#253ff6] flex-shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <span className="text-xs sm:text-sm text-gray-600 block truncate">{getFeatureName(featureId)}</span>
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
                          <div className="text-center py-4 sm:py-6 text-gray-400">
                            <p className="text-xs sm:text-sm">{featureSearch ? 'No matching features' : 'All features selected'}</p>
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
    <div className="space-y-6 sm:space-y-8">
      {/* Back navigation */}
      {previousTab && previousTab !== 'mockup' && (
        <div className="flex items-center">
          <button
            onClick={() => navigateTo(previousTab)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 active:text-gray-700 transition-colors text-xs sm:text-sm touch-manipulation"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>Back to {previousTab === 'overview' ? 'Overview' : previousTab === 'pricing' ? 'Calculator' : previousTab === 'tiers' ? 'Tiers' : previousTab === 'cogs' ? 'Costs' : previousTab === 'features' ? 'Features' : previousTab === 'analyze' ? 'Analyzer' : previousTab}</span>
          </button>
        </div>
      )}

      <div className="text-center max-w-2xl mx-auto px-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Pricing Preview</h1>
        <p className="text-gray-500 mt-1 sm:mt-2 text-xs sm:text-base">This is what your pricing page could look like. Click any card to customize.</p>
        <button
          onClick={copyPricingHTML}
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-all touch-manipulation"
        >
          {copied ? (
            <>
              <Check size={16} weight="bold" className="text-emerald-500" />
              <span className="text-emerald-600">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={16} weight="duotone" />
              <span>Copy HTML</span>
            </>
          )}
        </button>
      </div>

      <div className="flex justify-center">
        <BillingCycleToggle
          value={billingCycle}
          onChange={setBillingCycle}
          discount={averageDiscount}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-start px-4 sm:px-0">
        {visibleTiers.map((tier) => (
          <PricingCard
            key={tier.id}
            tier={tier}
            config={getTierConfig(tier.id)}
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
