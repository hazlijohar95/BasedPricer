# @basedpricer/core

Core business logic for BasedPricer - COGS calculations, margin analysis, investor metrics, and pricing utilities.

## Installation

```bash
npm install @basedpricer/core
```

## Features

- **COGS Calculations**: Variable costs, fixed costs, and complete breakdown
- **Margin Analysis**: Gross margin, operating margin, health status
- **Investor Metrics**: LTV, CAC, ARR, valuation projections, milestones
- **AI Cost Estimation**: Token cost calculations for multiple providers
- **Currency Support**: Multi-currency formatting and conversion
- **Zod Schemas**: Runtime validation for all data structures

## Quick Start

```typescript
import {
  calculateCOGSBreakdown,
  calculateGrossMargin,
  getMarginHealth,
  formatCurrency,
} from '@basedpricer/core';

// Calculate COGS
const costs = calculateCOGSBreakdown(
  [{ id: '1', name: 'API', unit: 'call', costPerUnit: 0.01, usagePerCustomer: 100, description: '' }],
  [{ id: '2', name: 'Hosting', monthlyCost: 50, description: '' }],
  100 // customers
);

console.log(costs.totalCOGS); // COGS per customer

// Calculate margin
const margin = calculateGrossMargin(49, costs.totalCOGS);
console.log(getMarginHealth(margin)); // 'healthy' | 'acceptable' | 'low'

// Format currency
console.log(formatCurrency(1234.56, 'MYR')); // "RM1,234.56"
```

## API Reference

### COGS Calculator

```typescript
// Calculate variable costs per customer
calculateVariableCosts(costs: VariableCostItem[], utilizationRate?: number): number

// Calculate total fixed costs
calculateTotalFixedCosts(fixedCosts: FixedCostItem[]): number

// Get complete COGS breakdown
calculateCOGSBreakdown(
  variableCosts: VariableCostItem[],
  fixedCosts: FixedCostItem[],
  customerCount: number,
  utilizationRate?: number
): CostBreakdown

// Calculate break-even customers
calculateBreakEvenCustomers(
  totalFixedCosts: number,
  pricePerCustomer: number,
  variableCostPerCustomer: number
): number
```

### Margin Calculator

```typescript
// Calculate gross margin percentage
calculateGrossMargin(price: number, cogs: number): number

// Get margin health status
getMarginHealth(margin: number): 'healthy' | 'acceptable' | 'low'

// Get margin status
getMarginStatus(margin: number): 'great' | 'ok' | 'low'

// Find minimum price for target margin
findMinimumPriceForMargin(cogs: number, targetMargin: number): number
```

### Investor Metrics

```typescript
// Calculate ARR from MRR
calculateARR(mrr: number): number

// Calculate LTV
calculateLTV(arpu: number, grossMarginPercent: number, averageLifetimeMonths: number): number

// Calculate LTV:CAC ratio
calculateLTVCACRatio(ltv: number, cac: number): number | null

// Calculate payback period
calculatePaybackPeriod(arpu: number, grossMarginPercent: number, cac: number): number | null

// Calculate valuation projections
calculateValuation(arr: number): ValuationProjection

// Get complete investor metrics
calculateInvestorMetrics(params: InvestorMetricsParams): InvestorMetrics
```

### AI Cost Calculator

```typescript
// Calculate token cost
calculateTokenCost(
  usage: TokenUsage,
  provider: AIProvider,
  model?: string,
  exchangeRate?: number
): AICostBreakdown

// Estimate analysis cost
estimateAnalysisCost(
  fileCount: number,
  totalChars: number,
  provider: AIProvider,
  model?: string
): CostEstimate

// Compare provider costs
compareProviderCosts(
  inputTokens: number,
  outputTokens: number,
  selectedProvider: AIProvider
): ProviderComparison[]
```

### Currency Utilities

```typescript
// Format currency
formatCurrency(value: number, currencyCode?: CurrencyCode, options?: FormatOptions): string

// Convert between currencies
convertCurrency(amount: number, from: CurrencyCode, to: CurrencyCode): number
```

### Schemas (Zod)

```typescript
import { VariableCostItemSchema, validateVariableCostItem } from '@basedpricer/core';

// Validate data
const result = validateVariableCostItem(data);
if (result.success) {
  console.log(result.data); // Typed VariableCostItem
} else {
  console.error(result.error);
}

// Direct schema validation
const parsed = VariableCostItemSchema.parse(data);
```

## Constants

```typescript
import { MARGIN_THRESHOLDS, CURRENCIES, AI_PRICING } from '@basedpricer/core';

// Margin thresholds
MARGIN_THRESHOLDS.HEALTHY   // 70
MARGIN_THRESHOLDS.ACCEPTABLE // 50

// Supported currencies
CURRENCIES.MYR
CURRENCIES.USD
CURRENCIES.SGD
// ...

// AI provider pricing
AI_PRICING.openai
AI_PRICING.anthropic
AI_PRICING.groq
// ...
```

## Types

All types are exported for TypeScript users:

```typescript
import type {
  VariableCostItem,
  FixedCostItem,
  CostBreakdown,
  MarginStatus,
  MarginHealth,
  Tier,
  Feature,
  BusinessType,
  AIProvider,
  CurrencyCode,
} from '@basedpricer/core';
```

## License

MIT
