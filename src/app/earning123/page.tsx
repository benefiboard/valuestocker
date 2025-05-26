'use client';

import { useState } from 'react';
import { Calculator, TrendingUp, Wallet, Calendar, Percent, DollarSign, Info } from 'lucide-react';
import { InvestmentMode, InvestmentResult } from './types';
import { calculateInvestmentReturn, formatCurrency, formatNumber } from './utils';
import { formatKoreanAmount, parseKoreanAmount } from './inputUtils';

export default function EarningCalculatorPage() {
  const [mode, setMode] = useState<InvestmentMode>('monthly');
  const [years, setYears] = useState(5);
  const [returnRate, setReturnRate] = useState(15);
  const [yearlyInvestment, setYearlyInvestment] = useState(10000000); // 연간 1천만원
  const [initialInvestment, setInitialInvestment] = useState(10000000); // 초기 1천만원
  const [inflationRate, setInflationRate] = useState(3);
  const [yearlyExpense, setYearlyExpense] = useState(0);
  const [result, setResult] = useState<InvestmentResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleCalculate = () => {
    const params = {
      mode,
      years,
      returnRate,
      yearlyInvestment: mode === 'monthly' ? yearlyInvestment : 0,
      initialInvestment: mode === 'lumpsum' ? initialInvestment : 0,
      inflationRate,
      yearlyExpense,
    };

    console.log('계산 파라미터:', params);

    const calculationResult = calculateInvestmentReturn(params);
    console.log('계산 결과:', calculationResult);

    setResult(calculationResult);
  };

  // 입력값 변경 핸들러
  const handleYearlyInvestmentChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    setYearlyInvestment(numValue);
  };

  const handleInitialInvestmentChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    setInitialInvestment(numValue);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            주식투자 복리 계산기
          </h1>
          <p className="text-gray-600">복리의 마법으로 당신의 미래 자산을 계산해보세요</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 왼쪽: 입력 영역 */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Calculator className="mr-2 text-pink-500" size={24} />
                  투자 설정
                </h2>

                {/* 투자 모드 선택 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">투자 방식</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setMode('monthly')}
                      className={`py-3 px-4 rounded-lg font-medium transition-all ${
                        mode === 'monthly'
                          ? 'bg-pink-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      적금형 (매년 추가투자)
                    </button>
                    <button
                      onClick={() => setMode('lumpsum')}
                      className={`py-3 px-4 rounded-lg font-medium transition-all ${
                        mode === 'lumpsum'
                          ? 'bg-pink-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      예금형 (초기투자만)
                    </button>
                  </div>
                </div>

                {/* 투자 기간 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline mr-1" size={16} />
                    투자 기간: {years}년
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1년</span>
                    <span>30년</span>
                  </div>
                </div>

                {/* 연 수익률 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <TrendingUp className="inline mr-1" size={16} />연 수익률: {returnRate}%
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={returnRate}
                    onChange={(e) => setReturnRate(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1%</span>
                    <span>20%</span>
                  </div>
                </div>

                {/* 투자 금액 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Wallet className="inline mr-1" size={16} />
                    {mode === 'monthly' ? '매년 투자금액' : '초기 투자금액'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={
                        mode === 'monthly'
                          ? yearlyInvestment.toLocaleString()
                          : initialInvestment.toLocaleString()
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        // 콤마 제거하고 한국어 금액 표현 파싱
                        const cleanValue = value.replace(/,/g, '');
                        const numValue = parseKoreanAmount(cleanValue);

                        console.log(`입력값: "${value}" → 파싱결과: ${numValue}`);

                        if (mode === 'monthly') {
                          setYearlyInvestment(numValue);
                        } else {
                          setInitialInvestment(numValue);
                        }
                      }}
                      onBlur={(e) => {
                        // 포커스를 잃었을 때 포맷팅
                        const currentValue =
                          mode === 'monthly' ? yearlyInvestment : initialInvestment;
                        e.target.value = currentValue.toLocaleString();
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="예: 1000만원, 5천만원, 1억원"
                    />
                    <span className="absolute right-3 top-2 text-gray-500">원</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    {mode === 'monthly' ? (
                      <>
                        <p>
                          연간 투자금액: {formatCurrency(yearlyInvestment)} (
                          {formatKoreanAmount(yearlyInvestment)})
                        </p>
                        <p>월 투자금액: {formatCurrency(Math.round(yearlyInvestment / 12))}</p>
                      </>
                    ) : (
                      <p>
                        초기 투자금액: {formatCurrency(initialInvestment)} (
                        {formatKoreanAmount(initialInvestment)})
                      </p>
                    )}
                  </div>
                </div>

                {/* 고급 설정 */}
                <details className="mb-6">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2 hover:text-gray-900">
                    고급 설정 ▼
                  </summary>

                  <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                    {/* 인플레이션율 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Percent className="inline mr-1" size={16} />
                        연간 인플레이션율: {inflationRate}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={inflationRate}
                        onChange={(e) => setInflationRate(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>

                    {/* 연간 생활비 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <DollarSign className="inline mr-1" size={16} />
                        연간 생활비
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={yearlyExpense}
                          onChange={(e) => setYearlyExpense(parseInt(e.target.value) || 0)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-2 text-gray-500">원</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">매년 인플레이션율만큼 증가합니다</p>
                    </div>
                  </div>
                </details>

                <button
                  onClick={handleCalculate}
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  계산하기
                </button>

                {/* 디버그 정보 (개발용) */}
                <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
                  <p>현재 설정값:</p>
                  <p>- 모드: {mode}</p>
                  <p>- 기간: {years}년</p>
                  <p>- 수익률: {returnRate}%</p>
                  <p>- 연간투자금: {yearlyInvestment.toLocaleString()}원</p>
                  <p>- 초기투자금: {initialInvestment.toLocaleString()}원</p>
                </div>
              </div>
            </div>

            {/* 오른쪽: 결과 영역 */}
            <div className="flex items-center justify-center">
              <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-8 text-white w-full max-w-md shadow-2xl">
                <div className="text-center">
                  <p className="text-lg mb-2 opacity-90">{years}년 후 예상 자산</p>
                  <div className="text-5xl sm:text-6xl font-bold mb-4">
                    {result !== null ? <>₩{result.finalAmount}</> : <>₩0</>}
                  </div>

                  {result !== null && (
                    <div className="mt-6 space-y-3 text-sm">
                      <div className="flex justify-between opacity-90">
                        <span>투자 방식:</span>
                        <span className="font-medium">
                          {mode === 'monthly' ? '적금형' : '예금형'}
                        </span>
                      </div>
                      <div className="flex justify-between opacity-90">
                        <span>연 수익률:</span>
                        <span className="font-medium">{returnRate}%</span>
                      </div>
                      <div className="flex justify-between opacity-90">
                        <span>투자 기간:</span>
                        <span className="font-medium">{years}년</span>
                      </div>
                      <div className="flex justify-between opacity-90">
                        <span>총 투자금:</span>
                        <span className="font-medium">₩{formatCurrency(result.totalInvested)}</span>
                      </div>
                      <div className="flex justify-between opacity-90">
                        <span>총 수익:</span>
                        <span className="font-medium text-green-300">
                          +₩{formatCurrency(result.totalReturn)}
                        </span>
                      </div>
                      {yearlyExpense > 0 && (
                        <div className="flex justify-between opacity-90">
                          <span>총 생활비:</span>
                          <span className="font-medium">
                            ₩{formatCurrency(result.totalExpenses)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleCalculate}
                    className="mt-8 bg-white text-pink-500 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors duration-200 shadow-lg"
                  >
                    다시 계산하기
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 상세 결과 표시 */}
          {result && result.yearlyBreakdown.length > 0 && (
            <div className="mt-8">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                <Info size={20} />
                {showDetails ? '상세 내역 숨기기' : '연도별 상세 내역 보기'}
              </button>

              {showDetails && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">연도</th>
                        <th className="px-4 py-2 text-right">시작 잔액</th>
                        <th className="px-4 py-2 text-right">투자금</th>
                        <th className="px-4 py-2 text-right">수익</th>
                        <th className="px-4 py-2 text-right">생활비</th>
                        <th className="px-4 py-2 text-right">연말 잔액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.yearlyBreakdown.map((data) => (
                        <tr key={data.year} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2">{data.year}년차</td>
                          <td className="px-4 py-2 text-right">
                            {formatCurrency(data.startAmount)}
                          </td>
                          <td className="px-4 py-2 text-right text-blue-600">
                            {data.investment > 0 && '+'}
                            {formatCurrency(data.investment)}
                          </td>
                          <td className="px-4 py-2 text-right text-green-600">
                            +{formatCurrency(data.returns)}
                          </td>
                          <td className="px-4 py-2 text-right text-red-600">
                            {data.expense > 0 && '-'}
                            {formatCurrency(data.expense)}
                          </td>
                          <td className="px-4 py-2 text-right font-medium">
                            {formatCurrency(data.endAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #ec4899;
          cursor: pointer;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #ec4899;
          cursor: pointer;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          border: none;
        }
      `}</style>
    </div>
  );
}
