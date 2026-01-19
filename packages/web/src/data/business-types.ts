/**
 * Business Type Definitions
 * Used for adaptive UX based on the type of SaaS being built
 */

export type BusinessType =
  | 'api_service'
  | 'marketplace'
  | 'fintech'
  | 'ai_ml_saas'
  | 'developer_tools'
  | 'b2b_saas'
  | 'consumer_saas'
  | 'generic';

export type PricingModelType =
  | 'usage_based'
  | 'seat_based'
  | 'feature_tiered'
  | 'take_rate'
  | 'hybrid'
  | 'freemium';

export interface DetectionSignal {
  type: 'dependency' | 'route' | 'pattern' | 'file';
  pattern: string;
  weight: number; // 0-1, higher = stronger signal
  description: string;
}

export interface FeatureCategoryConfig {
  id: string;
  name: string;
  description: string;
  critical: boolean; // Is this category critical for this business type?
}

export interface NarrativeTemplate {
  summaryTemplate: string;
  riskPatterns: string[];
  opportunityPatterns: string[];
  pricingAdvice: string;
}

export interface BusinessTypeConfig {
  id: BusinessType;
  name: string;
  description: string;
  pricingModel: PricingModelType;
  recommendedTierCount: number;
  allowsFreemium: boolean;
  keyMetrics: string[];
  signals: DetectionSignal[];
  featureCategories: FeatureCategoryConfig[];
  narrative: NarrativeTemplate;
}

/**
 * Business type detection signals and configurations
 */
export const BUSINESS_TYPES: Record<BusinessType, BusinessTypeConfig> = {
  api_service: {
    id: 'api_service',
    name: 'API Service',
    description: 'API-as-a-service, developer APIs, data services',
    pricingModel: 'usage_based',
    recommendedTierCount: 3,
    allowsFreemium: true,
    keyMetrics: ['API calls', 'Rate limits', 'Requests/second', 'Data transfer'],
    signals: [
      { type: 'dependency', pattern: 'express', weight: 0.5, description: 'Express.js API framework' },
      { type: 'dependency', pattern: 'fastify', weight: 0.6, description: 'Fastify API framework' },
      { type: 'dependency', pattern: 'hono', weight: 0.6, description: 'Hono edge API framework' },
      { type: 'dependency', pattern: '@nestjs/core', weight: 0.5, description: 'NestJS framework' },
      { type: 'dependency', pattern: 'swagger', weight: 0.7, description: 'API documentation' },
      { type: 'dependency', pattern: 'openapi', weight: 0.7, description: 'OpenAPI spec' },
      { type: 'dependency', pattern: '@trpc/server', weight: 0.5, description: 'tRPC API' },
      { type: 'route', pattern: '/api/v', weight: 0.8, description: 'Versioned API routes' },
      { type: 'route', pattern: '/api/health', weight: 0.4, description: 'Health check endpoint' },
      { type: 'pattern', pattern: 'rate.*limit', weight: 0.7, description: 'Rate limiting logic' },
      { type: 'pattern', pattern: 'api.*key', weight: 0.6, description: 'API key handling' },
      { type: 'file', pattern: 'openapi.yaml', weight: 0.8, description: 'OpenAPI spec file' },
    ],
    featureCategories: [
      { id: 'api_endpoints', name: 'API Endpoints', description: 'Core API functionality', critical: true },
      { id: 'rate_limiting', name: 'Rate Limiting', description: 'Request throttling', critical: true },
      { id: 'authentication', name: 'API Authentication', description: 'Keys, OAuth, JWT', critical: true },
      { id: 'documentation', name: 'Documentation', description: 'API docs, SDKs', critical: false },
      { id: 'analytics', name: 'Usage Analytics', description: 'Tracking, dashboards', critical: false },
      { id: 'support', name: 'Support', description: 'Developer support tiers', critical: false },
    ],
    narrative: {
      summaryTemplate: 'This is an API service that provides {mainFeature}. API services typically monetize through usage-based pricing with tiered rate limits.',
      riskPatterns: ['No rate limiting detected', 'Missing API versioning', 'No authentication middleware'],
      opportunityPatterns: ['Could add premium endpoints', 'Usage analytics could justify higher tiers', 'SDK generation could add value'],
      pricingAdvice: 'Price based on API calls with generous free tier to drive adoption. Enterprise tier should include SLA guarantees.',
    },
  },

  marketplace: {
    id: 'marketplace',
    name: 'Marketplace',
    description: 'Two-sided marketplace, e-commerce platform',
    pricingModel: 'take_rate',
    recommendedTierCount: 3,
    allowsFreemium: true,
    keyMetrics: ['GMV', 'Transactions', 'Sellers', 'Take rate percentage'],
    signals: [
      { type: 'dependency', pattern: 'stripe', weight: 0.6, description: 'Payment processing' },
      { type: 'dependency', pattern: '@stripe/stripe-js', weight: 0.6, description: 'Stripe client' },
      { type: 'dependency', pattern: 'algolia', weight: 0.5, description: 'Search service' },
      { type: 'dependency', pattern: 'meilisearch', weight: 0.5, description: 'Search engine' },
      { type: 'route', pattern: '/listings', weight: 0.7, description: 'Listing routes' },
      { type: 'route', pattern: '/sellers', weight: 0.8, description: 'Seller management' },
      { type: 'route', pattern: '/orders', weight: 0.6, description: 'Order management' },
      { type: 'route', pattern: '/checkout', weight: 0.5, description: 'Checkout flow' },
      { type: 'pattern', pattern: 'seller|vendor', weight: 0.7, description: 'Seller/vendor references' },
      { type: 'pattern', pattern: 'commission|fee.*percent', weight: 0.8, description: 'Commission logic' },
      { type: 'pattern', pattern: 'marketplace', weight: 0.9, description: 'Marketplace references' },
    ],
    featureCategories: [
      { id: 'listings', name: 'Listings', description: 'Product/service listings', critical: true },
      { id: 'search', name: 'Search & Discovery', description: 'Search, filters, recommendations', critical: true },
      { id: 'transactions', name: 'Transactions', description: 'Payments, escrow, refunds', critical: true },
      { id: 'seller_tools', name: 'Seller Tools', description: 'Analytics, inventory, promotions', critical: false },
      { id: 'buyer_tools', name: 'Buyer Tools', description: 'Wishlists, reviews, messaging', critical: false },
      { id: 'support', name: 'Support', description: 'Dispute resolution, help', critical: false },
    ],
    narrative: {
      summaryTemplate: 'This is a marketplace platform connecting {buyerType} with {sellerType}. Marketplaces typically monetize through transaction fees (take rate).',
      riskPatterns: ['No escrow/payment protection', 'Missing seller verification', 'No dispute resolution'],
      opportunityPatterns: ['Premium seller features', 'Promoted listings', 'Analytics dashboards for sellers'],
      pricingAdvice: 'Use take-rate pricing (5-20% per transaction). Offer reduced rates for high-volume sellers.',
    },
  },

  fintech: {
    id: 'fintech',
    name: 'Fintech',
    description: 'Financial services, banking, payments',
    pricingModel: 'hybrid',
    recommendedTierCount: 3,
    allowsFreemium: false, // Fintech rarely offers free tier due to compliance costs
    keyMetrics: ['Accounts', 'Transactions', 'AUM', 'Compliance features'],
    signals: [
      { type: 'dependency', pattern: 'plaid', weight: 0.9, description: 'Bank connections' },
      { type: 'dependency', pattern: 'stripe', weight: 0.5, description: 'Payment processing' },
      { type: 'dependency', pattern: 'dwolla', weight: 0.9, description: 'ACH transfers' },
      { type: 'dependency', pattern: 'persona', weight: 0.8, description: 'Identity verification' },
      { type: 'dependency', pattern: 'alloy', weight: 0.8, description: 'KYC/AML' },
      { type: 'route', pattern: '/accounts', weight: 0.6, description: 'Account management' },
      { type: 'route', pattern: '/transactions', weight: 0.6, description: 'Transaction handling' },
      { type: 'route', pattern: '/kyc', weight: 0.9, description: 'KYC endpoints' },
      { type: 'pattern', pattern: 'kyc|aml|compliance', weight: 0.9, description: 'Compliance terms' },
      { type: 'pattern', pattern: 'bank|account.*number', weight: 0.7, description: 'Banking terms' },
      { type: 'pattern', pattern: 'pci.*dss|encryption', weight: 0.7, description: 'Security compliance' },
    ],
    featureCategories: [
      { id: 'accounts', name: 'Account Management', description: 'User accounts, profiles', critical: true },
      { id: 'transactions', name: 'Transactions', description: 'Transfers, payments', critical: true },
      { id: 'compliance', name: 'Compliance', description: 'KYC, AML, reporting', critical: true },
      { id: 'security', name: 'Security', description: 'MFA, encryption, audit', critical: true },
      { id: 'integrations', name: 'Integrations', description: 'Banks, payment networks', critical: false },
      { id: 'reporting', name: 'Reporting', description: 'Statements, exports', critical: false },
    ],
    narrative: {
      summaryTemplate: 'This is a fintech application providing {mainFeature}. Fintech products require careful pricing due to compliance costs and regulatory requirements.',
      riskPatterns: ['Missing KYC/AML', 'No audit logging', 'Insufficient encryption', 'Missing MFA'],
      opportunityPatterns: ['Premium compliance features', 'White-label options', 'API access for partners'],
      pricingAdvice: 'No free tier due to compliance costs. Price based on accounts + transaction volume. Enterprise tier for custom compliance.',
    },
  },

  ai_ml_saas: {
    id: 'ai_ml_saas',
    name: 'AI/ML SaaS',
    description: 'AI-powered applications, ML platforms',
    pricingModel: 'usage_based',
    recommendedTierCount: 4,
    allowsFreemium: true,
    keyMetrics: ['Tokens/credits', 'Inference calls', 'Models', 'Training hours'],
    signals: [
      { type: 'dependency', pattern: 'openai', weight: 0.9, description: 'OpenAI API' },
      { type: 'dependency', pattern: '@anthropic-ai/sdk', weight: 0.9, description: 'Anthropic API' },
      { type: 'dependency', pattern: 'langchain', weight: 0.8, description: 'LangChain framework' },
      { type: 'dependency', pattern: '@google/generative-ai', weight: 0.8, description: 'Google AI' },
      { type: 'dependency', pattern: 'replicate', weight: 0.8, description: 'Replicate models' },
      { type: 'dependency', pattern: 'huggingface', weight: 0.7, description: 'HuggingFace' },
      { type: 'dependency', pattern: 'pinecone', weight: 0.6, description: 'Vector database' },
      { type: 'dependency', pattern: 'weaviate', weight: 0.6, description: 'Vector database' },
      { type: 'route', pattern: '/chat', weight: 0.5, description: 'Chat endpoint' },
      { type: 'route', pattern: '/generate', weight: 0.7, description: 'Generation endpoint' },
      { type: 'route', pattern: '/embed', weight: 0.7, description: 'Embeddings endpoint' },
      { type: 'pattern', pattern: 'llm|gpt|claude|gemini', weight: 0.8, description: 'LLM references' },
      { type: 'pattern', pattern: 'token.*usage|credit', weight: 0.7, description: 'Token/credit tracking' },
      { type: 'pattern', pattern: 'embedding|vector', weight: 0.6, description: 'Vector/embedding terms' },
    ],
    featureCategories: [
      { id: 'inference', name: 'AI Inference', description: 'Model calls, generations', critical: true },
      { id: 'models', name: 'Model Access', description: 'Available models, fine-tuning', critical: true },
      { id: 'storage', name: 'Data Storage', description: 'Vectors, documents, history', critical: false },
      { id: 'integrations', name: 'Integrations', description: 'APIs, webhooks, plugins', critical: false },
      { id: 'analytics', name: 'Usage Analytics', description: 'Tracking, dashboards', critical: false },
      { id: 'team', name: 'Team Features', description: 'Collaboration, sharing', critical: false },
    ],
    narrative: {
      summaryTemplate: 'This is an AI-powered application that {mainFeature}. AI products typically price based on usage (tokens, credits, or API calls).',
      riskPatterns: ['No token/usage tracking', 'Missing rate limiting', 'No cost controls for users'],
      opportunityPatterns: ['Premium models tier', 'Custom fine-tuning', 'Enterprise data privacy'],
      pricingAdvice: 'Use credit/token-based pricing. Offer generous free credits to drive adoption. Premium tiers for advanced models and higher limits.',
    },
  },

  developer_tools: {
    id: 'developer_tools',
    name: 'Developer Tools',
    description: 'Dev tools, CI/CD, code analysis',
    pricingModel: 'seat_based',
    recommendedTierCount: 4,
    allowsFreemium: true,
    keyMetrics: ['Seats', 'Projects', 'Builds/month', 'Storage'],
    signals: [
      { type: 'dependency', pattern: 'octokit', weight: 0.7, description: 'GitHub API' },
      { type: 'dependency', pattern: '@sentry/node', weight: 0.5, description: 'Error tracking' },
      { type: 'dependency', pattern: 'eslint', weight: 0.3, description: 'Linting tool' },
      { type: 'dependency', pattern: '@vercel/analytics', weight: 0.4, description: 'Vercel integration' },
      { type: 'route', pattern: '/projects', weight: 0.6, description: 'Project management' },
      { type: 'route', pattern: '/deployments', weight: 0.7, description: 'Deployment routes' },
      { type: 'route', pattern: '/builds', weight: 0.7, description: 'Build management' },
      { type: 'route', pattern: '/repos', weight: 0.6, description: 'Repository routes' },
      { type: 'pattern', pattern: 'ci.*cd|pipeline|deploy', weight: 0.7, description: 'CI/CD terms' },
      { type: 'pattern', pattern: 'git.*hub|gitlab|bitbucket', weight: 0.5, description: 'Git platform refs' },
      { type: 'pattern', pattern: 'developer|engineer', weight: 0.3, description: 'Developer focus' },
    ],
    featureCategories: [
      { id: 'projects', name: 'Projects', description: 'Project management, repos', critical: true },
      { id: 'builds', name: 'Builds & Deploys', description: 'CI/CD, deployments', critical: true },
      { id: 'collaboration', name: 'Collaboration', description: 'Teams, permissions', critical: false },
      { id: 'integrations', name: 'Integrations', description: 'Git, Slack, webhooks', critical: false },
      { id: 'analytics', name: 'Analytics', description: 'Metrics, insights', critical: false },
      { id: 'support', name: 'Support', description: 'Priority support, SLA', critical: false },
    ],
    narrative: {
      summaryTemplate: 'This is a developer tool that helps with {mainFeature}. Developer tools typically price per seat with usage limits.',
      riskPatterns: ['No team/permission system', 'Missing audit logs', 'No SSO support'],
      opportunityPatterns: ['Enterprise SSO', 'Advanced analytics', 'Custom integrations'],
      pricingAdvice: 'Seat-based pricing with per-project or per-build limits. Free tier for individuals, team tiers for collaboration.',
    },
  },

  b2b_saas: {
    id: 'b2b_saas',
    name: 'B2B SaaS',
    description: 'Business software, enterprise tools',
    pricingModel: 'feature_tiered',
    recommendedTierCount: 4,
    allowsFreemium: true,
    keyMetrics: ['Users', 'Features', 'Storage', 'Integrations'],
    signals: [
      { type: 'dependency', pattern: '@clerk/nextjs', weight: 0.4, description: 'Auth service' },
      { type: 'dependency', pattern: 'next-auth', weight: 0.4, description: 'Auth library' },
      { type: 'dependency', pattern: '@auth0', weight: 0.5, description: 'Auth0' },
      { type: 'dependency', pattern: '@supabase/supabase-js', weight: 0.4, description: 'Supabase' },
      { type: 'route', pattern: '/team', weight: 0.6, description: 'Team routes' },
      { type: 'route', pattern: '/organization', weight: 0.7, description: 'Org routes' },
      { type: 'route', pattern: '/workspace', weight: 0.6, description: 'Workspace routes' },
      { type: 'route', pattern: '/admin', weight: 0.5, description: 'Admin routes' },
      { type: 'pattern', pattern: 'organization|workspace|team', weight: 0.6, description: 'Org terms' },
      { type: 'pattern', pattern: 'role|permission|access', weight: 0.5, description: 'Access control' },
      { type: 'pattern', pattern: 'sso|saml|oidc', weight: 0.8, description: 'Enterprise auth' },
    ],
    featureCategories: [
      { id: 'core', name: 'Core Features', description: 'Main functionality', critical: true },
      { id: 'team', name: 'Team Management', description: 'Users, roles, permissions', critical: true },
      { id: 'integrations', name: 'Integrations', description: 'Third-party connections', critical: false },
      { id: 'reporting', name: 'Reporting', description: 'Analytics, exports', critical: false },
      { id: 'admin', name: 'Administration', description: 'Settings, audit logs', critical: false },
      { id: 'support', name: 'Support', description: 'Help, onboarding', critical: false },
    ],
    narrative: {
      summaryTemplate: 'This is a B2B SaaS application for {mainFeature}. B2B products typically use feature-tiered pricing with enterprise options.',
      riskPatterns: ['No team/org support', 'Missing audit logs', 'No SSO for enterprise'],
      opportunityPatterns: ['Enterprise SSO/SAML', 'Advanced admin controls', 'Custom integrations'],
      pricingAdvice: 'Feature-tiered pricing. Free/basic tier for small teams, Pro for growing businesses, Enterprise for large organizations.',
    },
  },

  consumer_saas: {
    id: 'consumer_saas',
    name: 'Consumer SaaS',
    description: 'B2C applications, consumer tools',
    pricingModel: 'freemium',
    recommendedTierCount: 3,
    allowsFreemium: true,
    keyMetrics: ['MAU', 'Usage', 'Premium conversions'],
    signals: [
      { type: 'dependency', pattern: 'firebase', weight: 0.5, description: 'Firebase' },
      { type: 'dependency', pattern: '@vercel/analytics', weight: 0.4, description: 'Analytics' },
      { type: 'dependency', pattern: 'mixpanel', weight: 0.5, description: 'Product analytics' },
      { type: 'dependency', pattern: 'posthog', weight: 0.5, description: 'Product analytics' },
      { type: 'route', pattern: '/profile', weight: 0.4, description: 'User profile' },
      { type: 'route', pattern: '/settings', weight: 0.3, description: 'User settings' },
      { type: 'route', pattern: '/share', weight: 0.5, description: 'Sharing features' },
      { type: 'pattern', pattern: 'social|share|invite', weight: 0.6, description: 'Social features' },
      { type: 'pattern', pattern: 'free.*tier|premium', weight: 0.7, description: 'Freemium terms' },
      { type: 'pattern', pattern: 'gamification|streak|badge', weight: 0.6, description: 'Engagement' },
    ],
    featureCategories: [
      { id: 'core', name: 'Core Features', description: 'Main functionality', critical: true },
      { id: 'personalization', name: 'Personalization', description: 'Customization, preferences', critical: false },
      { id: 'social', name: 'Social Features', description: 'Sharing, collaboration', critical: false },
      { id: 'premium', name: 'Premium Features', description: 'Advanced functionality', critical: false },
      { id: 'support', name: 'Support', description: 'Help, FAQs', critical: false },
    ],
    narrative: {
      summaryTemplate: 'This is a consumer application for {mainFeature}. Consumer products typically use freemium models with premium upgrades.',
      riskPatterns: ['No freemium tier', 'Missing social/sharing', 'No engagement features'],
      opportunityPatterns: ['Family/team plans', 'Lifetime deals', 'Exclusive features'],
      pricingAdvice: 'Freemium model with generous free tier. Premium for power users, possibly family/team plans.',
    },
  },

  generic: {
    id: 'generic',
    name: 'Generic SaaS',
    description: 'Standard SaaS application',
    pricingModel: 'feature_tiered',
    recommendedTierCount: 4,
    allowsFreemium: true,
    keyMetrics: ['Users', 'Features', 'Usage'],
    signals: [], // No specific signals - fallback type
    featureCategories: [
      { id: 'core', name: 'Core Features', description: 'Main functionality', critical: true },
      { id: 'team', name: 'Team Features', description: 'Collaboration', critical: false },
      { id: 'integrations', name: 'Integrations', description: 'Third-party connections', critical: false },
      { id: 'analytics', name: 'Analytics', description: 'Reporting, insights', critical: false },
      { id: 'support', name: 'Support', description: 'Help, documentation', critical: false },
    ],
    narrative: {
      summaryTemplate: 'This application provides {mainFeature}. Consider the specific use case to determine the best pricing model.',
      riskPatterns: [],
      opportunityPatterns: ['Consider your target market', 'Evaluate competitor pricing'],
      pricingAdvice: 'Standard feature-tiered pricing with 3-4 tiers. Evaluate competitors in your space for benchmarks.',
    },
  },
};

/**
 * Get business type config by ID
 */
export function getBusinessTypeConfig(type: BusinessType): BusinessTypeConfig {
  return BUSINESS_TYPES[type];
}

/**
 * Get all business types for display
 */
export function getAllBusinessTypes(): BusinessTypeConfig[] {
  return Object.values(BUSINESS_TYPES);
}

/**
 * Get business types sorted by detection confidence
 */
export function getBusinessTypesWithConfidence(
  detectedSignals: { type: BusinessType; confidence: number }[]
): Array<BusinessTypeConfig & { confidence: number }> {
  return detectedSignals
    .map(({ type, confidence }) => ({
      ...BUSINESS_TYPES[type],
      confidence,
    }))
    .sort((a, b) => b.confidence - a.confidence);
}
