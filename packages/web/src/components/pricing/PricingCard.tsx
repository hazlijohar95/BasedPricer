import { Check, Star, Crown } from '@phosphor-icons/react';
import type { Tier } from '../../data/tiers';
import type { TierConfig, BillingCycle } from './types';
import { getFeatureName, getFeatureLimit } from '../../utils/features';

interface PricingCardProps {
  tier: Tier;
  config: TierConfig;
  billingCycle: BillingCycle;
  isEditMode?: boolean;
  ctaClicked?: boolean;
  onCardClick?: () => void;
  onCtaClick?: () => void;
}

export function PricingCard({
  tier,
  config,
  billingCycle,
  isEditMode = false,
  ctaClicked = false,
  onCardClick,
  onCtaClick,
}: PricingCardProps) {
  const displayPrice = billingCycle === 'monthly'
    ? config.monthlyPrice
    : Math.round(config.annualPrice / 12);
  const isComingSoon = tier.status === 'coming_soon';
  const isCustom = tier.id === 'enterprise';

  return (
    <div
      className={`relative rounded-[0.2rem] bg-white transition-all duration-200 ${
        config.highlighted
          ? 'ring-2 ring-[#253ff6] shadow-xl shadow-[#253ff6]/5'
          : 'border border-gray-200'
      } ${isEditMode ? 'w-full sm:w-72' : 'cursor-pointer hover:border-gray-300 hover:shadow-md active:shadow-md touch-manipulation'}`}
      onClick={!isEditMode ? onCardClick : undefined}
    >
      {/* Popular Badge */}
      {config.highlighted && (
        <div className="absolute -top-3 sm:-top-3.5 left-1/2 -translate-x-1/2 z-10">
          <span className="bg-[#253ff6] text-white text-[10px] sm:text-xs font-semibold px-3 sm:px-4 py-1 sm:py-1.5 rounded-[0.2rem] flex items-center gap-1 sm:gap-1.5 shadow-lg shadow-[#253ff6]/25 whitespace-nowrap">
            <Star size={10} weight="fill" className="sm:w-3 sm:h-3" />
            {config.badgeText}
          </span>
        </div>
      )}

      {/* Coming Soon Badge */}
      {isComingSoon && !config.highlighted && (
        <div className="absolute -top-2.5 sm:-top-3 right-3 sm:right-4 z-10">
          <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] sm:text-[11px] font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-[0.2rem] shadow-sm">
            Coming Soon
          </span>
        </div>
      )}

      <div className={`p-4 sm:p-6 ${config.highlighted ? 'pt-6 sm:pt-8' : ''}`}>
        {/* Tier Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">{tier.name}</h3>
            {tier.id === 'enterprise' && <Crown size={16} weight="fill" className="text-amber-500 sm:w-[18px] sm:h-[18px]" />}
          </div>
          <p className="text-xs sm:text-sm text-gray-500">{config.tagline}</p>
        </div>

        {/* Price */}
        <div className="mb-4 sm:mb-6">
          {isCustom ? (
            <div>
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">Custom</span>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Tailored to your needs</p>
            </div>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-xs sm:text-sm font-medium text-gray-400">MYR</span>
              <span className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">{displayPrice}</span>
              <span className="text-xs sm:text-sm text-gray-400">/mo</span>
            </div>
          )}
          {billingCycle === 'annual' && config.monthlyPrice > 0 && !isCustom && (
            <p className="text-xs sm:text-sm text-emerald-600 mt-1.5 sm:mt-2 font-medium">
              Save MYR {(config.monthlyPrice * 12 - config.annualPrice).toLocaleString()}/yr
            </p>
          )}
        </div>

        {/* CTA Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isComingSoon && onCtaClick) {
              onCtaClick();
            }
          }}
          className={`w-full py-2.5 sm:py-3 px-4 rounded-[0.2rem] font-medium text-xs sm:text-sm transition-all duration-200 mb-4 sm:mb-6 touch-manipulation ${
            config.ctaStyle === 'primary'
              ? 'bg-[#253ff6] text-white hover:bg-[#1e35d4] active:bg-[#1e35d4] shadow-md shadow-[#253ff6]/20 focus-visible:ring-2 focus-visible:ring-[#253ff6] focus-visible:ring-offset-2'
              : config.ctaStyle === 'secondary'
              ? 'bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-800 focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2'
              : 'border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-50 focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2'
          } ${isComingSoon ? 'opacity-60 cursor-not-allowed' : ''} ${ctaClicked ? 'scale-95' : ''}`}
          disabled={isComingSoon}
        >
          {ctaClicked ? 'Preview Only' : isComingSoon ? 'Coming Soon' : config.ctaText}
        </button>

        {/* Features */}
        <div>
          <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 sm:mb-4">
            {tier.id === 'freemium' ? 'Includes' : `Everything in ${tier.id === 'basic' ? 'Free' : tier.id === 'pro' ? 'Basic' : 'Pro'}, plus`}
          </p>
          <div className="space-y-2.5 sm:space-y-3">
            {config.highlightedFeatures.slice(0, config.maxVisibleFeatures).map((featureId) => {
              const limit = getFeatureLimit(tier, featureId);
              const isIncluded = tier.includedFeatures.includes(featureId);
              if (!isIncluded) return null;

              return (
                <div key={featureId} className="flex items-start gap-2 sm:gap-3">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-[0.2rem] bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={10} weight="bold" className="text-emerald-600 sm:w-3 sm:h-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs sm:text-sm text-gray-700">{getFeatureName(featureId)}</span>
                    {config.showLimits && limit && (
                      <span className="text-[10px] sm:text-xs text-gray-400 ml-1">({limit})</span>
                    )}
                  </div>
                </div>
              );
            })}
            {config.highlightedFeatures.length === 0 && (
              <p className="text-xs sm:text-sm text-gray-400 italic">Click to add features</p>
            )}
            {config.highlightedFeatures.length > config.maxVisibleFeatures && (
              <p className="text-[10px] sm:text-xs text-gray-400 mt-2">
                +{config.highlightedFeatures.length - config.maxVisibleFeatures} more features
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
