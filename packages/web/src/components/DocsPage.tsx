import { useState, useCallback, memo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  House,
  GithubLogo,
  Package,
  CurrencyDollar,
  Stack,
  Calculator,
  Browser,
  Lightning,
  ChartLine,
  Users,
  Percent,
  ArrowsClockwise,
  Database,
  Question,
  CheckCircle,
  Lightbulb,
  Code,
  Gear,
  Sparkle,
  Rocket,
  CaretRight,
  List,
  X,
  ArrowUpRight,
  Copy,
  Check,
} from '@phosphor-icons/react';
import { Logo } from './brand';
import { useEscapeKey } from '../hooks';

// ============================================================================
// Types
// ============================================================================

interface NavItem {
  id: string;
  label: string;
  icon: typeof House;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface TocItem {
  id: string;
  label: string;
}

// ============================================================================
// Navigation Structure
// ============================================================================

const navSections: NavSection[] = [
  {
    title: 'Getting Started',
    items: [
      { id: 'overview', label: 'Overview', icon: House },
      { id: 'quickstart', label: 'Quickstart', icon: Rocket },
      { id: 'core-concepts', label: 'Core Concepts', icon: Lightbulb },
    ],
  },
  {
    title: 'Tools',
    items: [
      { id: 'codebase-analyzer', label: 'Codebase Analyzer', icon: GithubLogo },
      { id: 'feature-inventory', label: 'Feature Inventory', icon: Package },
      { id: 'cogs-calculator', label: 'COGS Calculator', icon: CurrencyDollar },
      { id: 'tier-configurator', label: 'Tier Configurator', icon: Stack },
      { id: 'pricing-calculator', label: 'Pricing Calculator', icon: Calculator },
      { id: 'pricing-mockup', label: 'Pricing Mockup', icon: Browser },
    ],
  },
  {
    title: 'Concepts',
    items: [
      { id: 'gross-margin', label: 'Gross Margin', icon: Percent },
      { id: 'cogs', label: 'COGS', icon: ChartLine },
      { id: 'unit-economics', label: 'Unit Economics', icon: Users },
      { id: 'pricing-strategies', label: 'Pricing Strategies', icon: Gear },
    ],
  },
  {
    title: 'Resources',
    items: [
      { id: 'faq', label: 'FAQ', icon: Question },
    ],
  },
];

const tocByPage: Record<string, TocItem[]> = {
  overview: [
    { id: 'what-is-basedpricer', label: 'What is BasedPricer?' },
    { id: 'the-problem', label: 'The Problem' },
    { id: 'who-is-this-for', label: 'Who is this for?' },
    { id: 'get-started', label: 'Get Started' },
  ],
  quickstart: [
    { id: 'step-1', label: '1. Import Features' },
    { id: 'step-2', label: '2. Add Costs' },
    { id: 'step-3', label: '3. Configure Tiers' },
    { id: 'step-4', label: '4. Calculate Pricing' },
    { id: 'step-5', label: '5. Preview & Share' },
  ],
  'core-concepts': [
    { id: 'pricing-workflow', label: 'Pricing Workflow' },
    { id: 'data-flow', label: 'Data Flow' },
    { id: 'local-storage', label: 'Local Storage' },
  ],
  'gross-margin': [
    { id: 'what-is-margin', label: 'What is Gross Margin?' },
    { id: 'margin-thresholds', label: 'Margin Thresholds' },
    { id: 'why-70-percent', label: 'Why 70%?' },
  ],
  cogs: [
    { id: 'what-is-cogs', label: 'What is COGS?' },
    { id: 'variable-costs', label: 'Variable Costs' },
    { id: 'fixed-costs', label: 'Fixed Costs' },
    { id: 'calculating', label: 'Putting it together' },
  ],
  faq: [
    { id: 'why', label: 'Why BasedPricer?' },
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'data-privacy', label: 'Data & Privacy' },
    { id: 'features', label: 'Features & Limitations' },
  ],
};

// ============================================================================
// Reusable Components
// ============================================================================

const LinkCard = memo(function LinkCard({
  title,
  description,
  href,
  onClick,
  external = false,
}: {
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  external?: boolean;
}) {
  const content = (
    <div className="group relative p-4 sm:p-5 bg-white border border-gray-200/80 rounded-xl hover:border-gray-300 active:border-gray-400 hover:shadow-sm active:shadow-none transition-all duration-200 cursor-pointer overflow-hidden touch-manipulation">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200" />
      <div className="relative">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-2">
          <h4 className="font-semibold text-[14px] sm:text-[15px] text-gray-900 group-hover:text-brand-primary group-active:text-brand-primary transition-colors duration-200">
            {title}
          </h4>
          {external ? (
            <ArrowUpRight size={16} className="text-gray-400 group-hover:text-brand-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 flex-shrink-0" />
          ) : (
            <CaretRight size={16} className="text-gray-400 group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
          )}
        </div>
        <p className="text-[12px] sm:text-[13px] text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );

  if (href) {
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="block">
          {content}
        </a>
      );
    }
    return <Link to={href} className="block">{content}</Link>;
  }

  return <button onClick={onClick} className="w-full text-left">{content}</button>;
});

const Callout = memo(function Callout({
  type = 'info',
  title,
  children,
}: {
  type?: 'info' | 'tip' | 'warning';
  title?: string;
  children: React.ReactNode;
}) {
  const styles = {
    info: {
      container: 'bg-blue-50/70 border-blue-200/60',
      icon: 'text-blue-500',
      title: 'text-blue-900',
      text: 'text-blue-800/90',
    },
    tip: {
      container: 'bg-emerald-50/70 border-emerald-200/60',
      icon: 'text-emerald-500',
      title: 'text-emerald-900',
      text: 'text-emerald-800/90',
    },
    warning: {
      container: 'bg-amber-50/70 border-amber-200/60',
      icon: 'text-amber-500',
      title: 'text-amber-900',
      text: 'text-amber-800/90',
    },
  };

  const icons = {
    info: Lightbulb,
    tip: CheckCircle,
    warning: Lightbulb,
  };

  const style = styles[type];
  const Icon = icons[type];

  return (
    <div className={`${style.container} border rounded-xl p-4 flex gap-3`}>
      <Icon size={18} weight="duotone" className={`${style.icon} flex-shrink-0 mt-0.5`} />
      <div className="min-w-0">
        {title && <p className={`font-medium text-[13px] ${style.title} mb-1`}>{title}</p>}
        <div className={`text-[13px] ${style.text} leading-relaxed`}>{children}</div>
      </div>
    </div>
  );
});

const CodeBlock = memo(function CodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const text = typeof children === 'string' ? children : '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [children]);

  return (
    <div className="group relative">
      <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <Check size={14} className="text-emerald-400" />
          ) : (
            <Copy size={14} className="text-gray-400" />
          )}
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 text-[13px] font-mono leading-relaxed overflow-x-auto">
        {children}
      </pre>
    </div>
  );
});

const SectionTitle = memo(function SectionTitle({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="group text-[18px] sm:text-[20px] font-semibold text-gray-900 mb-3 sm:mb-4 scroll-mt-20 sm:scroll-mt-24 flex items-center gap-2"
    >
      {children}
      <a
        href={`#${id}`}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-brand-primary touch-manipulation"
        aria-label="Link to this section"
      >
        #
      </a>
    </h2>
  );
});

const Prose = memo(function Prose({ children }: { children: React.ReactNode }) {
  return <p className="text-[14px] sm:text-[15px] text-gray-600 leading-[1.7] mb-4">{children}</p>;
});

const LeadText = memo(function LeadText({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] sm:text-[17px] text-gray-600 leading-[1.7] mb-6 sm:mb-8">{children}</p>;
});

// ============================================================================
// Page Content Components
// ============================================================================

interface PageProps {
  onNavigate: (id: string) => void;
}

const OverviewPage = memo(function OverviewPage({ onNavigate }: PageProps) {
  return (
    <div className="space-y-10">
      <LeadText>
        BasedPricer is a pricing strategy tool for SaaS founders. It helps you analyze your costs,
        organize features into tiers, and calculate optimal pricing based on actual data rather than guesswork.
      </LeadText>

      <section>
        <SectionTitle id="what-is-basedpricer">What is BasedPricer?</SectionTitle>
        <Prose>
          BasedPricer provides a complete pricing analysis workflow, letting you understand your true costs
          and set prices that ensure healthy margins. By consolidating your cost data and feature inventory,
          it creates a single source of truth for all pricing decisions.
        </Prose>
      </section>

      <section>
        <SectionTitle id="the-problem">The Problem</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-gradient-to-br from-red-50 to-red-50/30 rounded-xl border border-red-100/80">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                <X size={12} weight="bold" className="text-red-600" />
              </div>
              <span className="font-semibold text-[14px] text-red-900">Without BasedPricer</span>
            </div>
            <ul className="space-y-2">
              {[
                '"Let\'s just charge $29 like everyone else"',
                'Hidden costs eating into margins',
                'No idea which features are profitable',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-red-800/90">
                  <span className="w-1 h-1 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-50/30 rounded-xl border border-emerald-100/80">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check size={12} weight="bold" className="text-emerald-600" />
              </div>
              <span className="font-semibold text-[14px] text-emerald-900">With BasedPricer</span>
            </div>
            <ul className="space-y-2">
              {[
                'Pricing based on actual COGS analysis',
                'Every cost item tracked and allocated',
                'Data-driven tier recommendations',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-emerald-800/90">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle id="who-is-this-for">Who is this for?</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Code, label: 'Indie Hackers', desc: 'Building your first SaaS' },
            { icon: Lightning, label: 'Founders', desc: 'Validating pricing' },
            { icon: Gear, label: 'Product Managers', desc: 'Feature economics' },
            { icon: ChartLine, label: 'Finance Teams', desc: 'Unit economics' },
          ].map((item) => (
            <div
              key={item.label}
              className="group p-4 bg-gray-50/70 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all duration-200"
            >
              <div className="w-9 h-9 rounded-lg bg-white border border-gray-200/80 flex items-center justify-center mb-3 group-hover:border-gray-300 group-hover:shadow-sm transition-all duration-200">
                <item.icon size={18} weight="duotone" className="text-gray-600" />
              </div>
              <p className="font-semibold text-[14px] text-gray-900 mb-0.5">{item.label}</p>
              <p className="text-[12px] text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle id="get-started">Get Started</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LinkCard
            title="Quickstart Guide"
            description="Get up and running in 5 minutes with this step-by-step guide"
            onClick={() => onNavigate('quickstart')}
          />
          <LinkCard
            title="Core Concepts"
            description="Understand the pricing workflow and how data flows through the app"
            onClick={() => onNavigate('core-concepts')}
          />
        </div>
      </section>
    </div>
  );
});

const QuickstartPage = memo(function QuickstartPage(_props: PageProps) {
  return (
    <div className="space-y-10">
      <LeadText>
        Get up and running with BasedPricer in 5 simple steps. This guide walks you through
        the complete workflow from importing features to previewing your pricing page.
      </LeadText>

      <section>
        <SectionTitle id="step-1">1. Import Your Features</SectionTitle>
        <Prose>
          Start by importing features from your codebase or adding them manually. The feature
          inventory is the foundation of your pricing strategy.
        </Prose>
        <Callout type="tip" title="Pro tip">
          Connect your GitHub repository to auto-detect features using AI analysis. This saves
          hours of manual work and ensures you don't miss any features.
        </Callout>
      </section>

      <section>
        <SectionTitle id="step-2">2. Add Your Costs</SectionTitle>
        <Prose>
          Define your variable costs (per-customer) and fixed costs (monthly overhead).
          Understanding your cost structure is essential for setting profitable prices.
        </Prose>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100/80">
            <p className="font-semibold text-[14px] text-blue-900 mb-1">Variable Costs</p>
            <p className="text-[12px] text-blue-700/80">AI APIs, storage, emails, payment fees</p>
          </div>
          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100/80">
            <p className="font-semibold text-[14px] text-emerald-900 mb-1">Fixed Costs</p>
            <p className="text-[12px] text-emerald-700/80">Hosting, tools, subscriptions</p>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle id="step-3">3. Configure Pricing Tiers</SectionTitle>
        <Prose>
          Create pricing tiers (Free, Basic, Pro, Enterprise) and assign features to each.
          Use the tier configurator to set feature access and usage limits.
        </Prose>
      </section>

      <section>
        <SectionTitle id="step-4">4. Calculate Optimal Pricing</SectionTitle>
        <Prose>
          Use the pricing calculator to model different scenarios and see margin impacts in real-time.
        </Prose>
        <CodeBlock>{`# Example calculation
Price:  $49/month
COGS:   $12.50/customer
Margin: 74.5% ✓ Healthy`}</CodeBlock>
      </section>

      <section>
        <SectionTitle id="step-5">5. Preview & Share</SectionTitle>
        <Prose>
          See a live mockup of your pricing page and generate shareable reports for stakeholders.
        </Prose>
        <LinkCard
          title="Open the App"
          description="Start building your pricing strategy now"
          href="/"
        />
      </section>
    </div>
  );
});

const CoreConceptsPage = memo(function CoreConceptsPage(_props: PageProps) {
  return (
    <div className="space-y-10">
      <LeadText>
        Understanding the core concepts behind BasedPricer will help you get the most out of
        the tool and make better pricing decisions.
      </LeadText>

      <section>
        <SectionTitle id="pricing-workflow">Pricing Workflow</SectionTitle>
        <Prose>
          BasedPricer follows a structured workflow to help you build data-driven pricing:
        </Prose>
        <div className="flex flex-wrap items-center gap-2">
          {['Analyze', 'Features', 'COGS', 'Tiers', 'Calculate', 'Preview'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <span className="px-3.5 py-2 bg-gray-100 rounded-lg font-medium text-[13px] text-gray-700 border border-gray-200/50">
                {step}
              </span>
              {i < 5 && <CaretRight size={14} className="text-gray-300" />}
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle id="data-flow">Data Flow</SectionTitle>
        <Prose>
          Data flows through the app in a logical sequence, with each step building on the previous one.
        </Prose>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Database, color: 'blue', label: 'Input', desc: 'Features, costs, counts' },
            { icon: ArrowsClockwise, color: 'violet', label: 'Processing', desc: 'COGS, margins, revenue' },
            { icon: ChartLine, color: 'emerald', label: 'Output', desc: 'Pricing, projections' },
          ].map((item) => {
            const colors: Record<string, string> = {
              blue: 'bg-blue-50/70 border-blue-100/80 text-blue-600',
              violet: 'bg-violet-50/70 border-violet-100/80 text-violet-600',
              emerald: 'bg-emerald-50/70 border-emerald-100/80 text-emerald-600',
            };
            const textColors: Record<string, string> = {
              blue: 'text-blue-900',
              violet: 'text-violet-900',
              emerald: 'text-emerald-900',
            };
            return (
              <div key={item.label} className={`p-4 rounded-xl border ${colors[item.color]}`}>
                <item.icon size={20} className="mb-2" />
                <p className={`font-semibold text-[13px] ${textColors[item.color]}`}>{item.label}</p>
                <p className="text-[11px] opacity-80">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle id="local-storage">Local Storage</SectionTitle>
        <Callout type="info" title="Your data stays private">
          All your data is stored locally in your browser using localStorage. Nothing is sent to any server.
          Your pricing strategy stays completely private.
        </Callout>
      </section>
    </div>
  );
});

const ToolPage = memo(function ToolPage({
  description,
  content,
}: {
  description: string;
  content: React.ReactNode;
}) {
  return (
    <div className="space-y-8">
      <LeadText>{description}</LeadText>
      {content}
    </div>
  );
});

const GrossMarginPage = memo(function GrossMarginPage() {
  return (
    <div className="space-y-10">
      <LeadText>
        Gross margin tells you how much money you actually keep from each sale after paying the costs
        to deliver your service. It's the single most important number for SaaS profitability.
      </LeadText>

      <section>
        <SectionTitle id="what-is-margin">What is Gross Margin?</SectionTitle>
        <Prose>
          Imagine you sell a subscription for $50/month, but it costs you $15 to serve that customer
          (servers, APIs, support). Your gross margin is how much you keep: $35, or 70%.
        </Prose>

        {/* Visual example */}
        <div className="mt-4 p-5 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl border border-gray-200">
          <p className="text-[12px] text-gray-500 text-center mb-4">Simple example</p>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-xl flex items-center justify-center mb-2">
                <span className="text-[24px] font-bold text-blue-700">$50</span>
              </div>
              <p className="text-[12px] text-gray-600">Price</p>
            </div>
            <span className="text-[24px] text-gray-300">−</span>
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-xl flex items-center justify-center mb-2">
                <span className="text-[24px] font-bold text-red-600">$15</span>
              </div>
              <p className="text-[12px] text-gray-600">Costs</p>
            </div>
            <span className="text-[24px] text-gray-300">=</span>
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-xl flex items-center justify-center mb-2">
                <span className="text-[24px] font-bold text-emerald-700">$35</span>
              </div>
              <p className="text-[12px] text-gray-600">Profit (70%)</p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-900 rounded-xl">
          <p className="text-[12px] text-gray-400 mb-2">The formula</p>
          <code className="text-emerald-400 text-[14px]">Gross Margin = (Price - Costs) ÷ Price × 100</code>
        </div>
      </section>

      <section>
        <SectionTitle id="margin-thresholds">What's a good margin?</SectionTitle>
        <Prose>
          Different margins mean different things for your business health. Here's how to interpret yours:
        </Prose>
        <div className="space-y-3 mt-4">
          {[
            {
              color: 'emerald',
              threshold: '70%+',
              label: 'Healthy',
              desc: 'You have plenty of room for growth, marketing, and profit. This is the goal.'
            },
            {
              color: 'amber',
              threshold: '50-70%',
              label: 'Okay',
              desc: 'You\'re profitable but tight. Consider raising prices or cutting costs.'
            },
            {
              color: 'red',
              threshold: 'Below 50%',
              label: 'Danger zone',
              desc: 'You\'re spending too much per customer. Fix this before scaling.'
            },
          ].map((item) => {
            const styles: Record<string, { bg: string; border: string; dot: string }> = {
              emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
              amber: { bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
              red: { bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' },
            };
            const style = styles[item.color];
            return (
              <div key={item.threshold} className={`p-4 rounded-xl border ${style.bg} ${style.border}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-3 h-3 rounded-full ${style.dot}`} />
                  <span className="font-mono font-bold text-[16px] text-gray-900">{item.threshold}</span>
                  <span className="font-semibold text-[14px] text-gray-700">— {item.label}</span>
                </div>
                <p className="text-[13px] text-gray-600 ml-6">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle id="why-70-percent">Why do SaaS companies aim for 70%+?</SectionTitle>
        <Prose>
          After paying your direct costs (COGS), you still have to pay for everything else:
        </Prose>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            { label: 'Engineering salaries', pct: '20-30%' },
            { label: 'Sales & Marketing', pct: '20-40%' },
            { label: 'Admin & Operations', pct: '10-15%' },
            { label: 'Actual profit', pct: '10-20%' },
          ].map((item) => (
            <div key={item.label} className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-[13px] text-gray-700">{item.label}</span>
              <span className="text-[13px] font-mono font-semibold text-gray-900">{item.pct}</span>
            </div>
          ))}
        </div>
        <Callout type="info" title="The math">
          If your gross margin is only 50%, and you spend 30% on salaries and 20% on marketing,
          you're already at break-even with nothing left for profit or growth.
        </Callout>
      </section>
    </div>
  );
});

const COGSPage = memo(function COGSPage() {
  return (
    <div className="space-y-10">
      <LeadText>
        COGS (Cost of Goods Sold) is how much it costs you to serve each customer. If you don't know
        your COGS, you're pricing blind. This page explains it in plain English.
      </LeadText>

      <section>
        <SectionTitle id="what-is-cogs">What is COGS? (The coffee shop analogy)</SectionTitle>
        <Prose>
          Think of a coffee shop. When they sell you a $5 latte, they don't keep all $5. They pay for:
          milk, coffee beans, the cup, and a bit of electricity. That's their "cost of goods sold."
        </Prose>
        <Prose>
          For SaaS, it's the same concept: the direct costs of serving a customer. This includes your
          servers, APIs you call, emails you send, and payment processing fees.
        </Prose>

        {/* Visual analogy */}
        <div className="mt-4 p-5 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-[13px] font-semibold text-amber-900 mb-3">Coffee shop example:</p>
          <div className="grid grid-cols-4 gap-3 text-center text-[12px]">
            <div className="p-3 bg-white rounded-lg">
              <p className="text-amber-700 mb-1">You charge</p>
              <p className="font-bold text-[18px] text-gray-900">$5.00</p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <p className="text-amber-700 mb-1">Coffee + milk</p>
              <p className="font-bold text-[18px] text-gray-900">$0.80</p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <p className="text-amber-700 mb-1">Cup + lid</p>
              <p className="font-bold text-[18px] text-gray-900">$0.30</p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <p className="text-amber-700 mb-1">You keep</p>
              <p className="font-bold text-[18px] text-emerald-600">$3.90</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle id="variable-costs">Variable costs (costs that grow with users)</SectionTitle>
        <Prose>
          These costs increase every time you get a new customer. The more customers, the higher these costs.
        </Prose>

        <div className="mt-4 space-y-3">
          {[
            {
              name: 'AI API calls',
              example: 'OpenAI, Claude, etc.',
              typical: '$0.01 - $0.50 per request',
              why: 'Every time a user uses your AI feature, you pay the AI provider',
            },
            {
              name: 'Cloud storage',
              example: 'AWS S3, Cloudflare R2',
              typical: '$0.02 - $0.10 per GB',
              why: 'Users upload files, you store them, you pay for storage',
            },
            {
              name: 'Transactional emails',
              example: 'SendGrid, Postmark',
              typical: '$0.001 per email',
              why: 'Password resets, notifications, receipts - each email costs money',
            },
            {
              name: 'Payment processing',
              example: 'Stripe, PayPal',
              typical: '2.9% + $0.30 per transaction',
              why: 'When customers pay you, the payment processor takes a cut',
            },
          ].map((item) => (
            <div key={item.name} className="p-4 bg-blue-50/70 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-[14px] text-blue-900">{item.name}</p>
                <span className="text-[12px] font-mono text-blue-600">{item.typical}</span>
              </div>
              <p className="text-[12px] text-blue-700/80 mb-1">{item.example}</p>
              <p className="text-[13px] text-gray-600">{item.why}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle id="fixed-costs">Fixed costs (costs you pay no matter what)</SectionTitle>
        <Prose>
          These costs stay the same whether you have 10 customers or 10,000. They get "spread" across
          all your customers when calculating cost per customer.
        </Prose>

        <div className="mt-4 space-y-3">
          {[
            { name: 'Server hosting', example: 'Vercel, Railway, AWS', typical: '$20 - $200/month' },
            { name: 'Domain & SSL', example: 'Namecheap, Cloudflare', typical: '$10 - $20/month' },
            { name: 'Monitoring', example: 'Sentry, LogRocket', typical: '$20 - $50/month' },
            { name: 'Other tools', example: 'GitHub, Notion, Slack', typical: '$50 - $200/month' },
          ].map((item) => (
            <div key={item.name} className="flex items-center justify-between p-4 bg-emerald-50/70 rounded-xl border border-emerald-100">
              <div>
                <p className="font-semibold text-[14px] text-emerald-900">{item.name}</p>
                <p className="text-[12px] text-emerald-700/80">{item.example}</p>
              </div>
              <span className="text-[13px] font-mono font-semibold text-emerald-700">{item.typical}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle id="calculating">Putting it together</SectionTitle>
        <Prose>
          Your cost per customer = Variable costs + (Fixed costs ÷ Number of customers)
        </Prose>

        <div className="mt-4 p-5 bg-gray-900 rounded-xl text-white">
          <p className="text-[12px] text-gray-400 mb-3">Example calculation:</p>
          <div className="space-y-2 text-[14px] font-mono">
            <div className="flex justify-between">
              <span className="text-gray-400">Variable costs per user:</span>
              <span>$5.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Fixed costs (monthly):</span>
              <span>$200</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Number of customers:</span>
              <span>50</span>
            </div>
            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Fixed per customer:</span>
                <span>$200 ÷ 50 = $4.00</span>
              </div>
            </div>
            <div className="flex justify-between text-emerald-400 font-bold">
              <span>Total COGS per customer:</span>
              <span>$5.00 + $4.00 = $9.00</span>
            </div>
          </div>
        </div>

        <Callout type="tip" title="The magic of scale">
          Notice how fixed costs get cheaper per customer as you grow. With 500 customers instead of 50,
          that $200/month becomes just $0.40 per customer instead of $4.00.
        </Callout>
      </section>
    </div>
  );
});

const UnitEconomicsPage = memo(function UnitEconomicsPage() {
  return (
    <div className="space-y-10">
      <LeadText>
        Unit economics measure the profitability at the individual customer level.
        They help you understand if your business model is sustainable.
      </LeadText>

      <section>
        <SectionTitle id="key-metrics">Key Metrics</SectionTitle>
        <div className="space-y-3">
          {[
            { title: 'Profit per Customer', formula: 'Price - COGS = Your profit for each customer' },
            { title: 'MRR (Monthly Recurring Revenue)', formula: 'Sum of (Customers × Price) across all tiers' },
            { title: 'Gross Profit', formula: 'MRR - Total COGS = Monthly gross profit' },
          ].map((item) => (
            <div key={item.title} className="p-4 bg-white border border-gray-200/80 rounded-xl">
              <p className="font-semibold text-[14px] text-gray-900 mb-1">{item.title}</p>
              <p className="text-[13px] text-gray-500 font-mono">{item.formula}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
});

const PricingStrategiesPage = memo(function PricingStrategiesPage() {
  return (
    <div className="space-y-10">
      <LeadText>
        There are several approaches to setting your SaaS prices. The best strategy depends
        on your market, competition, and the value you provide.
      </LeadText>

      <section>
        <SectionTitle id="cost-plus">Cost-Plus Pricing</SectionTitle>
        <Prose>
          Start with your costs and add a markup. Simple and ensures profitability,
          but may leave money on the table if customers value your product highly.
        </Prose>
        <CodeBlock>Price = COGS × (1 + Markup%)</CodeBlock>
      </section>

      <section>
        <SectionTitle id="value-based">Value-Based Pricing</SectionTitle>
        <Prose>
          Price based on the value delivered to customers, not your costs.
          This often yields higher prices but requires deep customer understanding.
        </Prose>
        <Callout type="tip">
          If your product saves customers $500/month, pricing at $50/month (10% of value) is compelling
          and leaves room for growth.
        </Callout>
      </section>

      <section>
        <SectionTitle id="competitor-based">Competitor-Based Pricing</SectionTitle>
        <Prose>
          Position relative to competitors based on your differentiation and target market.
        </Prose>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Budget', desc: '20% below', color: 'blue' },
            { label: 'Parity', desc: 'Match leader', color: 'gray' },
            { label: 'Premium', desc: '20% above', color: 'violet' },
          ].map((item) => {
            const colors: Record<string, string> = {
              blue: 'bg-blue-50/70 border-blue-100/80',
              gray: 'bg-gray-100/70 border-gray-200/80',
              violet: 'bg-violet-50/70 border-violet-100/80',
            };
            const textColors: Record<string, string> = {
              blue: 'text-blue-900',
              gray: 'text-gray-900',
              violet: 'text-violet-900',
            };
            return (
              <div key={item.label} className={`p-4 rounded-xl border text-center ${colors[item.color]}`}>
                <p className={`font-semibold text-[14px] ${textColors[item.color]}`}>{item.label}</p>
                <p className="text-[12px] opacity-70">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
});

const FAQPage = memo(function FAQPage() {
  const [openId, setOpenId] = useState<string | null>('why-use');

  const faqSections = [
    {
      title: 'Why BasedPricer?',
      id: 'why',
      faqs: [
        {
          id: 'why-use',
          q: 'Why should I use BasedPricer instead of just picking a price?',
          a: 'Most founders pick prices by looking at competitors or guessing. This often leads to underpricing (leaving money on the table) or overpricing (losing customers). BasedPricer helps you set prices based on your actual costs, so you know exactly what margin you\'re making on each customer. It\'s the difference between hoping you\'re profitable and knowing you are.'
        },
        {
          id: 'vs-spreadsheet',
          q: 'How is this different from a spreadsheet?',
          a: 'You could do all this in a spreadsheet, but it would take hours to set up properly. BasedPricer gives you a ready-made pricing calculator with best practices built in. Plus, it includes features like AI codebase analysis and pricing page mockups that would be impossible in a spreadsheet.'
        },
        {
          id: 'when-use',
          q: 'When should I use this tool?',
          a: 'Use BasedPricer when: (1) You\'re launching a new SaaS and need to set initial prices, (2) You\'re considering raising prices and want to know how it affects margins, (3) You\'re adding a new tier and need to figure out what to charge, (4) Investors ask about your unit economics and you need clear numbers.'
        },
        {
          id: 'accuracy',
          q: 'How accurate are the calculations?',
          a: 'The calculations are as accurate as the data you put in. If you enter your real costs, you\'ll get real numbers. The formulas are standard accounting practices used by finance teams everywhere. We\'re not making up the math - this is how unit economics actually works.'
        },
      ]
    },
    {
      title: 'Getting Started',
      id: 'getting-started',
      faqs: [
        {
          id: 'how-long',
          q: 'How long does it take to set up?',
          a: 'If you know your costs, you can have your first pricing analysis done in 10-15 minutes. If you use the AI codebase analyzer, add another 1-2 minutes for the analysis. The hardest part is usually gathering your cost data (check your AWS/Stripe/API dashboards).'
        },
        {
          id: 'no-costs',
          q: 'What if I don\'t know all my costs yet?',
          a: 'Start with what you know. You can always update the numbers later. Even rough estimates are better than nothing. Common costs to check: your hosting bill, any API costs (OpenAI, Stripe fees, email services), and tools you pay for monthly.'
        },
        {
          id: 'no-customers',
          q: 'Can I use this if I don\'t have customers yet?',
          a: 'Absolutely! In fact, this is the best time to use it. Estimate how many customers you expect in your first year, and plan your pricing around that. It\'s much easier to set the right price from the start than to raise prices later.'
        },
      ]
    },
    {
      title: 'Data & Privacy',
      id: 'data-privacy',
      faqs: [
        {
          id: 'data-storage',
          q: 'Where is my data stored?',
          a: 'All your data stays in your browser\'s local storage. Nothing is sent to our servers. You own your data completely. If you clear your browser data, your BasedPricer data will be deleted too - so export your reports if you need to keep them.'
        },
        {
          id: 'github-safe',
          q: 'Is it safe to connect my GitHub?',
          a: 'Yes. When you connect GitHub, we only read your code to detect features - we don\'t store your code anywhere. The analysis happens in real-time, and your code is never saved. You can also skip GitHub entirely and add features manually.'
        },
        {
          id: 'sharing',
          q: 'Can I share my pricing with my team?',
          a: 'Yes! You can generate reports that summarize your pricing strategy. These can be shared with co-founders, investors, or your team. The reports are standalone files that don\'t require anyone else to use BasedPricer.'
        },
      ]
    },
    {
      title: 'Features & Limitations',
      id: 'features',
      faqs: [
        {
          id: 'free',
          q: 'Is BasedPricer really free?',
          a: 'Yes, 100% free and open source. No premium tier, no feature gates, no "contact sales" buttons. We built this because good pricing tools shouldn\'t cost hundreds of dollars per month.'
        },
        {
          id: 'non-saas',
          q: 'Can I use this for non-SaaS products?',
          a: 'The tool is designed for subscription-based SaaS products with recurring revenue. If you sell one-time purchases, physical products, or services, the calculations might not apply directly. However, the concepts (knowing your costs, targeting healthy margins) are universal.'
        },
        {
          id: 'currencies',
          q: 'Does it support different currencies?',
          a: 'Yes! You can set your preferred currency (USD, EUR, GBP, MYR, etc.) and all calculations will use that currency. If you serve customers in multiple currencies, you might want to run separate analyses for each market.'
        },
        {
          id: 'enterprise',
          q: 'How do I handle enterprise pricing?',
          a: 'For enterprise tiers with custom pricing, you can leave the price blank or set a placeholder. Enterprise deals usually involve negotiation anyway. Focus on knowing your floor price (the minimum you can charge while staying profitable).'
        },
      ]
    },
  ];

  return (
    <div className="space-y-10">
      <LeadText>
        Everything you need to know about using BasedPricer. If you can't find your answer here,
        check out our GitHub discussions or open an issue.
      </LeadText>

      {faqSections.map((section) => (
        <section key={section.id}>
          <SectionTitle id={section.id}>{section.title}</SectionTitle>
          <div className="space-y-2">
            {section.faqs.map((faq) => (
              <div key={faq.id} className="border border-gray-200/80 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/50 transition-colors"
                >
                  <span className="font-medium text-[14px] text-gray-900 pr-4">{faq.q}</span>
                  <CaretRight
                    size={16}
                    className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${openId === faq.id ? 'rotate-90' : ''}`}
                  />
                </button>
                {openId === faq.id && (
                  <div className="px-4 pb-4 text-[14px] text-gray-600 leading-relaxed border-t border-gray-100">
                    <p className="pt-3">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
});

// Step indicator component for tool guides
const StepIndicator = memo(function StepIndicator({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-[14px] font-semibold">
          {number}
        </div>
        <div className="w-px h-full bg-gray-200 mx-auto mt-2" />
      </div>
      <div className="pb-8">
        <h4 className="font-semibold text-[15px] text-gray-900 mb-2">{title}</h4>
        <div className="text-[14px] text-gray-600 leading-relaxed">{children}</div>
      </div>
    </div>
  );
});

const toolPages: Record<string, { title: string; description: string; content: React.ReactNode }> = {
  'codebase-analyzer': {
    title: 'Codebase Analyzer',
    description: 'The Codebase Analyzer connects to your GitHub repository and uses AI to automatically discover all the features in your product. Instead of manually listing every feature, let AI do the heavy lifting.',
    content: (
      <div className="space-y-8">
        {/* What it does - plain English */}
        <section>
          <h3 className="font-semibold text-[16px] text-gray-900 mb-3">What does this do?</h3>
          <Prose>
            Think of it like having a smart assistant read through your entire codebase and create a list of
            everything your product can do. It looks at your code structure, API endpoints, components, and
            configuration files to understand what features exist.
          </Prose>
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-8 justify-center text-[13px]">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mb-2 mx-auto">
                  <GithubLogo size={24} className="text-gray-600" />
                </div>
                <span className="text-gray-600">Your Code</span>
              </div>
              <CaretRight size={20} className="text-gray-400" />
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
                  <Sparkle size={24} className="text-blue-600" />
                </div>
                <span className="text-gray-600">AI Analysis</span>
              </div>
              <CaretRight size={20} className="text-gray-400" />
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
                  <Package size={24} className="text-emerald-600" />
                </div>
                <span className="text-gray-600">Feature List</span>
              </div>
            </div>
          </div>
        </section>

        {/* Step by step guide */}
        <section>
          <h3 className="font-semibold text-[16px] text-gray-900 mb-4">How to use it</h3>
          <div className="space-y-0">
            <StepIndicator number={1} title="Enter your repository URL">
              Paste the GitHub URL of your project. For example: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[13px]">github.com/yourname/your-saas</code>
            </StepIndicator>
            <StepIndicator number={2} title="Add your GitHub token (for private repos)">
              If your repo is private, you'll need a Personal Access Token. Go to GitHub Settings → Developer Settings → Personal Access Tokens to create one.
            </StepIndicator>
            <StepIndicator number={3} title="Click 'Analyze' and wait">
              The AI will scan your codebase. This usually takes 30-60 seconds depending on the size of your project.
            </StepIndicator>
            <StepIndicator number={4} title="Review and import features">
              You'll see a list of detected features. Review them, remove any that aren't customer-facing, and import the ones you want.
            </StepIndicator>
          </div>
        </section>

        {/* What it detects */}
        <section>
          <h3 className="font-semibold text-[16px] text-gray-900 mb-3">What does it look for?</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'React/Vue Components', desc: 'UI features users interact with' },
              { label: 'API Endpoints', desc: 'Backend functionality and integrations' },
              { label: 'Database Models', desc: 'Data structures that power features' },
              { label: 'Feature Flags', desc: 'Toggleable functionality in your code' },
            ].map((item) => (
              <div key={item.label} className="p-4 bg-gray-50/70 rounded-xl border border-gray-100">
                <p className="font-medium text-[14px] text-gray-900 mb-1">{item.label}</p>
                <p className="text-[12px] text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <Callout type="tip" title="Don't have a GitHub repo?">
          No problem! You can skip this tool entirely and add features manually in the Feature Inventory.
        </Callout>
      </div>
    ),
  },
  'feature-inventory': {
    title: 'Feature Inventory',
    description: 'The Feature Inventory is your master list of everything your product does. This is where you organize, categorize, and prepare features for tier assignment.',
    content: (
      <div className="space-y-8">
        {/* What it does */}
        <section>
          <h3 className="font-semibold text-[16px] text-gray-900 mb-3">What does this do?</h3>
          <Prose>
            Think of this as your product's feature database. Every feature your product has should live here.
            Later, you'll assign these features to different pricing tiers (like Free, Pro, Enterprise).
          </Prose>
        </section>

        {/* Visual example */}
        <section>
          <h3 className="font-semibold text-[16px] text-gray-900 mb-3">Example features</h3>
          <div className="space-y-2">
            {[
              { name: 'User Authentication', category: 'Core', complexity: 'Basic' },
              { name: 'AI Content Generation', category: 'AI', complexity: 'Advanced' },
              { name: 'Team Collaboration', category: 'Collaboration', complexity: 'Medium' },
              { name: 'API Access', category: 'Developer', complexity: 'Advanced' },
            ].map((feature) => (
              <div key={feature.name} className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg">
                <CheckCircle size={18} weight="duotone" className="text-emerald-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-[14px] text-gray-900">{feature.name}</p>
                </div>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[11px] font-medium rounded">{feature.category}</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[11px] font-medium rounded">{feature.complexity}</span>
              </div>
            ))}
          </div>
        </section>

        {/* How to use */}
        <section>
          <h3 className="font-semibold text-[16px] text-gray-900 mb-4">How to use it</h3>
          <div className="space-y-0">
            <StepIndicator number={1} title="Add your features">
              Click "Add Feature" and enter the name, description, and category. Be specific - "Export to PDF" is better than "Export".
            </StepIndicator>
            <StepIndicator number={2} title="Set complexity levels">
              Mark features as Basic, Medium, or Advanced. This helps later when deciding which tier gets which features.
            </StepIndicator>
            <StepIndicator number={3} title="Organize by category">
              Group related features together. Categories like "Core", "Analytics", "AI", "Integrations" help keep things organized.
            </StepIndicator>
          </div>
        </section>

        <Callout type="info" title="Pro tip">
          Focus on customer-facing features. Internal tools or admin features usually don't belong in your pricing tiers.
        </Callout>
      </div>
    ),
  },
  'cogs-calculator': {
    title: 'COGS Calculator',
    description: 'COGS (Cost of Goods Sold) Calculator helps you figure out exactly how much it costs to serve each customer. This is the foundation of profitable pricing.',
    content: (
      <div className="space-y-8">
        {/* Plain English explanation */}
        <section>
          <h3 className="font-semibold text-[16px] text-gray-900 mb-3">What does this do?</h3>
          <Prose>
            Before you can set a profitable price, you need to know your costs. This tool helps you add up
            everything you spend to run your SaaS - from API costs to hosting to payment fees. It then
            calculates your cost per customer.
          </Prose>

          {/* Simple visual formula */}
          <div className="mt-4 p-5 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-center gap-3 text-[14px]">
              <div className="text-center px-4 py-2 bg-white rounded-lg shadow-sm">
                <p className="text-[12px] text-gray-500 mb-1">Variable Costs</p>
                <p className="font-semibold text-gray-900">$8.50</p>
              </div>
              <span className="text-gray-400 font-semibold">+</span>
              <div className="text-center px-4 py-2 bg-white rounded-lg shadow-sm">
                <p className="text-[12px] text-gray-500 mb-1">Fixed / Customers</p>
                <p className="font-semibold text-gray-900">$4.00</p>
              </div>
              <span className="text-gray-400 font-semibold">=</span>
              <div className="text-center px-4 py-3 bg-gray-900 text-white rounded-lg shadow-sm">
                <p className="text-[12px] text-gray-300 mb-1">Cost per Customer</p>
                <p className="font-bold text-[18px]">$12.50</p>
              </div>
            </div>
          </div>
        </section>

        {/* Two types of costs */}
        <section>
          <h3 className="font-semibold text-[16px] text-gray-900 mb-3">Two types of costs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-blue-50/70 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <Users size={20} className="text-blue-600" />
                <p className="font-semibold text-[15px] text-blue-900">Variable Costs</p>
              </div>
              <p className="text-[13px] text-blue-800/80 mb-3">
                Costs that go up when you get more customers. Each new user costs you money.
              </p>
              <div className="space-y-2">
                {[
                  { name: 'OpenAI API calls', example: '$0.02 per request' },
                  { name: 'Cloud storage', example: '$0.10 per GB' },
                  { name: 'Email sending', example: '$0.001 per email' },
                  { name: 'Stripe fees', example: '2.9% + $0.30' },
                ].map((item) => (
                  <div key={item.name} className="flex justify-between text-[12px]">
                    <span className="text-blue-900">{item.name}</span>
                    <span className="text-blue-600 font-mono">{item.example}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 bg-emerald-50/70 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-2 mb-3">
                <Database size={20} className="text-emerald-600" />
                <p className="font-semibold text-[15px] text-emerald-900">Fixed Costs</p>
              </div>
              <p className="text-[13px] text-emerald-800/80 mb-3">
                Costs you pay every month regardless of customer count. These get "spread" across all customers.
              </p>
              <div className="space-y-2">
                {[
                  { name: 'Server hosting', example: '$50/month' },
                  { name: 'Domain & SSL', example: '$15/month' },
                  { name: 'Monitoring tools', example: '$30/month' },
                  { name: 'Other SaaS tools', example: '$100/month' },
                ].map((item) => (
                  <div key={item.name} className="flex justify-between text-[12px]">
                    <span className="text-emerald-900">{item.name}</span>
                    <span className="text-emerald-600 font-mono">{item.example}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How to use */}
        <section>
          <h3 className="font-semibold text-[16px] text-gray-900 mb-4">How to use it</h3>
          <div className="space-y-0">
            <StepIndicator number={1} title="List your variable costs">
              Add each cost that scales with users. Be specific about the unit (per request, per GB, per email).
            </StepIndicator>
            <StepIndicator number={2} title="Add your fixed monthly costs">
              Include everything you pay monthly: hosting, domains, tools, subscriptions.
            </StepIndicator>
            <StepIndicator number={3} title="Enter your customer count">
              How many paying customers do you have (or expect)? This divides your fixed costs.
            </StepIndicator>
          </div>
        </section>

        <Callout type="warning" title="Don't forget hidden costs">
          Payment processing fees (Stripe, PayPal) are often forgotten. At 2.9% + $0.30, a $29 plan actually costs you $1.14 in fees alone.
        </Callout>
      </div>
    ),
  },
  'tier-configurator': {
    title: 'Tier Configurator',
    description: 'The Tier Configurator is where you create your pricing tiers (like Free, Pro, Enterprise) and decide which features go in each tier.',
    content: (
      <div className="space-y-8">
        {/* What it does */}
        <section>
          <h3 className="font-semibold text-[16px] text-gray-900 mb-3">What does this do?</h3>
          <Prose>
            This is where you design your pricing structure. You'll create tiers (Free, Starter, Pro, etc.)
            and assign features to each one. The goal is to create clear value steps that encourage upgrades.
          </Prose>
        </section>

        {/* Visual tier example */}
        <section>
          <h3 className="font-semibold text-[16px] text-gray-900 mb-3">Example tier structure</h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              { name: 'Free', price: '$0', features: 3, highlight: false },
              { name: 'Starter', price: '$19', features: 8, highlight: false },
              { name: 'Pro', price: '$49', features: 15, highlight: true },
              { name: 'Enterprise', price: 'Custom', features: 'All', highlight: false },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`p-4 rounded-xl text-center ${
                  tier.highlight
                    ? 'bg-gray-900 text-white ring-2 ring-gray-900 ring-offset-2'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <p className={`font-semibold text-[14px] mb-1 ${tier.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {tier.name}
                </p>
                <p className={`text-[20px] font-bold mb-2 ${tier.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {tier.price}
                </p>
                <p className={`text-[12px] ${tier.highlight ? 'text-gray-300' : 'text-gray-500'}`}>
                  {tier.features} features
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How to use */}
        <section>
          <h3 className="font-semibold text-[16px] text-gray-900 mb-4">How to use it</h3>
          <div className="space-y-0">
            <StepIndicator number={1} title="Create your tiers">
              Start with 3-4 tiers. More than that confuses customers. Name them clearly (avoid creative names).
            </StepIndicator>
            <StepIndicator number={2} title="Assign features to each tier">
              Drag features from your inventory into each tier. Put basic features in lower tiers, advanced in higher.
            </StepIndicator>
            <StepIndicator number={3} title="Set usage limits (optional)">
              Some features might be limited by usage: "100 API calls" in Free, "Unlimited" in Pro.
            </StepIndicator>
            <StepIndicator number={4} title="Mark your recommended tier">
              Choose which tier you want most customers on. This will be highlighted on your pricing page.
            </StepIndicator>
          </div>
        </section>

        <Callout type="tip" title="Pricing psychology">
          Your middle tier should be your target. Make it obviously the best value by comparison. Most customers will choose it.
        </Callout>
      </div>
    ),
  },
  'pricing-calculator': {
    title: 'Pricing Calculator',
    description: 'The Pricing Calculator shows you the financial impact of your pricing decisions in real-time. See margins, revenue projections, and profitability at a glance.',
    content: (
      <div className="space-y-8">
        {/* What it does */}
        <section>
          <h3 className="font-semibold text-[16px] text-gray-900 mb-3">What does this do?</h3>
          <Prose>
            This is where everything comes together. Based on your costs and tier prices, the calculator
            shows you exactly how profitable each tier is, your total revenue, and whether your margins are healthy.
          </Prose>
        </section>

        {/* Visual calculation example */}
        <section>
          <h3 className="font-semibold text-[16px] text-gray-900 mb-3">Live calculation example</h3>
          <div className="bg-gray-900 rounded-xl p-5 text-white">
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { label: 'Price', value: '$49/mo' },
                { label: 'COGS', value: '$12.50' },
                { label: 'Profit', value: '$36.50' },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-[12px] text-gray-400 mb-1">{item.label}</p>
                  <p className="text-[20px] font-bold">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 p-3 bg-emerald-500/20 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-[14px]">74.5% gross margin - Healthy SaaS margin</span>
            </div>
          </div>
        </section>

        {/* What you'll see */}
        <section>
          <h3 className="font-semibold text-[16px] text-gray-900 mb-3">What you'll see</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Gross Margin %', desc: 'How much you keep after costs (aim for 70%+)' },
              { label: 'Profit per Customer', desc: 'Actual dollars you make per customer' },
              { label: 'Monthly Recurring Revenue', desc: 'Total revenue from all tiers' },
              { label: 'Margin Health Indicator', desc: 'Green = healthy, Yellow = watch, Red = fix' },
            ].map((item) => (
              <div key={item.label} className="p-4 bg-gray-50/70 rounded-xl border border-gray-100">
                <p className="font-medium text-[14px] text-gray-900 mb-1">{item.label}</p>
                <p className="text-[12px] text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <Callout type="info" title="What's a healthy margin?">
          SaaS companies typically aim for 70-80% gross margins. Below 50% means you're spending too much to serve each customer.
        </Callout>
      </div>
    ),
  },
  'pricing-mockup': {
    title: 'Pricing Mockup',
    description: 'The Pricing Mockup shows you exactly how your pricing page will look to customers. Preview different layouts, toggle annual pricing, and see your tiers side by side.',
    content: (
      <div className="space-y-8">
        {/* What it does */}
        <section>
          <h3 className="font-semibold text-[16px] text-gray-900 mb-3">What does this do?</h3>
          <Prose>
            See a live preview of your pricing page before building it. Test different layouts, see how
            features display in each tier, and make sure your pricing tells the right story.
          </Prose>
        </section>

        {/* Features */}
        <section>
          <h3 className="font-semibold text-[16px] text-gray-900 mb-3">Features</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Multiple layouts', desc: 'Cards, table, or comparison view' },
              { label: 'Highlighted tier', desc: 'Make your target tier stand out' },
              { label: 'Annual toggle', desc: 'Show monthly vs annual pricing' },
              { label: 'Feature display', desc: 'See exactly what each tier includes' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 p-4 bg-gray-50/70 rounded-xl border border-gray-100">
                <CheckCircle size={18} weight="duotone" className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[14px] text-gray-900">{item.label}</p>
                  <p className="text-[12px] text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Callout type="tip" title="Test before you build">
          Use the mockup to get stakeholder feedback before spending time building your actual pricing page.
        </Callout>
      </div>
    ),
  },
};

// ============================================================================
// Main Component
// ============================================================================

export function DocsPage() {
  const [activePage, setActivePage] = useState('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeHeading, setActiveHeading] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  // Close mobile nav on Escape key
  useEscapeKey(() => setMobileNavOpen(false), mobileNavOpen);

  // Get current section title
  const getCurrentSection = useCallback(() => {
    for (const section of navSections) {
      const item = section.items.find(i => i.id === activePage);
      if (item) return { section: section.title, item };
    }
    return { section: 'Getting Started', item: { id: 'overview', label: 'Overview', icon: House } };
  }, [activePage]);

  const { section, item } = getCurrentSection();
  const toc = tocByPage[activePage] || [];

  const handleNavigate = useCallback((id: string) => {
    setActivePage(id);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Track active heading for TOC highlight
  useEffect(() => {
    if (toc.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -80% 0px', threshold: 0 }
    );

    toc.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [toc, activePage]);

  const renderContent = useCallback(() => {
    switch (activePage) {
      case 'overview':
        return <OverviewPage onNavigate={handleNavigate} />;
      case 'quickstart':
        return <QuickstartPage onNavigate={handleNavigate} />;
      case 'core-concepts':
        return <CoreConceptsPage onNavigate={handleNavigate} />;
      case 'gross-margin':
        return <GrossMarginPage />;
      case 'cogs':
        return <COGSPage />;
      case 'unit-economics':
        return <UnitEconomicsPage />;
      case 'pricing-strategies':
        return <PricingStrategiesPage />;
      case 'faq':
        return <FAQPage />;
      default:
        if (toolPages[activePage]) {
          const tool = toolPages[activePage];
          return <ToolPage description={tool.description} content={tool.content} />;
        }
        return <OverviewPage onNavigate={handleNavigate} />;
    }
  }, [activePage, handleNavigate]);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/80 safe-area-top">
        <div className="flex items-center justify-between h-14 px-4 lg:px-6 max-w-[1400px] mx-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="lg:hidden p-2.5 -ml-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-all touch-manipulation focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 outline-none"
              aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={mobileNavOpen}
              aria-controls="docs-sidebar"
            >
              <div className={`transition-transform duration-300 ${mobileNavOpen ? 'rotate-90' : ''}`}>
                {mobileNavOpen ? <X size={20} /> : <List size={20} />}
              </div>
            </button>
            <Link to="/" className="flex items-center gap-2 group">
              <Logo size="sm" variant="icon" />
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-gray-300">
              <span>/</span>
              <span className="font-medium text-gray-900 text-[14px]">Docs</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <a
              href="https://github.com/basedpricer/basedpricer"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 outline-none"
            >
              <GithubLogo size={16} />
              GitHub
            </a>
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 active:bg-gray-700 rounded-lg transition-colors touch-manipulation focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 outline-none"
            >
              <Sparkle size={14} weight="bold" />
              <span className="hidden sm:inline">Open App</span>
              <span className="sm:hidden">App</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex max-w-[1400px] mx-auto">
        {/* Mobile nav overlay */}
        <div
          className={`lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${
            mobileNavOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setMobileNavOpen(false)}
        />

        {/* Left Sidebar */}
        <aside
          id="docs-sidebar"
          role="navigation"
          aria-label="Documentation navigation"
          className={`
          fixed lg:sticky top-14 left-0 z-40
          w-[280px] max-w-[85vw] h-[calc(100vh-3.5rem)] overflow-y-auto overscroll-contain
          bg-white lg:bg-transparent border-r border-gray-200/80 lg:border-0
          transition-transform duration-300 ease-out lg:translate-x-0
          ${mobileNavOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}>
          <nav className="p-4 lg:p-5 lg:py-8 lg:pr-6 safe-area-bottom">
            {navSections.map((navSection, sectionIndex) => (
              <div key={navSection.title} className={sectionIndex > 0 ? 'mt-6 lg:mt-8' : ''}>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                  {navSection.title}
                </p>
                <ul className="space-y-0.5">
                  {navSection.items.map((navItem) => {
                    const Icon = navItem.icon;
                    const isActive = activePage === navItem.id;
                    return (
                      <li key={navItem.id}>
                        <button
                          onClick={() => handleNavigate(navItem.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 lg:px-2.5 lg:py-2 text-[13px] rounded-lg transition-all duration-150 touch-manipulation focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 outline-none ${
                            isActive
                              ? 'bg-gray-900 text-white font-medium shadow-sm'
                              : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200 hover:text-gray-900'
                          }`}
                        >
                          <Icon size={16} weight={isActive ? 'bold' : 'regular'} className="flex-shrink-0" />
                          {navItem.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main ref={mainRef} className="flex-1 min-w-0">
          <div className="max-w-[720px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 safe-area-bottom">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[12px] sm:text-[13px] text-gray-400 mb-2 sm:mb-3">
              <span className="truncate">{section}</span>
              <CaretRight size={12} className="flex-shrink-0" />
              <span className="text-gray-600 truncate">{item.label}</span>
            </div>

            {/* Title */}
            <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-gray-900 tracking-tight mb-2">
              {item.label}
            </h1>

            {/* Content */}
            <div className="mt-6 sm:mt-8">
              {renderContent()}
            </div>

            {/* Footer navigation */}
            <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-gray-200/80">
              <div className="flex items-center justify-between gap-4">
                <Link
                  to="/"
                  className="text-[13px] text-gray-500 hover:text-gray-900 active:text-gray-700 transition-colors touch-manipulation py-1"
                >
                  ← Back to app
                </Link>
                <a
                  href="https://github.com/basedpricer/basedpricer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-gray-500 hover:text-gray-900 active:text-gray-700 transition-colors flex items-center gap-1 touch-manipulation py-1"
                >
                  <span className="hidden sm:inline">Edit on GitHub</span>
                  <span className="sm:hidden">GitHub</span>
                  <ArrowUpRight size={12} />
                </a>
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar - TOC */}
        {toc.length > 0 && (
          <aside className="hidden xl:block w-[200px] flex-shrink-0">
            <div className="sticky top-14 py-10 pr-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                On this page
              </p>
              <ul className="space-y-1">
                {toc.map((tocItem) => {
                  const isActive = activeHeading === tocItem.id;
                  return (
                    <li key={tocItem.id}>
                      <a
                        href={`#${tocItem.id}`}
                        className={`block px-2 py-1.5 text-[12px] rounded-md transition-all duration-150 ${
                          isActive
                            ? 'text-gray-900 bg-gray-100 font-medium'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {tocItem.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export default DocsPage;
