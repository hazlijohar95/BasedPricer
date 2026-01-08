import { useMemo } from 'react';
import {
  TrendUp,
  ChartLineUp,
  Target,
  Users,
  CheckCircle,
  Clock,
  Wallet,
  Percent,
} from '@phosphor-icons/react';
import type { ReportData } from '../../utils/reportEncoder';
import {
  calculateInvestorMetrics,
  formatCurrency,
  formatValuationRange,
} from '../../utils/investorMetrics';

interface InvestorReportProps {
  reportData: ReportData;
}

export function InvestorReport({ reportData }: InvestorReportProps) {
  const { state } = reportData;

  // Calculate costs
  const costs = useMemo(() => {
    const variableTotal = state.variableCosts.reduce(
      (sum, item) => sum + item.costPerUnit * item.usagePerCustomer,
      0
    );
    const fixedTotal = state.fixedCosts.reduce(
      (sum, item) => sum + item.monthlyCost,
      0
    );
    const fixedPerCustomer = state.customerCount > 0 ? fixedTotal / state.customerCount : 0;
    const totalCOGS = variableTotal + fixedPerCustomer;

    return { variableTotal, fixedTotal, fixedPerCustomer, totalCOGS };
  }, [state.variableCosts, state.fixedCosts, state.customerCount]);

  // Calculate key metrics
  const margin = state.selectedPrice > 0
    ? ((state.selectedPrice - costs.totalCOGS) / state.selectedPrice) * 100
    : 0;
  const profit = state.selectedPrice - costs.totalCOGS;
  const mrr = state.selectedPrice * state.customerCount;

  // Calculate paid customers (excluding freemium)
  const tierDist = state.tierDistribution;
  const freemiumPct = tierDist.freemium || 0;
  const paidCustomers = Math.round(state.customerCount * (1 - freemiumPct / 100));
  const arpu = paidCustomers > 0 ? mrr / paidCustomers : state.selectedPrice;

  // Break-even
  const breakEvenCustomers = costs.fixedTotal > 0 && profit > 0
    ? Math.ceil(costs.fixedTotal / profit)
    : 0;

  // LTV (assuming 24 month lifespan)
  const avgLifespanMonths = 24;
  const ltv = arpu * avgLifespanMonths * (margin / 100);

  // Calculate investor metrics
  const investorMetrics = useMemo(() => {
    return calculateInvestorMetrics({
      mrr,
      paidCustomers,
      arpu,
      grossMargin: margin,
      breakEvenCustomers,
      monthlyGrowthRate: 0.05, // Default 5%
      ltv,
    });
  }, [mrr, paidCustomers, arpu, margin, breakEvenCustomers, ltv]);

  return (
    <div className="space-y-6">
      {/* Hero Metrics */}
      <div className="grid grid-cols-3 gap-4 print:grid-cols-1">
        <div className="col-span-1 print:col-span-1 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-6 text-white print:bg-emerald-50 print:text-emerald-900 print:border print:border-emerald-200">
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={20} weight="bold" />
            <span className="text-sm font-medium opacity-90">Annual Recurring Revenue</span>
          </div>
          <p className="text-3xl font-bold font-mono">
            {formatCurrency(investorMetrics.arr)}
          </p>
          <p className="text-sm opacity-75 mt-1">
            MRR: {formatCurrency(investorMetrics.mrr)}
          </p>
        </div>

        <div className="col-span-2 print:col-span-1 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <ChartLineUp size={20} className="text-violet-600" />
            <span className="text-sm font-medium text-gray-700">Valuation Range (SaaS Multiples)</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatValuationRange(investorMetrics.valuation)}
          </p>
          <div className="flex gap-4 mt-3">
            <div className="text-center">
              <p className="text-xs text-gray-500">Conservative (5x)</p>
              <p className="text-sm font-semibold text-gray-700">
                {formatCurrency(investorMetrics.valuation.valuationLow)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Typical (10x)</p>
              <p className="text-sm font-semibold text-violet-600">
                {formatCurrency(investorMetrics.valuation.valuationMid)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">High Growth (15x)</p>
              <p className="text-sm font-semibold text-gray-700">
                {formatCurrency(investorMetrics.valuation.valuationHigh)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Unit Economics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 report-section">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target size={18} className="text-blue-600" />
          Unit Economics
        </h3>
        <div className="grid grid-cols-4 gap-4 print:grid-cols-2">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">ARPU</p>
            <p className="text-xl font-semibold text-gray-900 font-mono mt-1">
              {formatCurrency(investorMetrics.arpu)}
            </p>
            <p className="text-xs text-gray-400">Monthly</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">LTV</p>
            <p className="text-xl font-semibold text-gray-900 font-mono mt-1">
              {formatCurrency(ltv)}
            </p>
            <p className="text-xs text-gray-400">24-month lifespan</p>
          </div>
          <div className={`p-4 rounded-lg ${
            investorMetrics.grossMarginHealth === 'healthy' ? 'bg-emerald-50' :
            investorMetrics.grossMarginHealth === 'acceptable' ? 'bg-amber-50' : 'bg-red-50'
          }`}>
            <p className={`text-sm ${
              investorMetrics.grossMarginHealth === 'healthy' ? 'text-emerald-600' :
              investorMetrics.grossMarginHealth === 'acceptable' ? 'text-amber-600' : 'text-red-600'
            }`}>Gross Margin</p>
            <p className={`text-xl font-semibold mt-1 ${
              investorMetrics.grossMarginHealth === 'healthy' ? 'text-emerald-700' :
              investorMetrics.grossMarginHealth === 'acceptable' ? 'text-amber-700' : 'text-red-700'
            }`}>
              {margin.toFixed(1)}%
            </p>
            <p className={`text-xs ${
              investorMetrics.grossMarginHealth === 'healthy' ? 'text-emerald-500' :
              investorMetrics.grossMarginHealth === 'acceptable' ? 'text-amber-500' : 'text-red-500'
            }`}>
              {investorMetrics.grossMarginHealth === 'healthy' ? 'Healthy (≥70%)' :
               investorMetrics.grossMarginHealth === 'acceptable' ? 'Acceptable (50-70%)' : 'Needs work (<50%)'}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Paid Customers</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">
              {paidCustomers.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">of {state.customerCount} total</p>
          </div>
        </div>
      </div>

      {/* ARR Milestones */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 report-section">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendUp size={18} className="text-emerald-600" />
          ARR Milestones
        </h3>
        <div className="space-y-3">
          {investorMetrics.milestones.map((milestone, index) => {
            const isAchieved = investorMetrics.arr >= milestone.targetARR;
            const progressPct = Math.min(100, (investorMetrics.arr / milestone.targetARR) * 100);

            return (
              <div key={index} className={`p-4 rounded-lg border ${
                isAchieved ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isAchieved ? (
                      <CheckCircle size={18} className="text-emerald-600" weight="fill" />
                    ) : (
                      <Clock size={18} className="text-gray-400" />
                    )}
                    <span className={`font-medium ${isAchieved ? 'text-emerald-700' : 'text-gray-900'}`}>
                      {milestone.label}
                    </span>
                  </div>
                  <div className="text-right">
                    {isAchieved ? (
                      <span className="text-sm font-medium text-emerald-600">Achieved</span>
                    ) : (
                      <span className="text-sm text-gray-500">
                        {milestone.customersNeeded.toLocaleString()} customers needed
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isAchieved ? 'bg-emerald-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono text-gray-600 w-16 text-right">
                    {progressPct.toFixed(0)}%
                  </span>
                </div>
                {!isAchieved && milestone.monthsToReach !== null && (
                  <p className="text-xs text-gray-500 mt-2">
                    Est. {milestone.monthsToReach} months at 5% monthly growth
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Break-even Analysis */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 report-section">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users size={18} className="text-amber-600" />
          Break-even Analysis
        </h3>
        <div className="grid grid-cols-3 gap-4 print:grid-cols-1">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Break-even Point</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">
              {investorMetrics.breakEvenCustomers} <span className="text-sm font-normal text-gray-500">customers</span>
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Current Paid Customers</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">
              {investorMetrics.currentPaidCustomers}
            </p>
          </div>
          <div className={`p-4 rounded-lg ${
            investorMetrics.customersToBreakEven <= 0 ? 'bg-emerald-50' : 'bg-amber-50'
          }`}>
            <p className={`text-sm ${
              investorMetrics.customersToBreakEven <= 0 ? 'text-emerald-600' : 'text-amber-600'
            }`}>
              {investorMetrics.customersToBreakEven <= 0 ? 'Status' : 'Customers to Go'}
            </p>
            <p className={`text-2xl font-semibold mt-1 ${
              investorMetrics.customersToBreakEven <= 0 ? 'text-emerald-700' : 'text-amber-700'
            }`}>
              {investorMetrics.customersToBreakEven <= 0 ? 'Profitable' : investorMetrics.customersToBreakEven}
            </p>
          </div>
        </div>

        {investorMetrics.monthsToBreakEven !== null && investorMetrics.monthsToBreakEven > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                Estimated {investorMetrics.monthsToBreakEven} months to break-even
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Based on 5% monthly customer growth
            </p>
          </div>
        )}
      </div>

      {/* Key Metrics Summary */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-6 text-white report-section print:bg-gray-100 print:text-gray-900 print:border print:border-gray-300">
        <h3 className="font-semibold mb-4 flex items-center gap-2 print:text-gray-900">
          <Percent size={18} />
          Key Investor Metrics
        </h3>
        <div className="grid grid-cols-4 gap-4 print:grid-cols-2">
          <div>
            <p className="text-sm text-gray-400 print:text-gray-600">MRR</p>
            <p className="text-xl font-bold font-mono print:text-gray-900">{formatCurrency(mrr)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 print:text-gray-600">ARR</p>
            <p className="text-xl font-bold font-mono print:text-gray-900">{formatCurrency(investorMetrics.arr)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 print:text-gray-600">Gross Margin</p>
            <p className="text-xl font-bold print:text-gray-900">{margin.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 print:text-gray-600">Monthly Fixed Costs</p>
            <p className="text-xl font-bold font-mono print:text-gray-900">{formatCurrency(costs.fixedTotal)}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-700 print:border-gray-300">
          <div className="flex items-center justify-between print:flex-col print:items-start print:gap-2">
            <div>
              <p className="text-sm text-gray-400 print:text-gray-600">Valuation Estimate (10x ARR)</p>
              <p className="text-2xl font-bold font-mono print:text-gray-900">{formatCurrency(investorMetrics.valuation.valuationMid)}</p>
            </div>
            <div className="text-right print:text-left">
              <p className="text-sm text-gray-400 print:text-gray-600">Based on</p>
              <p className="text-sm print:text-gray-900">{state.customerCount} customers @ MYR {state.selectedPrice}/mo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
