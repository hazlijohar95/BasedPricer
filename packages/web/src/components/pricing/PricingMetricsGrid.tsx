/**
 * PricingMetricsGrid component
 * Displays key pricing metrics in a grid layout
 */

import { TrendUp, Users, Target, Percent } from '@phosphor-icons/react';
import {
  getGrossMarginTextColor,
  getGrossMarginBgColor,
  getOperatingMarginTextColor,
  getOperatingMarginBgColor,
  getOperatingMarginBorderColor,
} from '../../utils/marginUtils';

interface PricingMetricsGridProps {
  totalMRR: number;
  grossMargin: number;
  operatingMargin: number;
  arpu: number;
}

export function PricingMetricsGrid({
  totalMRR,
  grossMargin,
  operatingMargin,
  arpu,
}: PricingMetricsGridProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Monthly Revenue */}
      <div className="card p-5 border-l-[3px] border-l-[#253ff6]">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Monthly Revenue</p>
          <div className="w-8 h-8 rounded-full bg-[rgba(37,63,246,0.08)] flex items-center justify-center">
            <TrendUp size={16} weight="duotone" className="text-[#253ff6]" />
          </div>
        </div>
        <p className="text-2xl font-semibold text-gray-900 mt-2 font-mono tracking-tight">
          MYR {totalMRR.toLocaleString()}
        </p>
        <p className="text-xs text-gray-400 mt-1">Recurring</p>
      </div>

      {/* Gross Margin */}
      <div className="card p-5 border-l-[3px] border-l-emerald-500">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Gross Margin</p>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getGrossMarginBgColor(grossMargin)}`}>
            <Percent size={16} weight="duotone" className={getGrossMarginTextColor(grossMargin)} />
          </div>
        </div>
        <p className={`text-2xl font-semibold mt-2 ${getGrossMarginTextColor(grossMargin)}`}>
          {grossMargin.toFixed(0)}%
        </p>
        <p className="text-xs text-gray-400 mt-1">Revenue − Variable Costs</p>
      </div>

      {/* Operating Margin */}
      <div className={`card p-5 border-l-[3px] ${getOperatingMarginBorderColor(operatingMargin)}`}>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Operating Margin</p>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getOperatingMarginBgColor(operatingMargin)}`}>
            <Target size={16} weight="duotone" className={getOperatingMarginTextColor(operatingMargin)} />
          </div>
        </div>
        <p className={`text-2xl font-semibold mt-2 ${getOperatingMarginTextColor(operatingMargin)}`}>
          {operatingMargin.toFixed(0)}%
        </p>
        <p className="text-xs text-gray-400 mt-1">After all costs</p>
      </div>

      {/* ARPU */}
      <div className="card p-5 border-l-[3px] border-l-violet-500">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">ARPU (Paid)</p>
          <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center">
            <Users size={16} weight="duotone" className="text-violet-600" />
          </div>
        </div>
        <p className="text-2xl font-semibold text-gray-900 mt-2 font-mono tracking-tight">
          MYR {arpu.toFixed(0)}
        </p>
        <p className="text-xs text-gray-400 mt-1">Per paying user</p>
      </div>
    </div>
  );
}
