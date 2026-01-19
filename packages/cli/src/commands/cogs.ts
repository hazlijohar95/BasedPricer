/**
 * COGS command - calculate Cost of Goods Sold
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import {
  calculateCOGSBreakdown,
  calculateGrossMargin,
  getMarginHealth,
  calculateBreakEvenCustomers,
  validateVariableCostItem,
  validateFixedCostItem,
  CURRENCIES,
  type VariableCostItem,
  type FixedCostItem,
} from '@basedpricer/core';
import { formatCOGSTable, formatMarginTable } from '../formatters/table.js';
import { formatCOGSMarkdown, formatMarginMarkdown } from '../formatters/markdown.js';
import { formatJson } from '../formatters/json.js';
import { getDefaultCurrency } from '../utils/config.js';
import {
  parsePositiveInteger,
  parsePositiveNumber,
  validateCurrencyCode,
  validateOutputFormat,
  parseCostsJson,
} from '../utils/validation.js';
import { SAMPLE_VARIABLE_COSTS, SAMPLE_FIXED_COSTS } from '../data/sample-costs.js';

/**
 * Validate that a file path is safe (within current working directory)
 */
function validateFilePath(filePath: string): string {
  const resolved = path.resolve(filePath);
  const cwd = process.cwd();

  // Allow absolute paths but warn about them
  if (!resolved.startsWith(cwd)) {
    console.log(chalk.yellow(`Note: File path is outside current directory: ${resolved}`));
  }

  return resolved;
}

/**
 * Load and validate costs from a JSON file
 */
async function loadCostsFromFile(filePath: string): Promise<{
  variableCosts: VariableCostItem[];
  fixedCosts: FixedCostItem[];
}> {
  const resolvedPath = validateFilePath(filePath);

  if (!existsSync(resolvedPath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const fileContent = await readFile(resolvedPath, 'utf-8');
  const parsed = parseCostsJson(fileContent, filePath);

  const variableCosts: VariableCostItem[] = [];
  const fixedCosts: FixedCostItem[] = [];
  const warnings: string[] = [];

  // Validate variable costs
  for (let i = 0; i < parsed.variableCosts.length; i++) {
    const cost = parsed.variableCosts[i];
    const result = validateVariableCostItem(cost);
    if (result.success) {
      variableCosts.push(result.data);
    } else {
      warnings.push(`variableCosts[${i}]: ${result.error}`);
    }
  }

  // Validate fixed costs
  for (let i = 0; i < parsed.fixedCosts.length; i++) {
    const cost = parsed.fixedCosts[i];
    const result = validateFixedCostItem(cost);
    if (result.success) {
      fixedCosts.push(result.data);
    } else {
      warnings.push(`fixedCosts[${i}]: ${result.error}`);
    }
  }

  // Show warnings for invalid items
  if (warnings.length > 0) {
    console.error(chalk.yellow('\nWarnings while parsing costs file:'));
    warnings.forEach((w) => console.error(chalk.yellow(`  - ${w}`)));
    console.log();
  }

  if (variableCosts.length === 0 && fixedCosts.length === 0) {
    throw new Error('No valid cost items found in file');
  }

  return { variableCosts, fixedCosts };
}

export const cogsCommand = new Command('cogs')
  .description('Calculate COGS (Cost of Goods Sold) and margins')
  .option('-i, --input <file>', 'JSON file with cost data')
  .option('-c, --customers <number>', 'Number of customers (positive integer)', '100')
  .option('-p, --price <number>', 'Price per customer for margin calculation (positive number)')
  .option('-o, --output <format>', 'Output format: table, json, markdown', 'table')
  .option('--currency <code>', 'Currency code (MYR, USD, SGD, EUR, GBP, AUD)', 'MYR')
  .option('--save <file>', 'Save output to file')
  .action(async (options) => {
    try {
      // Validate all inputs upfront
      const outputFormat = validateOutputFormat(options.output);
      const customerCount = parsePositiveInteger(options.customers, 'Customer count');
      const currencyCode = validateCurrencyCode(options.currency || getDefaultCurrency());
      const currency = CURRENCIES[currencyCode];

      // Price is optional - validate only if provided
      let price: number | undefined;
      if (options.price !== undefined) {
        price = parsePositiveNumber(options.price, 'Price');
      }

      let variableCosts: VariableCostItem[];
      let fixedCosts: FixedCostItem[];

      // Load costs from file or use sample data
      if (options.input) {
        const loaded = await loadCostsFromFile(options.input);
        variableCosts = loaded.variableCosts;
        fixedCosts = loaded.fixedCosts;
      } else {
        // Use sample data for demo
        variableCosts = SAMPLE_VARIABLE_COSTS;
        fixedCosts = SAMPLE_FIXED_COSTS;
        console.log(chalk.gray('Using sample data. Use --input to provide your own costs.json\n'));
      }

      // Calculate COGS
      const breakdown = calculateCOGSBreakdown(variableCosts, fixedCosts, customerCount);

      // Prepare output based on format
      let output: string;

      if (outputFormat === 'json') {
        output = formatJsonOutput(
          variableCosts,
          fixedCosts,
          breakdown,
          customerCount,
          currencyCode,
          price
        );
      } else if (outputFormat === 'markdown') {
        output = formatMarkdownOutput(
          variableCosts,
          fixedCosts,
          breakdown,
          customerCount,
          currency.symbol,
          price
        );
      } else {
        output = formatTableOutput(
          variableCosts,
          fixedCosts,
          breakdown,
          customerCount,
          currency.symbol,
          price
        );
      }

      // Output result
      console.log(output);

      // Save to file if requested
      if (options.save) {
        const savePath = validateFilePath(options.save);
        await writeFile(savePath, output, 'utf-8');
        console.log(chalk.green(`\n✓ Saved to ${options.save}`));
      }
    } catch (err) {
      console.error(chalk.red('Error:'), (err as Error).message);
      process.exit(1);
    }
  });

/**
 * Format output as JSON
 */
function formatJsonOutput(
  variableCosts: VariableCostItem[],
  fixedCosts: FixedCostItem[],
  breakdown: ReturnType<typeof calculateCOGSBreakdown>,
  customerCount: number,
  currencyCode: string,
  price?: number
): string {
  const result: Record<string, unknown> = {
    customerCount,
    currency: currencyCode,
    breakdown,
    variableCosts,
    fixedCosts,
  };

  if (price !== undefined) {
    const margin = calculateGrossMargin(price, breakdown.totalCOGS);
    const health = getMarginHealth(margin);
    const breakEven = calculateBreakEvenCustomers(
      breakdown.fixedTotal,
      price,
      breakdown.variableTotal
    );

    result.marginAnalysis = {
      price,
      margin,
      health,
      profit: price - breakdown.totalCOGS,
      breakEvenCustomers: breakEven === Infinity ? null : breakEven,
    };
  }

  return formatJson(result);
}

/**
 * Format output as Markdown
 */
function formatMarkdownOutput(
  variableCosts: VariableCostItem[],
  fixedCosts: FixedCostItem[],
  breakdown: ReturnType<typeof calculateCOGSBreakdown>,
  customerCount: number,
  currencySymbol: string,
  price?: number
): string {
  let output = formatCOGSMarkdown(
    variableCosts,
    fixedCosts,
    breakdown,
    customerCount,
    currencySymbol
  );

  if (price !== undefined) {
    const margin = calculateGrossMargin(price, breakdown.totalCOGS);
    const health = getMarginHealth(margin);
    output += '\n' + formatMarginMarkdown(price, breakdown.totalCOGS, margin, health, currencySymbol);
  }

  return output;
}

/**
 * Format output as table
 */
function formatTableOutput(
  variableCosts: VariableCostItem[],
  fixedCosts: FixedCostItem[],
  breakdown: ReturnType<typeof calculateCOGSBreakdown>,
  customerCount: number,
  currencySymbol: string,
  price?: number
): string {
  let output = formatCOGSTable(
    variableCosts,
    fixedCosts,
    breakdown,
    customerCount,
    currencySymbol
  );

  if (price !== undefined) {
    const margin = calculateGrossMargin(price, breakdown.totalCOGS);
    const health = getMarginHealth(margin);
    output += '\n' + formatMarginTable(price, breakdown.totalCOGS, margin, health, currencySymbol);

    // Show break-even
    const breakEven = calculateBreakEvenCustomers(
      breakdown.fixedTotal,
      price,
      breakdown.variableTotal
    );

    if (breakEven !== Infinity && breakEven > 0) {
      output += '\n' + chalk.cyan(`Break-even: ${breakEven} customers`);
    } else if (price <= breakdown.variableTotal) {
      output += '\n' + chalk.yellow(`Warning: Price (${currencySymbol}${price}) is not higher than variable cost per customer (${currencySymbol}${breakdown.variableTotal.toFixed(2)}). Break-even not possible.`);
    }
  }

  return output;
}
