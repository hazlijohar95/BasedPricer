/**
 * Markdown formatter
 */

import type { CostBreakdown, VariableCostItem, FixedCostItem, MarginHealth } from '@basedpricer/core';

/**
 * Format data as markdown table
 */
export function formatMarkdown(headers: string[], rows: (string | number)[][]): string {
  const headerRow = `| ${headers.join(' | ')} |`;
  const separator = `| ${headers.map(() => '---').join(' | ')} |`;
  const dataRows = rows.map(row => `| ${row.join(' | ')} |`).join('\n');

  return `${headerRow}\n${separator}\n${dataRows}`;
}

/**
 * Format COGS breakdown as markdown
 */
export function formatCOGSMarkdown(
  variableCosts: VariableCostItem[],
  fixedCosts: FixedCostItem[],
  breakdown: CostBreakdown,
  customerCount: number,
  currency: string = 'RM'
): string {
  let md = '## COGS Breakdown\n\n';

  // Variable costs
  md += '### Variable Costs (per customer)\n\n';
  md += '| Cost Item | Unit | Cost/Unit | Usage | Per Customer |\n';
  md += '|-----------|------|-----------|-------|-------------|\n';

  variableCosts.forEach(cost => {
    const perCustomer = cost.costPerUnit * cost.usagePerCustomer;
    md += `| ${cost.name} | ${cost.unit} | ${currency} ${cost.costPerUnit.toFixed(4)} | ${cost.usagePerCustomer} | ${currency} ${perCustomer.toFixed(2)} |\n`;
  });

  md += `| **Total Variable** | | | | **${currency} ${breakdown.variableTotal.toFixed(2)}** |\n\n`;

  // Fixed costs
  md += '### Fixed Costs (monthly)\n\n';
  md += '| Cost Item | Monthly Cost | Per Customer |\n';
  md += '|-----------|-------------|-------------|\n';

  fixedCosts.forEach(cost => {
    const perCustomer = customerCount > 0 ? cost.monthlyCost / customerCount : 0;
    md += `| ${cost.name} | ${currency} ${cost.monthlyCost.toFixed(2)} | ${currency} ${perCustomer.toFixed(2)} |\n`;
  });

  md += `| **Total Fixed** | **${currency} ${breakdown.fixedTotal.toFixed(2)}** | **${currency} ${breakdown.fixedPerCustomer.toFixed(2)}** |\n\n`;

  // Summary
  md += '### Summary\n\n';
  md += `- **Total COGS per customer**: ${currency} ${breakdown.totalCOGS.toFixed(2)}\n`;
  md += `- **Customer count**: ${customerCount}\n`;

  return md;
}

/**
 * Format margin analysis as markdown
 */
export function formatMarginMarkdown(
  price: number,
  cogs: number,
  margin: number,
  health: MarginHealth,
  currency: string = 'RM'
): string {
  const profit = price - cogs;
  const healthEmoji = {
    healthy: '🟢',
    acceptable: '🟡',
    low: '🔴',
  }[health];

  let md = '## Margin Analysis\n\n';
  md += '| Metric | Value |\n';
  md += '|--------|-------|\n';
  md += `| Price | ${currency} ${price.toFixed(2)} |\n`;
  md += `| COGS | ${currency} ${cogs.toFixed(2)} |\n`;
  md += `| Profit | ${currency} ${profit.toFixed(2)} |\n`;
  md += `| Gross Margin | ${margin.toFixed(1)}% ${healthEmoji} ${health} |\n`;

  return md;
}
