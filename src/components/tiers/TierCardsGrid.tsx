/**
 * TierCardsGrid component
 * Displays a grid of tier cards with cost and margin information
 */

import type { Tier } from '../../data/tiers';

export interface TierCostData {
  total: number;
  margin: number;
}

interface TierCardsGridProps {
  tiers: Tier[];
  allTierCosts: Map<string, TierCostData>;
  selectedTierId: string;
  onSelect: (tierId: string) => void;
}

export function TierCardsGrid({
  tiers,
  allTierCosts,
  selectedTierId,
  onSelect,
}: TierCardsGridProps) {
  return (
    <div className={`grid gap-4 ${
      tiers.length === 2 ? 'grid-cols-2' :
      tiers.length === 3 ? 'grid-cols-3' :
      tiers.length === 5 ? 'grid-cols-5' :
      'grid-cols-4'
    }`}>
      {tiers.map((tier) => {
        const tierData = allTierCosts.get(tier.id);
        const tierCostsTotal = tierData?.total ?? 0;
        const tierMargin = tierData?.margin ?? 0;
        const isSelected = selectedTierId === tier.id;

        return (
          <button
            key={tier.id}
            onClick={() => onSelect(tier.id)}
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
  );
}
