import { useState } from 'react';
import { CaretDown, GlobeSimple, Lock, Check, X, Info } from '@phosphor-icons/react';

interface RepoAccessInfoProps {
  defaultExpanded?: boolean;
  hasToken: boolean;
}

export function RepoAccessInfo({ defaultExpanded = false, hasToken }: RepoAccessInfoProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-gray-200 bg-gray-50/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info size={18} weight="duotone" className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Repository access options</span>
          {hasToken && (
            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-medium rounded">
              Token active
            </span>
          )}
        </div>
        <CaretDown
          size={16}
          className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Public repos */}
            <div className={`p-4 rounded-lg border ${!hasToken ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <GlobeSimple size={18} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Public Repos</p>
                  <p className="text-[10px] text-gray-500">No authentication needed</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Check size={14} className="text-emerald-500" />
                  <span className="text-gray-600">Public repositories</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <X size={14} className="text-gray-300" />
                  <span className="text-gray-400">Private repositories</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-amber-600 font-medium">60</span>
                  <span className="text-gray-600">requests/hour limit</span>
                </div>
              </div>
            </div>

            {/* With token */}
            <div className={`p-4 rounded-lg border ${hasToken ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hasToken ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                  <Lock size={18} className={hasToken ? 'text-emerald-600' : 'text-gray-400'} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">With GitHub Token</p>
                  <p className="text-[10px] text-gray-500">
                    {hasToken ? 'Currently active' : 'Add token above'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Check size={14} className="text-emerald-500" />
                  <span className="text-gray-600">Public repositories</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Check size={14} className="text-emerald-500" />
                  <span className="text-gray-600">Private repositories</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-600 font-medium">5,000</span>
                  <span className="text-gray-600">requests/hour limit</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security note */}
          <div className="mt-3 p-2.5 bg-amber-50 border border-amber-100 rounded-md">
            <p className="text-xs text-amber-800">
              <strong>Token permissions:</strong> We only need read-only access (<code className="bg-amber-100 px-1 rounded text-[10px]">repo</code> scope).
              Your token is stored locally and sent directly to GitHub.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
