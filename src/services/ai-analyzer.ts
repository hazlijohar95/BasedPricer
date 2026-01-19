/**
 * AI Codebase Analyzer Service
 * Uses AI to analyze codebases and extract pricing-relevant information
 */

import { getAutoClient, createAIClient } from './ai-client';
import { type AnalysisPayload } from './github';
import { extractCostsFromDependencies, type CostSuggestion } from '../data/dependency-costs';
import { type AIProvider } from './api-keys';
import { type BusinessType, BUSINESS_TYPES, type PricingModelType } from '../data/business-types';

export interface DetectedFeature {
  id: string;
  name: string;
  description: string;
  category: string;
  costDriver?: string;
  confidence: number; // 0-100
}

export interface SuggestedTier {
  name: string;
  price: number;
  description: string;
  features: string[];
  limits: Record<string, number | 'unlimited'>;
}

export interface BusinessTypeDetection {
  detected: BusinessType;
  confidence: number;
  secondaryTypes: Array<{ type: BusinessType; confidence: number }>;
  signals: string[];
}

export interface AnalysisNarrative {
  summary: string;
  keyRisks: string[];
  keyOpportunities: string[];
  pricingRecommendation: string;
  whatMatters: string[];
}

export interface AnalysisResult {
  techStack: {
    framework: string;
    language: string;
    database?: string;
    hosting?: string;
    auth?: string;
  };
  features: DetectedFeature[];
  costSuggestions: CostSuggestion[];
  suggestedTiers: SuggestedTier[];
  summary: string;
  confidence: {
    overall: number;
    features: number;
    costs: number;
    tiers: number;
  };
  // New Phase 3 fields
  businessType: BusinessTypeDetection;
  narrative: AnalysisNarrative;
  tierModelType: PricingModelType;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

const ANALYSIS_SYSTEM_PROMPT = `You are an expert SaaS pricing analyst and software architect. Your task is to thoroughly analyze codebases to extract pricing-relevant information.

Key objectives:
1. **Business Type Classification**: First, classify what type of SaaS this is (API service, marketplace, fintech, AI/ML SaaS, developer tools, B2B SaaS, consumer SaaS, or generic)
2. **Tech Stack Analysis**: Identify framework, language, database, auth, hosting, and key libraries
3. **Feature Detection**: Find ALL user-facing features that could be monetized, with confidence scores
4. **Cost Driver Identification**: Map features to cost drivers (AI/LLM calls, storage, emails, API calls, compute)
5. **Tier Recommendations**: Suggest logical pricing tiers based on business type and feature complexity
6. **Narrative Insights**: Provide actionable insights, risks, opportunities, and recommendations

Business Type Definitions:
- api_service: API-as-a-service, developer APIs, data services (signals: versioned API routes, rate limiting, API docs)
- marketplace: Two-sided marketplace, e-commerce platform (signals: seller/buyer roles, listings, commissions)
- fintech: Financial services, banking, payments (signals: KYC/AML, bank connections, compliance)
- ai_ml_saas: AI-powered applications, ML platforms (signals: LLM APIs, tokens/credits, embeddings)
- developer_tools: Dev tools, CI/CD, code analysis (signals: GitHub integration, builds, deployments)
- b2b_saas: Business software, enterprise tools (signals: organizations, workspaces, SSO)
- consumer_saas: B2C applications, consumer tools (signals: social features, freemium, gamification)
- generic: Standard SaaS when no clear type detected

Analysis guidelines:
- Look for route handlers, API endpoints, and service files to identify features
- Check for AI/LLM integrations (OpenAI, Anthropic, Mistral, etc.)
- Identify storage services (S3, R2, Supabase Storage, etc.)
- Look for email services (Resend, SendGrid, Postmark, etc.)
- Find payment integrations (Stripe, PayPal, etc.)
- Detect auth patterns (Clerk, Auth.js, Supabase Auth, etc.)
- Match pricing model to business type (usage-based for API/AI, take-rate for marketplace, etc.)

You must respond with valid JSON only. No markdown, no explanation outside the JSON.`;

const ANALYSIS_USER_PROMPT = `Analyze this codebase and extract pricing-relevant information.

Repository: {repoName}
Description: {repoDescription}
Primary Language: {language}

Package.json dependencies:
{dependencies}

README (excerpt):
{readme}

Source file samples:
{sourceFiles}

---

Return a JSON object with this exact structure:
{
  "businessType": {
    "detected": "api_service | marketplace | fintech | ai_ml_saas | developer_tools | b2b_saas | consumer_saas | generic",
    "confidence": 85,
    "secondaryTypes": [
      { "type": "b2b_saas", "confidence": 40 }
    ],
    "signals": ["Found OpenAI integration", "Has versioned API routes", "Token usage tracking detected"]
  },
  "tierModelType": "usage_based | seat_based | feature_tiered | take_rate | hybrid | freemium",
  "techStack": {
    "framework": "string (e.g., Next.js, Remix, Express)",
    "language": "string (e.g., TypeScript, JavaScript)",
    "database": "string or null",
    "hosting": "string or null (e.g., Vercel, AWS)",
    "auth": "string or null (e.g., Clerk, NextAuth)"
  },
  "features": [
    {
      "id": "unique-id",
      "name": "Feature Name",
      "description": "What this feature does",
      "category": "Category (Auth, AI, Storage, Analytics, etc.)",
      "costDriver": "What drives the cost (API calls, storage, etc.) or null",
      "confidence": 85
    }
  ],
  "suggestedTiers": [
    {
      "name": "Free",
      "price": 0,
      "description": "For individuals getting started",
      "features": ["feature-id-1", "feature-id-2"],
      "limits": { "apiCalls": 100, "storage": 1 }
    },
    {
      "name": "Pro",
      "price": 29,
      "description": "For growing teams",
      "features": ["feature-id-1", "feature-id-2", "feature-id-3"],
      "limits": { "apiCalls": 10000, "storage": 50 }
    }
  ],
  "narrative": {
    "summary": "2-3 sentence summary tailored to the detected business type",
    "keyRisks": ["Risk 1", "Risk 2"],
    "keyOpportunities": ["Opportunity 1", "Opportunity 2"],
    "pricingRecommendation": "Specific pricing strategy recommendation based on business type",
    "whatMatters": ["Key metric 1 for this business type", "Key metric 2"]
  },
  "summary": "Brief 2-3 sentence summary of what this product does",
  "confidence": {
    "overall": 75,
    "features": 80,
    "costs": 70,
    "tiers": 65
  }
}

Be thorough but focus on features that affect pricing. Confidence scores should reflect certainty (0-100).
Match tierModelType to businessType: usage_based for API/AI, take_rate for marketplace, hybrid for fintech, etc.`;

/**
 * Prepare the analysis prompt with codebase data
 * Increased limits for more comprehensive analysis
 */
function preparePrompt(payload: AnalysisPayload): string {
  const dependencies = payload.packageJson
    ? JSON.stringify({
        dependencies: (payload.packageJson as Record<string, unknown>).dependencies ?? {},
        devDependencies: (payload.packageJson as Record<string, unknown>).devDependencies ?? {},
      }, null, 2)
    : 'No package.json found';

  // Increased README limit from 3000 to 5000 chars
  const readme = payload.readme
    ? payload.readme.slice(0, 5000)
    : 'No README found';

  // Increased from 10 to 20 files, and from 2000 to 4000 chars per file
  const sourceFiles = payload.srcFiles
    .slice(0, 20)
    .map(f => `--- ${f.path} ---\n${f.content.slice(0, 4000)}`)
    .join('\n\n');

  // Include config files for better context
  const configFiles = payload.configFiles
    .slice(0, 5)
    .map(f => `--- ${f.path} ---\n${f.content.slice(0, 2000)}`)
    .join('\n\n');

  return ANALYSIS_USER_PROMPT
    .replace('{repoName}', `${payload.repoInfo.owner}/${payload.repoInfo.repo}`)
    .replace('{repoDescription}', payload.repoInfo.description ?? 'No description')
    .replace('{language}', payload.repoInfo.language ?? 'Unknown')
    .replace('{dependencies}', dependencies)
    .replace('{readme}', readme)
    .replace('{sourceFiles}', `${sourceFiles}\n\n--- Config Files ---\n${configFiles}`);
}

/**
 * Parse AI response into structured result
 */
function parseAIResponse(content: string): Omit<AnalysisResult, 'costSuggestions' | 'tokenUsage'> {
  // Try to extract JSON from the response
  let jsonStr = content.trim();

  // Handle markdown code blocks
  if (jsonStr.startsWith('```')) {
    const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      jsonStr = match[1];
    }
  }

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate and safely extract features array
    const rawFeatures = Array.isArray(parsed.features) ? parsed.features : [];
    const features = rawFeatures.map((f: unknown, i: number) => {
      const feature = (typeof f === 'object' && f !== null) ? f as Record<string, unknown> : {};
      return {
        id: typeof feature.id === 'string' ? feature.id : `feature-${i}`,
        name: typeof feature.name === 'string' ? feature.name : 'Unknown Feature',
        description: typeof feature.description === 'string' ? feature.description : '',
        category: typeof feature.category === 'string' ? feature.category : 'Other',
        costDriver: typeof feature.costDriver === 'string' ? feature.costDriver : undefined,
        confidence: typeof feature.confidence === 'number' ? feature.confidence : 50,
      };
    });

    // Validate and safely extract suggested tiers array
    const suggestedTiers = Array.isArray(parsed.suggestedTiers) ? parsed.suggestedTiers : [];

    // Validate tech stack object
    const rawTechStack = (typeof parsed.techStack === 'object' && parsed.techStack !== null)
      ? parsed.techStack
      : {};

    // Validate business type detection
    const rawBusinessType = (typeof parsed.businessType === 'object' && parsed.businessType !== null)
      ? parsed.businessType as Record<string, unknown>
      : {};

    const businessType: BusinessTypeDetection = {
      detected: isValidBusinessType(rawBusinessType.detected) ? rawBusinessType.detected as BusinessType : 'generic',
      confidence: typeof rawBusinessType.confidence === 'number' ? rawBusinessType.confidence : 50,
      secondaryTypes: Array.isArray(rawBusinessType.secondaryTypes)
        ? rawBusinessType.secondaryTypes
            .filter((t: unknown) => typeof t === 'object' && t !== null)
            .map((t: unknown) => {
              const typed = t as Record<string, unknown>;
              return {
                type: isValidBusinessType(typed.type) ? typed.type as BusinessType : 'generic',
                confidence: typeof typed.confidence === 'number' ? typed.confidence : 0,
              };
            })
        : [],
      signals: Array.isArray(rawBusinessType.signals)
        ? rawBusinessType.signals.filter((s: unknown) => typeof s === 'string') as string[]
        : [],
    };

    // Validate narrative
    const rawNarrative = (typeof parsed.narrative === 'object' && parsed.narrative !== null)
      ? parsed.narrative as Record<string, unknown>
      : {};

    const narrative: AnalysisNarrative = {
      summary: typeof rawNarrative.summary === 'string' ? rawNarrative.summary : parsed.summary ?? '',
      keyRisks: Array.isArray(rawNarrative.keyRisks)
        ? rawNarrative.keyRisks.filter((r: unknown) => typeof r === 'string') as string[]
        : [],
      keyOpportunities: Array.isArray(rawNarrative.keyOpportunities)
        ? rawNarrative.keyOpportunities.filter((o: unknown) => typeof o === 'string') as string[]
        : [],
      pricingRecommendation: typeof rawNarrative.pricingRecommendation === 'string'
        ? rawNarrative.pricingRecommendation
        : 'Consider feature-tiered pricing based on your target market.',
      whatMatters: Array.isArray(rawNarrative.whatMatters)
        ? rawNarrative.whatMatters.filter((m: unknown) => typeof m === 'string') as string[]
        : [],
    };

    // Validate tier model type
    const tierModelType = isValidPricingModelType(parsed.tierModelType)
      ? parsed.tierModelType as PricingModelType
      : 'feature_tiered';

    return {
      techStack: {
        framework: typeof rawTechStack.framework === 'string' ? rawTechStack.framework : 'Unknown',
        language: typeof rawTechStack.language === 'string' ? rawTechStack.language : 'Unknown',
        database: typeof rawTechStack.database === 'string' ? rawTechStack.database : undefined,
        hosting: typeof rawTechStack.hosting === 'string' ? rawTechStack.hosting : undefined,
        auth: typeof rawTechStack.auth === 'string' ? rawTechStack.auth : undefined,
      },
      features,
      suggestedTiers,
      summary: typeof parsed.summary === 'string' ? parsed.summary : 'Analysis complete.',
      confidence: {
        overall: typeof parsed.confidence?.overall === 'number' ? parsed.confidence.overall : 50,
        features: typeof parsed.confidence?.features === 'number' ? parsed.confidence.features : 50,
        costs: typeof parsed.confidence?.costs === 'number' ? parsed.confidence.costs : 50,
        tiers: typeof parsed.confidence?.tiers === 'number' ? parsed.confidence.tiers : 50,
      },
      businessType,
      narrative,
      tierModelType,
    };
  } catch (e) {
    console.error('Failed to parse AI response:', e);
    console.error('Response was:', content);
    throw new Error('Failed to parse AI analysis response');
  }
}

/**
 * Type guard for BusinessType
 */
function isValidBusinessType(value: unknown): value is BusinessType {
  const validTypes: BusinessType[] = [
    'api_service', 'marketplace', 'fintech', 'ai_ml_saas',
    'developer_tools', 'b2b_saas', 'consumer_saas', 'generic'
  ];
  return typeof value === 'string' && validTypes.includes(value as BusinessType);
}

/**
 * Type guard for PricingModelType
 */
function isValidPricingModelType(value: unknown): value is PricingModelType {
  const validTypes: PricingModelType[] = [
    'usage_based', 'seat_based', 'feature_tiered', 'take_rate', 'hybrid', 'freemium'
  ];
  return typeof value === 'string' && validTypes.includes(value as PricingModelType);
}

/**
 * Analyze a codebase using AI
 */
export async function analyzeCodebase(
  payload: AnalysisPayload,
  options?: {
    provider?: AIProvider;
    apiKey?: string;
  }
): Promise<AnalysisResult> {
  // Get AI client
  const client = options?.provider && options?.apiKey
    ? createAIClient(options.provider, options.apiKey)
    : getAutoClient();

  if (!client) {
    throw new Error('No AI API key configured. Please add an API key in settings.');
  }

  // Extract dependency-based costs first (no AI needed)
  const pkgJson = payload.packageJson as Record<string, unknown> | undefined;
  const costSuggestions = extractCostsFromDependencies(
    (pkgJson?.dependencies as Record<string, string>) ?? {},
    (pkgJson?.devDependencies as Record<string, string>) ?? {}
  );

  // Prepare and send AI request
  const userPrompt = preparePrompt(payload);

  const response = await client.chat([
    { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ], {
    maxTokens: 4096,
    temperature: 0.2, // Lower for more consistent structured output
  });

  // Parse the response
  const parsed = parseAIResponse(response.content);

  return {
    ...parsed,
    costSuggestions,
    tokenUsage: response.usage,
  };
}

/**
 * Quick analysis using just package.json (no AI needed)
 */
export function quickAnalyzeFromPackageJson(
  packageJson: Record<string, unknown>
): Pick<AnalysisResult, 'techStack' | 'costSuggestions'> {
  // Safely extract dependencies with type validation
  const deps = (typeof packageJson.dependencies === 'object' && packageJson.dependencies !== null)
    ? packageJson.dependencies as Record<string, string>
    : {};
  const devDeps = (typeof packageJson.devDependencies === 'object' && packageJson.devDependencies !== null)
    ? packageJson.devDependencies as Record<string, string>
    : {};

  // Detect framework
  let framework = 'Unknown';
  if (deps['next']) framework = 'Next.js';
  else if (deps['remix']) framework = 'Remix';
  else if (deps['@remix-run/react']) framework = 'Remix';
  else if (deps['nuxt']) framework = 'Nuxt';
  else if (deps['vue']) framework = 'Vue';
  else if (deps['@angular/core']) framework = 'Angular';
  else if (deps['react']) framework = 'React';
  else if (deps['express']) framework = 'Express';
  else if (deps['fastify']) framework = 'Fastify';
  else if (deps['hono']) framework = 'Hono';

  // Detect language
  let language = 'JavaScript';
  if (devDeps['typescript'] || deps['typescript']) language = 'TypeScript';

  // Detect database
  let database: string | undefined;
  if (deps['@prisma/client'] || devDeps['prisma']) database = 'SQL (Prisma)';
  else if (deps['mongoose']) database = 'MongoDB';
  else if (deps['@supabase/supabase-js']) database = 'Supabase (Postgres)';
  else if (deps['drizzle-orm']) database = 'SQL (Drizzle)';
  else if (deps['@planetscale/database']) database = 'PlanetScale';
  else if (deps['firebase'] || deps['firebase-admin']) database = 'Firebase';

  // Detect auth
  let auth: string | undefined;
  if (deps['@clerk/nextjs'] || deps['@clerk/clerk-react']) auth = 'Clerk';
  else if (deps['next-auth'] || deps['@auth/core']) auth = 'NextAuth/Auth.js';
  else if (deps['@kinde-oss/kinde-auth-nextjs']) auth = 'Kinde';
  else if (deps['@auth0/nextjs-auth0']) auth = 'Auth0';
  else if (deps['@supabase/supabase-js']) auth = auth ?? 'Supabase Auth';

  // Detect hosting hints
  let hosting: string | undefined;
  if (deps['@vercel/edge'] || deps['@vercel/analytics']) hosting = 'Vercel';
  else if (deps['wrangler'] || devDeps['wrangler']) hosting = 'Cloudflare';

  return {
    techStack: {
      framework,
      language,
      database,
      hosting,
      auth,
    },
    costSuggestions: extractCostsFromDependencies(deps, devDeps),
  };
}

/**
 * Convert analysis result to pricing context format
 */
export function analysisToContextFormat(result: AnalysisResult) {
  // Convert cost suggestions to variable/fixed costs format
  const variableCosts = result.costSuggestions
    .filter(c => c.type === 'variable')
    .map((c, i) => ({
      id: `analysis-var-${i}`,
      name: c.name,
      unit: c.unit,
      costPerUnit: c.cost,
      usagePerCustomer: c.usagePerCustomer ?? 1,
      description: c.description,
    }));

  const fixedCosts = result.costSuggestions
    .filter(c => c.type === 'fixed')
    .map((c, i) => ({
      id: `analysis-fix-${i}`,
      name: c.name,
      monthlyCost: c.cost,
      description: c.description,
    }));

  // Convert features
  const features = result.features.map(f => ({
    id: f.id,
    name: f.name,
    description: f.description,
    category: f.category,
  }));

  return {
    variableCosts,
    fixedCosts,
    features,
    suggestedTiers: result.suggestedTiers,
  };
}
