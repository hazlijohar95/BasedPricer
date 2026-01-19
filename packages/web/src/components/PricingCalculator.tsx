import { useState, useMemo, useCallback } from 'react';
import { Gauge, ChartLineUp, Trophy, Rocket } from '@phosphor-icons/react';
import { calculateTierVariableCosts } from '../data/tiers';
import { usePricing } from '../context/PricingContext';
import { deriveCostRatesFromVariableCosts } from '../utils/costRates';
import {
  calculateInvestorMetrics,
  formatCurrency,
  type InvestorMetrics,
} from '../utils/investorMetrics';
import {
  ScenarioSelector,
  PricingMetricsGrid,
  UnitEconomicsGrid,
  PriceSensitivityTable,
  type Scenario,
} from './pricing';
import { MARGIN_THRESHOLDS } from '../constants';

type TierKey = 'freemium' | 'basic' | 'pro' | 'enterprise';

const scenarios: Scenario[] = [
  { name: 'Early Stage', distribution: { freemium: 80, basic: 15, pro: 4, enterprise: 1 }, monthlyChurnRate: 5, conversionRate: 3 },
  { name: 'Growth', distribution: { freemium: 70, basic: 20, pro: 8, enterprise: 2 }, monthlyChurnRate: 4, conversionRate: 5 },
  { name: 'Mature', distribution: { freemium: 60, basic: 25, pro: 12, enterprise: 3 }, monthlyChurnRate: 3, conversionRate: 7 },
];

export function PricingCalculator() {
  // Get shared state from context
  const {
    tiers,
    costs: cogsData,
    utilizationRate,
    setUtilizationRate,
    variableCosts,
    updateTier,
  } = usePricing();

  // Derive cost rates from context's variableCosts (single source of truth)
  // Uses centralized utility to ensure consistency across all components
  const costRates = useMemo(() => {
    return deriveCostRatesFromVariableCosts(variableCosts);
  }, [variableCosts]);

  // Derive prices directly from context tiers (single source of truth)
  // No local state duplication - prices come from tiers context
  const prices = useMemo((): Record<TierKey, number> => {
    const tierPrices: Record<TierKey, number> = { freemium: 0, basic: 25, pro: 78, enterprise: 500 };
    tiers.forEach(tier => {
      const key = tier.id as TierKey;
      // Use tier price if set, otherwise use defaults
      if (key in tierPrices) {
        tierPrices[key] = tier.monthlyPriceMYR;
      }
    });
    return tierPrices;
  }, [tiers]);

  const [scenario, setScenario] = useState<Scenario>(scenarios[0]);
  const [totalCustomers, setTotalCustomers] = useState(100);
  const [monthlyGrowthRate, setMonthlyGrowthRate] = useState(5); // Default 5% monthly growth

  // Use fixed costs from context
  const monthlyFixedCostsTotal = cogsData.fixedTotal;

  // Normalize distribution to always sum to 100%
  const normalizedDistribution = useMemo(() => {
    const total = Object.values(scenario.distribution).reduce((a, b) => a + b, 0);
    if (total === 0) return { freemium: 100, basic: 0, pro: 0, enterprise: 0 };

    return {
      freemium: (scenario.distribution.freemium / total) * 100,
      basic: (scenario.distribution.basic / total) * 100,
      pro: (scenario.distribution.pro / total) * 100,
      enterprise: (scenario.distribution.enterprise / total) * 100,
    };
  }, [scenario.distribution]);

  // Memoized customer counts by tier
  const counts = useMemo(() => ({
    freemium: Math.round((normalizedDistribution.freemium / 100) * totalCustomers),
    basic: Math.round((normalizedDistribution.basic / 100) * totalCustomers),
    pro: Math.round((normalizedDistribution.pro / 100) * totalCustomers),
    enterprise: Math.round((normalizedDistribution.enterprise / 100) * totalCustomers),
  }), [normalizedDistribution, totalCustomers]);

  // Memoized revenue by tier
  const revenue = useMemo(() => ({
    freemium: counts.freemium * prices.freemium,
    basic: counts.basic * prices.basic,
    pro: counts.pro * prices.pro,
    enterprise: counts.enterprise * prices.enterprise,
  }), [counts, prices]);

  // Memoized revenue totals
  const totalMRR = useMemo(() =>
    Object.values(revenue).reduce((a, b) => a + b, 0),
    [revenue]
  );

  // Calculate variable costs with configurable utilization rate - using Map for O(1) lookup
  // Now uses cost rates derived from context's variableCosts for consistency
  const tierCostsMap = useMemo(() => {
    const map = new Map<string, number>();
    tiers.forEach(tier => {
      map.set(tier.id, calculateTierVariableCosts(tier, utilizationRate, costRates).total);
    });
    return map;
  }, [tiers, utilizationRate, costRates]);

  // Memoized variable costs by tier (total cost for all customers in each tier)
  const tierVariableCosts = useMemo(() => ({
    freemium: (tierCostsMap.get('freemium') ?? 0) * counts.freemium,
    basic: (tierCostsMap.get('basic') ?? 0) * counts.basic,
    pro: (tierCostsMap.get('pro') ?? 0) * counts.pro,
    enterprise: (tierCostsMap.get('enterprise') ?? 0) * counts.enterprise,
  }), [tierCostsMap, counts]);

  // Memoized total costs
  const { totalVariableCosts, totalCosts } = useMemo(() => {
    const variableTotal = Object.values(tierVariableCosts).reduce((a, b) => a + b, 0);
    return {
      totalVariableCosts: variableTotal,
      totalCosts: variableTotal + monthlyFixedCostsTotal,
    };
  }, [tierVariableCosts, monthlyFixedCostsTotal]);

  // Memoized derived metrics
  const metrics = useMemo(() => {
    // Gross and operating margins
    const grossProfit = totalMRR - totalVariableCosts;
    const grossMargin = totalMRR > 0 ? (grossProfit / totalMRR) * 100 : 0;
    const operatingProfit = totalMRR - totalCosts;
    const operatingMargin = totalMRR > 0 ? (operatingProfit / totalMRR) * 100 : 0;

    // Paid customer metrics
    const paidCustomers = counts.basic + counts.pro + counts.enterprise;
    const paidRevenue = revenue.basic + revenue.pro + revenue.enterprise;
    const arpu = paidCustomers > 0 ? paidRevenue / paidCustomers : 0;

    // LTV calculation with monthly churn
    const ltv = scenario.monthlyChurnRate > 0
      ? arpu / (scenario.monthlyChurnRate / 100)
      : arpu * 24;

    // Break-even calculation - FIXED: now includes freemium costs
    // Freemium users don't pay but still incur variable costs that paid users must subsidize
    const paidTierVariableCosts = tierVariableCosts.basic + tierVariableCosts.pro + tierVariableCosts.enterprise;
    const freemiumCosts = tierVariableCosts.freemium;
    const avgPaidVariableCost = paidCustomers > 0 ? paidTierVariableCosts / paidCustomers : 0;
    const contributionMargin = arpu - avgPaidVariableCost;

    // Total costs that paid customers must cover = Fixed costs + Freemium subsidy
    const costsToRecoverMonthly = monthlyFixedCostsTotal + freemiumCosts;
    const breakEvenCustomers = contributionMargin > 0
      ? Math.ceil(costsToRecoverMonthly / contributionMargin)
      : 0;

    // Per-user freemium cost for analysis
    const freemiumCostPerUser = counts.freemium > 0 ? freemiumCosts / counts.freemium : 0;

    // Freemium conversion projections
    const monthlyConversions = counts.freemium * (scenario.conversionRate / 100);
    const projectedMrrGrowth = monthlyConversions * arpu;

    return {
      grossProfit,
      grossMargin,
      operatingProfit,
      operatingMargin,
      paidCustomers,
      arpu,
      ltv,
      contributionMargin,
      breakEvenCustomers,
      freemiumCosts, // Total freemium subsidy for transparency
      freemiumCostPerUser, // Cost per freemium user for analysis
      monthlyConversions, // Expected monthly conversions from freemium
      projectedMrrGrowth, // Projected MRR growth from conversions
    };
  }, [totalMRR, totalVariableCosts, totalCosts, counts, revenue, tierVariableCosts, scenario.monthlyChurnRate, monthlyFixedCostsTotal, scenario.conversionRate]);

  // Destructure for easier access in JSX
  const {
    grossProfit, grossMargin, operatingProfit, operatingMargin,
    paidCustomers, arpu, ltv, contributionMargin, breakEvenCustomers,
    freemiumCosts, freemiumCostPerUser, monthlyConversions, projectedMrrGrowth
  } = metrics;

  // Calculate investor metrics for valuation, milestones, and break-even timeline
  const investorMetrics = useMemo((): InvestorMetrics => {
    return calculateInvestorMetrics({
      mrr: totalMRR,
      paidCustomers,
      arpu,
      grossMargin,
      breakEvenCustomers,
      monthlyGrowthRate: monthlyGrowthRate / 100, // Convert percentage to decimal
      ltv,
    });
  }, [totalMRR, paidCustomers, arpu, grossMargin, breakEvenCustomers, monthlyGrowthRate, ltv]);

  // Dynamic price sensitivity points based on current basic price
  const priceSensitivityPoints = useMemo(() => {
    const basePrice = prices.basic;
    return [
      Math.max(10, Math.round(basePrice * 0.6)),
      Math.max(15, Math.round(basePrice * 0.8)),
      basePrice,
      Math.round(basePrice * 1.2),
      Math.round(basePrice * 1.5),
      Math.round(basePrice * 2),
    ].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
  }, [prices.basic]);

  // Memoized handler for distribution changes
  const handleDistributionChange = useCallback((tier: TierKey, newValue: number) => {
    setScenario(prev => ({
      ...prev,
      distribution: { ...prev.distribution, [tier]: newValue }
    }));
  }, []);

  // Handler for price changes - updates context directly
  const handlePriceChange = useCallback((tier: TierKey, value: number) => {
    // Find the tier and update its price in context
    const tierToUpdate = tiers.find(t => t.id === tier);
    if (tierToUpdate) {
      updateTier(tier, { monthlyPriceMYR: Math.max(0, value) });
    }
  }, [tiers, updateTier]);

  // Memoized handler for scenario field changes
  const handleScenarioChange = useCallback((field: 'monthlyChurnRate' | 'conversionRate', value: number) => {
    setScenario(prev => ({ ...prev, [field]: value }));
  }, []);

  const distributionTotal = useMemo(() =>
    Object.values(scenario.distribution).reduce((a, b) => a + b, 0),
    [scenario.distribution]
  );

  // Pre-calculate price sensitivity analysis data
  const priceSensitivityData = useMemo(() =>
    priceSensitivityPoints.map((price) => {
      const testRevenue = revenue.freemium + (counts.basic * price) + revenue.pro + revenue.enterprise;
      const testGrossProfit = testRevenue - totalVariableCosts;
      const testOperatingProfit = testRevenue - totalCosts;
      const testGrossMargin = testRevenue > 0 ? (testGrossProfit / testRevenue) * 100 : 0;
      return {
        price,
        testRevenue,
        testGrossProfit,
        testOperatingProfit,
        testGrossMargin,
        isHealthy: testGrossMargin >= MARGIN_THRESHOLDS.HEALTHY,
        isAcceptable: testGrossMargin >= MARGIN_THRESHOLDS.ACCEPTABLE,
        isCurrent: price === prices.basic,
      };
    }),
    [priceSensitivityPoints, revenue, counts.basic, totalVariableCosts, totalCosts, prices.basic]
  );

  return (
    <div className="space-y-6">
      {/* Header with Scenario Selector */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Pricing Calculator</h1>
          <p className="text-gray-500 text-sm mt-1">Model revenue, costs, and unit economics under different scenarios</p>
        </div>
        <ScenarioSelector
          scenarios={scenarios}
          selectedScenario={scenario}
          onSelect={setScenario}
        />
      </div>

      {/* Key Metrics */}
      <PricingMetricsGrid
        totalMRR={totalMRR}
        grossMargin={grossMargin}
        operatingMargin={operatingMargin}
        arpu={arpu}
      />

      {/* Configuration */}
      <div className="grid grid-cols-2 gap-6">
        {/* Pricing */}
        <div className="card p-6">
          <h3 className="font-medium text-gray-900 mb-4">Tier Pricing (MYR/month)</h3>
          <div className="space-y-4">
            {(['freemium', 'basic', 'pro', 'enterprise'] as const).map((tier) => {
              const tierDef = tiers.find(t => t.id === tier);
              const isFromData = tierDef && tierDef.monthlyPriceMYR > 0;
              return (
                <div key={tier} className="flex items-center gap-4">
                  <label className="w-24 text-sm font-medium text-gray-700 capitalize">{tier}</label>
                  <input
                    type="number"
                    min="0"
                    value={prices[tier]}
                    onChange={(e) => handlePriceChange(tier, Number(e.target.value))}
                    disabled={tier === 'freemium'}
                    className={`input-field flex-1 ${tier === 'freemium' ? 'bg-gray-100 text-gray-400' : ''}`}
                  />
                  {tier === 'basic' && <span className="text-xs text-[#253ff6] font-medium">Target</span>}
                  {!isFromData && tier !== 'freemium' && (
                    <span className="text-xs text-amber-600">TBD</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribution */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-gray-900">Customer Distribution</h3>
              {distributionTotal !== 100 && (
                <p className="text-xs text-amber-600 mt-0.5">
                  Ratios: {distributionTotal}% (auto-normalized to 100%)
                </p>
              )}
            </div>
            <input
              type="number"
              value={totalCustomers}
              onChange={(e) => setTotalCustomers(Math.max(0, Number(e.target.value)))}
              className="input-field w-24 text-center"
            />
          </div>
          <div className="space-y-4">
            {(['freemium', 'basic', 'pro', 'enterprise'] as const).map((tier) => (
              <div key={tier} className="flex items-center gap-4">
                <label className="w-24 text-sm font-medium text-gray-700 capitalize">{tier}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={scenario.distribution[tier]}
                  onChange={(e) => handleDistributionChange(tier, Number(e.target.value))}
                  className="flex-1 accent-[#253ff6]"
                />
                <span className="w-24 text-right text-sm font-mono text-gray-600">
                  {normalizedDistribution[tier].toFixed(0)}% ({counts[tier]})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assumptions */}
      <div className="card p-6">
        <h3 className="font-medium text-gray-900 mb-4">Assumptions</h3>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <label className="text-sm text-gray-600 flex items-center gap-2">
              <Gauge size={16} weight="duotone" className="text-gray-400" />
              Utilization Rate
            </label>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={utilizationRate}
                onChange={(e) => setUtilizationRate(Number(e.target.value))}
                className="flex-1 accent-[#253ff6]"
              />
              <span className="w-12 text-sm font-mono text-gray-700">{(utilizationRate * 100).toFixed(0)}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">How much of limits customers actually use</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Monthly Churn Rate</label>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={scenario.monthlyChurnRate}
                onChange={(e) => handleScenarioChange('monthlyChurnRate', Number(e.target.value))}
                className="input-field w-20 text-center"
              />
              <span className="text-sm text-gray-500">% per month</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              = {((1 - Math.pow(1 - scenario.monthlyChurnRate/100, 12)) * 100).toFixed(0)}% annual churn
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Freemium Conversion</label>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={scenario.conversionRate}
                onChange={(e) => handleScenarioChange('conversionRate', Number(e.target.value))}
                className="input-field w-20 text-center"
              />
              <span className="text-sm text-gray-500">% monthly</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              = ~{Math.round(monthlyConversions)} conversions/mo
              {projectedMrrGrowth > 0 && (
                <span className="text-emerald-600"> (+MYR {projectedMrrGrowth.toFixed(0)} MRR)</span>
              )}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600 flex items-center gap-2">
              <Rocket size={16} weight="duotone" className="text-gray-400" />
              Monthly Growth Rate
            </label>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={monthlyGrowthRate}
                onChange={(e) => setMonthlyGrowthRate(Math.max(0, Number(e.target.value)))}
                className="input-field w-20 text-center"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              = {((Math.pow(1 + monthlyGrowthRate/100, 12) - 1) * 100).toFixed(0)}% annual growth
            </p>
          </div>
        </div>
      </div>

      {/* Revenue & Cost Breakdown */}
      <div className="grid grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-medium text-gray-900 mb-4">Revenue Breakdown</h3>
          <div className="space-y-4">
            {(['freemium', 'basic', 'pro', 'enterprise'] as const).map((tier) => {
              const pct = totalMRR > 0 ? (revenue[tier] / totalMRR) * 100 : 0;
              return (
                <div key={tier}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 capitalize">{tier}</span>
                    <span className="font-mono text-gray-600">MYR {revenue[tier].toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        tier === 'freemium' ? 'bg-gray-300' :
                        tier === 'basic' ? 'bg-[#253ff6]' :
                        tier === 'pro' ? 'bg-violet-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {counts[tier]} × MYR {prices[tier]} = {pct.toFixed(1)}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-medium text-gray-900 mb-4">Cost Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2.5 border-b border-[#e4e4e4]">
              <div>
                <p className="text-sm font-medium text-gray-700">Variable Costs</p>
                <p className="text-xs text-gray-500">AI, Storage, Email @ {(utilizationRate * 100).toFixed(0)}% utilization</p>
              </div>
              <span className="font-mono text-sm text-gray-600">MYR {totalVariableCosts.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-[#e4e4e4]">
              <div>
                <p className="text-sm font-medium text-gray-700">Fixed Costs</p>
                <p className="text-xs text-gray-500">Infrastructure</p>
              </div>
              <span className="font-mono text-sm text-gray-600">MYR {monthlyFixedCostsTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-3 bg-gray-50 rounded-[0.2rem] px-4 -mx-2">
              <span className="font-medium text-gray-900">Total Costs</span>
              <span className="font-semibold text-gray-700 font-mono">MYR {totalCosts.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-3 bg-emerald-50 rounded-[0.2rem] px-4 -mx-2">
              <span className="font-medium text-gray-900">Gross Profit</span>
              <span className={`font-semibold font-mono ${grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                MYR {grossProfit.toFixed(2)}
              </span>
            </div>
            <div className={`flex justify-between py-3 rounded-[0.2rem] px-4 -mx-2 ${operatingProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <span className="font-medium text-gray-900">Operating Profit</span>
              <span className={`font-semibold font-mono ${operatingProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                MYR {operatingProfit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Unit Economics */}
      <UnitEconomicsGrid
        ltv={ltv}
        monthlyChurnRate={scenario.monthlyChurnRate}
        breakEvenCustomers={breakEvenCustomers}
        paidCustomers={paidCustomers}
        contributionMargin={contributionMargin}
        freemiumCosts={freemiumCosts}
        freemiumCostPerUser={freemiumCostPerUser}
        fixedCosts={monthlyFixedCostsTotal}
      />

      {/* Freemium Conversion Pipeline */}
      {counts.freemium > 0 && (
        <div className="card p-6 bg-gradient-to-br from-emerald-50/50 to-white border-emerald-200">
          <div className="flex items-center gap-2 mb-4">
            <Rocket size={20} weight="duotone" className="text-emerald-600" />
            <h3 className="font-medium text-gray-900">Freemium Conversion Pipeline</h3>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-[0.2rem] border border-emerald-200">
              <p className="text-sm text-gray-500">Freemium Pool</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{counts.freemium.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Free tier users</p>
            </div>
            <div className="p-4 bg-white rounded-[0.2rem] border border-emerald-200">
              <p className="text-sm text-gray-500">Monthly Conversions</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">~{Math.round(monthlyConversions)}</p>
              <p className="text-xs text-gray-500 mt-1">@ {scenario.conversionRate}% rate</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-[0.2rem] border border-emerald-200">
              <p className="text-sm text-emerald-600 font-medium">MRR Growth Potential</p>
              <p className="text-2xl font-bold text-emerald-700 font-mono mt-1">
                +MYR {projectedMrrGrowth.toFixed(0)}
              </p>
              <p className="text-xs text-emerald-500 mt-1">From conversions × ARPU</p>
            </div>
            <div className="p-4 bg-white rounded-[0.2rem] border border-emerald-200">
              <p className="text-sm text-gray-500">Annual Growth Impact</p>
              <p className="text-2xl font-bold text-gray-900 font-mono mt-1">
                +MYR {(projectedMrrGrowth * 12).toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Projected ARR increase</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Based on {counts.freemium.toLocaleString()} freemium users converting at {scenario.conversionRate}% monthly rate with ARPU of MYR {arpu.toFixed(0)}
          </p>
        </div>
      )}

      {/* Investor Metrics */}
      <div className="card p-6 bg-gradient-to-br from-violet-50/50 to-white border-violet-200">
        <div className="flex items-center gap-2 mb-4">
          <ChartLineUp size={20} weight="duotone" className="text-violet-600" />
          <h3 className="font-medium text-gray-900">Investor Metrics</h3>
        </div>

        {/* Valuation & Key Numbers */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-white rounded-[0.2rem] border border-violet-200">
            <p className="text-sm text-gray-500">Current ARR</p>
            <p className="text-2xl font-bold text-gray-900 font-mono mt-1">
              {formatCurrency(investorMetrics.arr)}
            </p>
            <p className="text-xs text-gray-500 mt-1">MRR × 12</p>
          </div>
          <div className="col-span-2 p-4 bg-violet-50 rounded-[0.2rem] border border-violet-200">
            <p className="text-sm text-violet-600 font-medium">Valuation Range (SaaS Multiples)</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-violet-700 font-mono">
                {formatCurrency(investorMetrics.valuation.valuationLow)}
              </span>
              <span className="text-gray-400">to</span>
              <span className="text-xl font-bold text-violet-700 font-mono">
                {formatCurrency(investorMetrics.valuation.valuationHigh)}
              </span>
            </div>
            <p className="text-xs text-violet-500 mt-1">5× to 15× ARR (industry standard for SaaS)</p>
          </div>
          <div className="p-4 bg-white rounded-[0.2rem] border border-violet-200">
            <p className="text-sm text-gray-500">Margin Health</p>
            <p className={`text-2xl font-bold mt-1 ${
              investorMetrics.grossMarginHealth === 'healthy' ? 'text-emerald-600' :
              investorMetrics.grossMarginHealth === 'acceptable' ? 'text-amber-600' :
              'text-red-600'
            }`}>
              {investorMetrics.grossMarginHealth === 'healthy' ? '✓ Healthy' :
               investorMetrics.grossMarginHealth === 'acceptable' ? '◐ OK' :
               '✗ Low'}
            </p>
            <p className="text-xs text-gray-500 mt-1">{grossMargin.toFixed(0)}% gross margin</p>
          </div>
        </div>

        {/* Milestones */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} weight="duotone" className="text-amber-500" />
            <h4 className="text-sm font-medium text-gray-700">ARR Milestones</h4>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {investorMetrics.milestones.map((milestone) => (
              <div
                key={milestone.label}
                className={`p-3 rounded-[0.2rem] border ${
                  milestone.monthsToReach === 0
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <p className="text-xs font-medium text-gray-600">{milestone.label}</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {milestone.customersNeeded.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">customers needed</p>
                {milestone.monthsToReach !== null && (
                  <p className={`text-xs mt-1 ${
                    milestone.monthsToReach === 0 ? 'text-emerald-600 font-medium' : 'text-gray-400'
                  }`}>
                    {milestone.monthsToReach === 0
                      ? '✓ Achieved'
                      : `~${milestone.monthsToReach} months @ ${monthlyGrowthRate}% growth`}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Break-even Timeline */}
        <div className="p-4 bg-white rounded-[0.2rem] border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Break-even Timeline</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {investorMetrics.customersToBreakEven > 0
                  ? `Need ${investorMetrics.customersToBreakEven} more paid customers to break even`
                  : 'Already at break-even!'}
              </p>
            </div>
            <div className="text-right">
              {investorMetrics.monthsToBreakEven !== null ? (
                <>
                  <p className={`text-2xl font-bold font-mono ${
                    investorMetrics.monthsToBreakEven === 0 ? 'text-emerald-600' : 'text-gray-900'
                  }`}>
                    {investorMetrics.monthsToBreakEven === 0 ? 'Now' : `${investorMetrics.monthsToBreakEven} mo`}
                  </p>
                  <p className="text-xs text-gray-500">@ {monthlyGrowthRate}% monthly growth</p>
                </>
              ) : (
                <p className="text-sm text-gray-500">Set growth rate to calculate</p>
              )}
            </div>
          </div>
          {investorMetrics.monthsToBreakEven !== null && investorMetrics.monthsToBreakEven > 0 && (
            <div className="mt-3">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (paidCustomers / breakEvenCustomers) * 100)}%`
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{paidCustomers} current</span>
                <span>{breakEvenCustomers} break-even</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Price Sensitivity */}
      <PriceSensitivityTable data={priceSensitivityData} />
    </div>
  );
}
