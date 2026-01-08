/**
 * AI Codebase Analyzer Service
 * Uses AI to analyze codebases and extract pricing-relevant information
 */

import { getAutoClient, createAIClient } from './ai-client';
import { type AnalysisPayload } from './github';
import { extractCostsFromDependencies, type CostSuggestion } from '../data/dependency-costs';
import { type AIProvider } from './api-keys';

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
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

const ANALYSIS_SYSTEM_PROMPT = `You are an expert SaaS pricing analyst. Analyze codebases to extract:
1. Tech stack and infrastructure dependencies
2. User-facing features that could be monetized
3. Cost drivers (AI calls, storage, emails, etc.)
4. Suggested pricing tiers based on feature complexity

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
  "summary": "Brief 2-3 sentence summary of what this product does and how it should be priced",
  "confidence": {
    "overall": 75,
    "features": 80,
    "costs": 70,
    "tiers": 65
  }
}

Be thorough but focus on features that affect pricing. Confidence scores should reflect certainty (0-100).`;

/**
 * Prepare the analysis prompt with codebase data
 */
function preparePrompt(payload: AnalysisPayload): string {
  const dependencies = payload.packageJson
    ? JSON.stringify({
        dependencies: (payload.packageJson as Record<string, unknown>).dependencies ?? {},
        devDependencies: (payload.packageJson as Record<string, unknown>).devDependencies ?? {},
      }, null, 2)
    : 'No package.json found';

  const readme = payload.readme
    ? payload.readme.slice(0, 3000) // Limit README size
    : 'No README found';

  const sourceFiles = payload.srcFiles
    .slice(0, 10) // Limit to 10 files
    .map(f => `--- ${f.path} ---\n${f.content.slice(0, 2000)}`) // Limit each file
    .join('\n\n');

  return ANALYSIS_USER_PROMPT
    .replace('{repoName}', `${payload.repoInfo.owner}/${payload.repoInfo.repo}`)
    .replace('{repoDescription}', payload.repoInfo.description ?? 'No description')
    .replace('{language}', payload.repoInfo.language ?? 'Unknown')
    .replace('{dependencies}', dependencies)
    .replace('{readme}', readme)
    .replace('{sourceFiles}', sourceFiles);
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
    };
  } catch (e) {
    console.error('Failed to parse AI response:', e);
    console.error('Response was:', content);
    throw new Error('Failed to parse AI analysis response');
  }
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
