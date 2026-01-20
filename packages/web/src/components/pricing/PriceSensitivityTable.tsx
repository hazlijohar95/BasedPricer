/**
 * PriceSensitivityTable component
 * Shows how different price points affect revenue and margins
 */

import { getPriceSensitivityStatusClass, getPriceSensitivityStatusLabel } from '../../utils/marginUtils';
import { MARGIN_THRESHOLDS } from '../../constants';

export interface PriceSensitivityRow {
  price: number;
  testRevenue: number;
  testGrossProfit: number;
  testOperatingProfit: number;
  testGrossMargin: number;
  isHealthy: boolean;
  isAcceptable: boolean;
  isCurrent: boolean;
}

interface PriceSensitivityTableProps {
  data: PriceSensitivityRow[];
}

export function PriceSensitivityTable({ data }: PriceSensitivityTableProps) {
  return (
    <div className="card p-6">
      <h3 className="font-medium text-gray-900 mb-4">Basic Tier Price Sensitivity</h3>
      <div className="overflow-hidden rounded-[0.2rem] border border-[#e4e4e4]">
        <table className="w-full" aria-label="Price sensitivity analysis">
          <thead>
            <tr className="table-header">
              <th scope="col" className="text-left py-3 px-4">Price</th>
              <th scope="col" className="text-right py-3 px-4">MRR</th>
              <th scope="col" className="text-right py-3 px-4">Gross Profit</th>
              <th scope="col" className="text-right py-3 px-4">Operating Profit</th>
              <th scope="col" className="text-right py-3 px-4">Gross Margin</th>
              <th scope="col" className="text-center py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map(({
              price, testRevenue, testGrossProfit, testOperatingProfit,
              testGrossMargin, isCurrent
            }) => (
              <tr key={price} className={`table-row ${isCurrent ? 'bg-[rgba(37,63,246,0.04)]' : ''}`}>
                <td className="py-3 px-4">
                  <span className="font-semibold text-gray-900">MYR {price}</span>
                  {isCurrent && <span className="ml-2 text-xs text-[#253ff6]">(Current)</span>}
                </td>
                <td className="py-3 px-4 text-right font-mono text-gray-600">
                  MYR {testRevenue.toLocaleString()}
                </td>
                <td className={`py-3 px-4 text-right font-mono ${testGrossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  MYR {testGrossProfit.toFixed(0)}
                </td>
                <td className={`py-3 px-4 text-right font-mono ${testOperatingProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  MYR {testOperatingProfit.toFixed(0)}
                </td>
                <td className={`py-3 px-4 text-right font-semibold ${
                  testGrossMargin >= MARGIN_THRESHOLDS.HEALTHY ? 'text-emerald-600' : testGrossMargin >= MARGIN_THRESHOLDS.ACCEPTABLE ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {testGrossMargin.toFixed(1)}%
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-[0.2rem] ${
                    getPriceSensitivityStatusClass(testGrossMargin)
                  }`}>
                    {getPriceSensitivityStatusLabel(testGrossMargin)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
