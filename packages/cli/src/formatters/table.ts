/**
 * Table formatter using cli-table3
 */

import Table from 'cli-table3';
import chalk from 'chalk';
import type { CostBreakdown, MarginHealth, VariableCostItem, FixedCostItem } from '@basedpricer/core';

export interface TableData {
  title?: string;
  headers: string[];
  rows: (string | number)[][];
}

/**
 * Format data as a CLI table
 */
export function formatTable(data: TableData): string {
  const table = new Table({
    head: data.headers.map(h => chalk.cyan.bold(h)),
    style: {
      head: [],
      border: [],
    },
  });

  data.rows.forEach(row => {
    table.push(row.map(cell => String(cell)));
  });

  let output = '';
  if (data.title) {
    output += chalk.bold.white(`\n${data.title}\n`);
  }
  output += table.toString();

  return output;
}

/**
 * Format COGS breakdown as table
 */
export function formatCOGSTable(
  variableCosts: VariableCostItem[],
  fixedCosts: FixedCostItem[],
  breakdown: CostBreakdown,
  customerCount: number,
  currency: string = 'RM'
): string {
  const table = new Table({
    head: [
      chalk.cyan.bold('Cost Item'),
      chalk.cyan.bold('Type'),
      chalk.cyan.bold('Per Unit'),
      chalk.cyan.bold('Usage'),
      chalk.cyan.bold('Per Customer'),
    ],
    style: { head: [], border: [] },
  });

  // Variable costs
  variableCosts.forEach(cost => {
    const perCustomer = cost.costPerUnit * cost.usagePerCustomer;
    table.push([
      cost.name,
      chalk.blue('Variable'),
      `${currency} ${cost.costPerUnit.toFixed(4)}`,
      `${cost.usagePerCustomer} ${cost.unit}`,
      `${currency} ${perCustomer.toFixed(2)}`,
    ]);
  });

  // Fixed costs
  fixedCosts.forEach(cost => {
    const perCustomer = customerCount > 0 ? cost.monthlyCost / customerCount : 0;
    table.push([
      cost.name,
      chalk.yellow('Fixed'),
      `${currency} ${cost.monthlyCost.toFixed(2)}/mo`,
      '-',
      `${currency} ${perCustomer.toFixed(2)}`,
    ]);
  });

  // Totals
  table.push([
    chalk.bold('Variable Total'),
    '',
    '',
    '',
    chalk.bold(`${currency} ${breakdown.variableTotal.toFixed(2)}`),
  ]);
  table.push([
    chalk.bold('Fixed Total'),
    '',
    `${currency} ${breakdown.fixedTotal.toFixed(2)}/mo`,
    '',
    chalk.bold(`${currency} ${breakdown.fixedPerCustomer.toFixed(2)}`),
  ]);
  table.push([
    chalk.bold.green('Total COGS'),
    '',
    '',
    '',
    chalk.bold.green(`${currency} ${breakdown.totalCOGS.toFixed(2)}`),
  ]);

  return chalk.bold.white('\nCOGS Breakdown\n') + table.toString();
}

/**
 * Format margin analysis as table
 */
export function formatMarginTable(
  price: number,
  cogs: number,
  margin: number,
  health: MarginHealth,
  currency: string = 'RM'
): string {
  const profit = price - cogs;

  const healthColor = {
    healthy: chalk.green,
    acceptable: chalk.yellow,
    low: chalk.red,
  }[health];

  const healthIcon = {
    healthy: '✓',
    acceptable: '~',
    low: '✗',
  }[health];

  const table = new Table({
    style: { head: [], border: [] },
  });

  table.push(
    [chalk.cyan('Price'), `${currency} ${price.toFixed(2)}`],
    [chalk.cyan('COGS'), `${currency} ${cogs.toFixed(2)}`],
    [chalk.cyan('Profit'), `${currency} ${profit.toFixed(2)}`],
    [chalk.cyan('Gross Margin'), healthColor(`${margin.toFixed(1)}% ${healthIcon} ${health.charAt(0).toUpperCase() + health.slice(1)}`)],
  );

  return chalk.bold.white('\nMargin Analysis\n') + table.toString();
}

/**
 * Format key-value pairs as table
 */
export function formatKeyValueTable(
  title: string,
  data: Record<string, string | number>
): string {
  const table = new Table({
    style: { head: [], border: [] },
  });

  Object.entries(data).forEach(([key, value]) => {
    table.push([chalk.cyan(key), String(value)]);
  });

  return chalk.bold.white(`\n${title}\n`) + table.toString();
}
