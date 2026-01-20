import { useMemo } from 'react';
import { CurrencyDollar, TrendUp, Percent, ChartBar, Warning, CheckCircle } from '@phosphor-icons/react';
import type { ReportData } from '../../utils/reportEncoder';
import {
  calculateCOGSBreakdown,
  calculateMargin,
  calculateProfit,
  getMarginStatus,
} from '../../utils/costCalculator';

interface AccountantReportProps {
  reportData: ReportData;
}

export function AccountantReport({ reportData }: AccountantReportProps) {
  const { state } = reportData;

  // Calculate costs using shared utility (single source of truth)
  const costs = useMemo(() => {
    return calculateCOGSBreakdown(
      state.variableCosts,
      state.fixedCosts,
      state.customerCount
    );
  }, [state.variableCosts, state.fixedCosts, state.customerCount]);

  // Calculate margin and profit using shared utilities
  const margin = calculateMargin(state.selectedPrice, costs.totalCOGS);
  const profit = calculateProfit(state.selectedPrice, costs.totalCOGS);

  // Get margin status using shared utility
  const marginStatus = getMarginStatus(margin);

  // Calculate MRR and ARR
  const mrr = state.selectedPrice * state.customerCount;
  const arr = mrr * 12;

  // Break-even calculation
  const breakEvenCustomers = costs.fixedTotal > 0 && profit > 0
    ? Math.ceil(costs.fixedTotal / profit)
    : 0;

  // P&L Projection (12 months) with growth modeling
  const monthlyGrowthRate = reportData.settings?.monthlyGrowthRate ?? 0.05; // Default 5%
  const growthPct = (monthlyGrowthRate * 100).toFixed(0);
  const projections = useMemo(() => {
    let cumulativeCustomers = state.customerCount;
    let cumulativeRevenue = 0;
    let cumulativeProfit = 0;

    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      // Apply growth for months after the first
      if (i > 0) {
        cumulativeCustomers = Math.round(cumulativeCustomers * (1 + monthlyGrowthRate));
      }
      const customers = cumulativeCustomers;
      const revenue = state.selectedPrice * customers;
      const variableCosts = costs.variableTotal * customers;
      const totalCosts = variableCosts + costs.fixedTotal;
      const grossProfit = revenue - totalCosts;

      cumulativeRevenue += revenue;
      cumulativeProfit += grossProfit;

      return {
        month,
        customers,
        revenue,
        variableCosts,
        fixedCosts: costs.fixedTotal,
        totalCosts,
        grossProfit,
        cumulativeRevenue,
        cumulativeProfit,
        growthPct: i > 0 ? monthlyGrowthRate * 100 : 0,
      };
    });
  }, [state.selectedPrice, costs, state.customerCount, monthlyGrowthRate]);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4 print:grid-cols-2">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Monthly Revenue</p>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <CurrencyDollar size={16} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900 font-mono">
            MYR {mrr.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">@ {state.customerCount} customers</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Annual Revenue</p>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <TrendUp size={16} className="text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900 font-mono">
            MYR {arr.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">Projected ARR</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Gross Margin</p>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              marginStatus === 'great' ? 'bg-emerald-50' :
              marginStatus === 'ok' ? 'bg-amber-50' : 'bg-red-50'
            }`}>
              <Percent size={16} className={
                marginStatus === 'great' ? 'text-emerald-600' :
                marginStatus === 'ok' ? 'text-amber-600' : 'text-red-600'
              } />
            </div>
          </div>
          <p className={`text-2xl font-semibold ${
            marginStatus === 'great' ? 'text-emerald-600' :
            marginStatus === 'ok' ? 'text-amber-600' : 'text-red-600'
          }`}>
            {margin.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {marginStatus === 'great' ? 'Healthy' : marginStatus === 'ok' ? 'Acceptable' : 'Review needed'}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Break-even</p>
            <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center">
              <ChartBar size={16} className="text-violet-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {breakEvenCustomers > 0 ? breakEvenCustomers : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">customers needed</p>
        </div>
      </div>

      {/* COGS Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 report-section">
        <h3 className="font-semibold text-gray-900 mb-4">Cost of Goods Sold (COGS) Breakdown</h3>

        {/* Variable Costs */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Variable Costs (per customer)</h4>
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Item</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Unit Cost</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Usage</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {state.variableCosts.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-gray-900">{item.name}</td>
                    <td className="px-4 py-2 text-right text-gray-600 font-mono">
                      MYR {item.costPerUnit.toFixed(3)}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-600">
                      {item.usagePerCustomer} {item.unit}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900 font-mono font-medium">
                      MYR {(item.costPerUnit * item.usagePerCustomer).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-gray-700 font-medium">Total Variable Cost</td>
                  <td className="px-4 py-2 text-right text-gray-900 font-mono font-semibold">
                    MYR {costs.variableTotal.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Fixed Costs */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Fixed Costs (monthly)</h4>
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Item</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Description</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Monthly Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {state.fixedCosts.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-gray-900">{item.name}</td>
                    <td className="px-4 py-2 text-gray-500">{item.description}</td>
                    <td className="px-4 py-2 text-right text-gray-900 font-mono font-medium">
                      MYR {item.monthlyCost.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={2} className="px-4 py-2 text-gray-700 font-medium">Total Fixed Cost</td>
                  <td className="px-4 py-2 text-right text-gray-900 font-mono font-semibold">
                    MYR {costs.fixedTotal.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} className="px-4 py-2 text-gray-700 font-medium">
                    Fixed Cost per Customer ({state.customerCount} customers)
                  </td>
                  <td className="px-4 py-2 text-right text-gray-900 font-mono font-semibold">
                    MYR {costs.fixedPerCustomer.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Total COGS Summary */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Total COGS per Customer</p>
              <p className="text-xs text-gray-500 mt-0.5">Variable + Fixed allocation</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-gray-900 font-mono">
                MYR {costs.totalCOGS.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                Price: MYR {state.selectedPrice} → Profit: MYR {profit.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Margin Analysis */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 report-section">
        <h3 className="font-semibold text-gray-900 mb-4">Margin Analysis</h3>
        <div className="grid grid-cols-3 gap-4 print:grid-cols-1">
          <div className={`p-4 rounded-lg ${
            marginStatus === 'great' ? 'bg-emerald-50 border border-emerald-200' :
            marginStatus === 'ok' ? 'bg-amber-50 border border-amber-200' :
            'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {marginStatus === 'great' ? (
                <CheckCircle size={16} className="text-emerald-600" weight="fill" />
              ) : (
                <Warning size={16} className={marginStatus === 'ok' ? 'text-amber-600' : 'text-red-600'} weight="fill" />
              )}
              <span className={`text-sm font-medium ${
                marginStatus === 'great' ? 'text-emerald-700' :
                marginStatus === 'ok' ? 'text-amber-700' : 'text-red-700'
              }`}>
                {marginStatus === 'great' ? 'Healthy Margin' :
                 marginStatus === 'ok' ? 'Acceptable Margin' : 'Low Margin'}
              </span>
            </div>
            <p className={`text-3xl font-semibold ${
              marginStatus === 'great' ? 'text-emerald-600' :
              marginStatus === 'ok' ? 'text-amber-600' : 'text-red-600'
            }`}>
              {margin.toFixed(1)}%
            </p>
            <p className={`text-xs mt-1 ${
              marginStatus === 'great' ? 'text-emerald-600' :
              marginStatus === 'ok' ? 'text-amber-600' : 'text-red-600'
            }`}>
              Target: ≥70%
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-sm text-gray-500 mb-2">Revenue per Customer</p>
            <p className="text-2xl font-semibold text-gray-900 font-mono">
              MYR {state.selectedPrice}
            </p>
            <p className="text-xs text-gray-400 mt-1">Monthly subscription</p>
          </div>

          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-sm text-gray-500 mb-2">Profit per Customer</p>
            <p className={`text-2xl font-semibold font-mono ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              MYR {profit.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 mt-1">After all costs</p>
          </div>
        </div>
      </div>

      {/* P&L Projection Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 report-section print:break-before">
        <h3 className="font-semibold text-gray-900 mb-4">12-Month P&L Projection ({growthPct}% Monthly Growth)</h3>
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600 sticky left-0 bg-gray-50 print:static">Month</th>
                {projections.map((p) => (
                  <th key={p.month} className="text-right px-3 py-2 font-medium text-gray-600">
                    M{p.month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="bg-blue-50/50">
                <td className="px-3 py-2 text-blue-700 font-medium sticky left-0 bg-blue-50/50 print:static print:bg-blue-50">Customers</td>
                {projections.map((p) => (
                  <td key={p.month} className="px-3 py-2 text-right text-blue-700 font-mono">
                    {p.customers.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2 text-gray-700 font-medium sticky left-0 bg-white print:static">Revenue</td>
                {projections.map((p) => (
                  <td key={p.month} className="px-3 py-2 text-right text-gray-900 font-mono">
                    {p.revenue.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50/50">
                <td className="px-3 py-2 text-gray-500 sticky left-0 bg-gray-50/50 print:static print:bg-gray-50">Variable Costs</td>
                {projections.map((p) => (
                  <td key={p.month} className="px-3 py-2 text-right text-gray-500 font-mono">
                    ({p.variableCosts.toFixed(0)})
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50/50">
                <td className="px-3 py-2 text-gray-500 sticky left-0 bg-gray-50/50 print:static print:bg-gray-50">Fixed Costs</td>
                {projections.map((p) => (
                  <td key={p.month} className="px-3 py-2 text-right text-gray-500 font-mono">
                    ({p.fixedCosts.toFixed(0)})
                  </td>
                ))}
              </tr>
              <tr className="font-medium border-t-2 border-gray-200">
                <td className="px-3 py-2 text-gray-900 sticky left-0 bg-white print:static">Gross Profit</td>
                {projections.map((p) => (
                  <td key={p.month} className={`px-3 py-2 text-right font-mono ${
                    p.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {p.grossProfit.toLocaleString()}
                  </td>
                ))}
              </tr>
            </tbody>
            <tfoot className="bg-gray-100 border-t-2 border-gray-300">
              <tr>
                <td className="px-3 py-2 text-gray-700 font-semibold sticky left-0 bg-gray-100 print:static">12-Month Total</td>
                <td colSpan={11}></td>
                <td className="px-3 py-2 text-right">
                  <div className="text-xs text-gray-500">Revenue</div>
                  <div className="font-mono font-semibold text-gray-900">
                    MYR {projections[11]?.cumulativeRevenue.toLocaleString()}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 sticky left-0 bg-gray-100 print:static"></td>
                <td colSpan={11}></td>
                <td className={`px-3 py-2 text-right ${
                  (projections[11]?.cumulativeProfit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  <div className="text-xs text-gray-500">Profit</div>
                  <div className="font-mono font-semibold">
                    MYR {projections[11]?.cumulativeProfit.toLocaleString()}
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700">
            <strong>Growth Assumptions:</strong> Projections based on {growthPct}% monthly customer growth rate. Starting with {state.customerCount} customers @ MYR {state.selectedPrice}/mo,
            growing to {projections[11]?.customers.toLocaleString()} customers by month 12 ({((projections[11]?.customers / state.customerCount - 1) * 100).toFixed(0)}% total growth).
          </p>
        </div>
      </div>
    </div>
  );
}
