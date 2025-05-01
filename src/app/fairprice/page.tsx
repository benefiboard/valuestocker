//src/app/fairprice/page.tsx

'use client';

import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import CompanySearchInput from '@/components/CompanySearchInput';
import { CompanyInfo, stockCodeMap } from '../../lib/stockCodeData';
import { CalculatedResults, StockPrice } from './types';
import { getIndustryParameters } from '../../lib/industryData';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BarChart4,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  Search as SearchIcon,
  Target,
} from 'lucide-react';
import { extractCalculatedResultsFromSupabase } from './FairpriceCalculate';

export default function FairPricePage() {
  // URL 쿼리 파라미터 가져오기
  const searchParams = useSearchParams();

  // 상태 관리
  const [companyName, setCompanyName] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyInfo | null>(null);

  const [latestPrice, setLatestPrice] = useState<StockPrice | null>(null);
  const [calculatedResults, setCalculatedResults] = useState<CalculatedResults | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [isSrimExpanded, setIsSrimExpanded] = useState<boolean>(false);
  const [showSearchForm, setShowSearchForm] = useState<boolean>(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [industryParams, setIndustryParams] = useState({
    avgPER: 10,
    avgPEG: 1.0,
    liabilityMultiplier: 1.2,
  });
  const [autoSearchTriggered, setAutoSearchTriggered] = useState<boolean>(false);

  // 회사 선택 핸들러
  const handleCompanySelect = (company: CompanyInfo) => {
    setCompanyName(company.companyName);
    setSelectedCompany(company);

    // 산업군별 파라미터 가져오기
    const params = getIndustryParameters(company.industry);
    setIndustryParams(params);
  };

  // URL 쿼리 파라미터에서 stockCode를 읽어 자동 검색 수행
  useEffect(() => {
    const stockCode = searchParams.get('stockCode');

    // 이미 자동 검색을 수행했거나 stockCode가 없으면 리턴
    if (autoSearchTriggered || !stockCode) {
      return;
    }

    // stockCodeMap에서 해당 종목 코드 찾기
    const company = Object.values(stockCodeMap).find((company) => company.stockCode === stockCode);

    if (company) {
      // 회사 정보 설정
      handleCompanySelect(company);

      // 자동 검색 트리거 표시 (중복 실행 방지)
      setAutoSearchTriggered(true);

      // 약간의 딜레이 후 검색 실행 (UI가 업데이트될 시간 제공)
      setTimeout(() => {
        performSearch(company.stockCode);
      }, 100);
    }
  }, [searchParams, autoSearchTriggered]);

  // 토글 함수
  const toggleSrimScenarios = () => {
    setIsSrimExpanded(!isSrimExpanded);
  };

  // 카테고리 확장/축소 핸들러
  const toggleCategory = (category: string) => {
    setExpandedCategories((prevState) => {
      const newState = new Set(prevState);
      if (newState.has(category)) {
        newState.delete(category);
      } else {
        newState.add(category);
      }
      return newState;
    });
  };

  // 신호등 컴포넌트
  const PriceSignal = ({ ratio }: { ratio: number }) => {
    let signalClass = 'bg-gray-400';
    let signalText = '?';
    let message = '';

    if (ratio < 0.7) {
      signalClass = 'bg-emerald-600';
      signalText = '저';
      message = '크게 저평가됨 (30% 이상)';
    } else if (ratio < 0.9) {
      signalClass = 'bg-emerald-500';
      signalText = '저';
      message = '저평가됨 (10-30%)';
    } else if (ratio < 1.1) {
      signalClass = 'bg-yellow-400';
      signalText = '적';
      message = '적정가 근처 (±10%)';
    } else if (ratio < 1.3) {
      signalClass = 'bg-orange-400';
      signalText = '고';
      message = '고평가됨 (10-30%)';
    } else {
      signalClass = 'bg-red-500';
      signalText = '고';
      message = '크게 고평가됨 (30% 이상)';
    }

    return (
      <div className="flex items-center gap-3">
        <div
          className={`rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center ${signalClass} text-white font-bold text-sm sm:text-base`}
        >
          {signalText}
        </div>
        <span className="text-sm sm:text-base text-gray-700">{message}</span>
      </div>
    );
  };

  // 검색 수행 함수 (URL 파라미터에서도 사용)
  const performSearch = async (stockCode: string) => {
    // 모든 상태 초기화
    setCalculatedResults(null);
    setSuccess(false);
    setError('');
    setLoading(true);

    try {
      // Supabase에서 적정가 계산 및 최신 주가 가져오기
      const calculatedResults = await extractCalculatedResultsFromSupabase(stockCode);

      if (!calculatedResults) {
        throw new Error(`${selectedCompany?.companyName || '주식'}의 데이터를 찾을 수 없습니다`);
      }

      setLatestPrice(calculatedResults.latestPrice || null);
      setCalculatedResults(calculatedResults);
      setSuccess(true);
      setShowSearchForm(false);
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

    // 선택된 회사가 없으면 에러 표시
    if (!selectedCompany) {
      setError('회사를 검색하고 선택해주세요');
      return;
    }

    // 주식 코드 가져오기
    const stockCode = selectedCompany.stockCode;

    // 검색 수행
    await performSearch(stockCode);
  };

  // 점수 바 렌더링 함수
  const renderScoreBar = (score: number, maxScore: number = 10) => {
    const percentage = (score / maxScore) * 100;
    let barColor = 'bg-gray-600';

    if (percentage >= 70) barColor = 'bg-emerald-600';
    else if (percentage < 20) barColor = 'bg-red-400';

    return (
      <div className="w-full bg-gray-100 rounded-full h-2 sm:h-2.5">
        <div
          className={`${barColor} h-2 sm:h-2.5 rounded-full`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  // 숫자 포맷팅 함수
  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  // 투자 한눈에 보기 컴포넌트 - 수정된 디자인
  const InvestmentAtGlance = ({
    currentPrice,
    fairPrice,
  }: {
    currentPrice: number;
    fairPrice: number;
  }) => {
    // 현재가와 적정가의 차이 계산
    const priceDiff = currentPrice - fairPrice;
    const priceDiffPercent = (priceDiff / fairPrice) * 100;
    const isPriceDiffPositive = priceDiff < 0;

    // 상태에 따른 색상과 텍스트 결정
    const statusColor = isPriceDiffPositive ? 'text-emerald-600' : 'text-red-500';
    const statusText = isPriceDiffPositive ? '저가' : '고가';

    // 막대 길이 계산 - 항상 차이가 보이는 접근법
    let fairBarWidth, currentBarWidth;

    // 비율 계산
    const diffPercent = Math.abs(priceDiffPercent);

    // 무조건 차이가 보이는 막대 길이 계산 함수
    const calculateBarWidths = () => {
      // 어떤 값이든 차이가 있으면(priceDiff !== 0) 반드시 시각적 차이를 보여줌

      // 긴 막대는 항상 100%
      const longBar = '100%';
      let shortBar;

      // 짧은 막대의 길이 계산
      if (priceDiff === 0) {
        // 정확히 같은 경우 (거의 없겠지만 처리)
        shortBar = longBar;
      } else if (diffPercent < 1) {
        // 극히 작은 차이(1% 미만): 최소 20%의 시각적 차이 보장
        shortBar = '80%';
      } else if (diffPercent < 5) {
        // 아주 작은 차이(1-5%): 25%의 시각적 차이
        shortBar = '75%';
      } else if (diffPercent < 10) {
        // 작은 차이(5-10%): 30%의 시각적 차이
        shortBar = '70%';
      } else if (diffPercent < 20) {
        // 중소 차이(10-20%): 35%의 시각적 차이
        shortBar = '65%';
      } else if (diffPercent < 50) {
        // 중간 차이(20-50%): 40%의 시각적 차이
        shortBar = '60%';
      } else if (diffPercent < 100) {
        // 큰 차이(50-100%): 50%의 시각적 차이
        shortBar = '50%';
      } else {
        // 아주 큰 차이(100% 이상): 60%의 시각적 차이
        shortBar = '40%';
      }

      return isPriceDiffPositive
        ? { fairBarWidth: longBar, currentBarWidth: shortBar }
        : { fairBarWidth: shortBar, currentBarWidth: longBar };
    };

    // 막대 길이 계산 적용
    const barWidths = calculateBarWidths();
    fairBarWidth = barWidths.fairBarWidth;
    currentBarWidth = barWidths.currentBarWidth;

    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 flex items-center">
          <Info className="mr-3 w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
          주가 대비 적정가 비교
        </h2>
        <hr className="mb-3 border-gray-200" />
        {/* 상단 비교 텍스트 */}
        <div className="mb-6 flex flex-wrap items-end">
          <p className={`text-2xl sm:text-3xl font-bold ${statusColor}`}>
            {/* <span className="text-sm text-gray-500 mr-2">적정가치 대비</span> */}
            {Math.abs(priceDiffPercent).toFixed(1)}%{' '}
            <span className="text-lg font-semibold sm:text-xl">{statusText}</span>
          </p>
          <p className="text-base sm:text-lg font-medium ml-1">
            ({formatNumber(Math.abs(priceDiff))}원)
          </p>
        </div>

        {/* 적정가 막대 */}
        <div className="flex items-center mb-6 h-12">
          <div
            className="bg-emerald-600 h-full flex items-center justify-end pr-4 sm:pr-6 rounded-r-2xl"
            style={{ width: fairBarWidth }}
          >
            <span className="text-white text-sm sm:text-base font-medium">적정가</span>
          </div>
          <div className="ml-4 text-base sm:text-lg font-medium whitespace-nowrap">
            {formatNumber(fairPrice)}원
          </div>
        </div>

        {/* 현재주가 막대 */}
        <div className="flex items-center h-12">
          <div
            className="bg-gray-500 h-full flex items-center justify-end pr-4 sm:pr-6 rounded-r-2xl"
            style={{ width: currentBarWidth }}
          >
            <span className="text-white text-sm sm:text-base font-medium">현재주가</span>
          </div>
          <div className="ml-4 text-base sm:text-lg font-medium whitespace-nowrap">
            {formatNumber(currentPrice)}원
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 px-4 sm:px-6 py-8">
      {/* 헤더 */}
      <header className="mb-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center">
          <Link
            href="/"
            className="mr-3 sm:mr-4 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
            <BarChart4 className="mr-3 text-emerald-600 w-6 h-6 sm:w-7 sm:h-7" />
            가치투자 주식 적정가 계산
          </h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full">
        {/* 검색 영역 - 확장/축소 가능 */}
        {showSearchForm ? (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md mb-6">
            <form onSubmit={handleSearch}>
              <div className="flex flex-col gap-5 sm:gap-6">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2 sm:mb-3">
                    회사명
                  </label>
                  <CompanySearchInput
                    onCompanySelect={handleCompanySelect}
                    initialValue={companyName}
                    placeholder="회사명 또는 종목코드 입력"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 sm:py-4 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center mt-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="mr-3 animate-spin" />
                      계산 중...
                    </>
                  ) : (
                    '가치 계산하기'
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 sm:px-8 shadow-md mb-6 flex justify-between items-center">
            <div className="flex items-center">
              <Target className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 mr-3" />
              <p className="text-lg sm:text-xl font-semibold text-gray-800">
                {selectedCompany?.companyName}{' '}
                <span className="font-normal text-sm text-gray-500">({latestPrice?.code})</span>
              </p>
            </div>

            <button
              onClick={() => setShowSearchForm(true)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 sm:px-4 py-2 text-xs sm:text-sm rounded-xl flex items-center transition-colors"
            >
              <SearchIcon className="h-4 w-4 mr-1 sm:mr-2 " />
              다른 종목
            </button>
          </div>
        )}

        {/* 로딩 상태 표시 */}
        {loading && (
          <div className="bg-white rounded-2xl p-10 shadow-md flex justify-center items-center mb-6">
            <Loader2 size={30} className="animate-spin text-emerald-600 mr-3" />
            <p className="text-lg text-gray-700">데이터를 불러오는 중...</p>
          </div>
        )}

        {/* 오류 메시지 */}
        {error && !loading && (
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-md mb-6 border-l-4 border-red-500">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-base sm:text-lg text-gray-800">오류</p>
                <p className="text-sm sm:text-base text-gray-600 mt-2">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 결과 영역 */}
        {success && calculatedResults && (
          <>
            {/* 투자 한눈에 보기 섹션 */}
            <InvestmentAtGlance
              currentPrice={latestPrice?.price || 0}
              fairPrice={calculatedResults.priceRange.midRange}
            />

            {/* 적정가 계산 결과 */}
            <div className="bg-white rounded-2xl shadow-md mb-6 p-6 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-5 flex items-center">
                <BarChart4 className="mr-3 w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                적정 주가 계산 결과
              </h2>

              {/* 이상치 경고 표시 */}
              {calculatedResults.hasOutliers && (
                <div className="p-5 bg-yellow-50 rounded-xl mb-5">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
                    <p className="text-sm sm:text-base font-medium text-gray-700">
                      일부 평가 모델에서 비정상적인 결과가 검출되었습니다. 결과 해석에 주의가
                      필요합니다.
                    </p>
                  </div>
                </div>
              )}

              <div>
                {/* 자산 가치 기반 모델 */}
                <div className="mb-5">
                  <button
                    className="w-full flex items-center justify-between p-5 bg-gray-50 rounded-xl text-left focus:outline-none hover:bg-gray-100 transition-colors"
                    onClick={() => toggleCategory('assetBased')}
                  >
                    <div className="flex items-center">
                      <Info className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 mr-3" />
                      <h3 className="text-base sm:text-lg font-medium text-gray-800">
                        자산 가치 기반 모델
                      </h3>
                    </div>
                    {expandedCategories.has('assetBased') ? (
                      <ChevronUp className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                    ) : (
                      <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                    )}
                  </button>

                  {expandedCategories.has('assetBased') && (
                    <div className="mt-3 divide-y divide-gray-100 bg-white rounded-xl overflow-hidden border border-gray-100">
                      {calculatedResults.categorizedModels?.assetBased.map((model) => (
                        <div
                          key={model.name}
                          className={`flex justify-between items-center px-5 py-4 hover:bg-gray-50 transition-colors ${
                            calculatedResults.outliers?.some((o) => o.name === model.name)
                              ? 'bg-gray-50'
                              : ''
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="text-sm sm:text-base font-medium text-gray-800">
                              {model.name}
                              {model.name === 'S-RIM 기본 시나리오' &&
                                calculatedResults.categorizedModels?.srimScenarios &&
                                calculatedResults.categorizedModels.srimScenarios.length > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSrimScenarios();
                                    }}
                                    className="ml-2 sm:ml-3 text-emerald-600 hover:text-emerald-700 focus:outline-none"
                                  >
                                    {isSrimExpanded ? '▼' : '▶'}
                                  </button>
                                )}
                              {calculatedResults.outliers?.some((o) => o.name === model.name) && (
                                <span className="ml-2 sm:ml-3 text-xs text-yellow-600 flex items-center">
                                  <AlertTriangle size={12} className="mr-1 sm:mr-2" /> 참고용
                                </span>
                              )}
                            </span>
                          </div>
                          <span className="text-sm sm:text-base font-bold text-gray-800">
                            {formatNumber(model.value)}원
                          </span>
                        </div>
                      ))}

                      {/* S-RIM 시나리오 섹션 - 토글 상태에 따라 표시/숨김 */}
                      {isSrimExpanded &&
                        calculatedResults.categorizedModels?.srimScenarios &&
                        calculatedResults.categorizedModels.srimScenarios.length > 0 && (
                          <div className="px-6 py-4 bg-gray-50">
                            <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-3">
                              S-RIM 추가 시나리오 (참고용)
                            </h4>
                            {calculatedResults.categorizedModels.srimScenarios.map((model) => (
                              <div
                                key={model.name}
                                className="flex justify-between text-sm text-gray-600 ml-5 py-2"
                              >
                                <span>{model.name}:</span>
                                <span className="font-medium">{formatNumber(model.value)}원</span>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  )}
                </div>

                {/* 수익 가치 기반 모델 */}
                <div className="mb-5">
                  <button
                    className="w-full flex items-center justify-between p-5 bg-gray-50 rounded-xl text-left focus:outline-none hover:bg-gray-100 transition-colors"
                    onClick={() => toggleCategory('earningsBased')}
                  >
                    <div className="flex items-center">
                      <Info className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 mr-3" />
                      <h3 className="text-base sm:text-lg font-medium text-gray-800">
                        수익 가치 기반 모델
                      </h3>
                    </div>
                    {expandedCategories.has('earningsBased') ? (
                      <ChevronUp className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                    ) : (
                      <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                    )}
                  </button>

                  {expandedCategories.has('earningsBased') && (
                    <div className="mt-3 divide-y divide-gray-100 bg-white rounded-xl overflow-hidden border border-gray-100">
                      {calculatedResults.categorizedModels?.earningsBased.map((model) => (
                        <div
                          key={model.name}
                          className={`flex justify-between items-center px-5 py-4 hover:bg-gray-50 transition-colors ${
                            calculatedResults.outliers?.some((o) => o.name === model.name)
                              ? 'bg-gray-50'
                              : ''
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="text-sm sm:text-base font-medium text-gray-800">
                              {model.name}
                              {calculatedResults.outliers?.some((o) => o.name === model.name) && (
                                <span className="ml-2 sm:ml-3 text-xs text-yellow-600 flex items-center">
                                  <AlertTriangle size={12} className="mr-1 sm:mr-2" /> 참고용
                                </span>
                              )}
                            </span>
                          </div>
                          <span className="text-sm sm:text-base font-bold text-gray-800">
                            {formatNumber(model.value)}원
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 혼합 모델 */}
                <div className="mb-1">
                  <button
                    className="w-full flex items-center justify-between p-5 bg-gray-50 rounded-xl text-left focus:outline-none hover:bg-gray-100 transition-colors"
                    onClick={() => toggleCategory('mixedModels')}
                  >
                    <div className="flex items-center">
                      <Info className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 mr-3" />
                      <h3 className="text-base sm:text-lg font-medium text-gray-800">혼합 모델</h3>
                    </div>
                    {expandedCategories.has('mixedModels') ? (
                      <ChevronUp className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                    ) : (
                      <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                    )}
                  </button>

                  {expandedCategories.has('mixedModels') && (
                    <div className="mt-3 divide-y divide-gray-100 bg-white rounded-xl overflow-hidden border border-gray-100">
                      {calculatedResults.categorizedModels?.mixedModels.map((model) => (
                        <div
                          key={model.name}
                          className={`flex justify-between items-center px-5 py-4 hover:bg-gray-50 transition-colors ${
                            calculatedResults.outliers?.some((o) => o.name === model.name)
                              ? 'bg-gray-50'
                              : ''
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="text-sm sm:text-base font-medium text-gray-800">
                              {model.name}
                              {calculatedResults.outliers?.some((o) => o.name === model.name) && (
                                <span className="ml-2 sm:ml-3 text-xs text-yellow-600 flex items-center">
                                  <AlertTriangle size={12} className="mr-1 sm:mr-2" /> 참고용
                                </span>
                              )}
                            </span>
                          </div>
                          <span className="text-sm sm:text-base font-bold text-gray-800">
                            {formatNumber(model.value)}원
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 종합 요약 및 투자 판단 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-5 flex items-center">
                <Info className="mr-3 w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                종합 투자 평가
              </h2>

              {/* 신호등 시스템 */}
              <div className="mb-6 p-5 bg-gray-50 rounded-xl">
                <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-4">가격 평가</h4>
                <PriceSignal ratio={calculatedResults.priceRatio} />
              </div>

              {/* 가격 범위 */}
              <div className="mb-6 p-5 bg-gray-50 rounded-xl">
                <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-3">적정가 범위</h4>
                {calculatedResults.hasOutliers && (
                  <p className="text-xs text-gray-600 mb-4">
                    * 이상치를 제외한 값으로 계산된 범위입니다.
                  </p>
                )}

                <div className="space-y-5">
                  <div className="flex items-center text-sm sm:text-base">
                    <div className="w-1/4">하위 25%</div>
                    <div className="w-1/2 px-3">
                      {renderScoreBar(
                        calculatedResults.priceRange.lowRange,
                        calculatedResults.priceRange.highRange
                      )}
                    </div>
                    <div className="w-1/4 text-right font-bold">
                      {formatNumber(calculatedResults.priceRange.lowRange)}원
                    </div>
                  </div>

                  <div className="flex items-center text-sm sm:text-base">
                    <div className="w-1/4 font-medium">중앙값</div>
                    <div className="w-1/2 px-3">
                      {renderScoreBar(
                        calculatedResults.priceRange.midRange,
                        calculatedResults.priceRange.highRange
                      )}
                    </div>
                    <div className="w-1/4 text-right font-bold">
                      {formatNumber(calculatedResults.priceRange.midRange)}원
                    </div>
                  </div>

                  <div className="flex items-center text-sm sm:text-base">
                    <div className="w-1/4">상위 25%</div>
                    <div className="w-1/2 px-3">
                      {renderScoreBar(
                        calculatedResults.priceRange.highRange,
                        calculatedResults.priceRange.highRange
                      )}
                    </div>
                    <div className="w-1/4 text-right font-bold">
                      {formatNumber(calculatedResults.priceRange.highRange)}원
                    </div>
                  </div>
                </div>
              </div>

              {/* 데이터 신뢰성 및 위험 프로필 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="p-5 bg-gray-50 rounded-xl">
                  <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-4">
                    데이터 신뢰성
                  </h4>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                      <div
                        className={`h-2 sm:h-3 rounded-full ${
                          calculatedResults.trustScore >= 8
                            ? 'bg-emerald-600'
                            : calculatedResults.trustScore >= 5
                            ? 'bg-yellow-400'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${calculatedResults.trustScore * 10}%` }}
                      ></div>
                    </div>
                    <span className="text-sm sm:text-base font-bold">
                      {calculatedResults.trustScore}/10
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {calculatedResults.trustScore >= 8
                      ? '데이터 신뢰성이 높습니다.'
                      : calculatedResults.trustScore >= 5
                      ? '데이터 신뢰성이 보통입니다. 추가 검토를 권장합니다.'
                      : '데이터 신뢰성이 낮습니다. 결과 해석에 주의가 필요합니다.'}
                  </p>
                </div>

                <div className="p-5 bg-gray-50 rounded-xl">
                  <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-4">
                    위험 프로필
                  </h4>
                  <div className="flex items-center gap-4">
                    <p
                      className={`px-3 py-1.5 rounded-lg text-white text-sm font-medium ${
                        calculatedResults.riskScore < 0.3
                          ? 'bg-emerald-600'
                          : calculatedResults.riskScore < 0.6
                          ? 'bg-yellow-400'
                          : 'bg-red-500'
                      }`}
                    >
                      {calculatedResults.riskScore < 0.3
                        ? '낮음'
                        : calculatedResults.riskScore < 0.6
                        ? '중간'
                        : '높음'}
                    </p>
                    <p className="text-sm flex-1">
                      {calculatedResults.riskScore < 0.3
                        ? '수익성이 안정적입니다. 예측 가능성이 높은 기업입니다.'
                        : calculatedResults.riskScore < 0.6
                        ? '보통 수준의 수익 변동성을 보입니다.'
                        : '수익성 변동이 큽니다. 주의가 필요합니다.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 현재가 대비 적정가 상태 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="p-5 bg-gray-50 rounded-xl">
                  <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-2">
                    적정가 중앙값
                  </h4>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-600">
                    {formatNumber(calculatedResults.priceRange.midRange)}원
                  </p>
                </div>
                <div className="p-5 bg-gray-50 rounded-xl">
                  <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-2">현재 주가</h4>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">
                    {formatNumber(latestPrice?.price || 0)}원
                    {latestPrice && latestPrice.formattedDate && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({latestPrice.formattedDate})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* 이상치 정보 (접이식) */}
              {calculatedResults.hasOutliers && (
                <details className="mb-6 p-5 bg-gray-50 rounded-xl">
                  <summary className="cursor-pointer text-sm sm:text-base font-medium">
                    참고용 이상치 값 정보 (클릭하여 확인)
                  </summary>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-3">
                      다음 값들은 다른 모델과 큰 차이를 보여 적정가 계산에서 제외되었습니다:
                    </p>
                    <ul className="pl-6 text-sm sm:text-base space-y-2">
                      {calculatedResults.outliers?.map((outlier) => (
                        <li key={outlier.name}>
                          {outlier.name}: {formatNumber(outlier.value)}원
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              )}

              {/* 투자 조언 메시지 */}
              <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                <p className="font-medium text-gray-800 mb-3">※ 투자 참고 사항:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>위 평가는 기초적인 가이드라인으로, 추가 분석이 권장됩니다.</li>
                  <li>적정가 범위는 다양한 모델의 결과 분포를 보여줍니다.</li>
                  <li>데이터 신뢰성이 낮을 경우 결과 해석에 주의가 필요합니다.</li>
                  <li>최종 투자 결정 전에 기업의 사업 모델, 경쟁력, 성장성도 함께 고려하세요.</li>
                  {calculatedResults.perAnalysis?.status === 'negative' && (
                    <li>이 기업은 현재 손실을 기록하고 있어 수익 기반 모델의 신뢰도가 낮습니다.</li>
                  )}
                  {calculatedResults.perAnalysis?.status === 'extreme_high' && (
                    <li>
                      이 기업은 현재 PER이 매우 높아 수익 기반 모델의 신뢰도가 낮을 수 있습니다.
                    </li>
                  )}
                </ul>
              </div>

              {/* 페이지 하단 네비게이션 버튼 */}
              <div className="mt-6">
                <Link href={`/checklist?stockCode=${selectedCompany?.stockCode}`}>
                  <button className="inline-flex items-center bg-emerald-600 text-white px-5 py-3 rounded-xl text-sm sm:text-base font-medium hover:bg-emerald-700 transition-colors">
                    체크리스트로 돌아가기
                    <svg
                      className="ml-2 w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
