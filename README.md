<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat-square&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License" />
</p>

<h1 align="center">BasedPricer</h1>

<p align="center">
  <strong>AI-powered SaaS pricing calculator for founders</strong><br>
  Analyze your codebase, detect features, and generate pricing recommendations
</p>

---

## Features

| Feature | Description |
|---------|-------------|
| **Codebase Analyzer** | Import GitHub repos, auto-detect features & cost drivers using AI |
| **Business Detection** | Identifies your SaaS type (API, marketplace, fintech, AI/ML, B2B, etc.) |
| **COGS Calculator** | Break down variable & fixed costs with margin analysis |
| **Tier Configurator** | Design pricing tiers with feature limits |
| **Pricing Mockup** | Preview your pricing page as customers see it |
| **Stakeholder Reports** | Generate reports for accountants, investors, engineers, marketers |

---

## Supported AI Providers

| Provider | Models | Pricing |
|----------|--------|---------|
| **OpenAI** | GPT-4o, GPT-4o Mini, o1 | [View](https://openai.com/api/pricing/) |
| **Anthropic** | Claude Sonnet 4, Claude 3.5 | [View](https://anthropic.com/pricing) |
| **OpenRouter** | 100+ models | [View](https://openrouter.ai/models) |
| **MiniMax** | M2.1, M1 (1M context) | [View](https://platform.minimax.io/pricing) |
| **GLM (Zhipu)** | GLM-4 Plus, Flash | [View](https://open.bigmodel.cn/pricing) |
| **Custom** | Any OpenAI-compatible | Self-hosted |

> All keys stored locally in your browser. Never sent to our servers.

---

## Quick Start

```bash
git clone https://github.com/hazlijohar95/BasedPricer.git
cd BasedPricer
npm install
npm run dev
```

Open [localhost:5173](http://localhost:5173)

---

## Configuration

All data is externalized to JSON files - **no code changes needed** to update pricing or add providers.

```
public/config/
├── ai-providers.json      # Provider pricing data
├── analysis-prompts.json  # AI analysis configuration
└── schemas/               # JSON validation schemas
```

### Update Pricing Data

Edit `public/config/ai-providers.json`:

```json
{
  "gpt-4o": {
    "inputPricePerMillion": 2.50,
    "outputPricePerMillion": 10.00,
    "lastPriceUpdate": "2026-01-19",
    "priceSource": "https://openai.com/api/pricing/"
  }
}
```

### Add Custom Provider

Add any OpenAI-compatible endpoint through the UI:
- Self-hosted LLMs (Ollama, vLLM, LocalAI)
- Alternative providers (Groq, Together AI)
- Private endpoints

---

## Project Structure

```
src/
├── components/        # React components
├── services/          # AI client, GitHub API, config loader
├── context/           # Global state management
└── utils/             # Cost calculations, metrics

public/config/         # User-editable configuration
```

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Quick contributions:**
- Update AI pricing data
- Add new providers
- Improve business type detection
- Report bugs

---

## License

MIT License - see [LICENSE](LICENSE)

---

<p align="center">
  Built for SaaS founders
</p>
