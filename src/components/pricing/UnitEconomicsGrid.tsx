/**
 * UnitEconomicsGrid component
 * Displays unit economics metrics: LTV, Break-even, Contribution Margin, Recommended CAC
 */

import { useState } from 'react';
import { CaretUp, Info } from '@phosphor-icons/react';

interface UnitEconomicsGridProps {
  ltv: number;
  monthlyChurnRate: number;
  breakEvenCustomers: number;
  paidCustomers: number;
  contributionMargin: number;
  freemiumCosts: number;
  freemiumCostPerUser: number;
  fixedCosts?: number;
}

export function UnitEconomicsGrid({
  ltv,
  monthlyChurnRate,
  breakEvenCustomers,
  paidCustomers,
  contributionMargin,
  freemiumCosts,
  freemiumCostPerUser,
  fixedCosts = 0,
}: UnitEconomicsGridProps) {
  const [showBreakEvenDetails, setShowBreakEvenDetails] = useState(false);

  // Calculate total costs for break-even
  const totalFixedCosts = fixedCosts + freemiumCosts;

  return (
    <div className="card p-6">
      <h3 className="font-medium text-gray-900 mb-4">Unit Economics</h3>
      <div className="grid grid-cols-4 gap-4">
        {/* LTV */}
        <div className="p-4 bg-gray-50 rounded-[0.2rem] border border-[#e4e4e4]">
          <p className="text-sm text-gray-500">LTV</p>
          <p className="text-2xl font-bold text-gray-900 font-mono mt-1">MYR {ltv.toFixed(0)}</p>
          <p className="text-xs text-gray-500 mt-1">
            ARPU ÷ {monthlyChurnRate}% monthly churn
          </p>
        </div>

        {/* Break-even */}
        <div className="p-4 bg-gray-50 rounded-[0.2rem] border border-[#e4e4e4]">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Break-even</p>
            <button
              onClick={() => setShowBreakEvenDetails(!showBreakEvenDetails)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Show calculation breakdown"
            >
              {showBreakEvenDetails ? (
                <CaretUp size={14} className="text-gray-400" />
              ) : (
                <Info size={14} className="text-gray-400" />
              )}
            </button>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{breakEvenCustomers}</p>
          <p className="text-xs text-gray-500 mt-1">
            Paid customers needed
            {paidCustomers > 0 && breakEvenCustomers > 0 && (
              <span className={paidCustomers >= breakEvenCustomers ? ' text-emerald-600' : ' text-amber-600'}>
                {' '}({paidCustomers >= breakEvenCustomers ? 'achieved' : `need ${breakEvenCustomers - paidCustomers} more`})
              </span>
            )}
          </p>

          {/* Expandable calculation breakdown */}
          {showBreakEvenDetails && (
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Formula Breakdown</p>
              <div className="bg-white p-2 rounded border border-gray-100 font-mono text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Fixed Costs</span>
                  <span>MYR {fixedCosts.toFixed(0)}</span>
                </div>
                {freemiumCosts > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>+ Freemium Subsidy</span>
                    <span>MYR {freemiumCosts.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 border-t border-gray-100 pt-1 mt-1">
                  <span>= Total to Cover</span>
                  <span>MYR {totalFixedCosts.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-gray-600 mt-2">
                  <span>÷ Contribution Margin</span>
                  <span>MYR {contributionMargin.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-gray-900 font-semibold border-t border-gray-100 pt-1 mt-1">
                  <span>= Break-even</span>
                  <span>{breakEvenCustomers} customers</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400">
                Each paying customer contributes MYR {contributionMargin.toFixed(0)}/mo towards covering fixed costs.
              </p>
            </div>
          )}

          {!showBreakEvenDetails && freemiumCosts > 0 && (
            <p className="text-xs text-amber-600 mt-1">
              Includes MYR {freemiumCosts.toFixed(2)} freemium subsidy
              {freemiumCostPerUser > 0 && (
                <span className="block">
                  (MYR {freemiumCostPerUser.toFixed(2)}/free user)
                </span>
              )}
            </p>
          )}
        </div>

        {/* Contribution Margin */}
        <div className="p-4 bg-gray-50 rounded-[0.2rem] border border-[#e4e4e4]">
          <p className="text-sm text-gray-500">Contribution Margin</p>
          <p className="text-2xl font-bold text-gray-900 font-mono mt-1">MYR {contributionMargin.toFixed(0)}</p>
          <p className="text-xs text-gray-500 mt-1">ARPU − Avg Variable Cost</p>
        </div>

        {/* Recommended CAC */}
        <div className="p-4 bg-[rgba(37,63,246,0.06)] rounded-[0.2rem] border border-[rgba(37,63,246,0.15)]">
          <p className="text-sm text-[#253ff6]">Recommended CAC</p>
          <p className="text-2xl font-bold text-[#253ff6] font-mono mt-1">
            MYR {(ltv / 5).toFixed(0)} - {(ltv / 3).toFixed(0)}
          </p>
          <p className="text-xs text-[#253ff6]/70 mt-1">LTV:CAC 3:1 to 5:1</p>
        </div>
      </div>
    </div>
  );
}
