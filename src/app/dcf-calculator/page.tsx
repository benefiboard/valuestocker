'use client';

import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import CompanySearchInput from '@/components/CompanySearchInput';
import { CompanyInfo, stockCodeMap } from '../../lib/stockCodeData';
import { DCFResult, DCFCalculationParams, FCFData } from './types';
import { calculateDCF } from './dcfCalculate';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Calculator,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Loader2,
  Search as SearchIcon,
  DollarSign,
  TrendingUp,
  X,
} from 'lucide-react';
import { formatAsset } from '@/utils/stockUtils';
import RiskWarning from '@/components/RiskWarning';

export default function DCFCalculatorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 상태 관리
  const [companyName, setCompanyName] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyInfo | null>(null);
  const [calculatedResult, setCalculatedResult] = useState<DCFResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [showSearchForm, setShowSearchForm] = useState<boolean>(true);
  const [expandedFCFTable, setExpandedFCFTable] = useState<boolean>(false);
  const [autoSearchTriggered, setAutoSearchTriggered] = useState<boolean>(false);

  // DCF 계산 파라미터
  const [dcfParams, setDcfParams] = useState<DCFCalculationParams>({
    projectionYears: 10,
    discountRate: 10,
    terminalGrowthRate: 0, // 사용안함
    safetyMargin: 0, // 사용안함
  });

  // 드롭다운 옵션
  const projectionYearsOptions = Array.from({ length: 11 }, (_, i) => i + 5); // 5-15년
  const discountRateOptions = [8, 9, 10, 11, 12, 13, 14, 15];

  // 애니메이션 키프레임
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
    if (typeof document !== 'undefined') {
      const styleTag = document.createElement('style');
      styleTag.textContent = styles;
      document.head.appendChild(styleTag);
      return () => {
        document.head.removeChild(styleTag);
      };
    }
  }, []);

  // 회사 선택 핸들러
  const handleCompanySelect = async (company: CompanyInfo, autoSearch: boolean = false) => {
    setCompanyName(company.companyName);
    setSelectedCompany(company);

    // ⭐ 엔터키로 선택했으면 바로 분석 시작
    if (autoSearch) {
      console.log('🚀 DCF-calculator 자동 분석 시작!');
      setAutoSearchTriggered(true);
      setTimeout(() => performSearch(company.stockCode), 100);
    }
  };

  // URL 쿼리 파라미터 처리
  useEffect(() => {
    const stockCode = searchParams.get('stockCode');

    if (!stockCode) {
      console.log('🧹 stockCode 없음 - 초기화');
      setCompanyName('');
      setSelectedCompany(null);
      setCalculatedResult(null);
      setSuccess(false);
      setError('');
      setShowSearchForm(true);
      setAutoSearchTriggered(false);
      setExpandedFCFTable(false);
      return;
    }

    if (selectedCompany?.stockCode !== stockCode) {
      console.log('🔍 새로운 종목 검색:', stockCode);
      const company = Object.values(stockCodeMap).find((c) => c.stockCode === stockCode);
      if (company) {
        handleCompanySelect(company);
        setAutoSearchTriggered(true);
        setTimeout(() => performSearch(company.stockCode), 100);
      }
    }
  }, [searchParams]);

  // 검색 수행 함수
  const performSearch = async (stockCode: string) => {
    setCalculatedResult(null);
    setSuccess(false);
    setError('');
    setLoading(true);

    try {
      const result = await calculateDCF(stockCode, dcfParams);

      if (!result) {
        throw new Error(`${selectedCompany?.companyName || '주식'}의 데이터를 찾을 수 없습니다`);
      }

      setCalculatedResult(result);
      setSuccess(true);
      setShowSearchForm(false);

      const url = new URL(window.location.href);
      url.searchParams.set('stockCode', stockCode);
      router.push(url.pathname + url.search, { scroll: false });

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('알 수 없는 오류가 발생했습니다');
      }
    } finally {
      setLoading(false);
    }
  };

  // 메인 검색 함수
  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCompany) {
      setError('회사를 검색하고 선택해주세요');
      return;
    }
    setAutoSearchTriggered(true);
    await performSearch(selectedCompany.stockCode);
  };

  // 계산 버튼 클릭 핸들러
  const handleCalculateClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!selectedCompany) {
      setError('회사를 검색하고 선택해주세요');
      return;
    }
    setAutoSearchTriggered(true);
    performSearch(selectedCompany.stockCode);
  };

  // 파라미터 변경 핸들러
  const handleParamChange = (param: keyof DCFCalculationParams, value: number) => {
    setDcfParams((prev) => ({
      ...prev,
      [param]: value,
    }));
  };

  // 재계산 함수
  const handleRecalculate = async () => {
    if (selectedCompany) {
      await performSearch(selectedCompany.stockCode);
    }
  };

  // 숫자 포맷팅 함수
  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 px-4 sm:px-6 py-4 sm:py-6">
      <RiskWarning stockCode={selectedCompany?.stockCode || ''} />
      <main className="flex-1 max-w-4xl mx-auto w-full">
        {/* 검색 영역 */}
        {showSearchForm ? (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md mb-6 border border-gray-100">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                📈 심플 DCF 계산기
              </h2>
              <p className="text-gray-600">
                순수 10년 FCF 현재가치로 기업의 내재가치를 계산해보세요
              </p>
            </div>

            <form onSubmit={handleSearch}>
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  📍 분석할 기업 선택
                </label>
                <CompanySearchInput
                  onCompanySelect={handleCompanySelect}
                  initialValue={companyName}
                  placeholder="회사명 또는 종목코드 입력"
                  className="transition-all duration-300 focus-within:shadow-md"
                />
              </div>

              {/* 3단계 가이드 */}
              {selectedCompany && (
                <div className="animate-fadeIn">
                  <h3 className="text-lg font-bold text-gray-800 mb-6 text-center">
                    🎯 3단계로 심플한 DCF 분석
                  </h3>

                  <div className="space-y-6 mb-8">
                    {/* 1단계 - 예측 기간 */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex items-start">
                        <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0">
                          1
                        </span>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 mb-2">몇 년간 예측할까요?</h4>
                          <p className="text-sm text-gray-600 mb-4">
                            기업의 미래 현금흐름을 예측할 기간을 설정합니다
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <select
                                value={dcfParams.projectionYears}
                                onChange={(e) =>
                                  handleParamChange('projectionYears', Number(e.target.value))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {projectionYearsOptions.map((year) => (
                                  <option key={year} value={year}>
                                    {year}년{' '}
                                    {year <= 7 ? '(단기)' : year <= 12 ? '(중기)' : '(장기)'}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                              <p className="text-xs text-gray-600">
                                💡 일반적으로 10년이 적정 수준으로 여겨집니다
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2단계 - 할인율 */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex items-start">
                        <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0">
                          2
                        </span>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 mb-2">
                            최소 연 몇 %의 수익을 원하시나요?
                          </h4>
                          <p className="text-sm text-gray-600 mb-4">
                            투자자가 요구하는 최소 수익률(할인율)입니다
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <select
                                value={dcfParams.discountRate}
                                onChange={(e) =>
                                  handleParamChange('discountRate', Number(e.target.value))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {discountRateOptions.map((rate) => (
                                  <option key={rate} value={rate}>
                                    연 {rate}%{' '}
                                    {rate <= 9 ? '(안정형)' : rate <= 12 ? '(균형형)' : '(공격형)'}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="text-xs text-gray-600 space-y-1">
                                <p>💡 정기예금: 약 3.5%</p>
                                <p>💡 코스피 평균: 약 8%</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3단계 - 할인율만 */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex items-start">
                        <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0">
                          3
                        </span>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 mb-2">할인율 재확인</h4>
                          <p className="text-sm text-gray-600 mb-4">
                            미래 현금흐름을 현재가치로 할인할 할인율을 확인합니다
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <select
                                value={dcfParams.discountRate}
                                onChange={(e) =>
                                  handleParamChange('discountRate', Number(e.target.value))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {discountRateOptions.map((rate) => (
                                  <option key={rate} value={rate}>
                                    연 {rate}%{' '}
                                    {rate <= 9 ? '(안정형)' : rate <= 12 ? '(균형형)' : '(공격형)'}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="text-xs text-gray-600">
                                💡 10%가 일반적인 할인율입니다
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 계산 버튼 */}
                  <button
                    onClick={handleCalculateClick}
                    type="button"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl text-lg font-bold"
                    disabled={loading || !selectedCompany}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={24} className="mr-3 animate-spin" />
                        계산 중...
                      </>
                    ) : (
                      <>
                        <TrendingUp size={24} className="mr-3" />
                        심플 DCF 계산하기
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 sm:px-6 shadow-md mb-6 flex justify-between items-center border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-full mr-3">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-lg font-semibold text-gray-800 truncate">
                {selectedCompany?.companyName}{' '}
                <span className="font-normal text-sm text-gray-500">
                  ({selectedCompany?.stockCode})
                </span>
              </p>
            </div>
            <button
              onClick={() => setShowSearchForm(true)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 text-sm rounded-xl flex items-center transition-all duration-300"
            >
              <SearchIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:block">다른 종목</span>
            </button>
          </div>
        )}

        {/* 로딩 상태 */}
        {loading && (
          <div className="bg-white rounded-2xl p-8 shadow-md flex flex-col items-center justify-center mb-6">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin"></div>
            </div>
            <div className="text-center">
              <p className="text-lg text-gray-700 font-medium mb-2">심플 DCF 계산 중...</p>
              <p className="text-sm text-gray-500">잠시만 기다려주세요</p>
            </div>
          </div>
        )}

        {/* 오류 메시지 */}
        {error && !loading && (
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

        {/* 결과 영역 */}
        {success && calculatedResult && (
          <div className="animate-fadeIn space-y-6">
            {/* 메인 결과 */}
            {calculatedResult.intrinsicValue === 0 ? (
              // DCF 계산 불가한 경우
              <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-md">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 text-center">
                  ⚠️ 심플 DCF 분석 결과
                </h2>

                <div className="text-center p-6 bg-yellow-50 rounded-xl border border-yellow-200">
                  <p className="text-lg font-bold text-yellow-800 mb-2">DCF 계산 불가</p>
                  <p className="text-yellow-700 mb-4">{calculatedResult.reason}</p>
                  {calculatedResult.recommendation && (
                    <p className="text-sm text-yellow-600 bg-yellow-100 p-3 rounded-lg">
                      💡 {calculatedResult.recommendation}
                    </p>
                  )}
                </div>

                <div className="mt-6 text-center text-sm text-gray-600">
                  음수 FCF: {calculatedResult.negativeYears}회 | 최근 FCF:{' '}
                  {formatAsset(calculatedResult.currentFCF)}
                </div>
              </div>
            ) : (
              // 정상 DCF 계산 결과
              <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-md">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 text-center">
                  📊 심플 DCF 분석 결과
                </h2>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">현재 주가</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-800">
                      {formatNumber(calculatedResult.currentPrice)}원
                    </p>
                  </div>

                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">예상 수익률</p>
                    <p
                      className={`text-xl sm:text-2xl font-bold ${
                        calculatedResult.expectedReturn > 0 ? 'text-blue-600' : 'text-red-600'
                      }`}
                    >
                      {calculatedResult.expectedReturn >= 0 ? '+' : ''}
                      {calculatedResult.expectedReturn.toFixed(1)}%
                    </p>
                  </div>

                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">내재가치</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">
                      {formatNumber(calculatedResult.intrinsicValuePerShare)}원
                    </p>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-600 border-t pt-4">
                  FCF 성장률 {(calculatedResult.finalGrowthRate * 100).toFixed(1)}% (최대 25% 제한)
                  | 할인율 {dcfParams.discountRate}% | 순수 10년 FCF 현재가치 합계
                </div>
              </div>
            )}

            {/* 투자 시나리오 (계산 가능한 경우만) */}
            {calculatedResult.intrinsicValue > 0 && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-6">💡 DCF 기반 투자 시나리오</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">💰 총 내재가치</p>
                      <p className="text-2xl font-bold text-gray-800 mb-2">
                        {formatAsset(calculatedResult.intrinsicValue)}
                      </p>
                      <p className="text-sm text-gray-600">
                        현재 시총 대비{' '}
                        {(
                          (calculatedResult.intrinsicValue / calculatedResult.currentMarketCap -
                            1) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">📈 FCF 성장 분석</p>
                      <p className="text-2xl font-bold text-gray-800 mb-2">
                        {(calculatedResult.finalGrowthRate * 100).toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-600">{calculatedResult.reason}</p>
                    </div>
                  </div>
                </div>

                {/* FCF 불안정 경고 */}
                {calculatedResult.negativeYears > 0 && (
                  <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>⚠️ 주의:</strong> 과거 5년 중 {calculatedResult.negativeYears}회 음수
                      FCF로 인해 성장률을 {calculatedResult.penaltyFactor}배 할인하여 보수적으로
                      계산했습니다. 터미널 가치도 제외된 보수적 평가입니다.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 파라미터 조정 섹션 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6">🔧 설정 값 조정하기</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📅 예측 기간
                  </label>
                  <select
                    value={dcfParams.projectionYears}
                    onChange={(e) => handleParamChange('projectionYears', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {projectionYearsOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}년
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">💰 할인율</label>
                  <select
                    value={dcfParams.discountRate}
                    onChange={(e) => handleParamChange('discountRate', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {discountRateOptions.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}%
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleRecalculate}
                className="w-full mt-6 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center font-medium"
              >
                다시 계산하기
              </button>
            </div>

            {/* FCF 데이터 테이블 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100">
              <button
                className="w-full flex items-center justify-between"
                onClick={() => setExpandedFCFTable(!expandedFCFTable)}
              >
                <h3 className="text-lg font-bold text-gray-800">📊 자유현금흐름(FCF) 분석</h3>
                <div className="bg-gray-100 p-2 rounded-full">
                  {expandedFCFTable ? (
                    <ChevronUp className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  )}
                </div>
              </button>

              {expandedFCFTable && (
                <div className="mt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                            연도
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                            FCF
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">
                            상태
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculatedResult.fcfData.map((data) => (
                          <tr key={data.year} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm">{data.year}년</td>
                            <td className="py-3 px-4 text-sm text-right">
                              {formatAsset(data.fcf)}
                            </td>
                            <td className="py-3 px-4 text-sm text-center">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  data.isPositive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {data.isPositive ? '양수' : '음수'}
                              </span>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-bold">
                          <td className="py-3 px-4 text-sm" colSpan={2}>
                            최종 성장률 (패널티 적용)
                          </td>
                          <td className="py-3 px-4 text-sm text-center text-blue-600">
                            {(calculatedResult.finalGrowthRate * 100).toFixed(1)}%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* 계산 방법 설명 */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">💡 DCF 계산 방법</h3>

              <div className="space-y-4 text-sm">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-medium text-blue-800 mb-2">심플한 DCF (할인현금흐름법)</p>
                  <p className="text-blue-700">
                    터미널 가치와 안전마진을 제외하고, 순수하게 10년간 예상되는 자유현금흐름을
                    현재가치로 할인한 합계입니다.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-800 mb-2">주요 계산 과정</p>
                  <div className="space-y-2 text-gray-700">
                    <p>1. 과거 5년 FCF 성장률 계산 (최대 25% 제한, 음수 년도 패널티 적용)</p>
                    <p>2. {dcfParams.projectionYears}년간 미래 FCF 예측</p>
                    <p>3. {dcfParams.discountRate}% 할인율로 현재가치 할인</p>
                    <p>4. 10년간 FCF 현재가치의 합계 = 순수 내재가치</p>
                  </div>
                </div>

                {calculatedResult.negativeYears > 0 && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="font-medium text-yellow-800 mb-2">음수 FCF 패널티 시스템</p>
                    <p className="text-yellow-700">
                      FCF 불안정성을 반영하여 음수 년도가 많을수록 성장률을 보수적으로 조정합니다.
                      {calculatedResult.negativeYears}회 음수로 인해 성장률을{' '}
                      {calculatedResult.penaltyFactor}배 할인했습니다.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 네비게이션 버튼 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100">
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl text-sm mb-6">
                <div className="font-medium text-amber-800 mb-3 flex items-center">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  투자 결정 전 확인사항
                </div>
                <ul className="list-disc pl-5 space-y-2 text-amber-700">
                  <li>DCF는 미래 예측에 기반한 참고 지표입니다</li>
                  <li>터미널 가치를 제외한 순수 10년 FCF 현재가치만 계산합니다</li>
                  <li>음수 FCF가 많은 기업은 ROE 방식을 함께 검토하세요</li>
                  <li>다른 평가 지표와 함께 종합적으로 판단하세요</li>
                </ul>
              </div>

              <hr className="mt-6" />

              {/* 페이지 하단 네비게이션 버튼 */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                  href={`/profit-calculator?stockCode=${selectedCompany?.stockCode}`}
                  className="w-full"
                >
                  <button className="w-full inline-flex items-center justify-center bg-emerald-600 text-white px-5 py-3 rounded-xl text-sm sm:text-base font-medium hover:bg-emerald-700 transition-all duration-300 shadow-sm hover:shadow group relative overflow-hidden">
                    <span className="relative flex items-center">
                      ROE 수익가치
                      <svg
                        className="ml-2 w-4 h-4 sm:w-5 sm:h-5"
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

                <Link
                  href={`/checklist?stockCode=${selectedCompany?.stockCode}`}
                  className="w-full"
                >
                  <button className="w-full inline-flex items-center justify-center bg-blue-600 text-white px-5 py-3 rounded-xl text-sm sm:text-base font-medium hover:bg-blue-700 transition-all duration-300 shadow-sm hover:shadow group relative overflow-hidden">
                    <span className="relative flex items-center">
                      체크리스트
                      <svg
                        className="ml-2 w-4 h-4 sm:w-5 sm:h-5"
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

                <a
                  href={`https://finance.naver.com/item/main.naver?code=${selectedCompany?.stockCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <button className="w-full inline-flex items-center justify-center bg-green-600 text-white px-5 py-3 rounded-xl text-sm sm:text-base font-medium hover:bg-green-700 transition-all duration-300 shadow-sm hover:shadow group relative overflow-hidden">
                    <span className="relative flex items-center">
                      네이버증권
                      <svg
                        className="ml-2 w-4 h-4 sm:w-5 sm:h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </span>
                  </button>
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
