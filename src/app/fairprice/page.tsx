//src/app/fairprice/page.tsx

'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import CompanySearchInput from '../components/CompanySearchInput';
import { CompanyInfo } from '@/lib/stockCodeData';
import {
  ApiResponse,
  CalculatedResults,
  FinancialData,
  StockPrice,
  UserData,
} from '@/lib/finance/types';
import { fetchStockPrices, fetchFinancialData, fetchStockPrice } from '@/lib/finance/apiService';
import { extractFinancialData, convertToPriceData } from '@/lib/finance/dataProcessor';
import { calculateAllPrices } from './PriceCalculate';
import { getIndustryParameters } from '@/lib/industryData';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BarChart4,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  Search as SearchIcon,
  XCircle,
} from 'lucide-react';

export default function FairPricePage() {
  // 상태 관리
  const [companyName, setCompanyName] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyInfo | null>(null);
  const [userData, setUserData] = useState<UserData>({
    treasuryShares: '', // 자사주
    targetPER: '10', // 적정 PER 배수(기본값 10)
    expectedReturn: '8', // 기대수익률(기본값 8%)
    pegRatio: '1.0', // PEG 비율(기본값 1.0 - 피터 린치 기준)
  });
  const [stockPrices, setStockPrices] = useState<Record<string, StockPrice>>({});
  const [latestPrice, setLatestPrice] = useState<StockPrice | null>(null);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [rawFinancialData, setRawFinancialData] = useState<ApiResponse | null>(null);
  const [calculatedResults, setCalculatedResults] = useState<CalculatedResults | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [isSrimExpanded, setIsSrimExpanded] = useState<boolean>(false);
  const [industryParams, setIndustryParams] = useState({
    avgPER: 10,
    avgPEG: 1.0,
    liabilityMultiplier: 1.2,
  });
  // 검색폼 표시 상태 추가
  const [showSearchForm, setShowSearchForm] = useState<boolean>(true);
  // 카테고리 확장 상태 추가
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  // 계산 설정 토글 상태
  const [showSettingsForm, setShowSettingsForm] = useState<boolean>(false);

  // 회사 선택 핸들러
  const handleCompanySelect = (company: CompanyInfo) => {
    setCompanyName(company.companyName);
    setSelectedCompany(company);

    // 산업군별 파라미터 가져오기
    const params = getIndustryParameters(company.industry);
    setIndustryParams(params);

    // 산업 평균 PER로 초기화
    setUserData((prev) => ({
      ...prev,
      targetPER: params.avgPER.toString(),
      pegRatio: params.avgPEG.toString(),
    }));
  };

  // 사용자 입력 핸들러
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  // 토글 함수
  const toggleSrimScenarios = () => {
    setIsSrimExpanded(!isSrimExpanded);
  };

  // 카테고리 확장/축소 핸들러 (독립적으로 작동하도록 수정)
  const toggleCategory = (category: string) => {
    setExpandedCategories((prevState) => {
      // 새로운 Set 객체 생성
      const newState = new Set(prevState);

      // 이미 확장된 카테고리면 제거, 아니면 추가
      if (newState.has(category)) {
        newState.delete(category);
      } else {
        newState.add(category);
      }

      return newState;
    });
  };

  //설정 토글 함수
  const toggleSettingsForm = () => {
    setShowSettingsForm(!showSettingsForm);
  };

  // 신호등 컴포넌트 개선
  const PriceSignal = ({ signal, message }: { signal: string; message: string }) => {
    let signalClass = 'bg-gray-400';
    let signalText = '?';

    if (signal === 'green') {
      signalClass = 'bg-green-500';
      signalText = '저';
    } else if (signal === 'lightgreen') {
      signalClass = 'bg-green-400';
      signalText = '저';
    } else if (signal === 'yellow') {
      signalClass = 'bg-yellow-400';
      signalText = '적';
    } else if (signal === 'orange') {
      signalClass = 'bg-orange-400';
      signalText = '고';
    } else if (signal === 'red') {
      signalClass = 'bg-red-500';
      signalText = '고';
    }

    return (
      <div className="flex items-center gap-2">
        <div
          className={`rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center ${signalClass} text-white font-bold text-xs sm:text-sm`}
        >
          {signalText}
        </div>
        <span className="text-xs sm:text-sm">{message}</span>
      </div>
    );
  };

  // 메인 검색 함수
  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 선택된 회사가 없으면 에러 표시
    if (!selectedCompany) {
      setError('회사를 검색하고 선택해주세요');
      return;
    }

    // 모든 상태 초기화
    setStockPrices({});
    setFinancialData(null);
    setRawFinancialData(null);
    setCalculatedResults(null);
    setSuccess(false);
    setError('');

    setLoading(true);

    try {
      // 1. 주가 데이터 가져오기 - 공통 모듈 사용
      //3년간
      const { priceDataMap, baseYearData } = await fetchStockPrices(selectedCompany.stockCode);
      //최신주가
      const latestPriceData = await fetchStockPrice(selectedCompany.stockCode, true);

      if (!baseYearData) {
        throw new Error(`${companyName}의 주가 데이터를 찾을 수 없습니다`);
      }

      // 상태 업데이트
      setStockPrices(priceDataMap);
      setLatestPrice(latestPriceData || null);

      // 2. 재무 데이터 가져오기 - 공통 모듈 사용
      const rawData = await fetchFinancialData(selectedCompany.dartCode);
      setRawFinancialData(rawData);

      // 3. 재무 데이터 추출 - 공통 모듈 사용
      const extractedData = extractFinancialData(rawData);
      const priceData = convertToPriceData(extractedData);
      setFinancialData(priceData);

      // 4. 적정가 계산 - priceDataMap을 직접 전달
      const results = calculateAllPrices(
        priceData,
        baseYearData,
        priceDataMap,
        userData,
        latestPriceData,
        selectedCompany.industry
      );
      setCalculatedResults(results);

      setSuccess(true);
      setShowSearchForm(false); // 검색 결과 표시 시 검색 폼 숨기기
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

  // 수정 계산하기 함수
  const handleRecalculate = () => {
    if (!financialData || !stockPrices) {
      setError('재계산을 위한 데이터가 없습니다. 먼저 회사를 검색해주세요.');
      return;
    }

    try {
      const currentYear = new Date().getFullYear();
      const baseYear = currentYear - 1;
      const baseYearData = stockPrices[baseYear];

      if (!baseYearData) {
        throw new Error('기준연도 데이터가 없습니다');
      }

      const results = calculateAllPrices(
        financialData,
        baseYearData,
        stockPrices,
        userData,
        latestPrice,
        selectedCompany?.industry || 'etc'
      );
      setCalculatedResults(results);
    } catch (error) {
      if (error instanceof Error) {
        setError('재계산 중 오류가 발생했습니다: ' + error.message);
      } else {
        setError('재계산 중 알 수 없는 오류가 발생했습니다');
      }
    }
  };

  // 점수 바 렌더링 함수
  const renderScoreBar = (score: number, maxScore: number = 10) => {
    const percentage = (score / maxScore) * 100;
    let barColor = 'bg-gray-600';

    if (percentage >= 70) barColor = 'bg-green-600';
    else if (percentage < 20) barColor = 'bg-red-400';

    return (
      <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
        <div
          className={`${barColor} h-1.5 sm:h-2 rounded-full`}
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
    const priceDiff = fairPrice - currentPrice;
    const priceDiffPercent = (priceDiff / currentPrice) * 100;
    const isPriceDiffPositive = priceDiff > 0;

    // 상태에 따른 색상과 텍스트 결정
    const statusColor = isPriceDiffPositive ? 'text-green-500' : 'text-red-500';
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
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-8 shadow-sm mb-6 sm:mb-10">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
          <Info className="mr-1 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
          주가 대비 적정가 비교
        </h2>
        {/* 상단 비교 텍스트 */}
        <div className="mb-4 flex flex-wrap items-end">
          <span className="text-base font-medium">현재가에 대비 </span>
          <span className={`text-xl sm:text-2xl font-bold ${statusColor} mx-1`}>
            {Math.abs(priceDiffPercent).toFixed(1)}%
          </span>
          <span className="text-base font-medium">
            ({formatNumber(Math.abs(priceDiff))}원) {statusText}
          </span>
        </div>

        {/* 적정가 막대 */}
        <div className="flex items-center mb-4 h-12">
          <div
            className="bg-green-500 h-full flex items-center justify-end sm:pr-6 pr-4 rounded-r-xl sm:rounded-r-full"
            style={{ width: fairBarWidth }}
          >
            <span className="text-white text-sm font-medium">적정가</span>
          </div>
          <div className="sm:ml-4 ml-2 text-base font-medium whitespace-nowrap">
            {formatNumber(fairPrice)}원
          </div>
        </div>

        {/* 현재주가 막대 */}
        <div className="flex items-center h-12">
          <div
            className="bg-gray-400 h-full flex items-center justify-end sm:pr-6 pr-4 rounded-r-xl sm:rounded-r-full"
            style={{ width: currentBarWidth }}
          >
            <span className="text-white text-sm font-medium">현재주가</span>
          </div>
          <div className="sm:ml-4 ml-2 text-base font-medium whitespace-nowrap">
            {formatNumber(currentPrice)}원
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 py-6 sm:p-6">
      {/* 헤더 */}
      <header className="mb-2 sm:mb-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center ">
          <Link
            href="/"
            className="mr-2 sm:mr-4 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
            <BarChart4 className="mr-1 sm:mr-2 text-gray-900 w-5 h-5 sm:w-7 sm:h-7" />
            가치투자 주식 적정가 계산
          </h1>
        </div>
        {/* <p className="text-xs sm:text-sm text-gray-600">
          워렌 버핏, 피터 린치 스타일의 가치투자자를 위한 가격 계산기입니다.
        </p> */}
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full">
        {/* 사용자 설정 영역 */}
        {!showSettingsForm ? (
          <div className="flex justify-end pr-4">
            <button
              onClick={toggleSettingsForm}
              className="text-xs sm:text-sm hover:bg-gray-200 text-gray-600 rounded-lg flex items-center transition-colors mb-4 sm:mb-4 underline"
            >
              <Info className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4 text-gray-700" />
              계산 설정 변경
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-8 shadow-sm mb-4 sm:mb-8">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-bold text-gray-600 flex items-center underline">
                <Info className="mr-1 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                적정가 계산 설정
              </h2>
              <button
                onClick={toggleSettingsForm}
                className="text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-lg flex items-center transition-colors"
              >
                계산 설정 닫기
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  자기주식수(자사주)
                </label>
                <input
                  type="number"
                  name="treasuryShares"
                  value={userData.treasuryShares}
                  onChange={handleInputChange}
                  placeholder="예: 399000000"
                  className="w-full p-2 border rounded-lg text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  적정 PER 배수 (산업 평균: {industryParams.avgPER})
                </label>
                <input
                  type="number"
                  name="targetPER"
                  value={userData.targetPER}
                  onChange={handleInputChange}
                  placeholder={`산업 평균: ${industryParams.avgPER}`}
                  className="w-full p-2 border rounded-lg text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  기대수익률/할인율(%)
                </label>
                <input
                  type="number"
                  name="expectedReturn"
                  value={userData.expectedReturn}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg text-xs sm:text-sm"
                />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <button
                onClick={handleRecalculate}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl transition-colors text-xs sm:text-sm font-medium"
              >
                수정 계산하기
              </button>
            </div>
          </div>
        )}
        {/* 검색 영역 - 확장/축소 가능 */}
        {showSearchForm ? (
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-8 shadow-sm mb-2 sm:mb-4">
            <form onSubmit={handleSearch}>
              <div className="flex flex-col gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
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
                  className="w-full bg-black hover:bg-gray-800 text-white py-2 sm:py-3 px-4 rounded-lg sm:rounded-xl transition-colors duration-200 flex items-center justify-center mt-1 sm:mt-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
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
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm mb-2 sm:mb-4 flex justify-between items-center">
            <div className="flex items-center">
              <BarChart4 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-900 mr-2" />
              <span className="text-sm sm:text-base font-medium">
                {selectedCompany?.companyName} ({latestPrice?.code})
              </span>
            </div>
            <button
              onClick={() => setShowSearchForm(true)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 text-xs sm:text-sm rounded-lg flex items-center transition-colors"
            >
              <SearchIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              다른 종목 보기
            </button>
          </div>
        )}

        {/* 오류 메시지 */}
        {error && (
          <div className="bg-white p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm mb-6 sm:mb-10 border-l-4 border-red-500">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-1 sm:mr-2 mt-0.5" />
              <div>
                <p className="font-medium text-sm sm:text-base text-gray-900">오류</p>
                <p className="text-xs sm:text-sm text-gray-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 결과 영역 */}
        {success && financialData && calculatedResults && (
          <>
            {/* 투자 한눈에 보기 섹션 (새로 추가) */}
            <InvestmentAtGlance
              currentPrice={
                latestPrice?.price || stockPrices[String(new Date().getFullYear() - 1)]?.price || 0
              }
              fairPrice={calculatedResults.priceRange.midRange}
            />

            {/* 주요 데이터 요약 */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-8 shadow-sm mb-6 sm:mb-10">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Info className="mr-1 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                주요 데이터 요약
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                <div className="bg-gray-50 p-2 sm:p-4 rounded-lg sm:rounded-xl">
                  <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">EPS(최신)</p>
                  <p className="text-base sm:text-xl font-bold truncate">
                    {formatNumber(financialData.epsByYear[financialData.years[0]])} 원
                  </p>
                </div>
                <div className="bg-gray-50 p-2 sm:p-4 rounded-lg sm:rounded-xl">
                  <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">EPS(3년 평균)</p>
                  <p className="text-base sm:text-xl font-bold truncate">
                    {formatNumber(calculatedResults.averageEps)} 원
                  </p>
                </div>
                <div className="bg-gray-50 p-2 sm:p-4 rounded-lg sm:rounded-xl">
                  <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">BPS(주당순자산)</p>
                  <p className="text-base sm:text-xl font-bold truncate">
                    {formatNumber(
                      financialData.equityAttributableToOwners /
                        (stockPrices[String(new Date().getFullYear() - 1)]?.sharesOutstanding || 1)
                    )}{' '}
                    원
                  </p>
                </div>
                <div className="bg-gray-50 p-2 sm:p-4 rounded-lg sm:rounded-xl">
                  <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">ROE</p>
                  <p className="text-base sm:text-xl font-bold truncate">
                    {(
                      (financialData.netIncome / financialData.equityAttributableToOwners) *
                      100
                    ).toFixed(2)}
                    %
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mt-2 sm:mt-4">
                <div className="bg-gray-50 p-2 sm:p-4 rounded-lg sm:rounded-xl">
                  <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">평균 PER</p>
                  <p className="text-base sm:text-xl font-bold truncate">
                    {calculatedResults.averagePER.toFixed(2)}
                  </p>
                </div>
                <div className="bg-gray-50 p-2 sm:p-4 rounded-lg sm:rounded-xl">
                  <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">적정 PER 배수</p>
                  <p className="text-base sm:text-xl font-bold truncate">
                    {formatNumber(Number(userData.targetPER))}
                    {Number(userData.targetPER) === industryParams.avgPER && (
                      <span className="text-xs text-gray-500 ml-1">(산업 평균)</span>
                    )}
                  </p>
                </div>
                <div className="bg-gray-50 p-2 sm:p-4 rounded-lg sm:rounded-xl col-span-2">
                  <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">현재 주가</p>
                  <p className="text-base sm:text-xl font-bold truncate">
                    {formatNumber(
                      latestPrice?.price ||
                        stockPrices[String(new Date().getFullYear() - 1)]?.price ||
                        0
                    )}
                    원
                    {latestPrice && latestPrice.formattedDate && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({latestPrice.formattedDate})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* 적정가 계산 결과 */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm mb-6 sm:mb-10 overflow-hidden">
              <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-100 border-b">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center">
                  <BarChart4 className="mr-1 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                  적정 주가 계산 결과
                </h2>
              </div>

              {/* PER 분석 결과 표시 */}
              {calculatedResults.perAnalysis &&
                calculatedResults.perAnalysis.status !== 'normal' && (
                  <div
                    className={`p-3 sm:p-4 ${
                      calculatedResults.perAnalysis.status === 'negative' ||
                      calculatedResults.perAnalysis.status === 'extreme_high'
                        ? 'bg-yellow-50'
                        : 'bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                      <p className="text-xs sm:text-sm font-medium">
                        {calculatedResults.perAnalysis.message}
                      </p>
                    </div>
                    {(calculatedResults.perAnalysis.status === 'negative' ||
                      calculatedResults.perAnalysis.status === 'extreme_high') && (
                      <p className="mt-1 sm:mt-2 text-xs text-gray-600 ml-6 sm:ml-7">
                        이런 경우 PER 기반 모델의 결과는 신뢰성이 낮을 수 있으며, 자산 기반 모델을
                        더 참고하는 것이 좋습니다.
                      </p>
                    )}
                  </div>
                )}

              {/* 이상치 경고 표시 */}
              {calculatedResults.hasOutliers && (
                <div className="p-3 sm:p-4 bg-yellow-50">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                    <p className="text-xs sm:text-sm font-medium">
                      일부 평가 모델에서 비정상적인 결과가 검출되었습니다. 결과 해석에 주의가
                      필요합니다.
                    </p>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                {/* 자산 가치 기반 모델 */}
                <button
                  className="w-full flex items-center justify-between px-3 sm:px-6 py-3 bg-gray-100 text-left focus:outline-none"
                  onClick={() => toggleCategory('assetBased')}
                >
                  <div className="flex items-center">
                    <Info className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 mr-1 sm:mr-2" />
                    <h3 className="text-sm sm:text-base font-medium">자산 가치 기반 모델</h3>
                  </div>
                  {expandedCategories.has('assetBased') ? (
                    <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                  )}
                </button>

                {expandedCategories.has('assetBased') && (
                  <div className="divide-y divide-gray-100">
                    {calculatedResults.categorizedModels?.assetBased.map((model) => (
                      <div
                        key={model.name}
                        className={`flex justify-between items-center px-3 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors ${
                          calculatedResults.outliers?.some((o) => o.name === model.name)
                            ? 'bg-gray-50'
                            : ''
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="text-xs sm:text-sm font-medium text-gray-900">
                            {model.name}
                            {model.name === 'S-RIM 기본 시나리오' &&
                              calculatedResults.categorizedModels?.srimScenarios &&
                              calculatedResults.categorizedModels.srimScenarios.length > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSrimScenarios();
                                  }}
                                  className="ml-1 sm:ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
                                >
                                  {isSrimExpanded ? '▼' : '▶'}
                                </button>
                              )}
                            {calculatedResults.outliers?.some((o) => o.name === model.name) && (
                              <span className="ml-1 sm:ml-2 text-xs text-yellow-600 flex items-center">
                                <AlertTriangle size={10} className="mr-0.5 sm:mr-1" /> 참고용
                              </span>
                            )}
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-gray-900">
                          {formatNumber(model.value)}원
                        </span>
                      </div>
                    ))}

                    {/* S-RIM 시나리오 섹션 - 토글 상태에 따라 표시/숨김 */}
                    {isSrimExpanded &&
                      calculatedResults.categorizedModels?.srimScenarios &&
                      calculatedResults.categorizedModels.srimScenarios.length > 0 && (
                        <div className="px-6 sm:px-8 py-2 sm:py-3 bg-gray-50">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                            S-RIM 추가 시나리오 (참고용)
                          </h4>
                          {calculatedResults.categorizedModels.srimScenarios.map((model) => (
                            <div
                              key={model.name}
                              className="flex justify-between text-xs text-gray-600 ml-4 py-1"
                            >
                              <span>{model.name}:</span>
                              <span className="font-medium">{formatNumber(model.value)}원</span>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                )}

                {/* 수익 가치 기반 모델 */}
                <button
                  className="w-full flex items-center justify-between px-3 sm:px-6 py-3 bg-gray-100 text-left focus:outline-none"
                  onClick={() => toggleCategory('earningsBased')}
                >
                  <div className="flex items-center">
                    <Info className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 mr-1 sm:mr-2" />
                    <h3 className="text-sm sm:text-base font-medium">수익 가치 기반 모델</h3>
                  </div>
                  {expandedCategories.has('earningsBased') ? (
                    <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                  )}
                </button>

                {expandedCategories.has('earningsBased') && (
                  <div className="divide-y divide-gray-100">
                    {calculatedResults.categorizedModels?.earningsBased.map((model) => (
                      <div
                        key={model.name}
                        className={`flex justify-between items-center px-3 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors ${
                          calculatedResults.outliers?.some((o) => o.name === model.name)
                            ? 'bg-gray-50'
                            : ''
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="text-xs sm:text-sm font-medium text-gray-900">
                            {model.name}
                            {calculatedResults.outliers?.some((o) => o.name === model.name) && (
                              <span className="ml-1 sm:ml-2 text-xs text-yellow-600 flex items-center">
                                <AlertTriangle size={10} className="mr-0.5 sm:mr-1" /> 참고용
                              </span>
                            )}
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-gray-900">
                          {formatNumber(model.value)}원
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 혼합 모델 */}
                <button
                  className="w-full flex items-center justify-between px-3 sm:px-6 py-3 bg-gray-100 text-left focus:outline-none"
                  onClick={() => toggleCategory('mixedModels')}
                >
                  <div className="flex items-center">
                    <Info className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 mr-1 sm:mr-2" />
                    <h3 className="text-sm sm:text-base font-medium">혼합 모델</h3>
                  </div>
                  {expandedCategories.has('mixedModels') ? (
                    <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                  )}
                </button>

                {expandedCategories.has('mixedModels') && (
                  <div className="divide-y divide-gray-100">
                    {calculatedResults.categorizedModels?.mixedModels.map((model) => (
                      <div
                        key={model.name}
                        className={`flex justify-between items-center px-3 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors ${
                          calculatedResults.outliers?.some((o) => o.name === model.name)
                            ? 'bg-gray-50'
                            : ''
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="text-xs sm:text-sm font-medium text-gray-900">
                            {model.name}
                            {calculatedResults.outliers?.some((o) => o.name === model.name) && (
                              <span className="ml-1 sm:ml-2 text-xs text-yellow-600 flex items-center">
                                <AlertTriangle size={10} className="mr-0.5 sm:mr-1" /> 참고용
                              </span>
                            )}
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-gray-900">
                          {formatNumber(model.value)}원
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 종합 요약 및 투자 판단 */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-8 shadow-sm">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Info className="mr-1 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                종합 투자 평가
              </h2>

              {/* 신호등 시스템 */}
              <div className="mb-3 sm:mb-4 p-3 bg-gray-50 rounded-lg sm:rounded-xl">
                <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">가격 평가</h4>
                <PriceSignal
                  signal={calculatedResults.priceSignal.signal}
                  message={calculatedResults.priceSignal.message}
                />
              </div>

              {/* 가격 범위 */}
              <div className="mb-3 sm:mb-4 p-3 bg-gray-50 rounded-lg sm:rounded-xl">
                <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">적정가 범위</h4>
                {calculatedResults.hasOutliers && (
                  <p className="text-xs text-gray-600 mb-2">
                    * 이상치를 제외한 값으로 계산된 범위입니다.
                  </p>
                )}

                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center text-xs sm:text-sm">
                    <div className="w-1/3">하위 25%</div>
                    <div className="w-1/2">
                      {renderScoreBar(
                        calculatedResults.priceRange.lowRange,
                        calculatedResults.priceRange.highRange
                      )}
                    </div>
                    <div className="w-1/6 text-right font-bold">
                      {formatNumber(calculatedResults.priceRange.lowRange)}원
                    </div>
                  </div>

                  <div className="flex items-center text-xs sm:text-sm">
                    <div className="w-1/3 font-medium">중앙값</div>
                    <div className="w-1/2">
                      {renderScoreBar(
                        calculatedResults.priceRange.midRange,
                        calculatedResults.priceRange.highRange
                      )}
                    </div>
                    <div className="w-1/6 text-right font-bold">
                      {formatNumber(calculatedResults.priceRange.midRange)}원
                    </div>
                  </div>

                  <div className="flex items-center text-xs sm:text-sm">
                    <div className="w-1/3">상위 25%</div>
                    <div className="w-1/2">
                      {renderScoreBar(
                        calculatedResults.priceRange.highRange,
                        calculatedResults.priceRange.highRange
                      )}
                    </div>
                    <div className="w-1/6 text-right font-bold">
                      {formatNumber(calculatedResults.priceRange.highRange)}원
                    </div>
                  </div>
                </div>
              </div>

              {/* 데이터 신뢰성 및 위험 프로필 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="p-3 bg-gray-50 rounded-lg sm:rounded-xl">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    데이터 신뢰성
                  </h4>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                      <div
                        className={`h-1.5 sm:h-2 rounded-full ${
                          calculatedResults.dataReliability.score >= 8
                            ? 'bg-green-500'
                            : calculatedResults.dataReliability.score >= 5
                            ? 'bg-yellow-400'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${calculatedResults.dataReliability.score * 10}%` }}
                      ></div>
                    </div>
                    <span className="text-xs sm:text-sm font-bold">
                      {calculatedResults.dataReliability.score}/10
                    </span>
                  </div>
                  <p className="text-xs mt-1 text-gray-600">
                    {calculatedResults.dataReliability.message}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg sm:rounded-xl">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">위험 프로필</h4>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-white text-xs ${
                        calculatedResults.riskProfile.riskLevel === '낮음'
                          ? 'bg-green-500'
                          : calculatedResults.riskProfile.riskLevel === '중간'
                          ? 'bg-yellow-400'
                          : 'bg-red-500'
                      }`}
                    >
                      {calculatedResults.riskProfile.riskLevel}
                    </span>
                    <span className="text-xs">{calculatedResults.riskProfile.message}</span>
                  </div>
                </div>
              </div>

              {/* 현재가 대비 적정가 상태 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="p-3 bg-gray-50 rounded-lg sm:rounded-xl">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    적정가 중앙값
                  </h4>
                  <p className="text-base sm:text-2xl font-bold">
                    {formatNumber(calculatedResults.priceRange.midRange)}원
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg sm:rounded-xl">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-1">현재 주가</h4>
                  <p className="text-base sm:text-2xl font-bold">
                    {formatNumber(
                      latestPrice?.price ||
                        stockPrices[String(new Date().getFullYear() - 1)]?.price ||
                        0
                    )}
                    원
                    {latestPrice && latestPrice.formattedDate && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({latestPrice.formattedDate})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* 이상치 정보 (접이식) */}
              {calculatedResults.hasOutliers && (
                <details className="mb-3 sm:mb-4 p-3 bg-gray-50 rounded-lg sm:rounded-xl">
                  <summary className="cursor-pointer text-xs sm:text-sm font-medium">
                    참고용 이상치 값 정보 (클릭하여 확인)
                  </summary>
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-2">
                      다음 값들은 다른 모델과 큰 차이를 보여 적정가 계산에서 제외되었습니다:
                    </p>
                    <ul className="pl-5 text-xs sm:text-sm space-y-1">
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
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl text-xs sm:text-sm">
                <p className="font-medium text-blue-800 mb-1">투자 참고 사항:</p>
                <ul className="list-disc pl-5 space-y-1 text-blue-700">
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

              <div className="mt-4 sm:mt-6">
                <Link href="/checklist">
                  <button className="inline-flex items-center bg-black text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors">
                    체크리스트로 돌아가기
                    <svg
                      className="ml-1 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4"
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
