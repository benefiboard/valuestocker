'use client';

import { useState, FormEvent } from 'react';
import CompanySearchInput from '../components/CompanySearchInput';
import { CompanyInfo } from '@/lib/stockCodeData';
import {
  ApiResponse,
  ChecklistItem,
  FinancialDataCheckList,
  StockPrice,
} from '@/lib/finance/types';
import { fetchStockPrice, fetchFinancialData, fetchStockPrices } from '@/lib/finance/apiService';
import { extractFinancialData, convertToChecklistData } from '@/lib/finance/dataProcessor';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  CircleDollarSign,
  Info,
  LineChart,
  Percent,
  ShieldAlert,
  TrendingUp,
  XCircle,
  CheckSquare,
  Award,
  AlertTriangle,
  Search as SearchIcon,
} from 'lucide-react';
import {
  calculateChecklist,
  calculateInvestmentRating,
  initialChecklist,
  ScoredChecklistItem,
  InvestmentRating,
  FINANCIAL_COMPANIES,
} from './ChecklistCalculate';
import Link from 'next/link';
import React from 'react';

interface HierarchicalCategory {
  [mainCategory: string]: {
    [subCategory: string]: ScoredChecklistItem[];
  };
}

export default function ChecklistPage() {
  // 상태 관리
  const [companyName, setCompanyName] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyInfo | null>(null);
  const [stockPrice, setStockPrice] = useState<StockPrice | null>(null);
  const [financialData, setFinancialData] = useState<FinancialDataCheckList | null>(null);
  const [rawFinancialData, setRawFinancialData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showSearchForm, setShowSearchForm] = useState<boolean>(true);

  // 체크리스트 결과 상태
  const [checklistResults, setChecklistResults] = useState<ScoredChecklistItem[]>([]);
  const [investmentRating, setInvestmentRating] = useState<InvestmentRating | null>(null);

  // 회사 선택 핸들러
  const handleCompanySelect = (company: CompanyInfo) => {
    setCompanyName(company.companyName);
    setSelectedCompany(company);
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
    setStockPrice(null);
    setFinancialData(null);
    setRawFinancialData(null);
    setChecklistResults([]);
    setInvestmentRating(null);
    setSuccess(false);
    setError('');

    setLoading(true);

    try {
      // 1. 주가 데이터 가져오기 - 3년치 데이터로 변경
      const { priceDataMap, baseYearData } = await fetchStockPrices(selectedCompany.stockCode);
      const latestPriceData = await fetchStockPrice(selectedCompany.stockCode, true);

      // baseYearData가 null인 경우 에러 처리
      if (!baseYearData) {
        throw new Error(`${companyName}의 주가 데이터를 찾을 수 없습니다`);
      }

      setStockPrice(latestPriceData || 0); // 현재 주가 설정

      // 2. 재무 데이터 가져오기 - 공통 모듈 사용
      const rawData = await fetchFinancialData(selectedCompany.dartCode);
      setRawFinancialData(rawData);

      // 3. 재무 데이터 추출
      const extractedData = extractFinancialData(rawData);
      const checklistData = convertToChecklistData(extractedData);
      setFinancialData(checklistData);

      // 4. 체크리스트 계산 - 여기서 baseYearData는 이미 null 체크를 했으므로 안전
      const checklist = calculateChecklist(
        checklistData,
        baseYearData,
        priceDataMap,
        selectedCompany.industry // 산업군 정보 전달
      );
      setChecklistResults(checklist);

      // 5. 투자 등급 계산
      const rating = calculateInvestmentRating(
        checklist,
        selectedCompany.stockCode,
        selectedCompany.industry // 산업군 정보 전달
      );
      setInvestmentRating(rating);

      setSuccess(true);
      setShowSearchForm(false); // 검색 결과가 표시되면 검색 폼 숨기기
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

  // 카테고리 확장/축소 핸들러
  const toggleCategory = (category: string) => {
    if (expandedCategory === category) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(category);
    }
  };

  // 중요도를 별로 표시하는 함수
  const renderImportance = (level: 1 | 2 | 3 | 4 | 5, isFailCriteria: boolean) => {
    const starColorClass = isFailCriteria ? 'text-red-500' : 'text-gray-800';

    return Array(level)
      .fill(0)
      .map((_, i) => (
        <span key={i} className={starColorClass}>
          ★
        </span>
      ));
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

  // 등급에 따른 배경색 결정
  const getGradeColor = (grade: string) => {
    switch (grade) {
      // 상위 등급: 녹색 계열 (A+, A, B+)
      case 'A+':
        return 'bg-green-600 text-white'; // 짙은 녹색
      case 'A':
        return 'bg-green-500 text-white'; // 녹색
      case 'B+':
        return 'bg-green-400 text-white'; // 밝은 녹색

      // 중간 등급: 회색 계열 (B, C+, C)
      case 'B':
        return 'bg-gray-600 text-white'; // 짙은 회색
      case 'C+':
        return 'bg-gray-500 text-white'; // 회색
      case 'C':
        return 'bg-gray-400 text-white'; // 밝은 회색

      // 하위 등급: 빨간색 계열 (D, F)
      case 'D':
        return 'bg-red-500 text-white'; // 빨간색
      case 'F':
        return 'bg-red-600 text-white'; // 짙은 빨간색

      // 기본값
      default:
        return 'bg-gray-400 text-white';
    }
  };

  // 숫자 포맷팅 함수
  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('ko-KR').format(Math.round(num * 100) / 100);
  };

  // 카테고리별 항목 그룹화 (예시: 세부 지표 - 자산가치 등)
  const getCategorizedItems = () => {
    const categories: { [key: string]: ScoredChecklistItem[] } = {};

    checklistResults.forEach((item) => {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    });

    return categories;
  };

  // 계층적 카테고리 구조를 생성하는 함수
  const getHierarchicalCategories = (): HierarchicalCategory => {
    const hierarchical: HierarchicalCategory = {};

    checklistResults.forEach((item) => {
      const categoryParts = item.category.split(' - ');
      const mainCategory = categoryParts[0];
      // 핵심 지표인 경우 subCategory도 '핵심 지표'로 설정
      const subCategory =
        mainCategory === '핵심 지표'
          ? '핵심 지표'
          : categoryParts.length > 1
          ? categoryParts[1]
          : '일반';

      if (!hierarchical[mainCategory]) {
        hierarchical[mainCategory] = {};
      }

      if (!hierarchical[mainCategory][subCategory]) {
        hierarchical[mainCategory][subCategory] = [];
      }

      hierarchical[mainCategory][subCategory].push(item);
    });

    return hierarchical;
  };

  // 카테고리 아이콘 매핑
  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      '핵심 지표': <LineChart className="h-4 w-4 sm:h-5 sm:w-5 text-gray-900" />,
      '세부 지표': <Info className="h-4 w-4 sm:h-5 sm:w-5 text-gray-900" />,
      수익성: <CircleDollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-gray-900" />,
      재무안정성: <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5 text-gray-900" />,
      성장성: <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-900" />,
      가치평가: <Percent className="h-4 w-4 sm:h-5 sm:w-5 text-gray-900" />,
    };

    return iconMap[category] || <Info className="h-4 w-4 sm:h-5 sm:w-5 text-gray-900" />;
  };

  // 카테고리 평균 점수 계산
  const getCategoryScore = (items: ScoredChecklistItem[]) => {
    if (items.length === 0) return 0;
    return Math.round((items.reduce((sum, item) => sum + item.score, 0) / items.length) * 10) / 10;
  };

  // 서브카테고리 점수 계산
  const getSubCategoryScore = (items: ScoredChecklistItem[]) => {
    if (items.length === 0) return 0;
    const score = items.reduce((sum, item) => sum + item.score, 0) / items.length;
    return Math.round(score * 10) / 10;
  };

  // 점수 +20점 하기
  const getDisplayScore = (score: number): number => {
    return Math.min(Math.round(score + 20), 100);
  };

  // 원형 프로그레스 바 컴포넌트
  const CircularProgress = ({ value, size = 120 }: { value: number; size?: number }) => {
    // 모바일에서는 크기를 줄임
    const mobileAdjustedSize = typeof window !== 'undefined' && window.innerWidth < 640 ? 90 : size;
    const radius = mobileAdjustedSize / 2;
    const circumference = radius * 2 * Math.PI;
    // 실제 값으로 원 채우기 계산 (시각적 표현은 원래 값 그대로 유지)
    const strokeDashoffset = circumference - (value / 100) * circumference;
    // 화면에 표시될 점수는 20점 추가
    const displayValue = getDisplayScore(value);

    return (
      <div className="relative" style={{ width: mobileAdjustedSize, height: mobileAdjustedSize }}>
        <svg
          width={mobileAdjustedSize}
          height={mobileAdjustedSize}
          viewBox={`0 0 ${mobileAdjustedSize} ${mobileAdjustedSize}`}
        >
          <circle
            cx={radius}
            cy={radius}
            r={radius - 5}
            fill="none"
            stroke="#f2f2f2"
            strokeWidth="5"
          />
          <circle
            cx={radius}
            cy={radius}
            r={radius - 5}
            fill="none"
            stroke="#333"
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${radius} ${radius})`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl sm:text-4xl font-bold">{displayValue}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 py-6 sm:p-6">
      {/* 헤더 */}
      <header className="mb-4 sm:mb-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center mb-2 sm:mb-4">
          <Link
            href="/"
            className="mr-2 sm:mr-4 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
            <CheckSquare className="mr-1 sm:mr-2 text-gray-900 w-5 h-5 sm:w-7 sm:h-7" />
            가치투자 체크리스트
          </h1>
        </div>
        {/* <p className="text-xs sm:text-sm text-gray-600">
          워렌 버핏, 피터 린치 스타일의 가치투자자를 위한 체크리스트입니다.
        </p> */}
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full">
        {/* 검색 영역 - 확장/축소 가능 */}
        {showSearchForm ? (
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-8 shadow-sm mb-6 sm:mb-10">
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
                      분석 중...
                    </>
                  ) : (
                    '기업 분석하기'
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm mb-6 sm:mb-10 flex justify-between items-center">
            <div className="flex items-center">
              <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 text-gray-900 mr-2" />
              <span className="text-sm sm:text-base font-medium">
                {selectedCompany?.companyName} ({stockPrice?.code})
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
        {success &&
          stockPrice &&
          financialData &&
          checklistResults.length > 0 &&
          investmentRating && (
            <>
              {/* 기업 요약 정보 */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-8 shadow-sm mb-6 sm:mb-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-8">
                  <div className="w-full">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center break-words">
                      {selectedCompany?.companyName}{' '}
                      <span className="text-xs sm:text-sm text-gray-600 ml-1 sm:ml-2">
                        ({stockPrice.code})
                      </span>
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                      현재 주가: {formatNumber(stockPrice.price)}원
                      {stockPrice.formattedDate && (
                        <span className="text-gray-600 ml-1 sm:ml-2">
                          ({stockPrice.formattedDate})
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* 금융사인 경우 안내 메시지 추가 */}
                {FINANCIAL_COMPANIES.includes(stockPrice.code) && (
                  <div className="bg-blue-50 p-3 sm:p-4 rounded-lg sm:rounded-xl mb-3 sm:mb-4">
                    <div className="flex items-start">
                      <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mr-1 sm:mr-2 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-blue-800">금융회사 특화 평가</p>
                        <p className="text-xs sm:text-sm text-blue-700 mt-0.5 sm:mt-1">
                          금융회사는 일반 기업과 다른 회계구조를 가지고 있어, 금융업 특성에 맞게
                          평가되었습니다. 일부 지표(매출액, 영업이익률 등)는 평가에서
                          제외되었습니다.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 구분선 */}
                <hr className="mb-4 sm:mb-8 border-gray-200" />

                {/* 투자 등급 영역 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 mb-4 sm:mb-8">
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative mb-2">
                      <CircularProgress value={investmentRating.percentage} />
                      <div className="absolute -top-1 -right-1">
                        <div
                          className={`rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center ${getGradeColor(
                            investmentRating.grade
                          )}`}
                        >
                          <span className="text-sm sm:text-base">{investmentRating.grade}</span>
                        </div>
                      </div>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mt-1 sm:mt-2">
                      투자 등급
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 text-center">
                      종합 점수: {getDisplayScore(investmentRating.percentage)}점
                    </p>
                  </div>

                  <div className="col-span-2 flex flex-col justify-center space-y-3 sm:space-y-4">
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                      <div className="flex justify-between mb-0.5 sm:mb-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-700">
                          핵심 지표 점수
                        </p>
                        <p className="text-base sm:text-lg font-bold">
                          {investmentRating.coreItemsScore}
                          <span className="text-xs text-gray-400">/10</span>
                        </p>
                      </div>
                      {renderScoreBar(investmentRating.coreItemsScore)}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-1 sm:mt-2">
                        <p className="text-xs sm:text-sm">
                          핵심 지표 통과:{' '}
                          <span className="text-base sm:text-lg font-bold">
                            {investmentRating.coreItemsPassCount}
                          </span>
                          <span className="text-xs text-gray-400">
                            /{investmentRating.coreItemsCount}
                          </span>
                        </p>
                        <p>
                          {investmentRating.hasCriticalFailure && (
                            <span className="text-red-500 mt-1 sm:ml-2 flex items-center text-xs sm:text-sm">
                              <AlertTriangle size={14} className="mr-0.5 sm:mr-1" /> 미달 항목 있음
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                      <div className="flex justify-between mb-0.5 sm:mb-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-700">
                          세부 지표 점수
                        </p>
                        <p className="text-base sm:text-lg font-bold">
                          {investmentRating.detailedItemsScore}
                          <span className="text-xs text-gray-400">/10</span>
                        </p>
                      </div>
                      {renderScoreBar(investmentRating.detailedItemsScore)}
                    </div>

                    <div className="bg-amber-50 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                      <p className="text-xs sm:text-sm font-medium text-amber-800 mb-1 sm:mb-2">
                        투자 분석
                      </p>
                      <p className="text-xs sm:text-sm text-gray-700">
                        {investmentRating.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 핵심 지표 요약 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                  <div className="bg-gray-50 p-2 sm:p-4 rounded-lg sm:rounded-xl">
                    <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">ROE</p>
                    <p className="text-base sm:text-xl font-bold truncate">
                      {formatNumber(
                        (financialData.netIncome / financialData.equityAttributableToOwners) * 100
                      )}
                      %
                    </p>
                  </div>
                  <div className="bg-gray-50 p-2 sm:p-4 rounded-lg sm:rounded-xl">
                    <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">PER</p>
                    <p className="text-base sm:text-xl font-bold truncate">
                      {formatNumber(
                        stockPrice.price /
                          (financialData.netIncome / (stockPrice.sharesOutstanding || 1))
                      )}
                      배
                    </p>
                  </div>
                  {financialData.revenueByYear[financialData.years[0]] &&
                    financialData.revenueByYear[financialData.years[1]] && (
                      <div className="bg-gray-50 p-2 sm:p-4 rounded-lg sm:rounded-xl">
                        <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">
                          매출 성장률
                        </p>
                        <p className="text-base sm:text-xl font-bold truncate">
                          {financialData.revenueByYear && financialData.years.length >= 2
                            ? formatNumber(
                                ((financialData.revenueByYear[financialData.years[0]] || 0) /
                                  (financialData.revenueByYear[financialData.years[1]] || 1) -
                                  1) *
                                  100
                              )
                            : '-'}
                          %
                        </p>
                      </div>
                    )}
                  <div className="bg-gray-50 p-2 sm:p-4 rounded-lg sm:rounded-xl">
                    <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">부채비율</p>
                    <p className="text-base sm:text-xl font-bold truncate">
                      {formatNumber(
                        ((financialData.assets - financialData.equity) / financialData.equity) * 100
                      )}
                      %
                    </p>
                  </div>
                </div>
              </div>

              {/* 체크리스트 결과 */}
              <div className="space-y-4 sm:space-y-6">
                {Object.entries(getHierarchicalCategories()).map(
                  ([mainCategory, subCategories]) => (
                    <div key={mainCategory} className="mb-4 sm:mb-8">
                      <h2 className="text-base sm:text-lg font-medium text-gray-700 mb-2 sm:mb-3">
                        {mainCategory}
                      </h2>
                      <div className="space-y-3 sm:space-y-4">
                        {Object.entries(subCategories).map(([subCategory, items]) => (
                          <div
                            key={`${mainCategory}-${subCategory}`}
                            className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden"
                          >
                            <button
                              className="w-full flex items-center justify-between p-3 sm:p-4 text-left focus:outline-none"
                              onClick={() => toggleCategory(`${mainCategory}-${subCategory}`)}
                            >
                              <div className="flex items-center min-w-0">
                                {' '}
                                {/* 오버플로우 방지 */}
                                {getCategoryIcon(mainCategory)}
                                {mainCategory === '핵심 지표' ? (
                                  <h3 className="text-base sm:text-lg font-medium text-gray-700 ml-2 truncate">
                                    핵심 지표
                                  </h3>
                                ) : (
                                  <span className="text-base sm:text-lg font-bold text-gray-900 ml-2 truncate">
                                    {subCategory}
                                  </span>
                                )}
                                <div className="flex items-center ml-2 sm:ml-3">
                                  <p className="bg-gray-100 text-gray-800 font-semibold rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs sm:text-sm">
                                    {getSubCategoryScore(items)}
                                    <span className="text-xs text-gray-400">/10</span>
                                  </p>
                                </div>
                              </div>
                              {expandedCategory === `${mainCategory}-${subCategory}` ? (
                                <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 flex-shrink-0" />
                              ) : (
                                <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 flex-shrink-0" />
                              )}
                            </button>

                            {expandedCategory === `${mainCategory}-${subCategory}` && (
                              <div className="px-3 sm:px-6 pb-3 sm:pb-6 divide-y divide-gray-100">
                                {items.map((item, idx) => (
                                  <div key={idx} className="py-3 sm:py-4">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        {' '}
                                        {/* 오버플로우 방지 */}
                                        <div className="flex items-center flex-wrap mb-1">
                                          <span
                                            className={`text-base sm:text-lg font-bold truncate ${
                                              item.isFailCriteria
                                                ? 'text-red-500 line-through'
                                                : 'text-gray-900'
                                            }`}
                                          >
                                            {item.title}
                                          </span>
                                          <span
                                            className={`ml-1 sm:ml-2 text-xs sm:text-sm ${
                                              item.isFailCriteria
                                                ? 'text-red-500 line-through'
                                                : 'text-gray-900'
                                            }`}
                                          >
                                            {renderImportance(item.importance, item.isFailCriteria)}
                                          </span>
                                          {item.isFailCriteria && (
                                            <span className="ml-1 sm:ml-2 text-xs text-red-500 flex items-center">
                                              <AlertTriangle size={10} className="mr-0.5 sm:mr-1" />{' '}
                                              미달
                                            </span>
                                          )}
                                        </div>
                                        <div className="mt-1 sm:mt-2 flex flex-wrap items-center">
                                          <span
                                            className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-2xl text-xs sm:text-sm font-semibold ${
                                              item.isFailCriteria
                                                ? 'border-2 border-red-500 text-red-700' // 미달인 경우 (심각)
                                                : item.score >= 7
                                                ? 'border-2 border-green-600 text-green-800' // 매우 좋은 경우 (7점 이상)
                                                : 'border border-gray-400 text-gray-800' // 그 외 모든 경우
                                            }`}
                                          >
                                            {typeof item.actualValue === 'number'
                                              ? formatNumber(item.actualValue)
                                              : item.actualValue || '-'}
                                          </span>
                                          <span className="text-xs text-gray-400 ml-2 sm:ml-4 mt-1 sm:mt-0">
                                            | 기준: {item.targetValue}
                                          </span>
                                        </div>
                                        <div className="mt-1 sm:mt-2">
                                          <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-xs text-gray-600">점수</span>
                                            <span className="text-xs text-gray-600">
                                              <span className="text-base sm:text-lg font-bold">
                                                {item.score}
                                              </span>
                                              /{item.maxScore}
                                            </span>
                                          </div>
                                          {renderScoreBar(item.score, item.maxScore)}
                                        </div>
                                      </div>
                                      <div className="ml-2 sm:ml-4 flex-shrink-0">
                                        {item.isPassed === true ? (
                                          <div className="bg-gray-900 rounded-full p-1 sm:p-1.5">
                                            <Check className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                                          </div>
                                        ) : item.isPassed === false ? (
                                          <div className="bg-gray-200 rounded-full p-1 sm:p-1.5">
                                            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                                          </div>
                                        ) : (
                                          <div className="bg-gray-100 rounded-full p-1 sm:p-1.5">
                                            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* 종합 평가 */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-8 shadow-sm mt-6 sm:mt-10">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <Award className="mr-1 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                  종합 투자 평가
                </h2>

                <div className="bg-gray-50 p-3 sm:p-6 rounded-lg sm:rounded-xl">
                  <div
                    className={`inline-block ${getGradeColor(
                      investmentRating.grade
                    )} text-base sm:text-lg font-bold rounded-lg px-2 sm:px-3 py-0.5 sm:py-1 mb-2 sm:mb-3`}
                  >
                    {investmentRating.grade}등급 ({getDisplayScore(investmentRating.percentage)}점)
                  </div>
                  <p className="text-sm sm:text-base text-gray-800">
                    {investmentRating.description}
                  </p>
                </div>

                <div className="mt-4 sm:mt-6">
                  <h3 className="font-bold mb-2 sm:mb-3 text-sm sm:text-base text-gray-800">
                    카테고리별 평가
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    {Object.entries(getHierarchicalCategories()).map(
                      ([mainCategory, subCategories]) => (
                        <React.Fragment key={mainCategory}>
                          {Object.entries(subCategories).map(([subCategory, items]) => {
                            const categoryScore = getSubCategoryScore(items);
                            // 핵심 지표는 그대로 표시하고, 세부 지표는 세부 카테고리만 표시
                            const displayName =
                              mainCategory === '핵심 지표' ? '핵심 지표' : subCategory;

                            return (
                              <div
                                key={`${mainCategory}-${subCategory}`}
                                className="flex items-center text-xs sm:text-sm"
                              >
                                <div className="w-1/3 truncate">{displayName}</div>
                                <div className="w-1/2">{renderScoreBar(categoryScore)}</div>
                                <div className="w-1/6 text-right">{categoryScore}/10</div>
                              </div>
                            );
                          })}
                        </React.Fragment>
                      )
                    )}
                  </div>
                </div>

                <div className="mt-4 sm:mt-6">
                  <Link href="/fairprice">
                    <button className="inline-flex items-center bg-black text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors">
                      적정가 계산하기
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
