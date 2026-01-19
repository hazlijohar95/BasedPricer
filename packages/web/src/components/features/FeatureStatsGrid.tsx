/**
 * FeatureStatsGrid component
 * Displays feature statistics: Total, Codebase, Manual, With Limits
 */

import { Lightning, Code, User, GitBranch } from '@phosphor-icons/react';

export interface FeatureStats {
  total: number;
  codebase: number;
  manual: number;
  categories: number;
  withLimits: number;
}

interface FeatureStatsGridProps {
  stats: FeatureStats;
}

export function FeatureStatsGrid({ stats }: FeatureStatsGridProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="card p-5 border-l-[3px] border-l-[#253ff6]">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Total Features</p>
          <div className="w-8 h-8 rounded-full bg-[rgba(37,63,246,0.08)] flex items-center justify-center">
            <Lightning size={16} weight="duotone" className="text-[#253ff6]" />
          </div>
        </div>
        <p className="text-2xl font-semibold text-gray-900 mt-2">{stats.total}</p>
        <p className="text-xs text-gray-400 mt-1">{stats.categories} categories</p>
      </div>
      <div className="card p-5 border-l-[3px] border-l-emerald-500">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">From Codebase</p>
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
            <Code size={16} weight="duotone" className="text-emerald-600" />
          </div>
        </div>
        <p className="text-2xl font-semibold text-emerald-600 mt-2">{stats.codebase}</p>
        <p className="text-xs text-gray-400 mt-1">AI-detected / cited</p>
      </div>
      <div className="card p-5 border-l-[3px] border-l-violet-500">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">User Added</p>
          <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center">
            <User size={16} weight="duotone" className="text-violet-600" />
          </div>
        </div>
        <p className="text-2xl font-semibold text-violet-600 mt-2">{stats.manual}</p>
        <p className="text-xs text-gray-400 mt-1">Planned / intended</p>
      </div>
      <div className="card p-5 border-l-[3px] border-l-amber-500">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">With Limits</p>
          <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
            <GitBranch size={16} weight="duotone" className="text-amber-600" />
          </div>
        </div>
        <p className="text-2xl font-semibold text-amber-600 mt-2">{stats.withLimits}</p>
        <p className="text-xs text-gray-400 mt-1">Tier-limited features</p>
      </div>
    </div>
  );
}
