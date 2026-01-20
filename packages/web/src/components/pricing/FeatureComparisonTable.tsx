import { Check, X } from '@phosphor-icons/react';
import type { Tier } from '../../data/tiers';
import { features, featureCategories } from '../../data/features';
import { getFeatureLimit } from '../../utils/features';

interface FeatureComparisonTableProps {
  tiers: Tier[];
}

export function FeatureComparisonTable({ tiers }: FeatureComparisonTableProps) {
  return (
    <div className="bg-white rounded-[0.2rem] border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Compare All Features</h3>
      </div>
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full min-w-[500px]" aria-label="Feature comparison across pricing tiers">
          <thead>
            <tr className="bg-gray-50/50">
              <th scope="col" className="text-left py-3 sm:py-4 px-3 sm:px-6 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/3 sticky left-0 bg-gray-50/50 z-10">
                Feature
              </th>
              {tiers.map(tier => (
                <th scope="col" key={tier.id} className="text-center py-3 sm:py-4 px-2 sm:px-4 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {tier.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Object.entries(featureCategories).map(([categoryId, category]) => {
              const categoryFeatures = features.filter(f => f.category === categoryId);
              if (categoryFeatures.length === 0) return null;

              return (
                <>
                  <tr key={categoryId}>
                    <td colSpan={tiers.length + 1} className="py-2 sm:py-3 px-3 sm:px-6 bg-gray-50/80">
                      <span className="text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {category.name}
                      </span>
                    </td>
                  </tr>
                  {categoryFeatures.map((feature) => (
                    <tr key={feature.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 sm:py-3.5 px-3 sm:px-6 sticky left-0 bg-white">
                        <span className="text-xs sm:text-sm text-gray-700">{feature.name}</span>
                      </td>
                      {tiers.map((tier) => {
                        const isIncluded = tier.includedFeatures.includes(feature.id);
                        const limit = getFeatureLimit(tier, feature.id);
                        return (
                          <td key={tier.id} className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-center">
                            {isIncluded ? (
                              limit ? (
                                <span className="text-xs sm:text-sm text-gray-600 font-medium">{limit}</span>
                              ) : (
                                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-[0.2rem] bg-emerald-50 flex items-center justify-center mx-auto">
                                  <Check size={10} weight="bold" className="text-emerald-600 sm:w-3 sm:h-3" />
                                </div>
                              )
                            ) : (
                              <X size={14} className="text-gray-300 mx-auto sm:w-4 sm:h-4" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
