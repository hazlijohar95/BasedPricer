import { useState, useMemo } from 'react';
import { Info, Plus, X, PencilSimple, Gauge } from '@phosphor-icons/react';
import { generateId } from '@basedpricer/core';
import { usePricing, type VariableCostItem, type FixedCostItem } from '../context/PricingContext';
import { COST_PRESETS, type CostPresetKey } from '../data/cost-presets';
import { getMarginStyle, calculateCOGSBreakdown } from '../utils/costCalculator';

export function COGSCalculator() {
  const {
    variableCosts,
    fixedCosts,
    customerCount,
    selectedPrice,
    costs,
    margin,
    profit,
    utilizationRate,
    setUtilizationRate,
    setVariableCosts,
    setFixedCosts,
    updateVariableCost,
    updateFixedCost,
    removeVariableCost,
    removeFixedCost,
    setCustomerCount,
    setSelectedPrice,
    loadPreset,
  } = usePricing();

  const [selectedPresetKey, setSelectedPresetKey] = useState<CostPresetKey>('ai-saas');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showRealisticUsage, setShowRealisticUsage] = useState(false);

  // Calculate realistic COGS with utilization applied
  const realisticCosts = useMemo(() => {
    return calculateCOGSBreakdown(variableCosts, fixedCosts, customerCount, utilizationRate);
  }, [variableCosts, fixedCosts, customerCount, utilizationRate]);

  // Use either max or realistic costs based on toggle
  const displayCosts = showRealisticUsage ? realisticCosts : costs;
  const displayMargin = showRealisticUsage
    ? selectedPrice > 0 ? ((selectedPrice - realisticCosts.totalCOGS) / selectedPrice) * 100 : 0
    : margin;
  const displayProfit = showRealisticUsage
    ? selectedPrice - realisticCosts.totalCOGS
    : profit;

  // Load preset handler
  const handleLoadPreset = (presetKey: CostPresetKey) => {
    setSelectedPresetKey(presetKey);
    loadPreset(COST_PRESETS[presetKey]);
  };

  // Margin styling - use display values
  const marginStyle = getMarginStyle(displayMargin);

  // Add new variable cost
  const addVariableCost = () => {
    const newId = generateId('var');
    const newCost: VariableCostItem = {
      id: newId,
      name: 'New cost item',
      unit: 'units',
      costPerUnit: 0.01,
      usagePerCustomer: 10,
      description: 'Click to edit',
    };
    setVariableCosts([...variableCosts, newCost]);
    setEditingItem(newId);
  };

  // Add new fixed cost
  const addFixedCost = () => {
    const newId = generateId('fix');
    const newCost: FixedCostItem = {
      id: newId,
      name: 'New fixed cost',
      monthlyCost: 50,
      description: 'Click to edit',
    };
    setFixedCosts([...fixedCosts, newCost]);
  };

  return (
    <div className="min-h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">COGS Calculator</h1>
          <p className="text-gray-500 text-sm mt-1">Build your cost model to find the right price</p>
        </div>
      </div>

      {/* What is COGS + Presets */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-blue-900 font-medium mb-1">What goes into COGS?</p>
            <p className="text-xs text-blue-700 mb-3">
              COGS (Cost of Goods Sold) = costs that scale with customers. Include: <strong>Variable costs</strong> (per-action costs like API calls, storage, emails) + <strong>Fixed costs</strong> (infrastructure shared by all customers). Don't include: salaries, marketing, office rent.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-blue-600">Load template:</span>
              {Object.entries(COST_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => handleLoadPreset(key as CostPresetKey)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    selectedPresetKey === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-blue-700 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Usage Mode Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">View costs at:</span>
          <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-[0.2rem]">
            <button
              onClick={() => setShowRealisticUsage(false)}
              className={`px-3 py-1.5 text-sm font-medium rounded-[0.2rem] transition-all duration-200 ${
                !showRealisticUsage
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Max usage (100%)
            </button>
            <button
              onClick={() => setShowRealisticUsage(true)}
              className={`px-3 py-1.5 text-sm font-medium rounded-[0.2rem] transition-all duration-200 ${
                showRealisticUsage
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Realistic ({(utilizationRate * 100).toFixed(0)}%)
            </button>
          </div>
        </div>
        {showRealisticUsage && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 group relative">
              <Gauge size={16} weight="duotone" className="text-gray-400" />
              <span className="text-xs text-gray-500">Avg. usage</span>
              <Info size={12} className="text-gray-300 cursor-help" />
              <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <p className="font-medium mb-1">Average Usage Rate</p>
                <p className="text-gray-300">Accounts for the fact that most customers don't use 100% of their allocated resources. Lower values mean lower actual costs per customer.</p>
              </div>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={utilizationRate}
              onChange={(e) => setUtilizationRate(Number(e.target.value))}
              className="w-24 accent-[#253ff6]"
            />
            <span className="text-sm font-mono text-gray-600 w-10">{(utilizationRate * 100).toFixed(0)}%</span>
          </div>
        )}
      </div>

      {/* Main Results */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        {/* COGS Result */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-500 text-sm">Your cost per customer / month</p>
            {showRealisticUsage && (
              <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded">
                @ {(utilizationRate * 100).toFixed(0)}% utilization
              </span>
            )}
          </div>
          <p className="text-5xl font-semibold text-gray-900 tracking-tight">
            MYR {displayCosts.totalCOGS.toFixed(2)}
          </p>

          {/* Breakdown bar */}
          <div className="mt-6">
            <div className="relative h-1.5 rounded-full overflow-hidden bg-gray-100">
              <div
                className="absolute left-0 top-0 h-full bg-[#253ff6] transition-all duration-500"
                style={{ width: `${displayCosts.totalCOGS > 0 ? (displayCosts.variableTotal / displayCosts.totalCOGS) * 100 : 0}%` }}
              />
              <div
                className="absolute top-0 h-full bg-[#253ff6]/30 transition-all duration-500"
                style={{
                  left: `${displayCosts.totalCOGS > 0 ? (displayCosts.variableTotal / displayCosts.totalCOGS) * 100 : 0}%`,
                  width: `${displayCosts.totalCOGS > 0 ? (displayCosts.fixedPerCustomer / displayCosts.totalCOGS) * 100 : 0}%`
                }}
              />
            </div>
            <div className="flex justify-between mt-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#253ff6]" />
                <span className="text-gray-400">Variable</span>
                <span className="font-medium text-gray-900">MYR {displayCosts.variableTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#253ff6]/30" />
                <span className="text-gray-400">Fixed (÷{customerCount})</span>
                <span className="font-medium text-gray-900">MYR {displayCosts.fixedPerCustomer.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Margin */}
        <div className={`rounded-lg p-6 border ${marginStyle.bg} border-gray-200`}>
          <p className="text-gray-500 text-sm mb-2">Margin at MYR {selectedPrice}</p>
          <p className={`text-5xl font-semibold tracking-tight ${marginStyle.text}`}>
            {displayMargin.toFixed(0)}%
          </p>
          <div className="mt-6">
            <div className="relative h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-[#253ff6] transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(100, displayMargin))}%` }}
              />
              <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-gray-400 rounded-full" style={{ left: '70%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 mt-2">
              <span>0%</span>
              <span className="text-gray-500 font-medium">70%</span>
              <span>100%</span>
            </div>
          </div>
          <p className={`text-sm mt-4 ${marginStyle.text}`}>
            {displayProfit >= 0 ? '+' : ''}MYR {displayProfit.toFixed(2)} profit/customer
          </p>
        </div>
      </div>

      {/* Editable Costs */}
      <div className="grid grid-cols-3 gap-5">
        {/* Variable Costs */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Variable Costs</h3>
              <p className="text-xs text-gray-500">Costs that scale with usage (per customer/month)</p>
            </div>
            <button
              onClick={addVariableCost}
              className="flex items-center gap-1 text-xs text-[#253ff6] hover:text-[#1a2eb8] transition-colors"
            >
              <Plus size={14} />
              Add item
            </button>
          </div>

          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-[10px] text-gray-500 uppercase tracking-wide px-2">
              <div className="col-span-3">Cost item</div>
              <div className="col-span-2 text-right">Usage</div>
              <div className="col-span-2">Unit</div>
              <div className="col-span-2 text-right">Cost/unit</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-1"></div>
            </div>

            {variableCosts.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center py-2 px-2 bg-gray-50 rounded group">
                <div className="col-span-3">
                  {editingItem === item.id ? (
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateVariableCost(item.id, 'name', e.target.value)}
                      onBlur={() => setEditingItem(null)}
                      autoFocus
                      className="w-full text-sm bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#253ff6]"
                    />
                  ) : (
                    <button
                      onClick={() => setEditingItem(item.id)}
                      className="text-sm text-gray-700 hover:text-[#253ff6] text-left flex items-center gap-1"
                    >
                      {item.name}
                      <PencilSimple size={10} className="opacity-0 group-hover:opacity-50" />
                    </button>
                  )}
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    value={item.usagePerCustomer}
                    onChange={(e) => updateVariableCost(item.id, 'usagePerCustomer', Number(e.target.value))}
                    className="w-full text-sm text-right bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#253ff6]"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={item.unit}
                    onChange={(e) => updateVariableCost(item.id, 'unit', e.target.value)}
                    className="w-full text-xs text-gray-500 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#253ff6] focus:outline-none px-1 py-1"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    step="0.001"
                    value={item.costPerUnit}
                    onChange={(e) => updateVariableCost(item.id, 'costPerUnit', Number(e.target.value))}
                    className="w-full text-sm text-right font-mono bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#253ff6]"
                  />
                </div>
                <div className="col-span-2 text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {(item.costPerUnit * item.usagePerCustomer).toFixed(2)}
                  </span>
                </div>
                <div className="col-span-1 text-right">
                  <button
                    onClick={() => removeVariableCost(item.id)}
                    className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-200 px-2">
              <span className="text-sm font-medium text-gray-700">
                Total variable per customer
                {showRealisticUsage && <span className="text-xs text-gray-500 ml-1">@ {(utilizationRate * 100).toFixed(0)}%</span>}
              </span>
              <span className="text-sm font-semibold text-[#253ff6]">MYR {displayCosts.variableTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right column: Fixed + Price */}
        <div className="space-y-5">
          {/* Fixed Costs */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Fixed Costs</h3>
                <p className="text-xs text-gray-500">Monthly infrastructure</p>
              </div>
              <button
                onClick={addFixedCost}
                className="flex items-center gap-1 text-xs text-[#253ff6] hover:text-[#1a2eb8]"
              >
                <Plus size={12} />
                Add
              </button>
            </div>

            <div className="space-y-1.5">
              {fixedCosts.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-1 group">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateFixedCost(item.id, 'name', e.target.value)}
                    className="text-xs text-gray-600 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#253ff6] focus:outline-none flex-1 mr-2"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={item.monthlyCost}
                      onChange={(e) => updateFixedCost(item.id, 'monthlyCost', Number(e.target.value))}
                      className="w-16 text-xs text-right font-mono bg-gray-50 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#253ff6]"
                    />
                    <button
                      onClick={() => removeFixedCost(item.id)}
                      className="p-0.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">Total monthly</span>
              <span className="text-sm font-medium text-gray-900">MYR {costs.fixedTotal.toFixed(2)}</span>
            </div>

            {/* Customer count */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Customers</span>
                <span className="text-sm font-medium text-gray-900">{customerCount}</span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={customerCount}
                onChange={(e) => setCustomerCount(Number(e.target.value))}
                className="w-full h-1 bg-gray-100 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-400 [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <p className="text-[10px] text-gray-500 mt-1">Fixed ÷ customers = MYR {costs.fixedPerCustomer.toFixed(2)}/ea</p>
            </div>
          </div>

          {/* Price Points */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Price Point</h3>
            <div className="space-y-1">
              {[15, 20, 25, 30, 38, 50, 78, 100].map((price) => {
                const m = ((price - displayCosts.totalCOGS) / price) * 100;
                const style = getMarginStyle(m);
                const isSelected = price === selectedPrice;

                return (
                  <button
                    key={price}
                    onClick={() => setSelectedPrice(price)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded transition-all ${
                      isSelected ? 'bg-gray-900 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : style.dot}`} />
                      <span className="font-mono text-sm">MYR {price}</span>
                    </div>
                    <span className={`text-sm font-medium ${isSelected ? 'text-white' : style.text}`}>
                      {m.toFixed(0)}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Formula */}
      <div className="mt-5 p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-500">
        <span className="font-medium text-gray-700">Formula:</span>{' '}
        <span className="font-mono">COGS = Σ(usage × cost{showRealisticUsage ? ` × ${(utilizationRate * 100).toFixed(0)}%` : ''}) + (fixed ÷ customers)</span>{' '}
        = {displayCosts.variableTotal.toFixed(2)} + ({displayCosts.fixedTotal.toFixed(0)} ÷ {customerCount}){' '}
        = <strong className="text-gray-900">MYR {displayCosts.totalCOGS.toFixed(2)}</strong>
      </div>
    </div>
  );
}
