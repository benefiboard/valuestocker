//src/app/checklist/page.tsx

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
} from 'lucide-react';
import {
  calculateChecklist,
  calculateInvestmentRating,
  initialChecklist,
  ScoredChecklistItem,
  InvestmentRating,
} from './ChecklistCalculate';
import Link from 'next/link';

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
      const checklist = calculateChecklist(checklistData, baseYearData, priceDataMap);
      setChecklistResults(checklist);

      // 5. 투자 등급 계산
      const rating = calculateInvestmentRating(checklist);
      setInvestmentRating(rating);

      setSuccess(true);
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
  const renderImportance = (level: 1 | 2 | 3 | 4 | 5) => {
    return Array(level)
      .fill(0)
      .map((_, i) => (
        <span key={i} className="text-gray-800">
          ★
        </span>
      ));
  };

  // 점수 바 렌더링 함수
  const renderScoreBar = (score: number, maxScore: number = 10) => {
    const percentage = (score / maxScore) * 100;
    let barColor = 'bg-gray-300';

    if (percentage >= 80) barColor = 'bg-green-500';
    else if (percentage >= 60) barColor = 'bg-green-400';
    else if (percentage >= 40) barColor = 'bg-yellow-400';
    else if (percentage >= 20) barColor = 'bg-orange-400';
    else barColor = 'bg-red-400';

    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${barColor} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
    );
  };

  // 등급에 따른 배경색 결정
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
        return 'bg-blue-500 text-white';
      case 'A':
        return 'bg-green-500 text-white';
      case 'B+':
        return 'bg-green-400 text-white';
      case 'B':
        return 'bg-yellow-400 text-gray-900';
      case 'C+':
        return 'bg-orange-400 text-white';
      case 'C':
        return 'bg-orange-500 text-white';
      case 'D':
        return 'bg-red-400 text-white';
      case 'F':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  // 숫자 포맷팅 함수
  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('ko-KR').format(Math.round(num * 100) / 100);
  };

  // 카테고리별 항목 그룹화
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

  // 카테고리 아이콘 매핑
  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      '핵심 지표': <LineChart className="h-5 w-5 text-gray-900" />,
      수익성: <CircleDollarSign className="h-5 w-5 text-gray-900" />,
      재무안정성: <ShieldAlert className="h-5 w-5 text-gray-900" />,
      성장성: <TrendingUp className="h-5 w-5 text-gray-900" />,
      가치평가: <Percent className="h-5 w-5 text-gray-900" />,
    };

    return iconMap[category] || <Info className="h-5 w-5 text-gray-900" />;
  };

  // 카테고리 평균 점수 계산
  const getCategoryScore = (items: ScoredChecklistItem[]) => {
    if (items.length === 0) return 0;
    return Math.round((items.reduce((sum, item) => sum + item.score, 0) / items.length) * 10) / 10;
  };

  // 원형 프로그레스 바 컴포넌트
  const CircularProgress = ({ value, size = 120 }: { value: number; size?: number }) => {
    const radius = size / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
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
          <span className="text-4xl font-bold">{value}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6">
      {/* 헤더 */}
      <header className="mb-12 max-w-5xl mx-auto w-full">
        <div className="flex items-center mb-4">
          <Link href="/" className="mr-4 text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <CheckSquare className="mr-2 text-gray-900" size={28} />
            가치투자 체크리스트
          </h1>
        </div>
        <p className="text-gray-600 text-sm">
          워렌 버핏, 피터 린치 스타일의 가치투자자를 위한 체크리스트입니다.
        </p>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full">
        {/* 검색 영역 */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-10">
          <form onSubmit={handleSearch}>
            <div className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">회사명</label>
                <CompanySearchInput
                  onCompanySelect={handleCompanySelect}
                  initialValue={companyName}
                  placeholder="회사명 또는 종목코드 입력"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-black hover:bg-gray-800 text-white py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center mt-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  '기업 분석하기'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="bg-white p-6 rounded-2xl shadow-sm mb-10 border-l-4 border-red-500">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">오류</p>
                <p className="text-gray-700 text-sm mt-1">{error}</p>
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
              <div className="bg-white rounded-2xl p-8 shadow-sm mb-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                      {stockPrice.name}{' '}
                      <span className="text-sm text-gray-500 ml-2">({stockPrice.code})</span>
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      현재 주가: {formatNumber(stockPrice.price)}원
                      {stockPrice.formattedDate && (
                        <span className="text-gray-500 ml-2">({stockPrice.formattedDate})</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* 투자 등급 영역 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative mb-2">
                      <CircularProgress value={investmentRating.percentage} />
                      <div className="absolute -top-1 -right-1">
                        <div
                          className={`rounded-full w-10 h-10 flex items-center justify-center ${getGradeColor(
                            investmentRating.grade
                          )}`}
                        >
                          {investmentRating.grade}
                        </div>
                      </div>
                    </div>
                    <h3 className="text-gray-900 font-bold text-lg mt-2">투자 등급</h3>
                    <p className="text-gray-600 text-sm text-center">
                      종합 점수: {investmentRating.percentage}점
                    </p>
                  </div>

                  <div className="col-span-2 flex flex-col justify-center space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="flex justify-between mb-1">
                        <p className="text-sm font-medium text-gray-700">핵심 지표 점수</p>
                        <p className="text-sm font-medium text-gray-700">
                          {investmentRating.coreItemsScore}/10
                        </p>
                      </div>
                      {renderScoreBar(investmentRating.coreItemsScore)}
                      <p className="text-xs text-gray-500 mt-1">
                        핵심 지표 통과: {investmentRating.coreItemsPassCount}/
                        {investmentRating.coreItemsCount} 항목
                        {investmentRating.hasCriticalFailure && (
                          <span className="text-red-500 ml-2 flex items-center text-xs">
                            <AlertTriangle size={12} className="mr-1" /> 과락 항목 있음
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="flex justify-between mb-1">
                        <p className="text-sm font-medium text-gray-700">세부 지표 점수</p>
                        <p className="text-sm font-medium text-gray-700">
                          {investmentRating.detailedItemsScore}/10
                        </p>
                      </div>
                      {renderScoreBar(investmentRating.detailedItemsScore)}
                    </div>

                    <div className="bg-amber-50 p-4 rounded-xl">
                      <p className="text-sm font-medium text-amber-800 mb-2">투자 분석</p>
                      <p className="text-sm text-gray-700">{investmentRating.description}</p>
                    </div>
                  </div>
                </div>

                {/* 핵심 지표 요약 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">ROE</p>
                    <p className="text-xl font-bold">
                      {formatNumber(
                        (financialData.netIncome / financialData.equityAttributableToOwners) * 100
                      )}
                      %
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">PER</p>
                    <p className="text-xl font-bold">
                      {formatNumber(
                        stockPrice.price /
                          (financialData.netIncome / (stockPrice.sharesOutstanding || 1))
                      )}
                      배
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">매출 성장률</p>
                    <p className="text-xl font-bold">
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
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">부채비율</p>
                    <p className="text-xl font-bold">
                      {formatNumber(
                        ((financialData.assets - financialData.equity) / financialData.equity) * 100
                      )}
                      %
                    </p>
                  </div>
                </div>
              </div>

              {/* 체크리스트 결과 */}
              <div className="space-y-6">
                {Object.entries(getCategorizedItems()).map(([category, items]) => (
                  <div key={category} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                      onClick={() => toggleCategory(category)}
                    >
                      <div className="flex items-center">
                        {getCategoryIcon(category)}
                        <h3 className="text-lg font-bold text-gray-900 ml-2">{category}</h3>
                        <div className="flex items-center ml-3">
                          <span className="bg-gray-100 text-gray-800 text-xs font-medium rounded-full px-2.5 py-1 mr-2">
                            {getCategoryScore(items)}/10
                          </span>
                          <span className="bg-gray-100 text-gray-800 text-xs font-medium rounded-full px-2.5 py-1">
                            {items.filter((item) => item.isPassed === true).length}/{items.length}
                          </span>
                        </div>
                      </div>
                      {expandedCategory === category ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </button>

                    {expandedCategory === category && (
                      <div className="px-6 pb-6 divide-y divide-gray-100">
                        {items.map((item, idx) => (
                          <div key={idx} className="py-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center mb-1">
                                  <span className="font-medium text-gray-900">{item.title}</span>
                                  <span className="ml-2 text-sm">
                                    {renderImportance(item.importance)}
                                  </span>
                                  {item.isFailCriteria && (
                                    <span className="ml-2 text-xs text-red-500 flex items-center">
                                      <AlertTriangle size={12} className="mr-1" /> 과락 지표
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">{item.description}</p>
                                <div className="mt-2 text-sm">
                                  <span className="text-gray-600">기준: </span>
                                  <span className="text-gray-900 font-medium">
                                    {item.targetValue}
                                  </span>
                                  {item.actualValue !== null && (
                                    <>
                                      <span className="text-gray-600 ml-2">실제: </span>
                                      <span className="text-gray-900 font-medium">
                                        {typeof item.actualValue === 'number'
                                          ? formatNumber(item.actualValue)
                                          : item.actualValue}
                                      </span>
                                    </>
                                  )}
                                </div>
                                <div className="mt-2">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-xs text-gray-500">점수</span>
                                    <span className="text-xs text-gray-500">
                                      {item.score}/{item.maxScore}
                                    </span>
                                  </div>
                                  {renderScoreBar(item.score, item.maxScore)}
                                </div>
                              </div>
                              <div className="ml-4">
                                {item.isPassed === true ? (
                                  <div className="bg-gray-900 rounded-full p-1.5">
                                    <Check className="h-4 w-4 text-white" />
                                  </div>
                                ) : item.isPassed === false ? (
                                  <div className="bg-gray-200 rounded-full p-1.5">
                                    <XCircle className="h-4 w-4 text-gray-500" />
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

              {/* 종합 평가 */}
              <div className="bg-white rounded-2xl p-8 shadow-sm mt-10">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Award className="mr-2" />
                  종합 투자 평가
                </h2>

                <div className="bg-gray-50 p-6 rounded-xl">
                  <div
                    className={`inline-block ${getGradeColor(
                      investmentRating.grade
                    )} text-lg font-bold rounded-lg px-3 py-1 mb-3`}
                  >
                    {investmentRating.grade}등급 ({investmentRating.percentage}점)
                  </div>
                  <p className="text-gray-800">{investmentRating.description}</p>
                </div>

                <div className="mt-6">
                  <h3 className="font-bold mb-3 text-gray-800">카테고리별 평가</h3>
                  <div className="space-y-3">
                    {Object.entries(getCategorizedItems()).map(([category, items]) => {
                      const categoryScore = getCategoryScore(items);
                      return (
                        <div key={category} className="flex items-center">
                          <div className="w-1/3">{category}</div>
                          <div className="w-1/2">{renderScoreBar(categoryScore)}</div>
                          <div className="w-1/6 text-right">{categoryScore}/10</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6">
                  <Link href="/fairprice">
                    <button className="inline-flex items-center bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
                      적정가 계산하기
                      <svg
                        className="ml-2 w-4 h-4"
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
