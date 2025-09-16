//src/app/pbr-calculator/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { PBRCalculationParams, PBRResult } from './types';
import { calculatePBR, validatePBRParams } from './pbrCalculate';
import Link from 'next/link';
import {
  AlertCircle,
  Calculator,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Target,
  TrendingUp,
  Clock,
  DollarSign,
} from 'lucide-react';
import RiskWarning from '@/components/RiskWarning';

export default function PBRCalculatorPage() {
  // 상태 관리
  const [params, setParams] = useState<PBRCalculationParams>({
    expectedROE: 10,
    requiredReturn: 10,
    sustainableYears: 3,
    currentPBR: 1,
  });

  const [result, setResult] = useState<PBRResult | null>(null);
  const [error, setError] = useState<string>('');
  const [expandedExplanation, setExpandedExplanation] = useState<boolean>(false);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [isInitialPBR, setIsInitialPBR] = useState<boolean>(true); // PBR 초기 상태 추적

  // 애니메이션 키프레임
  const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
  }
  .animate-pulse-slow {
    animation: pulse 2s ease-in-out infinite;
  }
  `;

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleTag = document.createElement('style');
      styleTag.textContent = styles;
      document.head.appendChild(styleTag);
      return () => {
        document.head.removeChild(styleTag);
      };
    }
  }, []);

  // 파라미터 변경 핸들러 (계산하지 않음)
  const handleParamChange = (param: keyof PBRCalculationParams, value: number) => {
    // NaN 체크 및 기본값 처리
    const cleanValue = isNaN(value) || value < 0 ? 0 : value;
    setParams((prev) => ({
      ...prev,
      [param]: cleanValue,
    }));
    // 에러 초기화
    setError('');
  };

  // input 값 정리 함수 (앞의 0 제거)
  const handleInputChange = (param: keyof PBRCalculationParams, inputValue: string) => {
    // 빈 문자열이면 0으로 처리
    if (inputValue === '') {
      handleParamChange(param, 0);
      return;
    }

    // 숫자로 변환
    const numValue = parseFloat(inputValue);
    handleParamChange(param, numValue);
  };

  // 현재 PBR용 특별 처리 함수
  const handleCurrentPBRChange = (inputValue: string) => {
    // 사용자가 입력을 시작했음을 표시
    setIsInitialPBR(false);

    // 빈 문자열이면 0으로 처리하되, 실제로는 보여주지 않음
    if (inputValue === '') {
      handleParamChange('currentPBR', 0);
      return;
    }

    const numValue = parseFloat(inputValue);
    handleParamChange('currentPBR', numValue);
  };

  // 계산 버튼 클릭 핸들러
  const handleCalculate = () => {
    // 유효성 검사
    const validationError = validatePBRParams(params);
    if (validationError) {
      setError(validationError);
      setResult(null);
      setShowResult(false);
      return;
    }

    // 계산 수행
    setError('');
    const calculationResult = calculatePBR(params);
    setResult(calculationResult);
    setShowResult(true);

    // 결과로 스크롤
    setTimeout(() => {
      const resultElement = document.getElementById('calculation-result');
      if (resultElement) {
        resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // 숫자 포맷팅 함수
  const formatNumber = (num: number, decimals: number = 2): string => {
    return num.toFixed(decimals);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 px-4 sm:px-6 py-4 sm:py-6">
      <RiskWarning stockCode="" />
      <main className="flex-1 max-w-4xl mx-auto w-full">
        {/* 계산 결과 (최상단) */}
        {showResult && result && !error && (
          <div id="calculation-result" className="animate-fadeIn space-y-6 mb-6">
            {/* 메인 결과 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-md">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 text-center">
                📊 적정 PBR 계산 결과
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="mb-3">
                    <Calculator className="h-8 w-8 text-blue-600 mx-auto" />
                  </div>
                  <p className="text-sm text-blue-700 mb-2">이론적 적정 PBR</p>
                  <p className="text-3xl font-bold text-blue-800">
                    {formatNumber(result.appropriatePBR, 2)}배
                  </p>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                  <div className="mb-3">
                    <TrendingUp className="h-8 w-8 text-green-600 mx-auto" />
                  </div>
                  <p className="text-sm text-green-700 mb-2">역계산 예상수익률</p>
                  <p className="text-3xl font-bold text-green-800">
                    {formatNumber(result.expectedReturn, 1)}%
                  </p>
                </div>
              </div>

              <div className="text-center text-sm text-gray-600 border-t pt-4">
                (예상 ROE {params.expectedROE}%, 기대수익률 {params.requiredReturn}%, 지속기간{' '}
                {params.sustainableYears}년, 현재 PBR {params.currentPBR}배 가정)
              </div>
            </div>

            {/* 해석 가이드 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6">💡 결과 해석 가이드</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-3">적정 PBR의 의미</h4>
                  <div className="text-sm text-blue-700 space-y-2">
                    <p>
                      • 현재 PBR이 <strong>{formatNumber(result.appropriatePBR, 2)}배</strong>{' '}
                      이하라면 이론적으로 매력적
                    </p>
                    <p>• 이 수치는 {params.sustainableYears}년 후 청산을 가정한 계산</p>
                    <p>• 실제로는 영구가치가 있어 더 높을 수 있음</p>
                  </div>
                </div>

                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-3">예상수익률의 의미</h4>
                  <div className="text-sm text-green-700 space-y-2">
                    <p>
                      • 현재 PBR {params.currentPBR}배로 투자 시 연평균{' '}
                      <strong>{formatNumber(result.expectedReturn, 1)}%</strong> 수익 예상
                    </p>
                    <p>• 기대수익률 {params.requiredReturn}%와 비교해보세요</p>
                    <p>
                      {result.expectedReturn > params.requiredReturn
                        ? '• ✅ 기대수익률을 상회하는 매력적인 투자'
                        : result.expectedReturn === params.requiredReturn
                        ? '• ⚖️ 기대수익률과 일치하는 적정한 투자'
                        : '• ❌ 기대수익률에 미달하는 투자'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 헤더 및 입력 폼 */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md mb-6 border border-gray-100">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">📊 적정 PBR 계산기</h1>
            <p className="text-gray-600">
              기업의 예상 수익성과 투자 기대수익률을 바탕으로 이론적 적정 PBR을 계산해보세요
            </p>
          </div>

          {/* 4단계 간결한 입력 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* 1단계 - 예상 ROE */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center mb-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">
                  1
                </span>
                <TrendingUp className="h-4 w-4 text-blue-600 mr-2" />
                <h3 className="font-bold text-gray-800 text-sm">예상 ROE</h3>
              </div>
              <input
                type="number"
                min="1"
                max="100"
                value={params.expectedROE === 0 ? '' : params.expectedROE}
                onChange={(e) => handleInputChange('expectedROE', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                placeholder="예상 ROE (%)"
              />
              <p className="text-xs text-gray-500 mt-1 text-center">1-100% 입력</p>
            </div>

            {/* 2단계 - 기대수익률 */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center mb-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">
                  2
                </span>
                <Target className="h-4 w-4 text-blue-600 mr-2" />
                <h3 className="font-bold text-gray-800 text-sm">기대수익률</h3>
              </div>
              <input
                type="number"
                min="1"
                max="100"
                value={params.requiredReturn === 0 ? '' : params.requiredReturn}
                onChange={(e) => handleInputChange('requiredReturn', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                placeholder="기대수익률 (%)"
              />
              <p className="text-xs text-gray-500 mt-1 text-center">1-100% 입력</p>
            </div>

            {/* 3단계 - 지속가능연수 */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center mb-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">
                  3
                </span>
                <Clock className="h-4 w-4 text-blue-600 mr-2" />
                <h3 className="font-bold text-gray-800 text-sm">지속연수</h3>
              </div>
              <input
                type="number"
                min="1"
                max="100"
                value={params.sustainableYears === 0 ? '' : params.sustainableYears}
                onChange={(e) => handleInputChange('sustainableYears', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                placeholder="지속연수 (년)"
              />
              <p className="text-xs text-gray-500 mt-1 text-center">1-100년 입력</p>
            </div>

            {/* 4단계 - 현재 PBR */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center mb-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">
                  4
                </span>
                <DollarSign className="h-4 w-4 text-blue-600 mr-2" />
                <h3 className="font-bold text-gray-800 text-sm">현재 PBR</h3>
              </div>
              <input
                type="number"
                min="0.01"
                max="999"
                step="0.01"
                value={isInitialPBR && params.currentPBR === 1 ? '' : params.currentPBR.toString()}
                onChange={(e) => handleCurrentPBRChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                placeholder="현재 PBR (배)"
              />
              <p className="text-xs text-gray-500 mt-1 text-center">소수점 2자리</p>
            </div>
          </div>

          {/* 계산 버튼 */}
          <button
            onClick={handleCalculate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl text-lg font-bold mb-6"
          >
            <Calculator size={24} className="mr-3" />
            적정 PBR 계산하기
          </button>

          {/* 간단한 도움말 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-gray-600">
            <div className="text-center">
              <p className="font-medium">💡 ROE</p>
              <p>자기자본 대비 수익률</p>
            </div>
            <div className="text-center">
              <p className="font-medium">💡 기대수익률</p>
              <p>투자자 요구 수익률</p>
            </div>
            <div className="text-center">
              <p className="font-medium">💡 지속연수</p>
              <p>경쟁우위 유지기간</p>
            </div>
            <div className="text-center">
              <p className="font-medium">💡 현재 PBR</p>
              <p>현재 시장 PBR 배수</p>
            </div>
          </div>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-md mb-6 border-l-4 border-red-500 animate-fadeIn">
            <div className="flex items-start">
              <div className="bg-red-50 p-2 rounded-full mr-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="font-medium text-base text-gray-800">오류</p>
                <p className="text-sm text-gray-600 mt-2">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 계산 결과가 있을 때만 상세 설명 표시 */}
        {showResult && result && !error && (
          <div className="animate-fadeIn space-y-6">
            {/* 계산 방법 설명 */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <button
                className="w-full flex items-center justify-between"
                onClick={() => setExpandedExplanation(!expandedExplanation)}
              >
                <h3 className="text-lg font-bold text-gray-800">🔍 계산 방법 상세 설명</h3>
                <div className="bg-gray-100 p-2 rounded-full">
                  {expandedExplanation ? (
                    <ChevronUp className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  )}
                </div>
              </button>

              {expandedExplanation && (
                <div className="mt-6 space-y-4 text-sm">
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="font-medium text-yellow-800 mb-2">기본 아이디어</p>
                    <p className="text-yellow-700">
                      "기업이 ROE {params.expectedROE}%로 {params.sustainableYears}년간 성장하고,
                      투자자가 요구하는 수익률이 {params.requiredReturn}%일 때의 이론적 적정 PBR을
                      계산합니다"
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-800 mb-3">📐 수식 설명</p>

                    <div className="space-y-3">
                      <div className="p-3 bg-white rounded border">
                        <p className="font-semibold text-gray-800 mb-2">1️⃣ 적정 PBR 계산</p>
                        <p className="font-mono text-sm text-gray-600">
                          적정 PBR = [(1 + 예상ROE) ÷ (1 + 기대수익률)]^지속연수
                        </p>
                        <p className="font-mono text-sm text-gray-600 mt-1">
                          = [(1 + {params.expectedROE / 100}) ÷ (1 + {params.requiredReturn / 100}
                          )]^{params.sustainableYears}
                        </p>
                        <p className="font-mono text-sm text-blue-600 font-bold mt-1">
                          = {formatNumber(result.appropriatePBR, 4)}
                        </p>
                      </div>

                      <div className="p-3 bg-white rounded border">
                        <p className="font-semibold text-gray-800 mb-2">2️⃣ 역계산 예상수익률</p>
                        <p className="font-mono text-sm text-gray-600">
                          예상수익률 = (1 + 예상ROE) ÷ (현재PBR^(1/지속연수)) - 1
                        </p>
                        <p className="font-mono text-sm text-gray-600 mt-1">
                          = (1 + {params.expectedROE / 100}) ÷ ({formatNumber(params.currentPBR, 2)}
                          ^(1/{params.sustainableYears})) - 1
                        </p>
                        <p className="font-mono text-sm text-green-600 font-bold mt-1">
                          = {formatNumber(result.expectedReturn / 100, 4)} (
                          {formatNumber(result.expectedReturn, 1)}%)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="font-medium text-red-800 mb-2">⚠️ 주의사항</p>
                    <ul className="list-disc pl-5 space-y-1 text-red-700">
                      <li>이는 {params.sustainableYears}년 후 청산을 가정한 이론적 계산</li>
                      <li>실제 기업가치는 영구가치를 포함하여 더 높을 수 있음</li>
                      <li>ROE와 지속기간은 투자자의 주관적 판단사항</li>
                      <li>다른 평가지표와 함께 종합적으로 검토 필요</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* 네비게이션 버튼 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100">
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl text-sm mb-6">
                <div className="font-medium text-amber-800 mb-3 flex items-center">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  투자 결정 전 확인사항
                </div>
                <ul className="list-disc pl-5 space-y-2 text-amber-700">
                  <li>본 계산기는 {params.sustainableYears}년 후 청산을 가정한 참고 도구</li>
                  <li>실제 기업가치는 더 높을 수 있음 (영구가치 미반영)</li>
                  <li>ROE, 기대수익률, 지속기간은 투자자의 주관적 판단사항</li>
                  <li>다른 평가 지표와 함께 종합적으로 검토하세요</li>
                </ul>
              </div>

              <hr className="mt-6" />

              {/* 페이지 하단 네비게이션 버튼 */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/profit-calculator" className="w-full">
                  <button className="w-full inline-flex items-center justify-center bg-blue-600 text-white px-5 py-3 rounded-xl text-sm sm:text-base font-medium hover:bg-blue-700 transition-all duration-300 shadow-sm hover:shadow group">
                    <span className="flex items-center">
                      수익가치 계산기
                      <svg
                        className="ml-2 w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </span>
                  </button>
                </Link>

                <Link href="/" className="w-full">
                  <button className="w-full inline-flex items-center justify-center bg-gray-100 text-gray-800 px-5 py-3 rounded-xl text-sm sm:text-base font-medium hover:bg-gray-200 transition-all duration-300 shadow-sm hover:shadow group">
                    <span className="flex items-center">
                      홈으로
                      <svg
                        className="ml-2 w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
