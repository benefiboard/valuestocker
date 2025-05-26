// src/app/earning/components.tsx

import { YearlyData } from './types';
import { formatCurrency } from './utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface YearlyBreakdownTableProps {
  data: YearlyData[];
}

export function YearlyBreakdownTable({ data }: YearlyBreakdownTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data || data.length === 0) return null;

  const displayData = isExpanded ? data : data.slice(0, 5);

  return (
    <div className="mt-8 bg-white rounded-xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">연도별 상세 내역</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-gray-600">
              <th className="text-left py-2">연도</th>
              <th className="text-right py-2">시작금액</th>
              <th className="text-right py-2">투자금</th>
              <th className="text-right py-2">수익</th>
              <th className="text-right py-2">생활비</th>
              <th className="text-right py-2">잔액</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((yearData) => (
              <tr key={yearData.year} className="border-b hover:bg-gray-50">
                <td className="py-3">{yearData.year}년차</td>
                <td className="text-right py-3 text-gray-600">
                  {formatCurrency(yearData.startAmount)}
                </td>
                <td className="text-right py-3 text-blue-600">
                  {yearData.investment > 0 && '+'}
                  {formatCurrency(yearData.investment)}
                </td>
                <td className="text-right py-3 text-green-600">
                  +{formatCurrency(yearData.returns)}
                </td>
                <td className="text-right py-3 text-red-600">
                  {yearData.expense > 0 && '-'}
                  {formatCurrency(yearData.expense)}
                </td>
                <td className="text-right py-3 font-medium">
                  {formatCurrency(yearData.endAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length > 5 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp size={16} />
              접기
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              {data.length - 5}개 더 보기
            </>
          )}
        </button>
      )}
    </div>
  );
}

interface InvestmentSummaryProps {
  totalInvested: number;
  totalReturn: number;
  totalExpenses: number;
  finalAmount: number;
  years: number;
}

export function InvestmentSummary({
  totalInvested,
  totalReturn,
  totalExpenses,
  finalAmount,
  years,
}: InvestmentSummaryProps) {
  const totalReturnRate =
    totalInvested > 0
      ? (((finalAmount - totalInvested + totalExpenses) / totalInvested) * 100).toFixed(1)
      : '0';

  return (
    <div className="grid grid-cols-2 gap-4 mt-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-600">총 투자금액</p>
        <p className="text-lg font-semibold text-gray-800">{formatCurrency(totalInvested)}</p>
      </div>

      <div className="bg-green-50 rounded-lg p-4">
        <p className="text-sm text-green-600">총 수익</p>
        <p className="text-lg font-semibold text-green-700">+{formatCurrency(totalReturn)}</p>
      </div>

      <div className="bg-red-50 rounded-lg p-4">
        <p className="text-sm text-red-600">총 생활비</p>
        <p className="text-lg font-semibold text-red-700">-{formatCurrency(totalExpenses)}</p>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-600">총 수익률</p>
        <p className="text-lg font-semibold text-blue-700">{totalReturnRate}%</p>
      </div>
    </div>
  );
}
