'use client';

import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, DollarSign, Clock, Percent, ArrowUp } from 'lucide-react';

interface CalculationResult {
  year: number;
  compound: number;
  simple: number;
  difference: number;
}

const InterestCalculator = () => {
  const [principal, setPrincipal] = useState<number>(1000000); // 초기 금액 (원)
  const [rate, setRate] = useState<number>(5); // 연이율 (%)
  const [years, setYears] = useState<number>(10); // 기간 (년)
  const [results, setResults] = useState<CalculationResult[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);

  // 애니메이션 스타일
  const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
  }
  `;

  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.textContent = styles;
    document.head.appendChild(styleTag);
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  // 숫자를 억/만 단위로 포맷팅 (.0 제거)
  const formatAsset = (amount: number): string => {
    if (amount >= 100000000) {
      const value = amount / 100000000;
      const formatted = value.toFixed(1);
      return `${formatted.endsWith('.0') ? Math.round(value) : formatted}억원`;
    } else if (amount >= 10000) {
      const value = amount / 10000;
      const formatted = value.toFixed(1);
      return `${formatted.endsWith('.0') ? Math.round(value) : formatted}만원`;
    } else {
      return `${Math.round(amount).toLocaleString()}원`;
    }
  };

  // 입력창용 숫자 포맷팅 (천 단위 콤마)
  const formatNumberWithCommas = (num: number): string => {
    return num.toLocaleString('ko-KR');
  };

  // 콤마가 포함된 문자열을 숫자로 변환
  const parseNumberFromInput = (value: string): number => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    return cleanValue ? parseInt(cleanValue) : 0;
  };

  // 복리/단리 계산 함수
  const calculateInterest = () => {
    // 입력 값 검증
    if (!principal || principal <= 0 || !rate || rate <= 0 || !years || years <= 0 || years > 50) {
      alert(
        '올바른 값을 입력해주세요.\n- 초기 투자금액: 1원 이상\n- 연 이자율: 0%보다 큰 값\n- 투자 기간: 1~50년'
      );
      return;
    }

    const calculationResults: CalculationResult[] = [];

    for (let year = 0; year <= years; year++) {
      const compoundAmount = principal * Math.pow(1 + rate / 100, year);
      const simpleAmount = principal * (1 + (rate / 100) * year);
      const difference = compoundAmount - simpleAmount;

      calculationResults.push({
        year,
        compound: compoundAmount,
        simple: simpleAmount,
        difference,
      });
    }

    setResults(calculationResults);
    setShowResults(true);
  };

  // SVG 차트 생성
  const generateChart = () => {
    if (results.length === 0 || years <= 0 || years > 50) return null;

    const maxAmount = Math.max(...results.map((r) => r.compound));
    const chartWidth = 500;
    const chartHeight = 250;
    const padding = 60; // padding 증가

    if (maxAmount <= principal || results.length < 2) return null;

    // 데이터 포인트 생성
    const compoundPoints = results
      .map((r, index) => {
        const x = padding + (index / (results.length - 1)) * (chartWidth - 2 * padding);
        const y =
          chartHeight -
          padding -
          ((r.compound - principal) / (maxAmount - principal)) * (chartHeight - 2 * padding);
        return `${x},${y}`;
      })
      .join(' ');

    const simplePoints = results
      .map((r, index) => {
        const x = padding + (index / (results.length - 1)) * (chartWidth - 2 * padding);
        const y =
          chartHeight -
          padding -
          ((r.simple - principal) / (maxAmount - principal)) * (chartHeight - 2 * padding);
        return `${x},${y}`;
      })
      .join(' ');

    // Y축 눈금 계산
    const yTicks = [];
    for (let i = 0; i <= 5; i++) {
      const value = principal + (i / 5) * (maxAmount - principal);
      const y = chartHeight - padding - (i / 5) * (chartHeight - 2 * padding);
      yTicks.push({ y, value });
    }

    // X축 눈금 계산
    const xTicks = [];
    const step = Math.max(1, Math.ceil(years / 5));
    for (let i = 0; i <= years; i += step) {
      if (years > 0) {
        const x = padding + (i / years) * (chartWidth - 2 * padding);
        xTicks.push({ x, value: i });
      }
    }

    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">📈 복리 vs 단리 비교</h3>
        <svg width={chartWidth} height={chartHeight} className="mx-auto">
          {/* 격자 */}
          {yTicks.map((tick, index) => (
            <line
              key={`y-grid-${index}`}
              x1={padding}
              y1={tick.y}
              x2={chartWidth - padding}
              y2={tick.y}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          ))}
          {xTicks.map((tick, index) => (
            <line
              key={`x-grid-${index}`}
              x1={tick.x}
              y1={padding}
              x2={tick.x}
              y2={chartHeight - padding}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          ))}

          {/* 축 */}
          <line
            x1={padding}
            y1={chartHeight - padding}
            x2={chartWidth - padding}
            y2={chartHeight - padding}
            stroke="#9ca3af"
            strokeWidth="2"
          />
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={chartHeight - padding}
            stroke="#9ca3af"
            strokeWidth="2"
          />

          {/* 화살표 */}
          <polygon
            points={`${chartWidth - padding + 5},${chartHeight - padding} ${
              chartWidth - padding - 5
            },${chartHeight - padding - 5} ${chartWidth - padding - 5},${
              chartHeight - padding + 5
            }`}
            fill="#9ca3af"
          />
          <polygon
            points={`${padding},${padding - 5} ${padding - 5},${padding + 5} ${padding + 5},${
              padding + 5
            }`}
            fill="#9ca3af"
          />

          {/* 단리 선 (회색) */}
          <polyline
            points={simplePoints}
            fill="none"
            stroke="#4b5563"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 복리 선 (emerald) */}
          <polyline
            points={compoundPoints}
            fill="none"
            stroke="#059669"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Y축 라벨 */}
          {yTicks.map((tick, index) => (
            <text
              key={`y-label-${index}`}
              x={padding - 15}
              y={tick.y + 5}
              textAnchor="end"
              className="text-xs fill-gray-600"
            >
              {formatAsset(tick.value)}
            </text>
          ))}

          {/* X축 라벨 */}
          {xTicks.map((tick, index) => (
            <text
              key={`x-label-${index}`}
              x={tick.x}
              y={chartHeight - padding + 20}
              textAnchor="middle"
              className="text-xs fill-gray-600"
            >
              {tick.value}년
            </text>
          ))}

          {/* 축 제목 */}
          <text
            x={padding - 35}
            y={padding - 15}
            textAnchor="middle"
            className="text-sm fill-gray-600"
          >
            수익
          </text>
          <text
            x={chartWidth - padding + 30}
            y={chartHeight - padding + 5}
            textAnchor="middle"
            className="text-sm fill-gray-600"
          >
            기간
          </text>

          {/* 범례 */}
          <g transform="translate(80, 40)">
            <line x1="0" y1="0" x2="20" y2="0" stroke="#059669" strokeWidth="3" />
            <text x="25" y="5" className="text-sm fill-emerald-600">
              복리
            </text>
            <line x1="0" y1="20" x2="20" y2="20" stroke="#4b5563" strokeWidth="3" />
            <text x="25" y="25" className="text-sm fill-gray-600">
              단리
            </text>
          </g>
        </svg>
      </div>
    );
  };

  const finalCompound = results.length > 0 ? results[results.length - 1].compound : 0;
  const finalSimple = results.length > 0 ? results[results.length - 1].simple : 0;
  const totalDifference = finalCompound - finalSimple;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 px-4 sm:px-6 py-4 sm:py-6">
      <main className="flex-1 max-w-4xl mx-auto w-full">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md mb-6 border border-gray-100">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">📈 복리 계산기</h1>
            <p className="text-gray-600">
              복리의 마법을 체험해보세요! 시간이 지날수록 커지는 차이를 확인할 수 있습니다.
            </p>
          </div>

          {/* 입력 폼 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                💰 초기 투자금액
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formatNumberWithCommas(principal)}
                  onChange={(e) => {
                    const parsedValue = parseNumberFromInput(e.target.value);
                    setPrincipal(parsedValue);
                  }}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right"
                  placeholder="1,000,000"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  원
                </span>
              </div>
              <div className="mt-1 text-xs text-emerald-600 font-medium">
                💡 {formatAsset(principal)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">📊 연 이자율</label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={rate.toString()}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    if (value === '' || value === '.') {
                      setRate(0);
                    } else {
                      const num = parseFloat(value);
                      setRate(isNaN(num) ? 0 : num);
                    }
                  }}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right"
                  placeholder="5"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  %
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">⏰ 투자 기간</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={years.toString()}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setYears(value ? parseInt(value) : 0);
                  }}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right"
                  placeholder="10"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  년
                </span>
              </div>
            </div>
          </div>

          {/* 계산 버튼 */}
          <button
            onClick={calculateInterest}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl text-lg font-bold"
          >
            <Calculator size={24} className="mr-3" />
            복리 효과 계산하기
          </button>
        </div>

        {/* 결과 영역 */}
        {showResults && results.length > 0 && (
          <div className="animate-fadeIn space-y-6">
            {/* 메인 결과 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-md">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 text-center">
                🎯 {years}년 후 결과
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-6 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-sm text-emerald-700 mb-2">복리 (복합이자)</p>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-600 mb-2">
                    {formatAsset(finalCompound)}
                  </p>
                  <div className="flex items-center justify-center text-sm text-emerald-600">
                    <TrendingUp size={16} className="mr-1" />+
                    {formatAsset(finalCompound - principal)}
                  </div>
                </div>

                <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-700 mb-2">단리 (단순이자)</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-600 mb-2">
                    {formatAsset(finalSimple)}
                  </p>
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <ArrowUp size={16} className="mr-1" />+{formatAsset(finalSimple - principal)}
                  </div>
                </div>

                <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-700 mb-2">복리의 추가 효과</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">
                    {formatAsset(totalDifference)}
                  </p>
                  <div className="flex items-center justify-center text-sm text-blue-600">
                    ✨ 복리만의 혜택
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-gray-600 border-t pt-4">
                연 {rate}% 이자율, {years}년간 운용 기준
              </div>
            </div>

            {/* 차트 */}
            {generateChart()}

            {/* 투자 시나리오 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6">💡 투자 시나리오 시뮬레이션</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
                  <div className="text-center">
                    <p className="text-sm text-emerald-700 mb-2">
                      💰 {formatAsset(principal)} 투자 시
                    </p>
                    <p className="text-2xl font-bold text-emerald-600 mb-2">
                      {years}년 후 → {formatAsset(finalCompound)}
                    </p>
                    <p className="text-sm text-emerald-600">
                      총 수익: +{formatAsset(finalCompound - principal)}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <div className="text-center">
                    <p className="text-sm text-blue-700 mb-2">📈 복리의 마법</p>
                    <p className="text-2xl font-bold text-blue-600 mb-2">
                      +{formatAsset(totalDifference)}
                    </p>
                    <p className="text-sm text-blue-600">단리보다 더 많은 수익</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>💡 TIP:</strong> 매년 인플레이션(약 2-3%)을 고려하면 실질 수익률은 더
                  낮아집니다. 현재 설정된 {rate}%는 명목 수익률입니다.
                </p>
              </div>
            </div>

            {/* 연도별 상세 표 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6">📋 연도별 상세 내역</h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">연차</th>
                      <th className="text-right py-3 px-4 text-sm font-bold text-emerald-700">
                        복리
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">단리</th>
                      <th className="text-right py-3 px-4 text-sm font-bold text-blue-700">차이</th>
                      <th className="text-right py-3 px-4 text-sm font-bold text-purple-700">
                        복리 배수
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result) => (
                      <tr key={result.year} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium">{result.year}년차</td>
                        <td className="py-3 px-4 text-sm text-right font-medium text-emerald-600">
                          {formatAsset(result.compound)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-gray-600">
                          {formatAsset(result.simple)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-medium text-blue-600">
                          +{formatAsset(result.difference)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-purple-600">
                          {(result.compound / result.simple).toFixed(3)}배
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 복리 효과 설명 */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">💡 복리가 특별한 이유</h3>

              <div className="space-y-4 text-sm">
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="font-medium text-emerald-800 mb-2">🌱 복리의 핵심</p>
                  <p className="text-emerald-700">
                    복리는 "이자에 이자가 붙는" 효과입니다. 매년 원금뿐만 아니라 이전에 받은
                    이자에도 새로운 이자가 붙어, 시간이 지날수록 기하급수적으로 증가합니다.
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-medium text-blue-800 mb-2">⚡ 시간의 힘</p>
                  <p className="text-blue-700 mb-3">
                    복리 효과는 시간이 지날수록 더욱 강력해집니다. {years}년 후 복리와 단리의 차이는
                    <strong className="text-blue-800"> {formatAsset(totalDifference)}</strong>에
                    달합니다.
                  </p>
                  <div className="bg-white rounded p-3 border">
                    <p className="text-xs text-blue-600">
                      💰 예시: 매월 {formatAsset(principal / 12)}씩 추가 투자하면 복리 효과가 더욱
                      커집니다!
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="font-medium text-orange-800 mb-2">🎯 실생활 활용법</p>
                  <ul className="list-disc pl-5 space-y-1 text-orange-700">
                    <li>가능한 한 빨리 투자를 시작하세요</li>
                    <li>꾸준히 장기간 투자하세요</li>
                    <li>중간에 인출하지 말고 재투자하세요</li>
                    <li>높은 수익률보다는 안정적인 수익률을 추구하세요</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default InterestCalculator;
