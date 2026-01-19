import { useState, lazy, Suspense } from 'react';
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
import { NavigationProvider, useNavigation, type Tab } from './context/NavigationContext';
import { ToastContainer } from './components/shared';
import { Logo } from './components/brand';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SkeletonPage } from './components/shared/Skeleton';

// Lazy-loaded components for code splitting (reduces initial bundle size)
const FeatureInventory = lazy(() => import('./components/FeatureInventory').then(m => ({ default: m.FeatureInventory })));
const COGSCalculator = lazy(() => import('./components/COGSCalculator').then(m => ({ default: m.COGSCalculator })));
const TierConfigurator = lazy(() => import('./components/TierConfigurator').then(m => ({ default: m.TierConfigurator })));
const PricingCalculator = lazy(() => import('./components/PricingCalculator').then(m => ({ default: m.PricingCalculator })));
const PricingMockup = lazy(() => import('./components/PricingMockup').then(m => ({ default: m.PricingMockup })));
const CodebaseAnalyzer = lazy(() => import('./components/CodebaseAnalyzer').then(m => ({ default: m.CodebaseAnalyzer })));
const ReportGenerator = lazy(() => import('./components/ReportGenerator').then(m => ({ default: m.ReportGenerator })));
const ReportPage = lazy(() => import('./components/ReportPage').then(m => ({ default: m.ReportPage })));

// Loading fallback with skeleton
function LoadingFallback() {
  return (
    <div className="p-6" role="status" aria-label="Loading content">
      <SkeletonPage />
    </div>
  );
}

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
  const { activeTab, navigateTo } = useNavigation();
  const { toasts, dismissToast } = usePricing();
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
          <Logo
            size={sidebarHovered ? 'md' : 'sm'}
            variant={sidebarHovered ? 'full' : 'icon'}
            animated={sidebarHovered}
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => navigateTo(tab.id)}
                    className={`w-full flex items-center gap-3 rounded-[0.2rem] transition-all duration-200 ${
                      sidebarHovered ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center'
                    } ${
                      activeTab === tab.id
                        ? 'bg-brand-subtle text-brand-primary'
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
            className={`w-full flex items-center gap-3 rounded-[0.2rem] transition-all duration-200 bg-brand-primary text-white hover:bg-[#1d4ed8] ${
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              {activeTab === 'overview' && <OverviewDashboard onNavigate={navigateTo} />}
              {activeTab === 'analyze' && <CodebaseAnalyzer />}
              {activeTab === 'features' && <FeatureInventory />}
              {activeTab === 'cogs' && <COGSCalculator />}
              {activeTab === 'tiers' && <TierConfigurator />}
              {activeTab === 'pricing' && <PricingCalculator />}
              {activeTab === 'mockup' && <PricingMockup />}
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>

      {/* Report Generator Dialog */}
      <Suspense fallback={null}>
        <ReportGenerator
          isOpen={reportGeneratorOpen}
          onClose={() => setReportGeneratorOpen(false)}
        />
      </Suspense>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <PricingProvider>
        <NavigationProvider>
          <Routes>
            <Route path="/" element={<MainApp />} />
            {/* Short link format: /r/{id}/{stakeholder} */}
            <Route path="/r/:id/:stakeholder" element={
              <Suspense fallback={<LoadingFallback />}>
                <ReportPage />
              </Suspense>
            } />
            {/* Portable link format: /report/{stakeholder}?d={compressed} */}
            <Route path="/report/:stakeholder" element={
              <Suspense fallback={<LoadingFallback />}>
                <ReportPage />
              </Suspense>
            } />
            {/* Legacy format (backwards compatibility) */}
            <Route path="/report/:data/:stakeholder" element={
              <Suspense fallback={<LoadingFallback />}>
                <ReportPage />
              </Suspense>
            } />
          </Routes>
        </NavigationProvider>
      </PricingProvider>
    </BrowserRouter>
  );
}

function OverviewDashboard({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const { tiers, costs, variableCosts, fixedCosts, resetToEmpty } = usePricing();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Calculate key metrics from context
  const avgVariableCost = costs.variableTotal;
  // Find the first paid tier (non-zero price) or first active tier
  const paidTier = tiers.find(t => t.monthlyPriceMYR > 0 && t.status === 'active');
  const targetPrice = paidTier?.monthlyPriceMYR ?? 0;
  const grossMargin = targetPrice > 0 ? ((targetPrice - avgVariableCost) / targetPrice) * 100 : 0;

  // Cost items count (variable + fixed)
  const costItemsCount = variableCosts.length + fixedCosts.length;

  // Get active tiers
  const activeTiers = tiers.filter(t => t.status === 'active');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Pricing Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Dashboard for your pricing strategy and key metrics</p>
        </div>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="group flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-all"
        >
          <svg
            className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          <span className="font-medium">Reset</span>
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowResetConfirm(false)}
          />
          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Start Fresh?</h3>
                <p className="text-sm text-gray-500">Clear all data and begin with empty state</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              This will remove all costs, tiers, and features. You'll start with a clean slate.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetToEmpty();
                  setShowResetConfirm(false);
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-l-[3px] border-l-blue-500">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Target Price</p>
            <div className="w-8 h-8 rounded-full bg-brand-subtle flex items-center justify-center">
              <TrendUp size={16} weight="duotone" className="text-brand-primary" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900 mt-2 font-mono tracking-tight">
            MYR {targetPrice}
          </p>
          <p className="text-xs text-gray-400 mt-1">{paidTier?.name ?? 'No paid tier'} / month</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tools Navigation */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="font-medium text-gray-900 mb-4">Tools</h3>
          <div className="space-y-1">
            {[
              { id: 'analyze' as Tab, label: 'Codebase Analyzer', sub: 'Import features from GitHub', icon: GithubLogo, borderColor: 'border-l-gray-400' },
              { id: 'features' as Tab, label: 'Feature Inventory', sub: 'Browse and categorize all features', icon: Package, borderColor: 'border-l-blue-500' },
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
                      <p className="text-sm font-medium text-gray-900 group-hover:text-brand-primary transition-colors">
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-400">{item.sub}</p>
                    </div>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-gray-300 group-hover:text-brand-primary group-hover:translate-x-1 transition-all"
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
              className="text-xs text-brand-primary hover:underline"
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
                      <span className="text-[10px] bg-brand-subtle text-brand-primary px-1.5 py-0.5 rounded-[0.2rem] font-medium">
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
              className="group w-full flex items-center gap-3 p-3 rounded-[0.2rem] bg-gray-900 hover:bg-brand-primary transition-colors"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
