# pricing-tools

A comprehensive SaaS pricing calculator that helps founders analyze costs, configure pricing tiers, and generate stakeholder reports.

## What is this?

**pricing-tools** is an open-source tool designed to help SaaS founders and product teams:

- **Analyze codebases** to automatically detect features and cost drivers using AI
- **Calculate COGS** (Cost of Goods Sold) with variable and fixed cost breakdowns
- **Configure pricing tiers** with feature limits and access controls
- **Simulate pricing scenarios** with revenue projections and unit economics
- **Generate stakeholder reports** for accountants, investors, engineers, and marketers

## Features

### Codebase Analyzer (AI-Powered)
Import your GitHub repository and let AI automatically detect:
- Tech stack and frameworks
- Feature inventory
- Cost drivers (APIs, storage, compute)
- Suggested pricing tiers

Supports **OpenAI**, **Anthropic (Claude)**, and **OpenRouter** - bring your own API key.

### COGS Calculator
Break down your costs:
- **Variable costs**: Per-customer costs (API calls, storage, processing)
- **Fixed costs**: Monthly overhead (servers, licenses, salaries)
- **Margin analysis**: Gross margin health indicators

### Feature Inventory
Manage and categorize all product features:
- Organize by category (invoicing, AI, integrations, etc.)
- Mark cost drivers
- Track feature complexity

### Tier Configurator
Design your pricing tiers:
- Set monthly/annual prices
- Configure feature limits per tier
- Include/exclude features
- Target audience positioning

### Pricing Calculator
Model your unit economics:
- Revenue projections
- Break-even analysis
- Customer distribution simulation
- Scenario comparison

### Mockup Preview
Preview your pricing page as customers would see it:
- Live tier comparison
- Feature highlights
- Responsive design preview

### Stakeholder Reports
Generate shareable reports for different audiences:
- **Accountant**: COGS breakdown, P&L projections
- **Investor**: Valuations, milestones, ARR metrics
- **Engineer**: Feature matrix, limits, implementation notes
- **Marketer**: Positioning, upgrade paths, CTAs

## Quick Start

```bash
# Clone the repository
git clone https://github.com/hazlijohar95/pricing-tools.git
cd pricing-tools

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## AI Setup (Bring Your Own Key)

The Codebase Analyzer requires an AI API key. All keys are stored locally in your browser and sent directly to providers.

### Supported Providers

| Provider | Model | Get API Key |
|----------|-------|-------------|
| OpenAI | GPT-4o | [platform.openai.com](https://platform.openai.com/api-keys) |
| Anthropic | Claude 3.5 Sonnet | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| OpenRouter | Various | [openrouter.ai](https://openrouter.ai/keys) |

### Adding Your Key

1. Go to the **Analyze** tab
2. Click **Configure** in the AI Provider section
3. Select your provider and paste your API key
4. (Optional) Add a GitHub token for private repository access

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **Vite** - Build tool
- **React Router** - Navigation
- **Phosphor Icons** - Icon library
- **LZ-String** - URL compression for shareable reports

## Project Structure

```
src/
├── components/          # React components
│   ├── reports/        # Stakeholder report components
│   └── shared/         # Reusable UI components
├── context/            # React context (PricingContext)
├── data/               # Static data (features, tiers)
├── hooks/              # Custom React hooks
├── services/           # AI and API integrations
│   ├── ai-analyzer.ts  # AI codebase analysis
│   ├── ai-client.ts    # Multi-provider AI client
│   ├── api-keys.ts     # Secure key storage
│   └── github.ts       # GitHub API integration
└── utils/              # Utility functions
    ├── costCalculator.ts
    ├── investorMetrics.ts
    └── reportEncoder.ts
```

## Building for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with care for SaaS founders everywhere.
