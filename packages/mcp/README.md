# @basedpricer/mcp

MCP (Model Context Protocol) server for BasedPricer. Use AI assistants like Claude to analyze SaaS pricing.

## Installation

```bash
npm install -g @basedpricer/mcp
```

Or run directly with npx:

```bash
npx @basedpricer/mcp
```

## Setup

### Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "basedpricer": {
      "command": "npx",
      "args": ["@basedpricer/mcp"]
    }
  }
}
```

### Claude Code

Add to your project's `.mcp.json`:

```json
{
  "servers": {
    "basedpricer": {
      "command": "npx",
      "args": ["@basedpricer/mcp"]
    }
  }
}
```

## Available Tools

### `calculate_cogs`

Calculate Cost of Goods Sold (COGS) breakdown for a SaaS product.

**Example prompt:**
> Calculate COGS for a SaaS with these costs:
> - OpenAI API: $0.03 per 1K tokens, 100 tokens per customer
> - Storage: $0.10 per GB, 2 GB per customer
> - Fixed hosting: $50/month
> Assume 100 customers.

### `calculate_margins`

Calculate gross margin and profit for a given price and COGS.

**Example prompt:**
> Calculate margins if I price at $49/month with COGS of $4.20

### `calculate_break_even`

Calculate the number of customers needed to break even.

**Example prompt:**
> How many customers do I need to break even with $75 fixed costs, $49 price, and $3.45 variable cost?

### `calculate_investor_metrics`

Calculate comprehensive investor metrics including ARR, valuation, LTV:CAC ratio.

**Example prompt:**
> Calculate investor metrics for:
> - MRR: $10,000
> - 200 paid customers
> - ARPU: $50
> - Gross margin: 70%
> - 5% monthly growth
> - LTV: $1,500, CAC: $500

### `estimate_ai_cost`

Estimate AI/LLM API costs for a product.

**Example prompt:**
> Estimate OpenAI costs for an app with 1000 tokens input, 500 tokens output per request, 100 requests per customer, 500 customers

### `get_margin_thresholds`

Get industry-standard SaaS margin thresholds.

## Available Resources

- `basedpricer://data/margin-thresholds` - SaaS margin health thresholds
- `basedpricer://data/currencies` - Supported currencies with exchange rates
- `basedpricer://data/ai-pricing` - AI provider pricing data
- `basedpricer://data/cost-drivers` - Common cost drivers

## Example Conversation

```
You: Calculate COGS for my SaaS. I use OpenAI ($0.03/1K tokens, 50 tokens/user),
     Supabase ($25/month fixed), and Vercel ($20/month fixed). I have 200 customers.

Claude: [Uses calculate_cogs tool]

Based on the calculation:
- Variable costs: RM 1.50 per customer (OpenAI API)
- Fixed costs: RM 45/month total (Supabase + Vercel)
- Fixed per customer: RM 0.23
- **Total COGS: RM 1.73 per customer**

You: What margin would I have at RM 29/month?

Claude: [Uses calculate_margins tool]

At RM 29/month pricing:
- COGS: RM 1.73
- Profit: RM 27.27
- **Gross Margin: 94.0%** (Healthy)

This is an excellent margin for a SaaS product!
```

## License

MIT
