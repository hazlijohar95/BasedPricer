# BasedPricer Restructure Plan: MCP + CLI Support

## Executive Summary

This document outlines a comprehensive plan to restructure BasedPricer from a React-only web app into a multi-interface platform supporting:
- **Web App** (existing)
- **CLI Tool** (`basedpricer` command)
- **MCP Server** (for AI assistants like Claude Code)

**Timeline**: 4 phases over ~3-4 weeks
**Approach**: Extract core logic → Build CLI → Build MCP → Update docs

---

## Phase 1: Core Package Extraction

### 1.1 Create Monorepo Structure

Convert the project to a monorepo using npm workspaces:

```
basedpricer/
├── packages/
│   ├── core/                    # @basedpricer/core - Business logic
│   ├── cli/                     # @basedpricer/cli - CLI tool
│   ├── mcp/                     # @basedpricer/mcp - MCP server
│   └── web/                     # Current React app (moved)
├── package.json                 # Root workspace config
├── tsconfig.base.json          # Shared TypeScript config
├── turbo.json                  # Turborepo config (optional)
└── README.md
```

**Root package.json:**
```json
{
  "name": "basedpricer",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces"
  }
}
```

### 1.2 Core Package Structure

```
packages/core/
├── src/
│   ├── index.ts                 # Public API exports
│   │
│   ├── calculators/
│   │   ├── cogs.ts              # COGS calculations
│   │   ├── margin.ts            # Margin analysis
│   │   ├── investor-metrics.ts  # LTV, CAC, ARR calculations
│   │   ├── ai-cost.ts           # Token cost estimation
│   │   └── index.ts
│   │
│   ├── analyzers/
│   │   ├── codebase.ts          # AI-powered codebase analysis
│   │   ├── dependency.ts        # package.json cost extraction
│   │   ├── business-type.ts     # Business type detection
│   │   └── index.ts
│   │
│   ├── generators/
│   │   ├── tiers.ts             # Tier recommendation generator
│   │   ├── reports.ts           # Report generation
│   │   └── index.ts
│   │
│   ├── providers/
│   │   ├── ai/
│   │   │   ├── base.ts          # AIProvider interface
│   │   │   ├── openai.ts
│   │   │   ├── anthropic.ts
│   │   │   ├── openrouter.ts
│   │   │   ├── groq.ts
│   │   │   └── index.ts
│   │   ├── github.ts            # GitHub API client
│   │   └── index.ts
│   │
│   ├── schemas/
│   │   ├── costs.ts
│   │   ├── tiers.ts
│   │   ├── features.ts
│   │   ├── analysis.ts
│   │   ├── reports.ts
│   │   └── index.ts
│   │
│   ├── data/
│   │   ├── business-types.ts
│   │   ├── ai-pricing.ts
│   │   ├── dependency-costs.ts
│   │   ├── tier-templates.ts
│   │   └── index.ts
│   │
│   ├── types/
│   │   ├── costs.ts
│   │   ├── tiers.ts
│   │   ├── features.ts
│   │   ├── analysis.ts
│   │   └── index.ts
│   │
│   └── utils/
│       ├── currency.ts
│       ├── validation.ts
│       └── index.ts
│
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

### 1.3 Core Package API Design

**Public API (`packages/core/src/index.ts`):**

```typescript
// ============================================
// @basedpricer/core - Public API
// ============================================

// ----- Types -----
export type {
  // Costs
  VariableCostItem,
  FixedCostItem,
  CostBreakdown,
  MarginInfo,
  MarginStatus,

  // Tiers
  Tier,
  TierLimit,
  TierRecommendation,

  // Features
  Feature,
  FeatureCategory,
  CostDriver,

  // Analysis
  CodebaseAnalysis,
  BusinessType,
  PricingModelType,
  TechStack,

  // Reports
  Report,
  ReportType,
  StakeholderType,

  // Config
  AIProviderConfig,
  CurrencyCode,
} from './types';

// ----- Schemas (Zod) -----
export {
  VariableCostItemSchema,
  FixedCostItemSchema,
  TierSchema,
  FeatureSchema,
  CodebaseAnalysisSchema,
  ReportSchema,
} from './schemas';

// ----- Calculators -----
export {
  // COGS
  calculateVariableCosts,
  calculateFixedCosts,
  calculateCOGSBreakdown,
  calculateCOGSPerCustomer,

  // Margins
  calculateGrossMargin,
  calculateOperatingMargin,
  calculateTierMargin,
  getMarginStatus,
  getMarginHealth,

  // Investor Metrics
  calculateLTV,
  calculateCAC,
  calculateLTVCACRatio,
  calculatePaybackPeriod,
  calculateARR,
  calculateMRR,
  projectValuation,

  // AI Costs
  estimateTokenCost,
  estimateAnalysisCost,
  getAIProviderPricing,
} from './calculators';

// ----- Analyzers -----
export {
  // Codebase Analysis
  analyzeCodebase,
  analyzeFromPackageJson,

  // Dependency Analysis
  extractDependencyCosts,
  detectTechStack,

  // Business Type
  detectBusinessType,
  getBusinessTypeConfig,
} from './analyzers';

// ----- Generators -----
export {
  // Tiers
  generateTierRecommendations,
  applyTierTemplate,

  // Reports
  generateReport,
  encodeReport,
  decodeReport,
} from './generators';

// ----- Providers -----
export {
  // AI Providers
  createAIClient,
  AIProvider,

  // GitHub
  GitHubClient,
  parseGitHubUrl,
  fetchRepoForAnalysis,
} from './providers';

// ----- Data -----
export {
  BUSINESS_TYPES,
  AI_PRICING,
  DEPENDENCY_COSTS,
  TIER_TEMPLATES,
  MARGIN_THRESHOLDS,
  CURRENCIES,
} from './data';

// ----- Utilities -----
export {
  formatCurrency,
  convertCurrency,
  roundToNearest,
} from './utils';
```

### 1.4 Files to Extract from Current Codebase

| Current Location | Target Location | Changes Needed |
|-----------------|-----------------|----------------|
| `src/utils/costCalculator.ts` | `core/src/calculators/cogs.ts` | Remove React imports |
| `src/utils/marginUtils.ts` | `core/src/calculators/margin.ts` | Split color utils (keep in web) |
| `src/utils/investorMetrics.ts` | `core/src/calculators/investor-metrics.ts` | None |
| `src/utils/aiCostCalculator.ts` | `core/src/calculators/ai-cost.ts` | None |
| `src/services/ai-analyzer.ts` | `core/src/analyzers/codebase.ts` | Remove context imports |
| `src/services/ai-client.ts` | `core/src/providers/ai/` | Split into provider files |
| `src/services/github.ts` | `core/src/providers/github.ts` | None |
| `src/schemas/*.ts` | `core/src/schemas/*.ts` | None |
| `src/data/*.ts` | `core/src/data/*.ts` | None |
| `src/utils/reportEncoder.ts` | `core/src/generators/reports.ts` | Decouple from PricingState |
| `src/utils/currency.ts` | `core/src/utils/currency.ts` | None |
| `src/constants/index.ts` | `core/src/data/constants.ts` | Split UI constants |

### 1.5 Core Package Dependencies

```json
{
  "name": "@basedpricer/core",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "dependencies": {
    "zod": "^4.3.5",
    "lz-string": "^1.5.0"
  },
  "devDependencies": {
    "typescript": "^5.9.0",
    "vitest": "^3.2.0",
    "tsup": "^8.5.0"
  }
}
```

### 1.6 Build Configuration

**tsconfig.json for core:**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["**/*.test.ts"]
}
```

**tsup.config.ts for bundling:**
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
});
```

---

## Phase 2: CLI Tool Development

### 2.1 CLI Package Structure

```
packages/cli/
├── src/
│   ├── index.ts                 # Entry point
│   ├── cli.ts                   # Command definitions
│   │
│   ├── commands/
│   │   ├── analyze.ts           # basedpricer analyze
│   │   ├── cogs.ts              # basedpricer cogs
│   │   ├── tiers.ts             # basedpricer tiers
│   │   ├── report.ts            # basedpricer report
│   │   ├── config.ts            # basedpricer config
│   │   └── index.ts
│   │
│   ├── formatters/
│   │   ├── table.ts             # Table output
│   │   ├── json.ts              # JSON output
│   │   ├── markdown.ts          # Markdown output
│   │   └── index.ts
│   │
│   ├── prompts/
│   │   ├── costs.ts             # Interactive cost entry
│   │   ├── tiers.ts             # Interactive tier config
│   │   └── index.ts
│   │
│   └── utils/
│       ├── config.ts            # Config file management
│       ├── spinner.ts           # Loading spinners
│       ├── colors.ts            # Terminal colors
│       └── index.ts
│
├── bin/
│   └── basedpricer.js           # CLI entry script
│
├── package.json
├── tsconfig.json
└── README.md
```

### 2.2 CLI Commands Design

#### Command: `basedpricer analyze`
Analyze a GitHub repository or local codebase.

```bash
# Analyze GitHub repo
basedpricer analyze --repo https://github.com/user/repo

# Analyze local directory
basedpricer analyze --path ./my-project

# Quick analysis (no AI, just package.json)
basedpricer analyze --repo https://github.com/user/repo --quick

# Output formats
basedpricer analyze --repo ... --output json
basedpricer analyze --repo ... --output table
basedpricer analyze --repo ... --output markdown

# Save to file
basedpricer analyze --repo ... -o analysis.json
```

**Output includes:**
- Detected business type + confidence
- Tech stack (framework, language, database, etc.)
- Extracted features with cost drivers
- Detected dependencies with estimated costs
- Recommended pricing model

#### Command: `basedpricer cogs`
Calculate COGS and margins.

```bash
# Interactive mode
basedpricer cogs

# From file
basedpricer cogs --input costs.json

# With customer count
basedpricer cogs --input costs.json --customers 1000

# Calculate for specific price point
basedpricer cogs --input costs.json --price 49.99 --customers 1000

# Output
basedpricer cogs --input costs.json --output table
basedpricer cogs --input costs.json --output json > breakdown.json
```

**Output includes:**
- Variable costs breakdown (per customer)
- Fixed costs breakdown (monthly)
- Total COGS per customer
- Margin analysis at given price
- Margin health status

#### Command: `basedpricer tiers`
Generate or configure pricing tiers.

```bash
# Generate recommendations from analysis
basedpricer tiers --from-analysis analysis.json

# Generate for specific business type
basedpricer tiers --business-type ai_ml_saas

# Interactive tier builder
basedpricer tiers --interactive

# Calculate tier economics
basedpricer tiers --input tiers.json --costs costs.json --customers 1000

# Output
basedpricer tiers --from-analysis analysis.json --output markdown
```

**Output includes:**
- Recommended tier structure (Free/Basic/Pro/Enterprise)
- Feature allocation per tier
- Price points (with currency conversion)
- Expected margins per tier

#### Command: `basedpricer report`
Generate stakeholder reports.

```bash
# Generate investor report
basedpricer report --type investor --analysis analysis.json --costs costs.json

# Generate all report types
basedpricer report --type all --analysis analysis.json

# Available types: investor, accountant, engineer, marketer
basedpricer report --type accountant -o accountant-report.md

# Include custom notes
basedpricer report --type investor --notes "Series A preparation"
```

#### Command: `basedpricer config`
Manage configuration and API keys.

```bash
# Set API key
basedpricer config set openai-key sk-xxx
basedpricer config set anthropic-key sk-ant-xxx
basedpricer config set github-token ghp_xxx

# View current config
basedpricer config list

# Set default AI provider
basedpricer config set default-provider anthropic

# Set default currency
basedpricer config set currency USD
```

### 2.3 CLI Input/Output Formats

**Input: costs.json**
```json
{
  "variableCosts": [
    {
      "name": "OpenAI API",
      "unit": "1K tokens",
      "costPerUnit": 0.03,
      "usagePerCustomer": 50,
      "description": "GPT-4 for analysis"
    }
  ],
  "fixedCosts": [
    {
      "name": "Vercel Hosting",
      "monthlyCost": 20,
      "description": "Pro plan"
    }
  ]
}
```

**Input: analysis.json** (from `analyze` command)
```json
{
  "businessType": "ai_ml_saas",
  "businessTypeConfidence": 0.85,
  "pricingModel": "usage_based",
  "techStack": {
    "framework": "Next.js",
    "language": "TypeScript",
    "database": "PostgreSQL",
    "auth": "NextAuth",
    "hosting": "Vercel"
  },
  "features": [...],
  "dependencies": [...],
  "estimatedCosts": {...}
}
```

**Output: Table format**
```
┌─────────────────────────────────────────────────────────┐
│                    COGS Breakdown                        │
├─────────────────────┬──────────┬────────────┬───────────┤
│ Cost Item           │ Type     │ Per Unit   │ Monthly   │
├─────────────────────┼──────────┼────────────┼───────────┤
│ OpenAI API          │ Variable │ RM 0.03    │ RM 1,500  │
│ Supabase            │ Variable │ RM 0.01    │ RM 500    │
│ Vercel Hosting      │ Fixed    │ -          │ RM 88     │
│ Domain              │ Fixed    │ -          │ RM 5      │
├─────────────────────┼──────────┼────────────┼───────────┤
│ Total COGS          │          │            │ RM 2,093  │
│ COGS per Customer   │          │ RM 2.09    │           │
└─────────────────────┴──────────┴────────────┴───────────┘

Margin Analysis (at RM 49/month):
  Gross Margin: 95.7% ✓ Healthy
  Break-even: 43 customers
```

### 2.4 CLI Dependencies

```json
{
  "name": "@basedpricer/cli",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "basedpricer": "./bin/basedpricer.js"
  },
  "dependencies": {
    "@basedpricer/core": "workspace:*",
    "commander": "^13.1.0",
    "inquirer": "^14.0.0",
    "chalk": "^5.4.0",
    "ora": "^8.2.0",
    "cli-table3": "^0.6.5",
    "conf": "^13.1.0"
  }
}
```

### 2.5 CLI UX Design Principles

1. **Progressive disclosure**: Simple commands work out of the box, advanced options available
2. **Sensible defaults**: Works without config for basic usage
3. **Multiple output formats**: JSON for scripting, table for humans, markdown for docs
4. **Interactive fallback**: If required input missing, prompt interactively
5. **Clear error messages**: Actionable errors with suggestions
6. **Progress feedback**: Spinners for long operations (AI analysis)
7. **Color coding**: Green for healthy, yellow for warning, red for issues
8. **Pipe-friendly**: JSON output can be piped to other tools

---

## Phase 3: MCP Server Development

### 3.1 MCP Package Structure

```
packages/mcp/
├── src/
│   ├── index.ts                 # Entry point
│   ├── server.ts                # MCP server setup
│   │
│   ├── tools/
│   │   ├── analyze-codebase.ts
│   │   ├── calculate-cogs.ts
│   │   ├── calculate-margins.ts
│   │   ├── generate-tiers.ts
│   │   ├── generate-report.ts
│   │   ├── estimate-ai-costs.ts
│   │   └── index.ts
│   │
│   ├── resources/
│   │   ├── business-types.ts
│   │   ├── pricing-models.ts
│   │   ├── ai-pricing.ts
│   │   └── index.ts
│   │
│   └── prompts/
│       ├── pricing-advisor.ts
│       └── index.ts
│
├── bin/
│   └── basedpricer-mcp.js
│
├── package.json
├── tsconfig.json
└── README.md
```

### 3.2 MCP Tools Design

#### Tool: `analyze_codebase`
```typescript
{
  name: "analyze_codebase",
  description: "Analyze a GitHub repository or local codebase to detect business type, features, tech stack, and estimated costs for pricing decisions",
  inputSchema: {
    type: "object",
    properties: {
      source: {
        type: "string",
        description: "GitHub URL (https://github.com/user/repo) or local path"
      },
      quick: {
        type: "boolean",
        description: "Quick analysis from package.json only (no AI)",
        default: false
      },
      aiProvider: {
        type: "string",
        enum: ["openai", "anthropic", "openrouter", "groq"],
        description: "AI provider to use for analysis"
      }
    },
    required: ["source"]
  }
}
```

**Returns:**
```typescript
{
  businessType: "ai_ml_saas",
  businessTypeConfidence: 0.85,
  pricingModel: "usage_based",
  techStack: {...},
  features: [...],
  estimatedMonthlyCosts: {
    variable: 450,
    fixed: 120,
    total: 570
  },
  recommendations: {
    pricingStrategy: "Usage-based with base fee",
    suggestedTiers: ["Free", "Pro", "Enterprise"],
    keyMetrics: ["API calls", "tokens processed"]
  }
}
```

#### Tool: `calculate_cogs`
```typescript
{
  name: "calculate_cogs",
  description: "Calculate Cost of Goods Sold breakdown and margins for a SaaS product",
  inputSchema: {
    type: "object",
    properties: {
      variableCosts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            unit: { type: "string" },
            costPerUnit: { type: "number" },
            usagePerCustomer: { type: "number" }
          }
        }
      },
      fixedCosts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            monthlyCost: { type: "number" }
          }
        }
      },
      customerCount: { type: "number", default: 100 },
      pricePerCustomer: { type: "number" },
      currency: {
        type: "string",
        enum: ["MYR", "USD", "SGD", "EUR", "GBP"],
        default: "MYR"
      }
    },
    required: ["variableCosts", "fixedCosts"]
  }
}
```

#### Tool: `calculate_margins`
```typescript
{
  name: "calculate_margins",
  description: "Analyze profit margins and health status for given costs and pricing",
  inputSchema: {
    type: "object",
    properties: {
      cogs: { type: "number", description: "Cost per customer" },
      price: { type: "number", description: "Price per customer" },
      customerCount: { type: "number" },
      fixedCosts: { type: "number", description: "Total monthly fixed costs" }
    },
    required: ["cogs", "price"]
  }
}
```

**Returns:**
```typescript
{
  grossMargin: 72.5,
  grossMarginStatus: "healthy",
  operatingMargin: 45.2,
  operatingMarginStatus: "acceptable",
  profitPerCustomer: 35.50,
  monthlyProfit: 3550,
  breakEvenCustomers: 28,
  recommendations: [
    "Gross margin is healthy at 72.5%",
    "Consider reducing variable costs to improve operating margin"
  ]
}
```

#### Tool: `generate_tier_recommendations`
```typescript
{
  name: "generate_tier_recommendations",
  description: "Generate pricing tier recommendations based on business type and features",
  inputSchema: {
    type: "object",
    properties: {
      businessType: {
        type: "string",
        enum: ["api_service", "marketplace", "fintech", "ai_ml_saas", "developer_tools", "b2b_saas", "consumer_saas"]
      },
      features: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            category: { type: "string" },
            costDriver: { type: "string" }
          }
        }
      },
      targetMargin: { type: "number", default: 70 },
      currency: { type: "string", default: "MYR" }
    },
    required: ["businessType"]
  }
}
```

#### Tool: `generate_report`
```typescript
{
  name: "generate_report",
  description: "Generate a stakeholder-specific pricing report",
  inputSchema: {
    type: "object",
    properties: {
      reportType: {
        type: "string",
        enum: ["investor", "accountant", "engineer", "marketer"],
        description: "Target audience for the report"
      },
      projectName: { type: "string" },
      analysis: { type: "object", description: "Codebase analysis results" },
      costs: { type: "object", description: "COGS breakdown" },
      tiers: { type: "array", description: "Pricing tiers" },
      notes: { type: "string", description: "Additional notes" }
    },
    required: ["reportType", "projectName"]
  }
}
```

#### Tool: `estimate_ai_costs`
```typescript
{
  name: "estimate_ai_costs",
  description: "Estimate AI/LLM API costs for a product based on usage patterns",
  inputSchema: {
    type: "object",
    properties: {
      provider: {
        type: "string",
        enum: ["openai", "anthropic", "groq", "openrouter"]
      },
      model: { type: "string" },
      estimatedInputTokens: { type: "number" },
      estimatedOutputTokens: { type: "number" },
      requestsPerCustomer: { type: "number" },
      customerCount: { type: "number" }
    },
    required: ["provider", "model", "estimatedInputTokens", "estimatedOutputTokens"]
  }
}
```

### 3.3 MCP Resources

```typescript
// Resource: business_types
{
  uri: "basedpricer://data/business-types",
  name: "Business Types",
  description: "Reference data for all supported business types and their characteristics",
  mimeType: "application/json"
}

// Resource: pricing_models
{
  uri: "basedpricer://data/pricing-models",
  name: "Pricing Models",
  description: "Reference data for SaaS pricing models (usage-based, seat-based, etc.)",
  mimeType: "application/json"
}

// Resource: ai_pricing
{
  uri: "basedpricer://data/ai-pricing",
  name: "AI Provider Pricing",
  description: "Current pricing for AI providers (OpenAI, Anthropic, etc.)",
  mimeType: "application/json"
}

// Resource: margin_thresholds
{
  uri: "basedpricer://data/margin-thresholds",
  name: "Margin Thresholds",
  description: "Industry standard SaaS margin thresholds",
  mimeType: "application/json"
}
```

### 3.4 MCP Prompts

```typescript
// Prompt: pricing_advisor
{
  name: "pricing_advisor",
  description: "Get AI-powered pricing advice for your SaaS product",
  arguments: [
    {
      name: "context",
      description: "Describe your product, target market, and current situation",
      required: true
    }
  ]
}
```

### 3.5 MCP Server Configuration

**Claude Desktop config (`claude_desktop_config.json`):**
```json
{
  "mcpServers": {
    "basedpricer": {
      "command": "npx",
      "args": ["@basedpricer/mcp"],
      "env": {
        "OPENAI_API_KEY": "sk-xxx",
        "ANTHROPIC_API_KEY": "sk-ant-xxx",
        "GITHUB_TOKEN": "ghp_xxx"
      }
    }
  }
}
```

### 3.6 MCP Dependencies

```json
{
  "name": "@basedpricer/mcp",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "basedpricer-mcp": "./bin/basedpricer-mcp.js"
  },
  "dependencies": {
    "@basedpricer/core": "workspace:*",
    "@modelcontextprotocol/sdk": "^1.0.0"
  }
}
```

---

## Phase 4: Testing Strategy

### 4.1 Testing Pyramid

```
                    ┌─────────────────┐
                    │   E2E Tests     │  ← CLI integration, MCP protocol
                    │   (Few, Slow)   │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │     Integration Tests       │  ← Cross-package, API calls
              │     (Moderate)              │
              └──────────────┬──────────────┘
                             │
       ┌─────────────────────┴─────────────────────┐
       │            Unit Tests                      │  ← Pure functions, schemas
       │            (Many, Fast)                    │
       └───────────────────────────────────────────┘
```

### 4.2 Core Package Tests

```
packages/core/src/
├── calculators/
│   ├── cogs.test.ts
│   │   ├── calculateVariableCosts - various cost scenarios
│   │   ├── calculateFixedCosts - rounding, edge cases
│   │   ├── calculateCOGSBreakdown - full breakdown accuracy
│   │   └── calculateCOGSPerCustomer - division, zero handling
│   │
│   ├── margin.test.ts
│   │   ├── calculateGrossMargin - percentage accuracy
│   │   ├── getMarginStatus - threshold boundaries
│   │   └── edge cases - zero price, negative margins
│   │
│   └── investor-metrics.test.ts
│       ├── calculateLTV - churn rate scenarios
│       ├── calculateLTVCACRatio - ratio accuracy
│       └── projectValuation - ARR multiples
│
├── analyzers/
│   ├── codebase.test.ts
│   │   ├── parseAIResponse - malformed JSON handling
│   │   ├── analyzeFromPackageJson - dependency detection
│   │   └── mock AI responses for consistent testing
│   │
│   └── business-type.test.ts
│       ├── detectBusinessType - signal matching
│       └── confidence scoring
│
├── generators/
│   ├── tiers.test.ts
│   │   ├── generateTierRecommendations - business type mapping
│   │   └── feature allocation logic
│   │
│   └── reports.test.ts
│       ├── encodeReport - compression
│       ├── decodeReport - decompression
│       └── round-trip integrity
│
└── schemas/
    └── *.test.ts
        ├── valid inputs pass
        ├── invalid inputs fail with correct errors
        └── edge cases (empty arrays, null values)
```

**Example test file:**
```typescript
// packages/core/src/calculators/cogs.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateVariableCosts,
  calculateCOGSBreakdown,
  calculateCOGSPerCustomer,
} from './cogs';

describe('calculateVariableCosts', () => {
  it('calculates total variable cost correctly', () => {
    const costs = [
      { name: 'API', costPerUnit: 0.01, usagePerCustomer: 100 },
      { name: 'Storage', costPerUnit: 0.05, usagePerCustomer: 10 },
    ];

    expect(calculateVariableCosts(costs, 1000)).toBe(1500); // (1 + 0.5) * 1000
  });

  it('handles empty costs array', () => {
    expect(calculateVariableCosts([], 1000)).toBe(0);
  });

  it('handles zero customers', () => {
    const costs = [{ name: 'API', costPerUnit: 0.01, usagePerCustomer: 100 }];
    expect(calculateVariableCosts(costs, 0)).toBe(0);
  });
});

describe('calculateCOGSPerCustomer', () => {
  it('includes fixed cost allocation', () => {
    const result = calculateCOGSPerCustomer({
      variableCostPerCustomer: 5,
      totalFixedCosts: 1000,
      customerCount: 100,
    });

    expect(result).toBe(15); // 5 + (1000/100)
  });

  it('handles single customer', () => {
    const result = calculateCOGSPerCustomer({
      variableCostPerCustomer: 5,
      totalFixedCosts: 1000,
      customerCount: 1,
    });

    expect(result).toBe(1005);
  });
});
```

### 4.3 CLI Tests

```
packages/cli/src/
├── commands/
│   ├── analyze.test.ts
│   │   ├── parses GitHub URLs correctly
│   │   ├── handles local paths
│   │   ├── validates output format options
│   │   └── error handling for invalid repos
│   │
│   ├── cogs.test.ts
│   │   ├── reads JSON input correctly
│   │   ├── validates cost schema
│   │   └── formats output correctly
│   │
│   └── config.test.ts
│       ├── sets and retrieves values
│       └── handles missing config file
│
└── formatters/
    ├── table.test.ts
    ├── json.test.ts
    └── markdown.test.ts
```

**CLI E2E test example:**
```typescript
// packages/cli/tests/e2e/analyze.test.ts
import { execSync } from 'child_process';
import { describe, it, expect } from 'vitest';

describe('basedpricer analyze', () => {
  it('analyzes a public GitHub repo', () => {
    const output = execSync(
      'basedpricer analyze --repo https://github.com/vercel/next.js --quick --output json',
      { encoding: 'utf-8' }
    );

    const result = JSON.parse(output);
    expect(result.techStack.framework).toBe('Next.js');
  });

  it('shows error for invalid repo', () => {
    expect(() => {
      execSync('basedpricer analyze --repo https://github.com/invalid/repo123456');
    }).toThrow();
  });
});
```

### 4.4 MCP Tests

```
packages/mcp/src/
├── tools/
│   ├── analyze-codebase.test.ts
│   │   ├── returns valid schema
│   │   ├── handles missing API keys
│   │   └── validates input parameters
│   │
│   └── calculate-cogs.test.ts
│       ├── returns correct structure
│       └── handles edge cases
│
└── server.test.ts
    ├── lists all tools correctly
    ├── lists all resources correctly
    └── handles malformed requests
```

**MCP protocol test:**
```typescript
// packages/mcp/tests/protocol.test.ts
import { MCPClient } from '@modelcontextprotocol/sdk/client';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('MCP Server Protocol', () => {
  let client: MCPClient;

  beforeAll(async () => {
    client = new MCPClient();
    await client.connect({ command: 'node', args: ['./bin/basedpricer-mcp.js'] });
  });

  afterAll(async () => {
    await client.disconnect();
  });

  it('lists all expected tools', async () => {
    const tools = await client.listTools();

    expect(tools.map(t => t.name)).toContain('analyze_codebase');
    expect(tools.map(t => t.name)).toContain('calculate_cogs');
    expect(tools.map(t => t.name)).toContain('calculate_margins');
  });

  it('executes calculate_cogs correctly', async () => {
    const result = await client.callTool('calculate_cogs', {
      variableCosts: [{ name: 'API', costPerUnit: 0.01, usagePerCustomer: 100 }],
      fixedCosts: [{ name: 'Hosting', monthlyCost: 50 }],
      customerCount: 100,
    });

    expect(result.totalVariableCosts).toBe(100);
    expect(result.totalFixedCosts).toBe(50);
  });
});
```

### 4.5 Test Coverage Targets

| Package | Target | Focus Areas |
|---------|--------|-------------|
| `@basedpricer/core` | 90%+ | All calculators, schema validation |
| `@basedpricer/cli` | 80%+ | Command parsing, output formatting |
| `@basedpricer/mcp` | 85%+ | Tool handlers, protocol compliance |

### 4.6 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - run: npm ci
      - run: npm run build --workspaces
      - run: npm run test --workspaces
      - run: npm run lint --workspaces

  e2e:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4

      - run: npm ci
      - run: npm run build --workspaces
      - run: npm run test:e2e --workspace=@basedpricer/cli
      - run: npm run test:e2e --workspace=@basedpricer/mcp

  publish:
    if: github.ref == 'refs/heads/main'
    needs: [test, e2e]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          registry-url: 'https://registry.npmjs.org'

      - run: npm ci
      - run: npm run build --workspaces
      - run: npx changeset publish
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Phase 5: Documentation

### 5.1 Documentation Structure

```
docs/
├── README.md                    # Project overview
├── getting-started/
│   ├── installation.md
│   ├── quick-start.md
│   └── configuration.md
│
├── core/
│   ├── README.md
│   ├── api-reference.md
│   ├── calculators.md
│   ├── analyzers.md
│   ├── schemas.md
│   └── examples.md
│
├── cli/
│   ├── README.md
│   ├── installation.md
│   ├── commands/
│   │   ├── analyze.md
│   │   ├── cogs.md
│   │   ├── tiers.md
│   │   ├── report.md
│   │   └── config.md
│   └── examples.md
│
├── mcp/
│   ├── README.md
│   ├── installation.md
│   ├── tools/
│   │   ├── analyze-codebase.md
│   │   ├── calculate-cogs.md
│   │   ├── calculate-margins.md
│   │   └── generate-tiers.md
│   ├── resources.md
│   └── claude-desktop-setup.md
│
├── web/
│   ├── README.md
│   └── deployment.md
│
└── contributing/
    ├── README.md
    ├── development-setup.md
    ├── architecture.md
    └── releasing.md
```

### 5.2 README Structure (Root)

```markdown
# BasedPricer

AI-powered SaaS pricing calculator for founders.

## What is BasedPricer?

BasedPricer helps you analyze your codebase, calculate costs, and design pricing tiers.

## Interfaces

| Interface | Use Case | Install |
|-----------|----------|---------|
| **Web App** | Interactive pricing design | [basedpricer.com](https://basedpricer.com) |
| **CLI** | Terminal workflows, CI/CD | `npm install -g @basedpricer/cli` |
| **MCP Server** | AI assistants (Claude Code) | `npx @basedpricer/mcp` |
| **Core Library** | Custom integrations | `npm install @basedpricer/core` |

## Quick Examples

### CLI
\`\`\`bash
# Analyze a GitHub repo
basedpricer analyze --repo https://github.com/user/repo

# Calculate COGS
basedpricer cogs --input costs.json --price 49 --customers 1000
\`\`\`

### MCP (Claude Code)
\`\`\`
> Analyze my repo at github.com/user/myapp and suggest pricing tiers
\`\`\`

### Core Library
\`\`\`typescript
import { analyzeCodebase, calculateCOGSBreakdown } from '@basedpricer/core';

const analysis = await analyzeCodebase('https://github.com/user/repo');
const cogs = calculateCOGSBreakdown(costs, 1000);
\`\`\`

## Documentation

- [Getting Started](./docs/getting-started/installation.md)
- [CLI Reference](./docs/cli/README.md)
- [MCP Server](./docs/mcp/README.md)
- [Core API](./docs/core/api-reference.md)

## License

MIT
```

### 5.3 CLI Documentation Example

```markdown
# basedpricer analyze

Analyze a GitHub repository or local codebase to detect business type,
tech stack, features, and estimated costs.

## Usage

\`\`\`bash
basedpricer analyze [options]
\`\`\`

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--repo <url>` | GitHub repository URL | - |
| `--path <path>` | Local directory path | - |
| `--quick` | Quick analysis (no AI) | `false` |
| `--output <format>` | Output format: `json`, `table`, `markdown` | `table` |
| `-o, --out <file>` | Save output to file | - |
| `--provider <name>` | AI provider to use | auto-detect |

## Examples

### Analyze a GitHub repository

\`\`\`bash
basedpricer analyze --repo https://github.com/vercel/next.js
\`\`\`

Output:
\`\`\`
┌─────────────────────────────────────────────┐
│           Codebase Analysis                  │
├─────────────────────────────────────────────┤
│ Business Type:    Developer Tools (92%)     │
│ Pricing Model:    Seat-based                │
├─────────────────────────────────────────────┤
│ Tech Stack                                  │
│   Framework:      React                     │
│   Language:       TypeScript                │
│   Database:       -                         │
├─────────────────────────────────────────────┤
│ Detected Features: 24                       │
│ Estimated Monthly Costs: RM 2,450           │
└─────────────────────────────────────────────┘
\`\`\`

### Quick analysis (no AI required)

\`\`\`bash
basedpricer analyze --repo https://github.com/user/repo --quick
\`\`\`

### Save as JSON for further processing

\`\`\`bash
basedpricer analyze --repo https://github.com/user/repo --output json -o analysis.json
\`\`\`

### Pipe to other commands

\`\`\`bash
basedpricer analyze --repo ... --output json | basedpricer tiers --from-stdin
\`\`\`
```

### 5.4 MCP Setup Guide

```markdown
# Setting up BasedPricer MCP Server

## Claude Desktop

1. Install the MCP server:
   \`\`\`bash
   npm install -g @basedpricer/mcp
   \`\`\`

2. Edit your Claude Desktop config:

   **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

   \`\`\`json
   {
     "mcpServers": {
       "basedpricer": {
         "command": "basedpricer-mcp",
         "env": {
           "OPENAI_API_KEY": "sk-...",
           "GITHUB_TOKEN": "ghp_..."
         }
       }
     }
   }
   \`\`\`

3. Restart Claude Desktop

## Claude Code

Add to your project's `.mcp.json`:

\`\`\`json
{
  "servers": {
    "basedpricer": {
      "command": "npx",
      "args": ["@basedpricer/mcp"]
    }
  }
}
\`\`\`

## Available Tools

Once configured, you can ask Claude:

- "Analyze my repo at github.com/user/myapp"
- "Calculate COGS for these costs: [list costs]"
- "What margins would I have at $49/month with 1000 customers?"
- "Generate pricing tier recommendations for an AI SaaS"
- "Create an investor report for my pricing analysis"

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key | For AI analysis |
| `ANTHROPIC_API_KEY` | Anthropic API key | Alternative |
| `GITHUB_TOKEN` | GitHub personal access token | For private repos |
```

---

## Phase 6: Migration & Release Plan

### 6.1 Migration Steps

**Step 1: Create monorepo structure**
```bash
# From project root
mkdir -p packages/{core,cli,mcp}
mv src packages/web/src
mv public packages/web/public
# ... move other web files
```

**Step 2: Extract core logic**
```bash
# Copy files to core package
cp packages/web/src/utils/costCalculator.ts packages/core/src/calculators/cogs.ts
# ... continue for all extractable files
```

**Step 3: Update web package imports**
```typescript
// Before
import { calculateCOGSBreakdown } from '../utils/costCalculator';

// After
import { calculateCOGSBreakdown } from '@basedpricer/core';
```

**Step 4: Build and test each package**
```bash
npm run build --workspace=@basedpricer/core
npm run test --workspace=@basedpricer/core
# ... repeat for cli, mcp, web
```

### 6.2 Release Strategy

**Version 1.0.0 (Initial Release)**
- `@basedpricer/core@1.0.0`
- `@basedpricer/cli@1.0.0`
- `@basedpricer/mcp@1.0.0`

**Semantic Versioning**
- Core changes bump all packages (they depend on core)
- CLI-only changes bump CLI only
- MCP-only changes bump MCP only

**Publishing**
```bash
# Using changesets for coordinated releases
npx changeset
npx changeset version
npx changeset publish
```

### 6.3 Backwards Compatibility

The web app should continue to work unchanged after migration:
- Same user experience
- Same localStorage data format
- Same shareable report URLs

---

## Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1**: Core Extraction | Week 1 | `@basedpricer/core` package |
| **Phase 2**: CLI Development | Week 2 | `@basedpricer/cli` with all commands |
| **Phase 3**: MCP Server | Week 3 | `@basedpricer/mcp` with all tools |
| **Phase 4**: Testing | Throughout | 85%+ coverage across packages |
| **Phase 5**: Documentation | Week 4 | Complete docs site |
| **Phase 6**: Release | Week 4 | npm publish, announcements |

---

## Success Metrics

1. **Core Package**
   - [ ] All calculators work independently
   - [ ] 90%+ test coverage
   - [ ] Zero React dependencies
   - [ ] < 50KB bundle size

2. **CLI**
   - [ ] All 5 commands working
   - [ ] JSON/table/markdown output
   - [ ] Interactive mode for missing inputs
   - [ ] < 2s startup time

3. **MCP Server**
   - [ ] All 6 tools registered
   - [ ] Works in Claude Desktop
   - [ ] Works in Claude Code
   - [ ] < 1s tool response (excluding AI calls)

4. **Documentation**
   - [ ] README with quick start
   - [ ] Full API reference
   - [ ] Setup guides for all interfaces
   - [ ] Example workflows

---

## Questions to Resolve

1. **Package naming**: `@basedpricer/*` or `basedpricer-*`?
2. **Monorepo tool**: npm workspaces vs pnpm vs turborepo?
3. **CLI framework**: Commander vs Yargs vs Clipanion?
4. **Config storage**: Where should CLI store API keys?
5. **MCP hosting**: Should we offer a hosted MCP server?

---

*Plan created: January 2026*
*Author: Claude (with human guidance)*
