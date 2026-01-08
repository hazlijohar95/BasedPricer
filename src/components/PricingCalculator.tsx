import { useState, useMemo, useCallback, useEffect } from 'react';
import { TrendUp, Users, Target, Percent, Gauge, ChartLineUp, Trophy, Rocket } from '@phosphor-icons/react';
import { calculateTierVariableCosts, DEFAULT_COST_RATES, type CostRates } from '../data/tiers';
import { usePricing } from '../context/PricingContext';
import {
  calculateInvestorMetrics,
  formatCurrency,
  type InvestorMetrics,
} from '../utils/investorMetrics';

type TierKey = 'freemium' | 'basic' | 'pro' | 'enterprise';

interface Scenario {
  name: string;
  distribution: Record<TierKey, number>;
  monthlyChurnRate: number; // Explicit: monthly churn
  conversionRate: number;
}

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
  } = usePricing();

  // Derive cost rates from context's variableCosts (single source of truth)
  // This ensures PricingCalculator uses the same rates as COGSCalculator
  const costRates = useMemo((): CostRates => {
    const ocrCost = variableCosts.find(c => c.id === 'ocr')?.costPerUnit;
    const emailCost = variableCosts.find(c => c.id === 'email')?.costPerUnit;
    const storageCost = variableCosts.find(c => c.id === 'storage')?.costPerUnit;

    return {
      extractionCostPerUnit: ocrCost ?? DEFAULT_COST_RATES.extractionCostPerUnit,
      emailCostPerUnit: emailCost ?? DEFAULT_COST_RATES.emailCostPerUnit,
      storageCostPerGB: storageCost ?? DEFAULT_COST_RATES.storageCostPerGB,
    };
  }, [variableCosts]);

  // Get initial prices from context tiers
  const getInitialPrices = useCallback((): Record<TierKey, number> => {
    const tierPrices: Record<TierKey, number> = { freemium: 0, basic: 25, pro: 78, enterprise: 500 };
    tiers.forEach(tier => {
      const key = tier.id as TierKey;
      if (tier.monthlyPriceMYR > 0) {
        tierPrices[key] = tier.monthlyPriceMYR;
      }
    });
    return tierPrices;
  }, [tiers]);

  const [scenario, setScenario] = useState<Scenario>(scenarios[0]);
  const [totalCustomers, setTotalCustomers] = useState(100);
  const [prices, setPrices] = useState<Record<TierKey, number>>(() => getInitialPrices());
  const [monthlyGrowthRate, setMonthlyGrowthRate] = useState(5); // Default 5% monthly growth

  // Sync prices when tiers change in context (e.g., user edits prices in Tier Configurator)
  useEffect(() => {
    const newPrices = getInitialPrices();
    setPrices(prev => {
      // Only update if prices actually changed in context
      const hasChanges = Object.entries(newPrices).some(
        ([key, value]) => prev[key as TierKey] !== value
      );
      return hasChanges ? newPrices : prev;
    });
  }, [getInitialPrices]);

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
      freemiumCosts, // New: expose freemium subsidy for transparency
    };
  }, [totalMRR, totalVariableCosts, totalCosts, counts, revenue, tierVariableCosts, scenario.monthlyChurnRate, monthlyFixedCostsTotal]);

  // Destructure for easier access in JSX
  const {
    grossProfit, grossMargin, operatingProfit, operatingMargin,
    paidCustomers, arpu, ltv, contributionMargin, breakEvenCustomers,
    freemiumCosts
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

  // Memoized handler for price changes
  const handlePriceChange = useCallback((tier: TierKey, value: number) => {
    setPrices(prev => ({ ...prev, [tier]: Math.max(0, value) }));
  }, []);

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
        isHealthy: testGrossMargin >= 70,
        isAcceptable: testGrossMargin >= 50,
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
        <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-[0.2rem]">
          {scenarios.map((s) => (
            <button
              key={s.name}
              onClick={() => setScenario(s)}
              className={`px-4 py-1.5 text-sm font-medium rounded-[0.2rem] transition-all duration-200 ${
                scenario.name === s.name
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
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
        <div className="card p-5 border-l-[3px] border-l-emerald-500">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Gross Margin</p>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              grossMargin >= 70 ? 'bg-emerald-50' :
              grossMargin >= 50 ? 'bg-amber-50' :
              'bg-red-50'
            }`}>
              <Percent size={16} weight="duotone" className={
                grossMargin >= 70 ? 'text-emerald-600' :
                grossMargin >= 50 ? 'text-amber-600' :
                'text-red-600'
              } />
            </div>
          </div>
          <p className={`text-2xl font-semibold mt-2 ${
            grossMargin >= 70 ? 'text-emerald-600' :
            grossMargin >= 50 ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {grossMargin.toFixed(0)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">Revenue − Variable Costs</p>
        </div>
        <div className={`card p-5 border-l-[3px] ${
          operatingMargin >= 20 ? 'border-l-emerald-500' :
          operatingMargin >= 0 ? 'border-l-amber-500' :
          'border-l-red-500'
        }`}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Operating Margin</p>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              operatingMargin >= 20 ? 'bg-emerald-50' :
              operatingMargin >= 0 ? 'bg-amber-50' :
              'bg-red-50'
            }`}>
              <Target size={16} weight="duotone" className={
                operatingMargin >= 20 ? 'text-emerald-600' :
                operatingMargin >= 0 ? 'text-amber-600' :
                'text-red-600'
              } />
            </div>
          </div>
          <p className={`text-2xl font-semibold mt-2 ${
            operatingMargin >= 20 ? 'text-emerald-600' :
            operatingMargin >= 0 ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {operatingMargin.toFixed(0)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">After all costs</p>
        </div>
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
            <p className="text-xs text-gray-400 mt-1">How much of limits customers actually use</p>
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
            <p className="text-xs text-gray-400 mt-1">
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
              <span className="text-sm text-gray-500">%</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Free to paid conversion</p>
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
            <p className="text-xs text-gray-400 mt-1">
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
                  <p className="text-xs text-gray-400 mt-1">
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
                <p className="text-xs text-gray-400">AI, Storage, Email @ {(utilizationRate * 100).toFixed(0)}% utilization</p>
              </div>
              <span className="font-mono text-sm text-gray-600">MYR {totalVariableCosts.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-[#e4e4e4]">
              <div>
                <p className="text-sm font-medium text-gray-700">Fixed Costs</p>
                <p className="text-xs text-gray-400">Infrastructure</p>
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
      <div className="card p-6">
        <h3 className="font-medium text-gray-900 mb-4">Unit Economics</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-[0.2rem] border border-[#e4e4e4]">
            <p className="text-sm text-gray-500">LTV</p>
            <p className="text-2xl font-bold text-gray-900 font-mono mt-1">MYR {ltv.toFixed(0)}</p>
            <p className="text-xs text-gray-400 mt-1">
              ARPU ÷ {scenario.monthlyChurnRate}% monthly churn
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-[0.2rem] border border-[#e4e4e4]">
            <p className="text-sm text-gray-500">Break-even</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{breakEvenCustomers}</p>
            <p className="text-xs text-gray-400 mt-1">
              Paid customers needed
              {paidCustomers > 0 && breakEvenCustomers > 0 && (
                <span className={paidCustomers >= breakEvenCustomers ? ' text-emerald-600' : ' text-amber-600'}>
                  {' '}({paidCustomers >= breakEvenCustomers ? 'achieved' : `need ${breakEvenCustomers - paidCustomers} more`})
                </span>
              )}
            </p>
            {freemiumCosts > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                Includes MYR {freemiumCosts.toFixed(2)} freemium subsidy
              </p>
            )}
          </div>
          <div className="p-4 bg-gray-50 rounded-[0.2rem] border border-[#e4e4e4]">
            <p className="text-sm text-gray-500">Contribution Margin</p>
            <p className="text-2xl font-bold text-gray-900 font-mono mt-1">MYR {contributionMargin.toFixed(0)}</p>
            <p className="text-xs text-gray-400 mt-1">ARPU − Avg Variable Cost</p>
          </div>
          <div className="p-4 bg-[rgba(37,63,246,0.06)] rounded-[0.2rem] border border-[rgba(37,63,246,0.15)]">
            <p className="text-sm text-[#253ff6]">Recommended CAC</p>
            <p className="text-2xl font-bold text-[#253ff6] font-mono mt-1">
              MYR {(ltv / 5).toFixed(0)} - {(ltv / 3).toFixed(0)}
            </p>
            <p className="text-xs text-[#253ff6]/70 mt-1">LTV:CAC 3:1 to 5:1</p>
          </div>
        </div>
      </div>

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
            <p className="text-xs text-gray-400 mt-1">MRR × 12</p>
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
            <p className="text-xs text-gray-400 mt-1">{grossMargin.toFixed(0)}% gross margin</p>
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
              <p className="text-xs text-gray-400 mt-0.5">
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
                  <p className="text-xs text-gray-400">@ {monthlyGrowthRate}% monthly growth</p>
                </>
              ) : (
                <p className="text-sm text-gray-400">Set growth rate to calculate</p>
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
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{paidCustomers} current</span>
                <span>{breakEvenCustomers} break-even</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Price Sensitivity */}
      <div className="card p-6">
        <h3 className="font-medium text-gray-900 mb-4">Basic Tier Price Sensitivity</h3>
        <div className="overflow-hidden rounded-[0.2rem] border border-[#e4e4e4]">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left py-3 px-4">Price</th>
                <th className="text-right py-3 px-4">MRR</th>
                <th className="text-right py-3 px-4">Gross Profit</th>
                <th className="text-right py-3 px-4">Operating Profit</th>
                <th className="text-right py-3 px-4">Gross Margin</th>
                <th className="text-center py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {priceSensitivityData.map(({
                price, testRevenue, testGrossProfit, testOperatingProfit,
                testGrossMargin, isHealthy, isAcceptable, isCurrent
              }) => (
                <tr key={price} className={`table-row ${isCurrent ? 'bg-[rgba(37,63,246,0.04)]' : ''}`}>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-900">MYR {price}</span>
                    {isCurrent && <span className="ml-2 text-xs text-[#253ff6]">(Current)</span>}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-gray-600">
                    MYR {testRevenue.toLocaleString()}
                  </td>
                  <td className={`py-3 px-4 text-right font-mono ${testGrossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    MYR {testGrossProfit.toFixed(0)}
                  </td>
                  <td className={`py-3 px-4 text-right font-mono ${testOperatingProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    MYR {testOperatingProfit.toFixed(0)}
                  </td>
                  <td className={`py-3 px-4 text-right font-semibold ${
                    isHealthy ? 'text-emerald-600' : isAcceptable ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {testGrossMargin.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-[0.2rem] ${
                      isHealthy ? 'bg-emerald-50 text-emerald-600' :
                      isAcceptable ? 'bg-amber-50 text-amber-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {isHealthy ? 'Healthy' : isAcceptable ? 'OK' : 'Low'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
