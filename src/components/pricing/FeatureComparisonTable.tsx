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
      <div className="px-6 py-5 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Compare All Features</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/3">
                Feature
              </th>
              {tiers.map(tier => (
                <th key={tier.id} className="text-center py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                    <td colSpan={tiers.length + 1} className="py-3 px-6 bg-gray-50/80">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {category.name}
                      </span>
                    </td>
                  </tr>
                  {categoryFeatures.map((feature) => (
                    <tr key={feature.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-6">
                        <span className="text-sm text-gray-700">{feature.name}</span>
                      </td>
                      {tiers.map((tier) => {
                        const isIncluded = tier.includedFeatures.includes(feature.id);
                        const limit = getFeatureLimit(tier, feature.id);
                        return (
                          <td key={tier.id} className="py-3.5 px-4 text-center">
                            {isIncluded ? (
                              limit ? (
                                <span className="text-sm text-gray-600 font-medium">{limit}</span>
                              ) : (
                                <div className="w-5 h-5 rounded-[0.2rem] bg-emerald-50 flex items-center justify-center mx-auto">
                                  <Check size={12} weight="bold" className="text-emerald-600" />
                                </div>
                              )
                            ) : (
                              <X size={16} className="text-gray-300 mx-auto" />
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
