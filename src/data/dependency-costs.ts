/**
 * Dependency to Cost Mapping
 * Maps npm packages to their typical cost implications
 */

export interface CostSuggestion {
  type: 'fixed' | 'variable';
  name: string;
  description: string;
  cost: number;
  unit: string;
  category: string;
  usagePerCustomer?: number; // For variable costs
  notes?: string;
}

/**
 * Map of npm package names to their cost implications
 */
export const DEPENDENCY_COST_MAP: Record<string, CostSuggestion> = {
  // ==========================================
  // AI / LLM
  // ==========================================
  'openai': {
    type: 'variable',
    name: 'OpenAI API',
    description: 'GPT API calls',
    cost: 0.03,
    unit: 'call',
    category: 'AI',
    usagePerCustomer: 50,
    notes: 'Cost varies by model. GPT-4 ~$0.03/1K tokens, GPT-3.5 ~$0.002/1K tokens',
  },
  '@anthropic-ai/sdk': {
    type: 'variable',
    name: 'Anthropic API',
    description: 'Claude API calls',
    cost: 0.015,
    unit: 'call',
    category: 'AI',
    usagePerCustomer: 50,
  },
  'ai': {
    type: 'variable',
    name: 'AI SDK (Vercel)',
    description: 'AI provider abstraction',
    cost: 0.02,
    unit: 'call',
    category: 'AI',
    usagePerCustomer: 50,
    notes: 'Actual cost depends on underlying provider',
  },
  'langchain': {
    type: 'variable',
    name: 'LangChain (LLM)',
    description: 'LLM orchestration',
    cost: 0.02,
    unit: 'call',
    category: 'AI',
    usagePerCustomer: 50,
  },
  '@langchain/core': {
    type: 'variable',
    name: 'LangChain (LLM)',
    description: 'LLM orchestration',
    cost: 0.02,
    unit: 'call',
    category: 'AI',
    usagePerCustomer: 50,
  },
  'replicate': {
    type: 'variable',
    name: 'Replicate API',
    description: 'ML model inference',
    cost: 0.01,
    unit: 'call',
    category: 'AI',
    usagePerCustomer: 20,
  },
  '@huggingface/inference': {
    type: 'variable',
    name: 'Hugging Face',
    description: 'ML inference API',
    cost: 0.005,
    unit: 'call',
    category: 'AI',
    usagePerCustomer: 30,
  },

  // ==========================================
  // Database
  // ==========================================
  '@supabase/supabase-js': {
    type: 'fixed',
    name: 'Supabase',
    description: 'Database + Auth + Storage',
    cost: 25,
    unit: 'month',
    category: 'Database',
    notes: 'Free tier available. Pro starts at $25/mo',
  },
  '@prisma/client': {
    type: 'fixed',
    name: 'Database (Prisma)',
    description: 'Self-hosted database',
    cost: 20,
    unit: 'month',
    category: 'Database',
    notes: 'Cost depends on hosting provider',
  },
  'prisma': {
    type: 'fixed',
    name: 'Database (Prisma)',
    description: 'Self-hosted database',
    cost: 20,
    unit: 'month',
    category: 'Database',
  },
  'mongoose': {
    type: 'fixed',
    name: 'MongoDB',
    description: 'MongoDB database',
    cost: 25,
    unit: 'month',
    category: 'Database',
    notes: 'MongoDB Atlas pricing',
  },
  'drizzle-orm': {
    type: 'fixed',
    name: 'Database (Drizzle)',
    description: 'Self-hosted database',
    cost: 15,
    unit: 'month',
    category: 'Database',
  },
  '@planetscale/database': {
    type: 'fixed',
    name: 'PlanetScale',
    description: 'Serverless MySQL',
    cost: 29,
    unit: 'month',
    category: 'Database',
  },
  '@upstash/redis': {
    type: 'fixed',
    name: 'Upstash Redis',
    description: 'Serverless Redis',
    cost: 10,
    unit: 'month',
    category: 'Database',
  },
  '@upstash/ratelimit': {
    type: 'fixed',
    name: 'Upstash (Rate Limit)',
    description: 'Rate limiting service',
    cost: 5,
    unit: 'month',
    category: 'Database',
  },
  'ioredis': {
    type: 'fixed',
    name: 'Redis',
    description: 'Redis cache',
    cost: 15,
    unit: 'month',
    category: 'Database',
  },
  '@neondatabase/serverless': {
    type: 'fixed',
    name: 'Neon Database',
    description: 'Serverless Postgres',
    cost: 19,
    unit: 'month',
    category: 'Database',
  },

  // ==========================================
  // Email
  // ==========================================
  '@sendgrid/mail': {
    type: 'variable',
    name: 'SendGrid Email',
    description: 'Transactional email',
    cost: 0.001,
    unit: 'email',
    category: 'Email',
    usagePerCustomer: 10,
  },
  'resend': {
    type: 'variable',
    name: 'Resend Email',
    description: 'Developer email',
    cost: 0.001,
    unit: 'email',
    category: 'Email',
    usagePerCustomer: 10,
  },
  '@react-email/components': {
    type: 'fixed',
    name: 'React Email',
    description: 'Email templates',
    cost: 0,
    unit: 'month',
    category: 'Email',
    notes: 'Free - just templates',
  },
  'nodemailer': {
    type: 'fixed',
    name: 'Email Server',
    description: 'Self-hosted email',
    cost: 10,
    unit: 'month',
    category: 'Email',
  },
  'postmark': {
    type: 'variable',
    name: 'Postmark',
    description: 'Transactional email',
    cost: 0.001,
    unit: 'email',
    category: 'Email',
    usagePerCustomer: 10,
  },

  // ==========================================
  // Storage / Files
  // ==========================================
  '@aws-sdk/client-s3': {
    type: 'variable',
    name: 'AWS S3',
    description: 'File storage',
    cost: 0.023,
    unit: 'GB',
    category: 'Storage',
    usagePerCustomer: 1,
  },
  '@uploadthing/react': {
    type: 'variable',
    name: 'UploadThing',
    description: 'File uploads',
    cost: 0.05,
    unit: 'GB',
    category: 'Storage',
    usagePerCustomer: 0.5,
  },
  'uploadthing': {
    type: 'variable',
    name: 'UploadThing',
    description: 'File uploads',
    cost: 0.05,
    unit: 'GB',
    category: 'Storage',
    usagePerCustomer: 0.5,
  },
  '@vercel/blob': {
    type: 'variable',
    name: 'Vercel Blob',
    description: 'Blob storage',
    cost: 0.02,
    unit: 'GB',
    category: 'Storage',
    usagePerCustomer: 0.5,
  },
  'cloudinary': {
    type: 'fixed',
    name: 'Cloudinary',
    description: 'Image/video hosting',
    cost: 25,
    unit: 'month',
    category: 'Storage',
  },

  // ==========================================
  // Auth
  // ==========================================
  '@clerk/nextjs': {
    type: 'fixed',
    name: 'Clerk Auth',
    description: 'Authentication',
    cost: 25,
    unit: 'month',
    category: 'Auth',
    notes: 'Free up to 10K MAU',
  },
  '@clerk/clerk-react': {
    type: 'fixed',
    name: 'Clerk Auth',
    description: 'Authentication',
    cost: 25,
    unit: 'month',
    category: 'Auth',
  },
  'next-auth': {
    type: 'fixed',
    name: 'NextAuth',
    description: 'Self-hosted auth',
    cost: 0,
    unit: 'month',
    category: 'Auth',
    notes: 'Free - self-hosted',
  },
  '@auth/core': {
    type: 'fixed',
    name: 'Auth.js',
    description: 'Self-hosted auth',
    cost: 0,
    unit: 'month',
    category: 'Auth',
  },
  '@kinde-oss/kinde-auth-nextjs': {
    type: 'fixed',
    name: 'Kinde Auth',
    description: 'Authentication',
    cost: 25,
    unit: 'month',
    category: 'Auth',
  },
  '@auth0/nextjs-auth0': {
    type: 'fixed',
    name: 'Auth0',
    description: 'Authentication',
    cost: 23,
    unit: 'month',
    category: 'Auth',
  },
  'firebase': {
    type: 'fixed',
    name: 'Firebase',
    description: 'Backend + Auth',
    cost: 25,
    unit: 'month',
    category: 'Auth',
  },

  // ==========================================
  // Payments
  // ==========================================
  'stripe': {
    type: 'variable',
    name: 'Stripe Fees',
    description: 'Payment processing',
    cost: 2.9,
    unit: '%',
    category: 'Payments',
    notes: '2.9% + $0.30 per transaction',
  },
  '@stripe/stripe-js': {
    type: 'variable',
    name: 'Stripe Fees',
    description: 'Payment processing',
    cost: 2.9,
    unit: '%',
    category: 'Payments',
  },
  '@lemonsqueezy/lemonsqueezy.js': {
    type: 'variable',
    name: 'LemonSqueezy',
    description: 'Payment processing',
    cost: 5,
    unit: '%',
    category: 'Payments',
    notes: '5% + $0.50 per transaction',
  },
  'paddle-sdk': {
    type: 'variable',
    name: 'Paddle',
    description: 'Payment processing',
    cost: 5,
    unit: '%',
    category: 'Payments',
  },

  // ==========================================
  // Monitoring / Analytics
  // ==========================================
  '@sentry/nextjs': {
    type: 'fixed',
    name: 'Sentry',
    description: 'Error tracking',
    cost: 26,
    unit: 'month',
    category: 'Monitoring',
  },
  '@sentry/react': {
    type: 'fixed',
    name: 'Sentry',
    description: 'Error tracking',
    cost: 26,
    unit: 'month',
    category: 'Monitoring',
  },
  'posthog-js': {
    type: 'fixed',
    name: 'PostHog',
    description: 'Product analytics',
    cost: 0,
    unit: 'month',
    category: 'Monitoring',
    notes: 'Free tier available',
  },
  '@vercel/analytics': {
    type: 'fixed',
    name: 'Vercel Analytics',
    description: 'Web analytics',
    cost: 10,
    unit: 'month',
    category: 'Monitoring',
  },
  'mixpanel': {
    type: 'fixed',
    name: 'Mixpanel',
    description: 'Product analytics',
    cost: 25,
    unit: 'month',
    category: 'Monitoring',
  },

  // ==========================================
  // Search
  // ==========================================
  'algoliasearch': {
    type: 'variable',
    name: 'Algolia Search',
    description: 'Full-text search',
    cost: 0.0001,
    unit: 'operation',
    category: 'Search',
    usagePerCustomer: 100,
  },
  '@meilisearch/instant-meilisearch': {
    type: 'fixed',
    name: 'Meilisearch',
    description: 'Search engine',
    cost: 30,
    unit: 'month',
    category: 'Search',
  },
  'typesense': {
    type: 'fixed',
    name: 'Typesense',
    description: 'Search engine',
    cost: 30,
    unit: 'month',
    category: 'Search',
  },

  // ==========================================
  // Hosting Indicators
  // ==========================================
  '@vercel/edge': {
    type: 'fixed',
    name: 'Vercel Pro',
    description: 'Edge functions hosting',
    cost: 20,
    unit: 'month',
    category: 'Hosting',
  },
  '@cloudflare/workers-types': {
    type: 'fixed',
    name: 'Cloudflare Workers',
    description: 'Edge hosting',
    cost: 5,
    unit: 'month',
    category: 'Hosting',
  },
  'wrangler': {
    type: 'fixed',
    name: 'Cloudflare Workers',
    description: 'Edge hosting',
    cost: 5,
    unit: 'month',
    category: 'Hosting',
  },

  // ==========================================
  // CMS
  // ==========================================
  '@sanity/client': {
    type: 'fixed',
    name: 'Sanity CMS',
    description: 'Headless CMS',
    cost: 15,
    unit: 'month',
    category: 'CMS',
  },
  'contentful': {
    type: 'fixed',
    name: 'Contentful',
    description: 'Headless CMS',
    cost: 300,
    unit: 'month',
    category: 'CMS',
  },
  '@notionhq/client': {
    type: 'fixed',
    name: 'Notion API',
    description: 'Notion as CMS',
    cost: 0,
    unit: 'month',
    category: 'CMS',
    notes: 'Requires Notion subscription',
  },

  // ==========================================
  // Real-time
  // ==========================================
  'pusher': {
    type: 'variable',
    name: 'Pusher',
    description: 'Real-time messaging',
    cost: 0.0001,
    unit: 'message',
    category: 'Real-time',
    usagePerCustomer: 1000,
  },
  'socket.io': {
    type: 'fixed',
    name: 'WebSocket Server',
    description: 'Real-time connections',
    cost: 10,
    unit: 'month',
    category: 'Real-time',
    notes: 'Self-hosted cost',
  },
  '@liveblocks/client': {
    type: 'fixed',
    name: 'Liveblocks',
    description: 'Collaborative features',
    cost: 25,
    unit: 'month',
    category: 'Real-time',
  },
  'ably': {
    type: 'variable',
    name: 'Ably',
    description: 'Real-time messaging',
    cost: 0.00002,
    unit: 'message',
    category: 'Real-time',
    usagePerCustomer: 1000,
  },

  // ==========================================
  // Queue / Background Jobs
  // ==========================================
  '@trigger.dev/sdk': {
    type: 'fixed',
    name: 'Trigger.dev',
    description: 'Background jobs',
    cost: 10,
    unit: 'month',
    category: 'Background Jobs',
  },
  'inngest': {
    type: 'fixed',
    name: 'Inngest',
    description: 'Background jobs',
    cost: 20,
    unit: 'month',
    category: 'Background Jobs',
  },
  'bullmq': {
    type: 'fixed',
    name: 'BullMQ (Redis)',
    description: 'Queue + Redis',
    cost: 15,
    unit: 'month',
    category: 'Background Jobs',
  },
};

/**
 * Extract cost suggestions from package.json dependencies
 */
export function extractCostsFromDependencies(
  dependencies: Record<string, string> = {},
  devDependencies: Record<string, string> = {}
): CostSuggestion[] {
  // Include both dependencies and devDependencies (some cost drivers like prisma are dev deps)
  const allDeps = { ...dependencies, ...devDependencies };
  const suggestions: CostSuggestion[] = [];
  const seen = new Set<string>();

  for (const pkg of Object.keys(allDeps)) {
    const costInfo = DEPENDENCY_COST_MAP[pkg];
    if (costInfo && !seen.has(costInfo.name)) {
      seen.add(costInfo.name);
      suggestions.push(costInfo);
    }
  }

  return suggestions;
}

/**
 * Group suggestions by category
 */
export function groupSuggestionsByCategory(
  suggestions: CostSuggestion[]
): Record<string, CostSuggestion[]> {
  return suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.category]) {
      acc[suggestion.category] = [];
    }
    acc[suggestion.category].push(suggestion);
    return acc;
  }, {} as Record<string, CostSuggestion[]>);
}

/**
 * Calculate estimated monthly cost from suggestions
 */
export function estimateMonthlyCost(
  suggestions: CostSuggestion[],
  customerCount: number = 100
): { fixed: number; variable: number; total: number } {
  let fixed = 0;
  let variable = 0;

  for (const s of suggestions) {
    if (s.type === 'fixed') {
      fixed += s.cost;
    } else {
      const usage = (s.usagePerCustomer ?? 1) * customerCount;
      if (s.unit === '%') {
        // Percentage-based (like Stripe) - assume $50 average transaction
        variable += (s.cost / 100) * 50 * usage;
      } else {
        variable += s.cost * usage;
      }
    }
  }

  return { fixed, variable, total: fixed + variable };
}
