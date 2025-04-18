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
import { fetchStockPrice, fetchFinancialData } from '@/lib/finance/apiService';
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
} from 'lucide-react';
import { calculateChecklist, initialChecklist } from './ChecklistCalculate';
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
  const [checklistResults, setChecklistResults] = useState<ChecklistItem[]>([]);

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
    setSuccess(false);
    setError('');

    setLoading(true);

    try {
      // 1. 주가 데이터 가져오기 - 공통 모듈 사용
      const priceData = await fetchStockPrice(selectedCompany.stockCode, true);
      setStockPrice(priceData);

      // 2. 재무 데이터 가져오기 - 공통 모듈 사용
      const rawData = await fetchFinancialData(selectedCompany.dartCode);
      setRawFinancialData(rawData);

      // 3. 재무 데이터 추출 - 공통 모듈 사용
      const extractedData = extractFinancialData(rawData);
      const checklistData = convertToChecklistData(extractedData);
      setFinancialData(checklistData);

      // 4. 체크리스트 계산
      const checklist = calculateChecklist(checklistData, priceData);
      setChecklistResults(checklist);

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

  // 결과 합격률 계산
  const calculatePassRate = () => {
    if (checklistResults.length === 0) return 0;

    const passedItems = checklistResults.filter((item) => item.isPassed === true);
    return Math.round((passedItems.length / checklistResults.length) * 100);
  };

  // 숫자 포맷팅 함수
  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('ko-KR').format(Math.round(num * 100) / 100);
  };

  // 카테고리별 항목 그룹화
  const getCategorizedItems = () => {
    const categories: { [key: string]: ChecklistItem[] } = {};

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
      '기본 지표': <LineChart className="h-5 w-5 text-gray-900" />,
      수익성: <CircleDollarSign className="h-5 w-5 text-gray-900" />,
      재무안정성: <ShieldAlert className="h-5 w-5 text-gray-900" />,
      성장성: <TrendingUp className="h-5 w-5 text-gray-900" />,
      가치평가: <Percent className="h-5 w-5 text-gray-900" />,
    };

    return iconMap[category] || <Info className="h-5 w-5 text-gray-900" />;
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
          <span className="text-3xl font-bold">{value}%</span>
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
        {success && stockPrice && financialData && checklistResults.length > 0 && (
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

              {/* 체크리스트 통계 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                <div className="flex flex-col items-center justify-center">
                  <CircularProgress value={calculatePassRate()} />
                  <h3 className="text-gray-900 font-bold text-lg mt-4">체크리스트 통과율</h3>
                  <p className="text-gray-600 text-sm">
                    {checklistResults.filter((item) => item.isPassed === true).length}/
                    {checklistResults.length} 항목 통과
                  </p>
                </div>

                <div className="col-span-2 flex flex-col justify-center">
                  <div className="grid grid-cols-2 gap-4">
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
                          ((financialData.assets - financialData.equity) / financialData.equity) *
                            100
                        )}
                        %
                      </p>
                    </div>
                  </div>
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
                      <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium rounded-full px-2.5 py-1">
                        {items.filter((item) => item.isPassed === true).length}/{items.length}
                      </span>
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
              <h2 className="text-xl font-bold text-gray-900 mb-4">종합 평가</h2>

              <div className="bg-gray-50 p-6 rounded-xl">
                <p className="text-gray-800">
                  {calculatePassRate() >= 80
                    ? '우수한 투자 대상입니다. 체크리스트 항목을 대부분 통과했습니다.'
                    : calculatePassRate() >= 60
                    ? '양호한 투자 대상입니다. 주요 체크리스트 항목을 통과했지만 일부 주의가 필요합니다.'
                    : calculatePassRate() >= 40
                    ? '투자 시 주의가 필요합니다. 많은 체크리스트 항목을 통과하지 못했습니다.'
                    : '투자에 적합하지 않은 것으로 판단됩니다. 대부분의 체크리스트 항목을 통과하지 못했습니다.'}
                </p>
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
