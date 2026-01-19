/**
 * BasedPricer MCP Server
 * Model Context Protocol server for AI-powered pricing analysis
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import {
  // Calculators
  calculateCOGSBreakdown,
  calculateGrossMargin,
  getMarginHealth,
  getMarginStatus,
  calculateBreakEvenCustomers,
  calculateInvestorMetrics,
  calculateTokenCost,

  // Data
  MARGIN_THRESHOLDS,
  CURRENCIES,
  AI_PRICING,
  COST_DRIVERS,
} from '@basedpricer/core';

import {
  VALID_CURRENCY_CODES,
  VALID_AI_PROVIDERS,
  validatePositiveNumber,
  validateNonNegativeNumber,
  validateNumber,
  validateCurrencyCode,
  validateAIProvider,
  validateVariableCosts,
  validateFixedCosts,
  getNumberOrDefault,
} from './validation.js';

// ============================================================================
// Server Setup
// ============================================================================

const server = new Server(
  {
    name: 'basedpricer',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// ============================================================================
// Tools
// ============================================================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'calculate_cogs',
        description: 'Calculate Cost of Goods Sold (COGS) breakdown for a SaaS product. Returns variable costs, fixed costs, and total COGS per customer.',
        inputSchema: {
          type: 'object',
          properties: {
            variableCosts: {
              type: 'array',
              description: 'Array of variable cost items',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string', description: 'Cost item name (e.g., "OpenAI API")' },
                  unit: { type: 'string', description: 'Unit of measurement (e.g., "1K tokens", "GB")' },
                  costPerUnit: { type: 'number', description: 'Cost per unit (must be positive)' },
                  usagePerCustomer: { type: 'number', description: 'Average usage per customer per month (must be positive)' },
                  description: { type: 'string' },
                },
                required: ['name', 'unit', 'costPerUnit', 'usagePerCustomer'],
              },
            },
            fixedCosts: {
              type: 'array',
              description: 'Array of fixed cost items',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string', description: 'Cost item name (e.g., "Hosting")' },
                  monthlyCost: { type: 'number', description: 'Monthly cost (must be non-negative)' },
                  description: { type: 'string' },
                },
                required: ['name', 'monthlyCost'],
              },
            },
            customerCount: {
              type: 'number',
              description: 'Number of customers (must be positive, default: 100)',
              default: 100,
            },
            currency: {
              type: 'string',
              enum: VALID_CURRENCY_CODES,
              description: 'Currency code (default: MYR)',
              default: 'MYR',
            },
          },
          required: ['variableCosts', 'fixedCosts'],
        },
      },
      {
        name: 'calculate_margins',
        description: 'Calculate gross margin and profit for a given price and COGS. Returns margin percentage, profit, and health status.',
        inputSchema: {
          type: 'object',
          properties: {
            price: {
              type: 'number',
              description: 'Price per customer per month (must be positive)',
            },
            cogs: {
              type: 'number',
              description: 'Cost of Goods Sold per customer (must be non-negative)',
            },
            currency: {
              type: 'string',
              enum: VALID_CURRENCY_CODES,
              default: 'MYR',
            },
          },
          required: ['price', 'cogs'],
        },
      },
      {
        name: 'calculate_break_even',
        description: 'Calculate the number of customers needed to break even given fixed costs, price, and variable costs.',
        inputSchema: {
          type: 'object',
          properties: {
            totalFixedCosts: {
              type: 'number',
              description: 'Total monthly fixed costs (must be non-negative)',
            },
            pricePerCustomer: {
              type: 'number',
              description: 'Price per customer per month (must be positive)',
            },
            variableCostPerCustomer: {
              type: 'number',
              description: 'Variable cost per customer (must be non-negative)',
            },
          },
          required: ['totalFixedCosts', 'pricePerCustomer', 'variableCostPerCustomer'],
        },
      },
      {
        name: 'calculate_investor_metrics',
        description: 'Calculate comprehensive investor metrics including ARR, valuation projections, LTV:CAC ratio, and milestones.',
        inputSchema: {
          type: 'object',
          properties: {
            mrr: { type: 'number', description: 'Monthly Recurring Revenue (must be positive)' },
            paidCustomers: { type: 'number', description: 'Number of paying customers (must be positive integer)' },
            arpu: { type: 'number', description: 'Average Revenue Per User monthly (must be positive)' },
            grossMargin: { type: 'number', description: 'Gross margin percentage (0-100)' },
            breakEvenCustomers: { type: 'number', description: 'Number of customers needed to break even (must be positive)' },
            monthlyGrowthRate: { type: 'number', description: 'Monthly growth rate (e.g., 0.05 for 5%)' },
            ltv: { type: 'number', description: 'Customer Lifetime Value (must be positive)' },
            estimatedCac: { type: 'number', description: 'Estimated Customer Acquisition Cost (optional, must be positive if provided)' },
          },
          required: ['mrr', 'paidCustomers', 'arpu', 'grossMargin', 'breakEvenCustomers', 'monthlyGrowthRate', 'ltv'],
        },
      },
      {
        name: 'estimate_ai_cost',
        description: 'Estimate AI/LLM API costs for a product based on usage patterns.',
        inputSchema: {
          type: 'object',
          properties: {
            provider: {
              type: 'string',
              enum: [...VALID_AI_PROVIDERS],
              description: 'AI provider',
            },
            model: { type: 'string', description: 'Model name (optional, uses default if not specified)' },
            estimatedInputTokens: { type: 'number', description: 'Estimated input tokens per request (must be positive)' },
            estimatedOutputTokens: { type: 'number', description: 'Estimated output tokens per request (must be positive)' },
            requestsPerCustomer: { type: 'number', description: 'Number of requests per customer per month (default: 1)' },
            customerCount: { type: 'number', description: 'Number of customers (default: 1)' },
          },
          required: ['provider', 'estimatedInputTokens', 'estimatedOutputTokens'],
        },
      },
      {
        name: 'get_margin_thresholds',
        description: 'Get the industry-standard SaaS margin thresholds used for health classification.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const safeArgs = (args ?? {}) as Record<string, unknown>;

  try {
    switch (name) {
      case 'calculate_cogs': {
        // Validate inputs
        const customerCount = getNumberOrDefault(safeArgs, 'customerCount', 100);
        if (customerCount <= 0) {
          throw new Error('customerCount must be positive');
        }

        const currencyCode = validateCurrencyCode(safeArgs.currency);
        const currency = CURRENCIES[currencyCode];

        const variableCosts = validateVariableCosts(safeArgs.variableCosts);
        const fixedCosts = validateFixedCosts(safeArgs.fixedCosts);

        const breakdown = calculateCOGSBreakdown(variableCosts, fixedCosts, customerCount);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                customerCount,
                currency: currencyCode,
                breakdown: {
                  variableCostPerCustomer: breakdown.variableTotal,
                  fixedCostPerCustomer: breakdown.fixedPerCustomer,
                  totalCOGSPerCustomer: breakdown.totalCOGS,
                  totalMonthlyFixedCosts: breakdown.fixedTotal,
                },
                variableCosts: variableCosts.map(c => ({
                  name: c.name,
                  costPerCustomer: c.costPerUnit * c.usagePerCustomer,
                })),
                fixedCosts: fixedCosts.map(c => ({
                  name: c.name,
                  monthlyCost: c.monthlyCost,
                  costPerCustomer: customerCount > 0 ? c.monthlyCost / customerCount : 0,
                })),
                summary: `Total COGS per customer: ${currency.symbol} ${breakdown.totalCOGS.toFixed(2)} (Variable: ${currency.symbol} ${breakdown.variableTotal.toFixed(2)}, Fixed: ${currency.symbol} ${breakdown.fixedPerCustomer.toFixed(2)})`,
              }, null, 2),
            },
          ],
        };
      }

      case 'calculate_margins': {
        const price = validatePositiveNumber(safeArgs.price, 'price');
        const cogs = validateNonNegativeNumber(safeArgs.cogs, 'cogs');
        const currencyCode = validateCurrencyCode(safeArgs.currency);
        const currency = CURRENCIES[currencyCode];

        const margin = calculateGrossMargin(price, cogs);
        const profit = price - cogs;
        const health = getMarginHealth(margin);
        const status = getMarginStatus(margin);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                price,
                cogs,
                currency: currencyCode,
                profit,
                grossMargin: margin,
                marginHealth: health,
                marginStatus: status,
                isHealthy: margin >= MARGIN_THRESHOLDS.HEALTHY,
                isAcceptable: margin >= MARGIN_THRESHOLDS.ACCEPTABLE,
                summary: `Gross margin: ${margin.toFixed(1)}% (${health}). Profit per customer: ${currency.symbol} ${profit.toFixed(2)}`,
                recommendations: margin < MARGIN_THRESHOLDS.ACCEPTABLE
                  ? ['Consider reducing costs or increasing price to improve margins']
                  : margin < MARGIN_THRESHOLDS.HEALTHY
                  ? ['Margins are acceptable but could be improved']
                  : ['Margins are healthy'],
              }, null, 2),
            },
          ],
        };
      }

      case 'calculate_break_even': {
        const totalFixedCosts = validateNonNegativeNumber(safeArgs.totalFixedCosts, 'totalFixedCosts');
        const pricePerCustomer = validatePositiveNumber(safeArgs.pricePerCustomer, 'pricePerCustomer');
        const variableCostPerCustomer = validateNonNegativeNumber(safeArgs.variableCostPerCustomer, 'variableCostPerCustomer');

        const breakEven = calculateBreakEvenCustomers(totalFixedCosts, pricePerCustomer, variableCostPerCustomer);
        const contribution = pricePerCustomer - variableCostPerCustomer;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                breakEvenCustomers: breakEven === Infinity ? null : breakEven,
                canBreakEven: breakEven !== Infinity,
                totalFixedCosts,
                pricePerCustomer,
                variableCostPerCustomer,
                contributionMargin: contribution,
                contributionMarginPercent: ((contribution / pricePerCustomer) * 100).toFixed(1),
                summary: breakEven === Infinity
                  ? 'Cannot break even with current pricing - price must exceed variable costs'
                  : `Need ${breakEven} customers to break even`,
              }, null, 2),
            },
          ],
        };
      }

      case 'calculate_investor_metrics': {
        const mrr = validatePositiveNumber(safeArgs.mrr, 'mrr');
        const paidCustomers = validatePositiveNumber(safeArgs.paidCustomers, 'paidCustomers');
        const arpu = validatePositiveNumber(safeArgs.arpu, 'arpu');
        const grossMargin = validateNumber(safeArgs.grossMargin, 'grossMargin');
        const breakEvenCustomers = validatePositiveNumber(safeArgs.breakEvenCustomers, 'breakEvenCustomers');
        const monthlyGrowthRate = validateNumber(safeArgs.monthlyGrowthRate, 'monthlyGrowthRate');
        const ltv = validatePositiveNumber(safeArgs.ltv, 'ltv');

        // estimatedCac is optional
        let estimatedCac: number | undefined;
        if (safeArgs.estimatedCac !== undefined && safeArgs.estimatedCac !== null) {
          estimatedCac = validatePositiveNumber(safeArgs.estimatedCac, 'estimatedCac');
        }

        const metrics = calculateInvestorMetrics({
          mrr,
          paidCustomers,
          arpu,
          grossMargin,
          breakEvenCustomers,
          monthlyGrowthRate,
          ltv,
          estimatedCac,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                revenue: {
                  mrr: metrics.mrr,
                  arr: metrics.arr,
                  arpu: metrics.arpu,
                },
                customers: {
                  paidCustomers: metrics.paidCustomers,
                  breakEvenCustomers: metrics.breakEvenCustomers,
                  customersToBreakEven: metrics.customersToBreakEven,
                  monthsToBreakEven: metrics.monthsToBreakEven,
                },
                valuation: {
                  low: `${(metrics.valuation.valuationLow / 1000000).toFixed(1)}M (5x ARR)`,
                  mid: `${(metrics.valuation.valuationMid / 1000000).toFixed(1)}M (10x ARR)`,
                  high: `${(metrics.valuation.valuationHigh / 1000000).toFixed(1)}M (15x ARR)`,
                },
                health: {
                  grossMarginHealth: metrics.grossMarginHealth,
                  ltvCacRatio: metrics.ltvCacRatio,
                  paybackPeriodMonths: metrics.paybackPeriodMonths,
                },
                milestones: metrics.milestones.map(m => ({
                  ...m,
                  monthsToReach: m.monthsToReach === null ? 'N/A' : m.monthsToReach,
                })),
              }, null, 2),
            },
          ],
        };
      }

      case 'estimate_ai_cost': {
        const provider = validateAIProvider(safeArgs.provider);
        const model = typeof safeArgs.model === 'string' ? safeArgs.model : undefined;
        const inputTokens = validatePositiveNumber(safeArgs.estimatedInputTokens, 'estimatedInputTokens');
        const outputTokens = validatePositiveNumber(safeArgs.estimatedOutputTokens, 'estimatedOutputTokens');
        const requestsPerCustomer = getNumberOrDefault(safeArgs, 'requestsPerCustomer', 1);
        const customerCount = getNumberOrDefault(safeArgs, 'customerCount', 1);

        if (requestsPerCustomer <= 0) {
          throw new Error('requestsPerCustomer must be positive');
        }
        if (customerCount <= 0) {
          throw new Error('customerCount must be positive');
        }

        const costPerRequest = calculateTokenCost(
          { promptTokens: inputTokens, completionTokens: outputTokens, totalTokens: inputTokens + outputTokens },
          provider,
          model
        );

        const totalRequests = requestsPerCustomer * customerCount;
        const totalCostUSD = costPerRequest.totalCostUSD * totalRequests;
        const totalCostMYR = costPerRequest.totalCostMYR * totalRequests;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                provider,
                model: costPerRequest.modelName,
                perRequest: {
                  inputTokens,
                  outputTokens,
                  costUSD: costPerRequest.totalCostUSD,
                  costMYR: costPerRequest.totalCostMYR,
                },
                monthly: {
                  requestsPerCustomer,
                  customerCount,
                  totalRequests,
                  totalCostUSD,
                  totalCostMYR,
                  costPerCustomerUSD: customerCount > 0 ? totalCostUSD / customerCount : 0,
                  costPerCustomerMYR: customerCount > 0 ? totalCostMYR / customerCount : 0,
                },
                summary: `Est. ${totalCostUSD.toFixed(4)} USD (${totalCostMYR.toFixed(2)} MYR) per month for ${customerCount} customers`,
              }, null, 2),
            },
          ],
        };
      }

      case 'get_margin_thresholds': {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                thresholds: MARGIN_THRESHOLDS,
                explanation: {
                  healthy: `>= ${MARGIN_THRESHOLDS.HEALTHY}% - Healthy SaaS gross margin`,
                  acceptable: `>= ${MARGIN_THRESHOLDS.ACCEPTABLE}% - Acceptable but room for improvement`,
                  low: `< ${MARGIN_THRESHOLDS.ACCEPTABLE}% - Concerning, review pricing or costs`,
                },
                industryBenchmarks: {
                  topQuartile: '80%+',
                  median: '70%',
                  bottomQuartile: '50-60%',
                },
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: errorMessage,
            tool: name,
            hint: 'Check that all required parameters are provided with valid values',
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// ============================================================================
// Resources
// ============================================================================

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'basedpricer://data/margin-thresholds',
        name: 'Margin Thresholds',
        description: 'Industry-standard SaaS margin thresholds for health classification',
        mimeType: 'application/json',
      },
      {
        uri: 'basedpricer://data/currencies',
        name: 'Supported Currencies',
        description: 'List of supported currencies with exchange rates',
        mimeType: 'application/json',
      },
      {
        uri: 'basedpricer://data/ai-pricing',
        name: 'AI Provider Pricing',
        description: 'Current pricing for AI providers (OpenAI, Anthropic, etc.)',
        mimeType: 'application/json',
      },
      {
        uri: 'basedpricer://data/cost-drivers',
        name: 'Cost Drivers',
        description: 'Common SaaS cost drivers and their default rates',
        mimeType: 'application/json',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    switch (uri) {
      case 'basedpricer://data/margin-thresholds':
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(MARGIN_THRESHOLDS, null, 2),
            },
          ],
        };

      case 'basedpricer://data/currencies':
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(CURRENCIES, null, 2),
            },
          ],
        };

      case 'basedpricer://data/ai-pricing':
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(AI_PRICING, null, 2),
            },
          ],
        };

      case 'basedpricer://data/cost-drivers':
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(COST_DRIVERS, null, 2),
            },
          ],
        };

      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    // Return error in MCP-compliant format
    return {
      contents: [
        {
          uri,
          mimeType: 'text/plain',
          text: `Error: ${errorMessage}`,
        },
      ],
    };
  }
});

// ============================================================================
// Start Server
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('BasedPricer MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
