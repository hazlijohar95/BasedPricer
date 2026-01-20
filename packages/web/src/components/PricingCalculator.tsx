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
  // Maps tier IDs to prices dynamically - works with any tier configuration
  const prices = useMemo((): Record<string, number> => {
    // Start with default tier prices for backwards compatibility
    const tierPrices: Record<string, number> = { freemium: 0, basic: 25, pro: 78, enterprise: 500 };

    // Override with actual tier prices from context
    tiers.forEach(tier => {
      tierPrices[tier.id] = tier.monthlyPriceMYR;
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
  const handleDistributionChange = useCallback((tierId: string, newValue: number) => {
    setScenario(prev => ({
      ...prev,
      distribution: { ...prev.distribution, [tierId]: newValue }
    }));
  }, []);

  // Handler for price changes - updates context directly
  const handlePriceChange = useCallback((tierId: string, value: number) => {
    // Find the tier and update its price in context
    const tierToUpdate = tiers.find(t => t.id === tierId);
    if (tierToUpdate) {
      updateTier(tierId, { monthlyPriceMYR: Math.max(0, value) });
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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Pricing Calculator</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Model revenue, costs, and unit economics under different scenarios</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Pricing */}
        <div className="card p-4 sm:p-6">
          <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Tier Pricing (MYR/month)</h3>
          <div className="space-y-3 sm:space-y-4">
            {(['freemium', 'basic', 'pro', 'enterprise'] as const).map((tier) => {
              const tierDef = tiers.find(t => t.id === tier);
              const isFromData = tierDef && tierDef.monthlyPriceMYR > 0;
              return (
                <div key={tier} className="flex items-center gap-2 sm:gap-4">
                  <label className="w-20 sm:w-24 text-xs sm:text-sm font-medium text-gray-700 capitalize">{tier}</label>
                  <input
                    type="number"
                    min="0"
                    value={prices[tier]}
                    onChange={(e) => handlePriceChange(tier, Number(e.target.value))}
                    disabled={tier === 'freemium'}
                    className={`input-field flex-1 text-sm touch-manipulation ${tier === 'freemium' ? 'bg-gray-100 text-gray-400' : ''}`}
                  />
                  {tier === 'basic' && <span className="text-xs text-[#253ff6] font-medium hidden sm:inline">Target</span>}
                  {!isFromData && tier !== 'freemium' && (
                    <span className="text-xs text-amber-600 hidden sm:inline">TBD</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribution */}
        <div className="card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
            <div>
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Customer Distribution</h3>
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
              className="input-field w-full sm:w-24 text-center text-sm touch-manipulation"
            />
          </div>
          <div className="space-y-3 sm:space-y-4">
            {(['freemium', 'basic', 'pro', 'enterprise'] as const).map((tier) => (
              <div key={tier} className="flex items-center gap-2 sm:gap-4">
                <label className="w-20 sm:w-24 text-xs sm:text-sm font-medium text-gray-700 capitalize">{tier}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={scenario.distribution[tier]}
                  onChange={(e) => handleDistributionChange(tier, Number(e.target.value))}
                  className="flex-1 accent-[#253ff6] touch-manipulation h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5"
                />
                <span className="w-16 sm:w-24 text-right text-xs sm:text-sm font-mono text-gray-600">
                  {normalizedDistribution[tier].toFixed(0)}% ({counts[tier]})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assumptions */}
      <div className="card p-4 sm:p-6">
        <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Assumptions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div>
            <label className="text-xs sm:text-sm text-gray-600 flex items-center gap-2">
              <Gauge size={16} weight="duotone" className="text-gray-400" />
              Utilization Rate
            </label>
            <div className="flex items-center gap-2 sm:gap-3 mt-2">
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={utilizationRate}
                onChange={(e) => setUtilizationRate(Number(e.target.value))}
                className="flex-1 accent-[#253ff6] touch-manipulation h-2 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5"
              />
              <span className="w-10 sm:w-12 text-xs sm:text-sm font-mono text-gray-700">{(utilizationRate * 100).toFixed(0)}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1 hidden sm:block">How much of limits customers actually use</p>
          </div>
          <div>
            <label className="text-xs sm:text-sm text-gray-600">Monthly Churn Rate</label>
            <div className="flex items-center gap-2 sm:gap-3 mt-2">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={scenario.monthlyChurnRate}
                onChange={(e) => handleScenarioChange('monthlyChurnRate', Number(e.target.value))}
                className="input-field w-16 sm:w-20 text-center text-sm touch-manipulation"
              />
              <span className="text-xs sm:text-sm text-gray-500">% /mo</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              = {((1 - Math.pow(1 - scenario.monthlyChurnRate/100, 12)) * 100).toFixed(0)}% annual
            </p>
          </div>
          <div>
            <label className="text-xs sm:text-sm text-gray-600">Freemium Conversion</label>
            <div className="flex items-center gap-2 sm:gap-3 mt-2">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={scenario.conversionRate}
                onChange={(e) => handleScenarioChange('conversionRate', Number(e.target.value))}
                className="input-field w-16 sm:w-20 text-center text-sm touch-manipulation"
              />
              <span className="text-xs sm:text-sm text-gray-500">% /mo</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              ~{Math.round(monthlyConversions)}/mo
              {projectedMrrGrowth > 0 && (
                <span className="text-emerald-600 block sm:inline"> +MYR {projectedMrrGrowth.toFixed(0)}</span>
              )}
            </p>
          </div>
          <div>
            <label className="text-xs sm:text-sm text-gray-600 flex items-center gap-2">
              <Rocket size={16} weight="duotone" className="text-gray-400" />
              Monthly Growth
            </label>
            <div className="flex items-center gap-2 sm:gap-3 mt-2">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={monthlyGrowthRate}
                onChange={(e) => setMonthlyGrowthRate(Math.max(0, Number(e.target.value)))}
                className="input-field w-16 sm:w-20 text-center text-sm touch-manipulation"
              />
              <span className="text-xs sm:text-sm text-gray-500">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              = {((Math.pow(1 + monthlyGrowthRate/100, 12) - 1) * 100).toFixed(0)}% annual
            </p>
          </div>
        </div>
      </div>

      {/* Revenue & Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card p-4 sm:p-6">
          <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Revenue Breakdown</h3>
          <div className="space-y-3 sm:space-y-4">
            {(['freemium', 'basic', 'pro', 'enterprise'] as const).map((tier) => {
              const pct = totalMRR > 0 ? (revenue[tier] / totalMRR) * 100 : 0;
              return (
                <div key={tier}>
                  <div className="flex justify-between text-xs sm:text-sm mb-1">
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

        <div className="card p-4 sm:p-6">
          <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Cost Breakdown</h3>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-start py-2 sm:py-2.5 border-b border-[#e4e4e4]">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-700">Variable Costs</p>
                <p className="text-xs text-gray-500 truncate">AI, Storage @ {(utilizationRate * 100).toFixed(0)}%</p>
              </div>
              <span className="font-mono text-xs sm:text-sm text-gray-600 ml-2 shrink-0">MYR {totalVariableCosts.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-start py-2 sm:py-2.5 border-b border-[#e4e4e4]">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-700">Fixed Costs</p>
                <p className="text-xs text-gray-500">Infrastructure</p>
              </div>
              <span className="font-mono text-xs sm:text-sm text-gray-600 ml-2 shrink-0">MYR {monthlyFixedCostsTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2.5 sm:py-3 bg-gray-50 rounded-[0.2rem] px-3 sm:px-4 -mx-1 sm:-mx-2">
              <span className="font-medium text-gray-900 text-xs sm:text-sm">Total Costs</span>
              <span className="font-semibold text-gray-700 font-mono text-xs sm:text-sm">MYR {totalCosts.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2.5 sm:py-3 bg-emerald-50 rounded-[0.2rem] px-3 sm:px-4 -mx-1 sm:-mx-2">
              <span className="font-medium text-gray-900 text-xs sm:text-sm">Gross Profit</span>
              <span className={`font-semibold font-mono text-xs sm:text-sm ${grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                MYR {grossProfit.toFixed(2)}
              </span>
            </div>
            <div className={`flex justify-between py-2.5 sm:py-3 rounded-[0.2rem] px-3 sm:px-4 -mx-1 sm:-mx-2 ${operatingProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <span className="font-medium text-gray-900 text-xs sm:text-sm">Operating Profit</span>
              <span className={`font-semibold font-mono text-xs sm:text-sm ${operatingProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
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
        <div className="card p-4 sm:p-6 bg-gradient-to-br from-emerald-50/50 to-white border-emerald-200">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Rocket size={18} weight="duotone" className="text-emerald-600 sm:w-5 sm:h-5" />
            <h3 className="font-medium text-gray-900 text-sm sm:text-base">Freemium Conversion Pipeline</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-white rounded-[0.2rem] border border-emerald-200">
              <p className="text-xs sm:text-sm text-gray-500">Freemium Pool</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{counts.freemium.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Free tier users</p>
            </div>
            <div className="p-3 sm:p-4 bg-white rounded-[0.2rem] border border-emerald-200">
              <p className="text-xs sm:text-sm text-gray-500">Monthly Conversions</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">~{Math.round(monthlyConversions)}</p>
              <p className="text-xs text-gray-500 mt-1">@ {scenario.conversionRate}% rate</p>
            </div>
            <div className="p-3 sm:p-4 bg-emerald-50 rounded-[0.2rem] border border-emerald-200">
              <p className="text-xs sm:text-sm text-emerald-600 font-medium">MRR Growth</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-700 font-mono mt-1">
                +MYR {projectedMrrGrowth.toFixed(0)}
              </p>
              <p className="text-xs text-emerald-500 mt-1 hidden sm:block">From conversions × ARPU</p>
            </div>
            <div className="p-3 sm:p-4 bg-white rounded-[0.2rem] border border-emerald-200">
              <p className="text-xs sm:text-sm text-gray-500">Annual Impact</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 font-mono mt-1">
                +MYR {(projectedMrrGrowth * 12).toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Projected ARR increase</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 sm:mt-4 flex items-start sm:items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 sm:mt-0 shrink-0" />
            <span className="leading-relaxed">{counts.freemium.toLocaleString()} freemium users @ {scenario.conversionRate}% monthly, ARPU MYR {arpu.toFixed(0)}</span>
          </p>
        </div>
      )}

      {/* Investor Metrics */}
      <div className="card p-4 sm:p-6 bg-gradient-to-br from-violet-50/50 to-white border-violet-200">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <ChartLineUp size={18} weight="duotone" className="text-violet-600 sm:w-5 sm:h-5" />
          <h3 className="font-medium text-gray-900 text-sm sm:text-base">Investor Metrics</h3>
        </div>

        {/* Valuation & Key Numbers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="p-3 sm:p-4 bg-white rounded-[0.2rem] border border-violet-200">
            <p className="text-xs sm:text-sm text-gray-500">Current ARR</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 font-mono mt-1">
              {formatCurrency(investorMetrics.arr)}
            </p>
            <p className="text-xs text-gray-500 mt-1 hidden sm:block">MRR × 12</p>
          </div>
          <div className="col-span-2 p-3 sm:p-4 bg-violet-50 rounded-[0.2rem] border border-violet-200 order-3 lg:order-none">
            <p className="text-xs sm:text-sm text-violet-600 font-medium">Valuation Range</p>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 mt-1">
              <span className="text-base sm:text-xl font-bold text-violet-700 font-mono">
                {formatCurrency(investorMetrics.valuation.valuationLow)}
              </span>
              <span className="text-gray-400 hidden sm:inline">to</span>
              <span className="text-base sm:text-xl font-bold text-violet-700 font-mono">
                <span className="sm:hidden">- </span>{formatCurrency(investorMetrics.valuation.valuationHigh)}
              </span>
            </div>
            <p className="text-xs text-violet-500 mt-1 hidden sm:block">5× to 15× ARR (industry standard)</p>
          </div>
          <div className="p-3 sm:p-4 bg-white rounded-[0.2rem] border border-violet-200">
            <p className="text-xs sm:text-sm text-gray-500">Margin Health</p>
            <p className={`text-lg sm:text-2xl font-bold mt-1 ${
              investorMetrics.grossMarginHealth === 'healthy' ? 'text-emerald-600' :
              investorMetrics.grossMarginHealth === 'acceptable' ? 'text-amber-600' :
              'text-red-600'
            }`}>
              {investorMetrics.grossMarginHealth === 'healthy' ? '✓ Healthy' :
               investorMetrics.grossMarginHealth === 'acceptable' ? '◐ OK' :
               '✗ Low'}
            </p>
            <p className="text-xs text-gray-500 mt-1">{grossMargin.toFixed(0)}% margin</p>
          </div>
        </div>

        {/* Milestones */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <Trophy size={16} weight="duotone" className="text-amber-500" />
            <h4 className="text-xs sm:text-sm font-medium text-gray-700">ARR Milestones</h4>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {investorMetrics.milestones.map((milestone) => (
              <div
                key={milestone.label}
                className={`p-2.5 sm:p-3 rounded-[0.2rem] border ${
                  milestone.monthsToReach === 0
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <p className="text-xs font-medium text-gray-600">{milestone.label}</p>
                <p className="text-base sm:text-lg font-bold text-gray-900 mt-1">
                  {milestone.customersNeeded.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 hidden sm:block">customers needed</p>
                {milestone.monthsToReach !== null && (
                  <p className={`text-xs mt-1 ${
                    milestone.monthsToReach === 0 ? 'text-emerald-600 font-medium' : 'text-gray-400'
                  }`}>
                    {milestone.monthsToReach === 0
                      ? '✓ Achieved'
                      : <span className="hidden sm:inline">~{milestone.monthsToReach} mo @ {monthlyGrowthRate}%</span>}
                    {milestone.monthsToReach !== 0 && <span className="sm:hidden">~{milestone.monthsToReach} mo</span>}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Break-even Timeline */}
        <div className="p-3 sm:p-4 bg-white rounded-[0.2rem] border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div>
              <h4 className="text-xs sm:text-sm font-medium text-gray-700">Break-even Timeline</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {investorMetrics.customersToBreakEven > 0
                  ? `Need ${investorMetrics.customersToBreakEven} more paid customers`
                  : 'Already at break-even!'}
              </p>
            </div>
            <div className="text-left sm:text-right">
              {investorMetrics.monthsToBreakEven !== null ? (
                <>
                  <p className={`text-xl sm:text-2xl font-bold font-mono ${
                    investorMetrics.monthsToBreakEven === 0 ? 'text-emerald-600' : 'text-gray-900'
                  }`}>
                    {investorMetrics.monthsToBreakEven === 0 ? 'Now' : `${investorMetrics.monthsToBreakEven} mo`}
                  </p>
                  <p className="text-xs text-gray-500">@ {monthlyGrowthRate}% monthly growth</p>
                </>
              ) : (
                <p className="text-xs sm:text-sm text-gray-500">Set growth rate to calculate</p>
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
