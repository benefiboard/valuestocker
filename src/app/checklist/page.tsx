//src/app/checklist/page.tsx

'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

import { CompanyInfo, stockCodeMap } from '@/lib/stockCodeData';
import { ScoredChecklistItem, InvestmentRating, StockPrice } from './types';
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
  Target,
} from 'lucide-react';
import {
  calculateChecklist,
  calculateInvestmentRating,
  getStockPriceFromSupabase,
} from './ChecklistCalculate';
import Link from 'next/link';
import React from 'react';
import CompanySearchInput from '../../components/CompanySearchInput';
import { FINANCIAL_COMPANIES } from './constants/industryThresholds';

interface HierarchicalCategory {
  [mainCategory: string]: {
    [subCategory: string]: ScoredChecklistItem[];
  };
}

export default function ChecklistPage() {
  // URL 쿼리 파라미터 가져오기
  const searchParams = useSearchParams();

  // 상태 관리
  const [companyName, setCompanyName] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyInfo | null>(null);
  const [stockPrice, setStockPrice] = useState<StockPrice | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showSearchForm, setShowSearchForm] = useState<boolean>(true);
  const [autoSearchTriggered, setAutoSearchTriggered] = useState<boolean>(false);

  // 체크리스트 결과 상태
  const [checklistResults, setChecklistResults] = useState<ScoredChecklistItem[]>([]);
  const [investmentRating, setInvestmentRating] = useState<InvestmentRating | null>(null);
  // 등급에 따른 설명 상태 추가
  const [ratingDescription, setRatingDescription] = useState<string>('');

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
        performSearch(company);
      }, 100);
    }
  }, [searchParams, autoSearchTriggered]);

  // 등급에 따른 설명 생성 함수
  const getGradeDescription = (
    grade: string,
    hasCriticalFailure: boolean,
    isFinancialCompany: boolean
  ): string => {
    if (hasCriticalFailure) {
      if (grade === 'F') return '핵심 지표에 심각한 문제가 있어 투자에 적합하지 않습니다.';
      return '핵심 지표에 심각한 문제가 있어 투자에 주의가 필요합니다.';
    }

    // 등급별 설명 생성
    const descriptions: Record<string, string> = {
      'A+': '우수한 투자 대상입니다. 모든 핵심 지표가 매우 양호합니다.',
      A: '양호한 투자 대상입니다. 핵심 지표가 대부분 양호합니다.',
      'B+': '괜찮은 투자 대상입니다. 일부 보완이 필요한 지표가 있습니다.',
      B: '평균적인 투자 대상입니다. 몇몇 지표에서 개선이 필요합니다.',
      'C+': '투자 시 주의가 필요합니다. 여러 지표에서 문제점이 발견되었습니다.',
      C: '투자 위험이 큽니다. 많은 지표에서 문제점이 발견되었습니다.',
      D: '투자에 적합하지 않습니다. 대부분의 지표가 기준에 미달합니다.',
    };

    let description = descriptions[grade] || '평가할 데이터가 부족합니다.';

    // 금융회사인 경우 설명 조정
    if (isFinancialCompany) {
      description += ' (금융회사에 최적화된 평가 기준 적용)';
    }

    return description;
  };

  // 회사 선택 핸들러
  const handleCompanySelect = (company: CompanyInfo) => {
    setCompanyName(company.companyName);
    setSelectedCompany(company);
  };

  // 검색 수행 함수 (URL 파라미터에서도 사용)
  const performSearch = async (company: CompanyInfo) => {
    // 모든 상태 초기화
    setStockPrice(null);
    setChecklistResults([]);
    setInvestmentRating(null);
    setRatingDescription('');
    setSuccess(false);
    setError('');
    setLoading(true);

    try {
      console.log('===== 검색 시작 =====');
      console.log(`회사명: ${company.companyName} (${company.stockCode})`);
      console.log(`DART 코드: ${company.dartCode}`);
      console.log(`산업군: ${company.industry}`);

      // 체크리스트 계산 (Supabase 데이터 활용)
      console.log('체크리스트 계산 시작...');
      const checklist = await calculateChecklist(company.stockCode, company.industry);

      if (checklist.length === 0) {
        throw new Error(`${company.companyName}의 데이터를 찾을 수 없습니다`);
      }

      console.log('체크리스트 계산 결과:', checklist);
      setChecklistResults(checklist);

      // 주가 정보 직접 가져오기
      const stockPriceData = await getStockPriceFromSupabase(company.stockCode);
      if (!stockPriceData) {
        throw new Error(`${company.companyName}의 주가 데이터를 찾을 수 없습니다`);
      }

      // 주가 정보 설정
      setStockPrice(stockPriceData);

      // 투자 등급 계산
      console.log('투자 등급 계산 시작...');
      const rating = calculateInvestmentRating(checklist, company.stockCode, company.industry);

      console.log('투자 등급 계산 결과:', rating);

      // 등급 설명 생성 및 설정
      const description = getGradeDescription(
        rating.grade,
        rating.hasCriticalFailure,
        rating.isFinancialCompany
      );
      setRatingDescription(description);
      setInvestmentRating(rating);

      console.log('분석 완료!');
      setSuccess(true);
      setShowSearchForm(false); // 검색 결과가 표시되면 검색 폼 숨기기
    } catch (error) {
      console.error('오류 발생:', error);
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

    // 검색 수행
    await performSearch(selectedCompany);
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

    if (percentage >= 70) barColor = 'bg-emerald-600';
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
        return 'bg-emerald-600 text-white'; // 짙은 녹색
      case 'A':
        return 'bg-emerald-500 text-white'; // 녹색
      case 'B+':
        return 'bg-emerald-400 text-white'; // 밝은 녹색

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
      '핵심 지표': <LineChart className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />,
      '세부 지표': <Info className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />,
      수익성: <CircleDollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />,
      재무안정성: <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />,
      성장성: <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />,
      가치평가: <Percent className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />,
    };

    return iconMap[category] || <Info className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />;
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
            stroke="#000000"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${radius} ${radius})`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl sm:text-3xl font-bold">{displayValue}</span>
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
            <CheckSquare className="mr-3 text-emerald-600 w-6 h-6 sm:w-7 sm:h-7" />
            가치투자 체크리스트
          </h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full">
        {/* 로딩 상태 */}
        {loading && (
          <div className="bg-white rounded-2xl p-10 shadow-md flex justify-center items-center mb-6">
            <Loader2 size={30} className="animate-spin text-emerald-600 mr-3" />
            <p className="text-lg text-gray-700">데이터를 분석하는 중...</p>
          </div>
        )}

        {/* 검색 영역 - 확장/축소 가능 */}
        {showSearchForm && !loading ? (
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
          !loading && (
            <div className="bg-white rounded-2xl p-6 sm:px-8 shadow-md mb-6 flex justify-between items-center">
              <div className="flex items-center">
                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 mr-3" />
                <p className="text-lg sm:text-xl font-semibold text-gray-800">
                  {selectedCompany?.companyName}{' '}
                  <span className="font-normal text-sm text-gray-500">({stockPrice?.code})</span>
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
          )
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
        {success && stockPrice && checklistResults.length > 0 && investmentRating && (
          <>
            {/* 기업 요약 정보 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 sm:mb-6">
                <div className="w-full">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center break-words">
                    {selectedCompany?.companyName}{' '}
                    <span className="text-xs sm:text-sm text-gray-500 ml-2">
                      ({stockPrice.code})
                    </span>
                  </h2>

                  <p className="text-sm sm:text-base text-gray-600 mt-1 ">
                    현재 주가:{' '}
                    <span className="text-gray-800 text-lg sm:text-xl font-semibold sm:text-lg">
                      {stockPrice.price}
                    </span>
                    원
                    {stockPrice.formattedDate && (
                      <span className="text-gray-500 text-xs sm:text-sm ml-1">
                        ({stockPrice.formattedDate})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* 금융사인 경우 안내 메시지 추가 */}
              {investmentRating.isFinancialCompany && (
                <div className="bg-blue-50 p-4 sm:p-5 rounded-xl mb-5">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm sm:text-base text-blue-800">
                        금융회사 특화 평가
                      </p>
                      <p className="text-sm text-blue-700 mt-2">
                        금융회사는 일반 기업과 다른 회계구조를 가지고 있어, 금융업 특성에 맞게
                        평가되었습니다. 일부 지표(매출액, 영업이익률 등)는 평가에서 제외되었습니다.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 구분선 */}
              <hr className="mb-6 border-gray-200" />

              {/* 투자 등급 영역 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative mb-3">
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
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 mt-2">투자 등급</h3>
                  <p className="text-xs sm:text-sm text-gray-600 text-center">
                    종합 점수: {getDisplayScore(investmentRating.percentage)}점
                  </p>
                </div>

                <div className="col-span-2 flex flex-col justify-center space-y-4">
                  <div className="bg-gray-50 p-4 sm:p-5 rounded-xl">
                    <div className="flex justify-between mb-2">
                      <p className="text-sm sm:text-base font-medium text-gray-700">
                        핵심 지표 점수
                      </p>
                      <p className="text-base sm:text-lg font-bold">
                        {investmentRating.coreItemsScore}
                        <span className="text-xs text-gray-400">/10</span>
                      </p>
                    </div>
                    {renderScoreBar(investmentRating.coreItemsScore)}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3">
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
                            <AlertTriangle size={14} className="mr-1 sm:mr-2" /> 미달 항목 있음
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 sm:p-5 rounded-xl">
                    <div className="flex justify-between mb-2">
                      <p className="text-sm sm:text-base font-medium text-gray-700">
                        세부 지표 점수
                      </p>
                      <p className="text-base sm:text-lg font-bold">
                        {investmentRating.detailedItemsScore}
                        <span className="text-xs text-gray-400">/10</span>
                      </p>
                    </div>
                    {renderScoreBar(investmentRating.detailedItemsScore)}
                  </div>

                  <div className="bg-amber-50 p-4 sm:p-5 rounded-xl">
                    <p className="text-sm sm:text-base font-medium text-amber-800 mb-2">
                      투자 분석
                    </p>
                    <p className="text-sm text-gray-700">{ratingDescription}</p>
                  </div>
                </div>
              </div>

              {/* 핵심 지표 요약 - 이 부분은 Supabase로 전환 후 수정이 필요할 수 있음 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* ROE 자리 - 실제 데이터 바인딩 필요 */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">ROE</p>
                  <p className="text-base sm:text-xl font-bold truncate">
                    {formatNumber(
                      (checklistResults.find((item) => item.title === 'ROE (자기자본이익률)')
                        ?.actualValue as number) || 0
                    )}
                    %<span className="text-xs text-gray-400">(최근 3년)</span>
                  </p>
                </div>
                {/* PER 자리 */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">PER</p>
                  <p className="text-base sm:text-xl font-bold truncate">
                    {formatNumber(
                      (checklistResults.find((item) => item.title === 'PER')
                        ?.actualValue as number) || 0
                    )}
                    배
                  </p>
                </div>
                {/* 금융회사가 아닐 때만 매출 성장률 표시 */}
                {!investmentRating.isFinancialCompany && (
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">매출 성장률</p>
                    <p className="text-base sm:text-xl font-bold truncate">
                      {formatNumber(
                        (checklistResults.find((item) => item.title === '매출액 성장률')
                          ?.actualValue as number) || 0
                      )}
                      %<span className="text-xs text-gray-400">(최근 3년)</span>
                    </p>
                  </div>
                )}

                {/* 금융회사가 아닐 때만 부채비율 표시 */}
                {!investmentRating.isFinancialCompany && (
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">부채비율</p>
                    <p className="text-base sm:text-xl font-bold truncate">
                      {formatNumber(
                        (checklistResults.find((item) => item.title === '부채비율')
                          ?.actualValue as number) || 0
                      )}
                      %
                    </p>
                  </div>
                )}

                {/* 금융회사일 때 대체 지표 표시 */}
                {investmentRating.isFinancialCompany && (
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">순이익 증가율</p>
                    <p className="text-base sm:text-xl font-bold truncate">
                      {formatNumber(
                        (checklistResults.find((item) => item.title === '순이익 증가율')
                          ?.actualValue as number) || 0
                      )}
                      %<span className="text-xs text-gray-400">(최근 3년)</span>
                    </p>
                  </div>
                )}

                {/* 금융회사일 때 대체 지표 표시 */}
                {investmentRating.isFinancialCompany && (
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">BPS 성장률</p>
                    <p className="text-base sm:text-xl font-bold truncate">
                      {formatNumber(
                        (checklistResults.find((item) => item.title === 'BPS 성장률')
                          ?.actualValue as number) || 0
                      )}
                      %
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 체크리스트 결과 */}
            <div className="space-y-6">
              {Object.entries(getHierarchicalCategories()).map(([mainCategory, subCategories]) => (
                <div key={mainCategory} className="mb-6">
                  <h2 className="text-base sm:text-lg font-medium text-gray-700 mb-3">
                    {mainCategory}
                  </h2>
                  <div className="space-y-4">
                    {Object.entries(subCategories).map(([subCategory, items]) => (
                      <div
                        key={`${mainCategory}-${subCategory}`}
                        className="bg-white rounded-2xl shadow-md overflow-hidden"
                      >
                        <button
                          className="w-full flex items-center justify-between p-4 sm:p-5 text-left focus:outline-none"
                          onClick={() => toggleCategory(`${mainCategory}-${subCategory}`)}
                        >
                          <div className="flex items-center min-w-0">
                            {' '}
                            {/* 오버플로우 방지 */}
                            {getCategoryIcon(mainCategory)}
                            {mainCategory === '핵심 지표' ? (
                              <h3 className="text-base sm:text-lg font-medium text-gray-700 ml-3 truncate">
                                핵심 지표
                              </h3>
                            ) : (
                              <span className="text-base sm:text-lg font-bold text-gray-800 ml-3 truncate">
                                {subCategory}
                              </span>
                            )}
                            <div className="flex items-center ml-3">
                              <p className="bg-gray-100 text-gray-800 font-semibold rounded-full px-2.5 py-1 text-sm">
                                {getSubCategoryScore(items)}
                                <span className="text-xs text-gray-400">/10</span>
                              </p>
                            </div>
                          </div>
                          {expandedCategory === `${mainCategory}-${subCategory}` ? (
                            <ChevronUp className="h-5 w-5 text-gray-600 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-600 flex-shrink-0" />
                          )}
                        </button>

                        {expandedCategory === `${mainCategory}-${subCategory}` && (
                          <div className="px-5 sm:px-6 pb-5 sm:pb-6 divide-y divide-gray-100">
                            {items.map((item, idx) => (
                              <div key={idx} className="py-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    {' '}
                                    {/* 오버플로우 방지 */}
                                    <div className="flex items-center flex-wrap mb-2">
                                      <span
                                        className={`text-base sm:text-lg font-bold truncate ${
                                          item.isFailCriteria
                                            ? 'text-red-500 line-through'
                                            : 'text-gray-800'
                                        }`}
                                      >
                                        {item.title}
                                      </span>
                                      <span
                                        className={`ml-2 text-sm ${
                                          item.isFailCriteria
                                            ? 'text-red-500 line-through'
                                            : 'text-gray-800'
                                        }`}
                                      >
                                        {renderImportance(item.importance, item.isFailCriteria)}
                                      </span>
                                      {item.isFailCriteria && (
                                        <span className="ml-2 text-xs text-red-500 flex items-center">
                                          <AlertTriangle size={12} className="mr-1" /> 미달
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center">
                                      <span
                                        className={`px-2.5 py-1 rounded-2xl text-sm font-semibold
    ${
      item.isFailCriteria
        ? 'border-2 border-red-500 text-red-700'
        : item.score >= 7
        ? 'border-2 border-emerald-600 text-emerald-800'
        : 'border border-gray-400 text-gray-800'
    }`}
                                      >
                                        {typeof item.actualValue === 'number' &&
                                        item.actualValue < 0
                                          ? `${item.actualValue.toFixed(2)} `
                                          : typeof item.actualValue === 'number'
                                          ? `${item.actualValue.toFixed(2)}`
                                          : item.actualValue || '-'}
                                      </span>
                                      <span className="text-xs text-gray-500 ml-4 mt-0">
                                        | 기준: {item.targetValue}
                                      </span>
                                    </div>
                                    <div className="mt-3">
                                      <div className="flex items-center justify-between mb-1">
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
                                  <div className="ml-4 flex-shrink-0">
                                    {item.isPassed === true ? (
                                      <div className="bg-emerald-600 rounded-full p-1.5">
                                        <Check className="h-4 w-4 text-white" />
                                      </div>
                                    ) : item.isPassed === false ? (
                                      <div className="bg-gray-200 rounded-full p-1.5">
                                        <XCircle className="h-4 w-4 text-gray-600" />
                                      </div>
                                    ) : (
                                      <div className="bg-gray-100 rounded-full p-1.5">
                                        <AlertCircle className="h-4 w-4 text-gray-400" />
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
              ))}
            </div>

            {/* 종합 평가 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md mt-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Award className="mr-3 w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                종합 투자 평가
              </h2>

              <div className="bg-gray-50 p-5 sm:p-6 rounded-xl mb-6">
                <div
                  className={`inline-block ${getGradeColor(
                    investmentRating.grade
                  )} text-base sm:text-lg font-bold rounded-xl px-3 py-1 mb-3`}
                >
                  {investmentRating.grade}등급 ({getDisplayScore(investmentRating.percentage)}점)
                </div>
                <p className="text-sm sm:text-base text-gray-800">{ratingDescription}</p>
              </div>

              <div className="mt-5">
                <h3 className="font-bold mb-3 text-sm sm:text-base text-gray-800">
                  카테고리별 평가
                </h3>
                <div className="space-y-3">
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
                              className="flex items-center text-sm"
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

              <div className="mt-6">
                <Link href={`/fairprice?stockCode=${stockPrice.code}`}>
                  <button className="inline-flex items-center bg-emerald-600 text-white px-5 py-3 rounded-xl text-sm sm:text-base font-medium hover:bg-emerald-700 transition-colors">
                    적정가 계산하기
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
