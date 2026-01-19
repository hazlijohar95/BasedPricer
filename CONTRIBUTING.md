# Contributing to Pricing Tools

Thank you for your interest in contributing to Pricing Tools! This guide will help you get started with contributing to the project, whether you're updating pricing data, adding new features, or fixing bugs.

## Table of Contents

- [Quick Start](#quick-start)
- [Updating Pricing Data](#updating-pricing-data)
- [Adding New AI Providers](#adding-new-ai-providers)
- [Customizing Analysis Prompts](#customizing-analysis-prompts)
- [Code Contributions](#code-contributions)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/pricing-tools-oss.git
cd pricing-tools-oss

# Install dependencies
npm install

# Start development server
npm run dev
```

The app runs at `http://localhost:5173`.

---

## Updating Pricing Data

AI provider pricing changes frequently. Help keep the data accurate by submitting updates!

### Where Pricing Data Lives

All pricing data is in a single, human-editable JSON file:

```
public/config/ai-providers.json
```

### How to Update Pricing

1. **Find the official source** - Always use the provider's official pricing page:
   - OpenAI: https://openai.com/api/pricing/
   - Anthropic: https://www.anthropic.com/pricing
   - OpenRouter: https://openrouter.ai/models
   - MiniMax: https://platform.minimax.io/pricing
   - GLM (Zhipu): https://open.bigmodel.cn/pricing

2. **Edit the config file** - Update the relevant model's pricing:

```json
{
  "gpt-4o": {
    "id": "gpt-4o",
    "name": "GPT-4o",
    "inputPricePerMillion": 2.50,      // <-- Update this
    "outputPricePerMillion": 10.00,    // <-- Update this
    "lastPriceUpdate": "2026-01-19",   // <-- Update to today
    "priceSource": "https://openai.com/api/pricing/"
  }
}
```

3. **Update metadata** - Bump the `lastUpdated` date in `_meta`:

```json
{
  "_meta": {
    "version": "1.0.0",
    "lastUpdated": "2026-01-19"  // <-- Update to today
  }
}
```

4. **Submit a PR** - Include:
   - Screenshot or link to the official pricing page
   - Brief description of what changed

### Pricing Data Schema

Each model follows this structure:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Model ID used in API calls |
| `name` | string | Yes | Human-readable display name |
| `description` | string | No | Brief description of capabilities |
| `inputPricePerMillion` | number | Yes | USD per 1M input tokens |
| `outputPricePerMillion` | number | Yes | USD per 1M output tokens |
| `contextWindow` | number | No | Max context length in tokens |
| `maxOutputTokens` | number | No | Max output tokens per request |
| `supportsVision` | boolean | No | Can process images |
| `supportsTools` | boolean | No | Supports function calling |
| `lastPriceUpdate` | string | Yes | ISO date (YYYY-MM-DD) of last verification |
| `priceSource` | string | Yes | URL to official pricing source |
| `notes` | string | No | Additional context (free tier, beta, etc.) |
| `deprecated` | boolean | No | Whether model is deprecated |

### Example PR Description

```markdown
## Update OpenAI GPT-4o Pricing

**Source:** https://openai.com/api/pricing/ (screenshot attached)

**Changes:**
- GPT-4o input: $5.00 → $2.50 per 1M tokens
- GPT-4o output: $15.00 → $10.00 per 1M tokens

**Verified:** 2026-01-19
```

---

## Adding New AI Providers

### Built-in Providers

To add a new provider to the default configuration:

1. Add provider entry to `public/config/ai-providers.json`:

```json
{
  "providers": {
    "newprovider": {
      "id": "newprovider",
      "name": "New Provider",
      "website": "https://newprovider.ai",
      "pricingPage": "https://newprovider.ai/pricing",
      "apiDocsUrl": "https://docs.newprovider.ai",
      "keyDocsUrl": "https://newprovider.ai/keys",
      "keyPlaceholder": "np-...",
      "keyPattern": "^np-[a-zA-Z0-9]{20,}$",
      "baseUrl": "https://api.newprovider.ai/v1",
      "isOpenAICompatible": true,
      "supportsStreaming": true,
      "defaultModel": "model-name",
      "models": {
        "model-name": {
          "id": "model-name",
          "name": "Model Name",
          "inputPricePerMillion": 1.00,
          "outputPricePerMillion": 2.00,
          "contextWindow": 128000,
          "lastPriceUpdate": "2026-01-19",
          "priceSource": "https://newprovider.ai/pricing"
        }
      }
    }
  }
}
```

2. If the provider uses OpenAI-compatible API format, it should work automatically.

3. If the provider has a unique API format (like Anthropic), add a handler in `src/services/ai-client.ts`.

4. Add a logo:
   - Add SVG logo to `public/logos/newprovider.svg`
   - Update `src/components/ProviderLogos.tsx`

5. Update `src/services/api-keys.ts`:
   - Add to `AIProvider` type
   - Add key pattern validation
   - Add to `PROVIDER_INFO`

### Custom Providers (User-Added)

Users can add their own OpenAI-compatible providers through the UI without code changes. These are stored in localStorage and include:

- Self-hosted LLMs (Ollama, vLLM, LocalAI)
- Alternative providers (Groq, Together AI, Fireworks)
- Private/enterprise endpoints

Custom provider IDs must start with `custom_` (e.g., `custom_ollama`).

---

## Customizing Analysis Prompts

Analysis prompts are fully customizable in:

```
public/config/analysis-prompts.json
```

### Adding Business Types

To add a new business type detection:

```json
{
  "businessTypes": {
    "healthcare_saas": {
      "name": "Healthcare SaaS",
      "description": "Healthcare and medical software",
      "signals": [
        "HIPAA compliance",
        "patient records",
        "medical APIs",
        "HL7/FHIR"
      ],
      "recommendedPricingModel": "seat_based",
      "typicalTiers": 3,
      "keyMetrics": ["patients", "providers", "records"]
    }
  }
}
```

### Modifying Detection Signals

Signals are patterns the AI looks for to classify business types:

```json
{
  "ai_ml_saas": {
    "signals": [
      "LLM APIs (OpenAI, Anthropic)",
      "tokens/credits",
      "embeddings",
      "vector stores",
      "model inference",
      "fine-tuning",           // <-- Add new signal
      "model deployment"       // <-- Add new signal
    ]
  }
}
```

### Changing Analysis Settings

```json
{
  "analysisSettings": {
    "temperature": 0.2,           // Lower = more consistent output
    "maxTokens": 4096,            // Response length limit
    "maxReadmeChars": 5000,       // README excerpt length
    "maxSourceFiles": 20,         // Number of files to analyze
    "maxCharsPerFile": 4000,      // Chars per source file
    "maxConfigFiles": 5,          // Config files to include
    "maxCharsPerConfigFile": 2000
  }
}
```

### Prompt Engineering Tips

- **Be specific**: Clear instructions produce better results
- **Use examples**: Show the AI what good output looks like
- **Structure output**: Request JSON for consistent parsing
- **Set confidence thresholds**: Ask for confidence scores to gauge reliability
- **Match pricing to business type**: Link business classification to pricing recommendations

---

## Code Contributions

### Project Structure

```
src/
├── components/          # React components
│   ├── shared/          # Reusable components
│   │   ├── PricingSourceInfo.tsx      # Data attribution
│   │   ├── CustomProviderManager.tsx  # Custom provider UI
│   │   └── AnalysisTransparency.tsx   # Transparency view
│   ├── CodebaseAnalyzer.tsx           # Main analyzer
│   └── ...
├── services/            # Business logic
│   ├── config-loader.ts # Loads external configs
│   ├── ai-client.ts     # AI provider API calls
│   ├── ai-analyzer.ts   # Codebase analysis
│   ├── api-keys.ts      # API key management
│   └── github.ts        # GitHub API
├── data/                # Static data (legacy, migrating to config/)
├── context/             # React context providers
└── utils/               # Utility functions

public/
└── config/              # External configuration (user-editable)
    ├── ai-providers.json
    ├── analysis-prompts.json
    └── schemas/         # JSON schemas for validation
```

### Code Style

- **TypeScript**: All new code should be TypeScript
- **Functional components**: Use React hooks, no class components
- **Tailwind CSS**: For styling
- **ESLint**: Run `npm run lint` before committing
- **Formatting**: Prettier is configured

### Adding Features

1. **Check existing issues** - Look for related discussions
2. **Create an issue first** - Discuss the approach before implementing
3. **Keep changes focused** - One feature per PR
4. **Update types** - Maintain type safety
5. **Test manually** - Verify in the browser

---

## Testing

### Manual Testing Checklist

Before submitting a PR, test these scenarios:

- [ ] App loads without errors
- [ ] Can add/remove API keys for all providers
- [ ] Can analyze a public GitHub repository
- [ ] Cost calculations display correctly
- [ ] Custom provider can be added and used
- [ ] Transparency panel shows correct data
- [ ] Pricing source links work

### Running the App

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

---

## Pull Request Process

### Before Submitting

1. **Update documentation** if you changed behavior
2. **Update types** if you changed data structures
3. **Test your changes** manually
4. **Run lint** and fix any issues

### PR Template

```markdown
## Description
Brief description of the changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Pricing data update
- [ ] Documentation
- [ ] Configuration change

## Testing Done
- [ ] Tested locally
- [ ] Verified in browser
- [ ] Checked responsive design

## Screenshots (if applicable)
Add screenshots for UI changes.

## Additional Notes
Any context reviewers should know.
```

### Review Process

1. PRs require at least one approval
2. Pricing updates are usually merged quickly
3. Feature changes may need discussion
4. Be responsive to feedback

---

## Questions?

- **Open an issue** for bugs or feature requests
- **Start a discussion** for questions or ideas
- **Check existing issues** before creating new ones

Thank you for contributing!
