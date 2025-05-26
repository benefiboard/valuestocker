'use client';

import { useState, useEffect } from 'react';
import { Calculator, TrendingUp } from 'lucide-react';

export default function StockInvestmentCalculator() {
  const [investmentType, setInvestmentType] = useState('savings'); // "savings" or "lump"
  const [period, setPeriod] = useState(10); // 투자기간 (년)
  const [annualReturn, setAnnualReturn] = useState(8); // 연수익률 (%)
  const [amount, setAmount] = useState(1000); // 투자금액 (만원)
  const [result, setResult] = useState({ totalAmount: 0, totalReturn: 0, totalInvestment: 0 });

  // 한국 단위 변환 함수
  const formatKoreanCurrency = (num: number) => {
    if (num >= 100000000) {
      // 1억만원 이상 (조 단위)
      const jo = Math.floor(num / 100000000);
      const eok = Math.floor((num % 100000000) / 10000);
      const man = num % 10000;

      let result = '';
      if (jo > 0) result += `${jo}조`;
      if (eok > 0) result += ` ${eok}억`;
      if (man > 0) result += ` ${man.toLocaleString()}만원`;
      else if (result && !result.includes('만원')) result += '원';

      return result.trim();
    } else if (num >= 10000) {
      // 1억만원 미만, 1만원 이상
      const eok = Math.floor(num / 10000);
      const man = num % 10000;

      let result = '';
      if (eok > 0) result += `${eok}억`;
      if (man > 0) result += ` ${man.toLocaleString()}만원`;

      return result.trim();
    }
    return `${num.toLocaleString()}만원`;
  };

  // 투자 결과 계산 (복리)
  const calculateInvestment = () => {
    const rate = annualReturn / 100;
    let totalAmount = 0;
    let totalInvestment = 0;

    if (investmentType === 'savings') {
      // 적금형 (매년 일정 금액 투자) - 복리
      totalInvestment = amount * period;
      if (rate === 0) {
        totalAmount = totalInvestment;
      } else {
        totalAmount = amount * (((1 + rate) ** period - 1) / rate);
      }
    } else {
      // 예금형 (초기 일시불 투자) - 복리
      totalInvestment = amount;
      totalAmount = amount * (1 + rate) ** period;
    }

    const totalReturn = totalAmount - totalInvestment;

    setResult({
      totalAmount: Math.round(totalAmount),
      totalReturn: Math.round(totalReturn),
      totalInvestment: Math.round(totalInvestment),
    });
  };

  useEffect(() => {
    calculateInvestment();
  }, [investmentType, period, annualReturn, amount]);

  const returnRate =
    result.totalInvestment > 0 ? (result.totalReturn / result.totalInvestment) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-16">
      <div className="max-w-5xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">주식투자 결과 계산기</h1>
          <p className="text-gray-600">투자 조건을 입력하여 예상 수익을 계산해보세요</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 좌측 입력 폼 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            {/* 투자 방식 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">투자 방식</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setInvestmentType('savings')}
                  className={`p-4 rounded-lg border transition-colors ${
                    investmentType === 'savings'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-medium mb-1">적금형</div>
                    <div className="text-xs text-gray-500">매년 일정금액</div>
                  </div>
                </button>
                <button
                  onClick={() => setInvestmentType('lump')}
                  className={`p-4 rounded-lg border transition-colors ${
                    investmentType === 'lump'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-medium mb-1">예금형</div>
                    <div className="text-xs text-gray-500">초기 일시불</div>
                  </div>
                </button>
              </div>
            </div>

            {/* 투자금액 */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                {investmentType === 'savings' ? '매년 투자금액' : '초기 투자금액'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={amount.toLocaleString()}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                      setAmount(Number(value) || 0);
                    }
                  }}
                  className="w-full text-right text-2xl font-bold text-blue-600 bg-transparent border-0 border-b-2 border-gray-300 focus:border-blue-600 focus:outline-none pb-2 pr-10"
                  style={{
                    WebkitAppearance: 'none',
                    MozAppearance: 'textfield',
                  }}
                  placeholder="5,000"
                />
                <span className="absolute right-0 bottom-2 text-lg text-gray-500 font-medium w-10 text-right">
                  만원
                </span>
              </div>
            </div>

            {/* 투자기간 */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">투자기간</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={period}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (
                      value === '' ||
                      (!isNaN(Number(value)) && Number(value) >= 0 && Number(value) <= 50)
                    ) {
                      setPeriod(Number(value) || 0);
                    }
                  }}
                  className="w-full text-right text-2xl font-bold text-blue-600 bg-transparent border-0 border-b-2 border-gray-300 focus:border-blue-600 focus:outline-none pb-2 pr-10"
                  style={{
                    WebkitAppearance: 'none',
                    MozAppearance: 'textfield',
                  }}
                  placeholder="5"
                />
                <span className="absolute right-0 bottom-2 text-lg text-gray-500 font-medium w-10 text-right">
                  년
                </span>
              </div>
            </div>

            {/* 연수익률 */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">연수익률</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={annualReturn}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (
                      value === '' ||
                      (!isNaN(Number(value)) && Number(value) >= 0 && Number(value) <= 100)
                    ) {
                      setAnnualReturn(Number(value) || 0);
                    }
                  }}
                  className="w-full text-right text-2xl font-bold text-blue-600 bg-transparent border-0 border-b-2 border-gray-300 focus:border-blue-600 focus:outline-none pb-2 pr-10"
                  style={{
                    WebkitAppearance: 'none',
                    MozAppearance: 'textfield',
                  }}
                  placeholder="20"
                />
                <span className="absolute right-0 bottom-2 text-lg text-gray-500 font-medium w-10 text-right">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* 우측 결과 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <div className="text-center mb-6">
              <p className=" text-blue-600 text-2xl font-bold">
                {formatKoreanCurrency(result.totalAmount)}
              </p>
            </div>

            <hr className="my-6" />

            {/* 투자 결과 상세 */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">총 투자원금</span>
                <span className="text-lg font-bold">
                  {formatKoreanCurrency(result.totalInvestment)}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">총 수익금</span>
                <span className="text-lg font-bold text-blue-600">
                  +{formatKoreanCurrency(result.totalReturn)}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">최종 자산</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatKoreanCurrency(result.totalAmount)}
                </span>
              </div>

              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600 font-medium">총 수익률</span>
                <span className="text-xl font-bold text-blue-600">+{returnRate.toFixed(1)}%</span>
              </div>
            </div>

            {/* 투자 방식 설명 */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-2">
                💡 {investmentType === 'savings' ? '적금형 투자' : '예금형 투자'} 특징
              </div>
              <div className="text-xs text-gray-500">
                {investmentType === 'savings'
                  ? '매년 일정 금액을 꾸준히 투자하여 시간 분산 효과와 복리 효과를 모두 얻는 방식입니다.'
                  : '초기에 목돈을 일시불로 투자하여 복리 효과를 극대화하는 방식입니다.'}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 주의사항 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-xs text-gray-500">
            ※ 본 계산은 복리로 계산되며, 실제 투자 결과는 시장 상황에 따라 달라질 수 있습니다. 세금,
            수수료 등은 고려되지 않았습니다.
          </div>
        </div>
      </div>
    </div>
  );
}
