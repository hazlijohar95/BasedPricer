import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  House,
  Package,
  CurrencyDollar,
  Stack,
  Calculator,
  Browser,
  ArrowRight,
  GithubLogo,
  TrendUp,
  Percent,
  ChartLine,
  Lightning,
  Eye,
  Link,
} from '@phosphor-icons/react';
import { PricingProvider, usePricing } from './context/PricingContext';
import { FeatureInventory } from './components/FeatureInventory';
import { COGSCalculator } from './components/COGSCalculator';
import { TierConfigurator } from './components/TierConfigurator';
import { PricingCalculator } from './components/PricingCalculator';
import { PricingMockup } from './components/PricingMockup';
import { CodebaseAnalyzer } from './components/CodebaseAnalyzer';
import { ReportGenerator } from './components/ReportGenerator';
import { ReportPage } from './components/ReportPage';

type Tab = 'overview' | 'analyze' | 'features' | 'cogs' | 'tiers' | 'pricing' | 'mockup';

const tabs: { id: Tab; label: string; icon: typeof House }[] = [
  { id: 'overview', label: 'Overview', icon: House },
  { id: 'analyze', label: 'Analyze', icon: GithubLogo },
  { id: 'features', label: 'Features', icon: Package },
  { id: 'cogs', label: 'COGS', icon: CurrencyDollar },
  { id: 'tiers', label: 'Tiers', icon: Stack },
  { id: 'pricing', label: 'Calculator', icon: Calculator },
  { id: 'mockup', label: 'Mockup', icon: Browser },
];

function MainApp() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [reportGeneratorOpen, setReportGeneratorOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      <aside
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
        className={`fixed left-0 top-0 h-full bg-white border-r border-[#e4e4e4] z-50 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarHovered ? 'w-56' : 'w-16'
        }`}
      >
        {/* Logo */}
        <div className={`border-b border-[#e4e4e4] transition-all duration-300 ${sidebarHovered ? 'p-4' : 'p-3'}`}>
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center bg-[#253ff6] text-white rounded-lg transition-all duration-300 ${sidebarHovered ? 'w-8 h-8' : 'w-9 h-9'} flex-shrink-0`}>
              <Calculator size={sidebarHovered ? 18 : 20} weight="bold" />
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${sidebarHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
              <h1 className="font-semibold text-gray-900 text-sm whitespace-nowrap">Pricing Tools</h1>
              <p className="text-xs text-gray-400 whitespace-nowrap">SaaS Calculator</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 rounded-[0.2rem] transition-all duration-200 ${
                      sidebarHovered ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center'
                    } ${
                      activeTab === tab.id
                        ? 'bg-[rgba(37,63,246,0.08)] text-[#253ff6]'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                  >
                    <Icon size={20} weight="duotone" className="flex-shrink-0" />
                    <span className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
                      sidebarHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0'
                    }`}>
                      {tab.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Generate Reports Button */}
        <div className={`border-t border-[#e4e4e4] transition-all duration-300 ${sidebarHovered ? 'p-3' : 'p-2'}`}>
          <button
            onClick={() => setReportGeneratorOpen(true)}
            className={`w-full flex items-center gap-3 rounded-[0.2rem] transition-all duration-200 bg-[#253ff6] text-white hover:bg-[#1a2eb8] ${
              sidebarHovered ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center'
            }`}
          >
            <Link size={20} weight="bold" className="flex-shrink-0" />
            <span className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
              sidebarHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0'
            }`}>
              Generate Reports
            </span>
          </button>
        </div>

      </aside>

      {/* Main Content */}
      <main className={`min-h-screen transition-all duration-300 ease-in-out ${sidebarHovered ? 'ml-56' : 'ml-16'}`}>
        <div className="max-w-6xl mx-auto px-8 py-8">
          {activeTab === 'overview' && <OverviewDashboard onNavigate={setActiveTab} />}
          {activeTab === 'analyze' && <CodebaseAnalyzer />}
          {activeTab === 'features' && <FeatureInventory />}
          {activeTab === 'cogs' && <COGSCalculator />}
          {activeTab === 'tiers' && <TierConfigurator />}
          {activeTab === 'pricing' && <PricingCalculator />}
          {activeTab === 'mockup' && <PricingMockup />}
        </div>
      </main>

      {/* Report Generator Dialog */}
      <ReportGenerator
        isOpen={reportGeneratorOpen}
        onClose={() => setReportGeneratorOpen(false)}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <PricingProvider>
        <Routes>
          <Route path="/" element={<MainApp />} />
          {/* Short link format: /r/{id}/{stakeholder} */}
          <Route path="/r/:id/:stakeholder" element={<ReportPage />} />
          {/* Portable link format: /report/{stakeholder}?d={compressed} */}
          <Route path="/report/:stakeholder" element={<ReportPage />} />
          {/* Legacy format (backwards compatibility) */}
          <Route path="/report/:data/:stakeholder" element={<ReportPage />} />
        </Routes>
      </PricingProvider>
    </BrowserRouter>
  );
}

function OverviewDashboard({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const { tiers, costs, variableCosts, fixedCosts } = usePricing();

  // Calculate key metrics from context
  const avgVariableCost = costs.variableTotal;
  const basicTier = tiers.find(t => t.id === 'basic');
  const basicPrice = basicTier?.monthlyPriceMYR ?? 25;
  const grossMargin = basicPrice > 0 ? ((basicPrice - avgVariableCost) / basicPrice) * 100 : 0;

  // Cost items count (variable + fixed)
  const costItemsCount = variableCosts.length + fixedCosts.length;

  // Get active tiers
  const activeTiers = tiers.filter(t => t.status === 'active');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Pricing Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Dashboard for your pricing strategy and key metrics</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-5 border-l-[3px] border-l-[#253ff6]">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Target Price</p>
            <div className="w-8 h-8 rounded-full bg-[rgba(37,63,246,0.08)] flex items-center justify-center">
              <TrendUp size={16} weight="duotone" className="text-[#253ff6]" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900 mt-2 font-mono tracking-tight">
            MYR {basicPrice}
          </p>
          <p className="text-xs text-gray-400 mt-1">Basic tier / month</p>
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
          <p className="text-xs text-gray-400 mt-1">At target price</p>
        </div>

        <div className="card p-5 border-l-[3px] border-l-violet-500">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Est. COGS</p>
            <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center">
              <ChartLine size={16} weight="duotone" className="text-violet-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900 mt-2 font-mono tracking-tight">
            MYR {avgVariableCost.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Variable cost / customer</p>
        </div>

        <div className="card p-5 border-l-[3px] border-l-amber-500">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Cost Items</p>
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
              <Lightning size={16} weight="duotone" className="text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900 mt-2">
            {costItemsCount}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {variableCosts.length} variable, {fixedCosts.length} fixed
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Tools Navigation */}
        <div className="col-span-2 card p-6">
          <h3 className="font-medium text-gray-900 mb-4">Tools</h3>
          <div className="space-y-1">
            {[
              { id: 'analyze' as Tab, label: 'Codebase Analyzer', sub: 'Import features from GitHub', icon: GithubLogo, borderColor: 'border-l-gray-400' },
              { id: 'features' as Tab, label: 'Feature Inventory', sub: 'Browse and categorize all features', icon: Package, borderColor: 'border-l-[#253ff6]' },
              { id: 'cogs' as Tab, label: 'COGS Calculator', sub: 'Analyze variable and fixed costs', icon: CurrencyDollar, borderColor: 'border-l-emerald-500' },
              { id: 'tiers' as Tab, label: 'Tier Configurator', sub: 'Set limits and feature access', icon: Stack, borderColor: 'border-l-violet-500' },
              { id: 'pricing' as Tab, label: 'Pricing Calculator', sub: 'Model revenue and unit economics', icon: Calculator, borderColor: 'border-l-amber-500' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`group w-full flex items-center justify-between p-4 rounded-[0.2rem] border-l-[3px] ${item.borderColor} bg-gray-50/50 hover:bg-gray-100/80 transition-colors text-left`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-white border border-[#e4e4e4] flex items-center justify-center">
                      <Icon size={18} weight="duotone" className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-[#253ff6] transition-colors">
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-400">{item.sub}</p>
                    </div>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-gray-300 group-hover:text-[#253ff6] group-hover:translate-x-1 transition-all"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Tiers Panel */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Tiers</h3>
            <button
              onClick={() => onNavigate('tiers')}
              className="text-xs text-[#253ff6] hover:underline"
            >
              Configure
            </button>
          </div>
          <div className="space-y-3">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={`p-3 rounded-[0.2rem] border transition-colors ${
                  tier.status === 'active'
                    ? 'bg-white border-[#e4e4e4]'
                    : 'bg-gray-50 border-gray-100 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${tier.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span className="text-sm font-medium text-gray-900">{tier.name}</span>
                    {tier.id === 'basic' && (
                      <span className="text-[10px] bg-[rgba(37,63,246,0.08)] text-[#253ff6] px-1.5 py-0.5 rounded-[0.2rem] font-medium">
                        Target
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-mono text-gray-600">
                    {tier.monthlyPriceMYR === 0 ? 'Free' : `MYR ${tier.monthlyPriceMYR}`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-4 border-t border-[#e4e4e4]">
            <button
              onClick={() => onNavigate('mockup')}
              className="group w-full flex items-center gap-3 p-3 rounded-[0.2rem] bg-gray-900 hover:bg-[#253ff6] transition-colors"
            >
              <Eye size={18} weight="bold" className="text-white" />
              <div className="text-left">
                <p className="text-sm font-medium text-white">Preview Pricing Page</p>
                <p className="text-xs text-gray-400">See customer view</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Cost Summary */}
      <div className="card p-6">
        <h3 className="font-medium text-gray-900 mb-4">Cost Summary</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-[0.2rem] border border-[#e4e4e4]">
            <p className="text-sm text-gray-500">Variable Costs</p>
            <p className="text-xl font-semibold text-gray-900 font-mono mt-1">
              MYR {costs.variableTotal.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Per customer / month</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-[0.2rem] border border-[#e4e4e4]">
            <p className="text-sm text-gray-500">Fixed Costs</p>
            <p className="text-xl font-semibold text-gray-900 font-mono mt-1">
              MYR {costs.fixedTotal.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Total monthly</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-[0.2rem] border border-[#e4e4e4]">
            <p className="text-sm text-gray-500">Active Tiers</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">{activeTiers.length}</p>
            <p className="text-xs text-gray-400 mt-1">of {tiers.length} configured</p>
          </div>
          <div className={`p-4 rounded-[0.2rem] border ${
            grossMargin >= 70
              ? 'bg-emerald-50 border-emerald-200'
              : grossMargin >= 50
              ? 'bg-amber-50 border-amber-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <p className={`text-sm ${
              grossMargin >= 70 ? 'text-emerald-600' :
              grossMargin >= 50 ? 'text-amber-600' :
              'text-red-600'
            }`}>Health Status</p>
            <p className={`text-xl font-semibold mt-1 ${
              grossMargin >= 70 ? 'text-emerald-700' :
              grossMargin >= 50 ? 'text-amber-700' :
              'text-red-700'
            }`}>
              {grossMargin >= 70 ? 'Healthy' : grossMargin >= 50 ? 'Acceptable' : 'Review Needed'}
            </p>
            <p className={`text-xs mt-1 ${
              grossMargin >= 70 ? 'text-emerald-500' :
              grossMargin >= 50 ? 'text-amber-500' :
              'text-red-500'
            }`}>
              {grossMargin >= 70 ? '≥70% margin' : grossMargin >= 50 ? '50-70% margin' : '<50% margin'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
