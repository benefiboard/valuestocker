//src/app/graham/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchGrahamStocks, GrahamStock } from '@/utils/stockDataService';
import { formatNumber, formatAsset } from '../../utils/stockUtils';
import { AccordionSection, Pagination } from '../../components/StockPageComponents';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart4,
  Filter,
  Loader2,
  AlertCircle,
  DollarSign,
  PercentIcon,
  LineChart,
  Info,
  Briefcase,
} from 'lucide-react';
import { StockLinkButtons } from '../../components/StockLinkButtons';

// 정렬 타입 정의
type SortField =
  | 'current_per'
  | 'debtratio'
  | 'company_name'
  | 'industry'
  | 'subindustry'
  | 'current_price'
  | 'dividend_yield';
type SortDirection = 'asc' | 'desc';

export default function GrahamPage() {
  // 상태 관리
  const [stocks, setStocks] = useState<GrahamStock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<GrahamStock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('current_per');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [industryFilter, setIndustryFilter] = useState<string>('');
  const [subIndustryFilter, setSubIndustryFilter] = useState<string>('');
  const [dividendMinFilter, setDividendMinFilter] = useState<number | ''>('');
  const [dividendMaxFilter, setDividendMaxFilter] = useState<number | ''>('');
  const [industries, setIndustries] = useState<string[]>([]);
  const [subIndustries, setSubIndustries] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card'); // 뷰 모드 상태 추가
  const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(false); // 필터 영역 확장 상태
  const [isConditionExpanded, setIsConditionExpanded] = useState<boolean>(false); // 조건 영역 확장 상태
  const itemsPerPage = 20;

  // Supabase에서 조건에 맞는 주식 데이터 가져오기
  useEffect(() => {
    const loadStockData = async () => {
      setLoading(true);

      // stockDataService에서 함수 호출로 대체
      const result = await fetchGrahamStocks();

      if (result.error) {
        setError(result.error);
        setStocks([]);
        setFilteredStocks([]);
      } else {
        setStocks(result.stocks);
        setFilteredStocks(result.stocks);
        setIndustries(result.industries);
        setSubIndustries(result.subIndustries);
        setCurrentPage(1);
      }

      setLoading(false);
    };

    loadStockData();
  }, []);

  // 필터 적용
  useEffect(() => {
    let filtered = [...stocks];

    // 산업군 필터
    if (industryFilter) {
      filtered = filtered.filter((stock) => stock.industry === industryFilter);

      // 산업군 변경 시 하위 산업군 목록 업데이트
      const newSubIndustries = Array.from(
        new Set(
          stocks
            .filter((stock) => stock.industry === industryFilter)
            .map((stock) => stock.subindustry)
        )
      ).sort();
      setSubIndustries(newSubIndustries);

      // 기존 하위 산업군이 새 목록에 없으면 초기화
      if (subIndustryFilter && !newSubIndustries.includes(subIndustryFilter)) {
        setSubIndustryFilter('');
      }
    } else {
      // 산업군 필터가 없을 때 모든 하위 산업군 표시
      const allSubIndustries = Array.from(new Set(stocks.map((stock) => stock.subindustry))).sort();
      setSubIndustries(allSubIndustries);
    }

    // 하위 산업군 필터
    if (subIndustryFilter) {
      filtered = filtered.filter((stock) => stock.subindustry === subIndustryFilter);
    }

    // 배당률 범위 필터 추가
    if (typeof dividendMinFilter === 'number' && dividendMinFilter > 0) {
      filtered = filtered.filter((stock) => stock.dividend_yield >= dividendMinFilter);
    }

    if (typeof dividendMaxFilter === 'number' && dividendMaxFilter > 0) {
      filtered = filtered.filter((stock) => stock.dividend_yield <= dividendMaxFilter);
    }

    // 정렬 적용
    filtered.sort((a, b) => {
      const valueA = a[sortField];
      const valueB = b[sortField];

      // 문자열 정렬
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      // 숫자 정렬
      return sortDirection === 'asc'
        ? (valueA as number) - (valueB as number)
        : (valueB as number) - (valueA as number);
    });

    setFilteredStocks(filtered);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  }, [
    stocks,
    industryFilter,
    subIndustryFilter,
    dividendMinFilter,
    dividendMaxFilter,
    sortField,
    sortDirection,
  ]);

  // 뷰 모드 감지 (화면 크기에 따라 자동 변경)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // lg 브레이크포인트
        setViewMode('table');
      } else {
        setViewMode('card');
      }
    };

    // 초기 설정
    handleResize();

    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 정렬 토글 함수
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 필터 초기화 함수
  const resetFilters = () => {
    setIndustryFilter('');
    setSubIndustryFilter('');
    setDividendMinFilter('');
    setDividendMaxFilter('');
    setSortField('current_per');
    setSortDirection('asc');
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredStocks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredStocks.slice(startIndex, endIndex);

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 px-4 sm:px-6 py-8">
      {/* 헤더 */}
      <header className="mb-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center">
          <Link
            href="/"
            className="mr-3 sm:mr-4 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
            <BarChart4 className="mr-3 text-emerald-600 w-6 h-6 sm:w-7 sm:h-7" />
            벤자민 그레이엄 가치투자 종목
          </h1>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full">
        {/* 설명 카드 - 아코디언 방식 */}
        <AccordionSection
          title="그레이엄 가치투자 원칙"
          isExpanded={isConditionExpanded}
          toggleExpanded={() => setIsConditionExpanded(!isConditionExpanded)}
        >
          <p className="text-sm sm:text-base text-gray-700 mb-3">
            벤자민 그레이엄의 가치투자 원칙에 따른 종목 리스트입니다:
          </p>
          <ul className="list-disc pl-5 text-sm sm:text-base text-gray-700 space-y-2">
            <li>
              <strong>PER 10 미만</strong> - 수익성 대비 저평가된 기업
            </li>
            <li>
              <strong>부채비율 100% 미만</strong> - 재무적으로 안정적인 기업
            </li>
            <li>
              <strong>배당률 필터 지원</strong> - 원하는 배당수익률로 추가 필터링 가능
            </li>
          </ul>
        </AccordionSection>

        {/* 필터 및 정렬 컨트롤 - 아코디언 방식 */}
        <AccordionSection
          title={
            <div className="flex items-center">
              <Filter className="w-5 h-5 mr-2 text-emerald-600" />
              <span className="text-lg font-semibold text-gray-800">필터 및 정렬</span>
            </div>
          }
          isExpanded={isFilterExpanded}
          toggleExpanded={() => setIsFilterExpanded(!isFilterExpanded)}
          rightContent={
            <button
              onClick={(e) => {
                e.stopPropagation(); // 버튼 클릭 시 아코디언 확장/축소 방지
                resetFilters();
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors mr-4"
            >
              필터 초기화
            </button>
          }
        >
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* 산업군 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">산업군</label>
                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">모든 산업군</option>
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>

              {/* 하위 산업군 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">하위 산업군</label>
                <select
                  value={subIndustryFilter}
                  onChange={(e) => setSubIndustryFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  disabled={subIndustries.length === 0}
                >
                  <option value="">모든 하위 산업군</option>
                  {subIndustries.map((subIndustry) => (
                    <option key={subIndustry} value={subIndustry}>
                      {subIndustry}
                    </option>
                  ))}
                </select>
              </div>

              {/* 배당률 범위 필터 추가 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  배당률 범위 (%)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={dividendMinFilter}
                    onChange={(e) =>
                      setDividendMinFilter(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="최소"
                    min="0"
                    step="0.1"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <span className="self-center">~</span>
                  <input
                    type="number"
                    value={dividendMaxFilter}
                    onChange={(e) =>
                      setDividendMaxFilter(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="최대"
                    min="0"
                    step="0.1"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* 정렬 필드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">정렬 기준</label>
                <div className="flex space-x-2">
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="current_per">PER</option>
                    <option value="debtratio">부채비율</option>
                    <option value="dividend_yield">배당률</option>
                    <option value="current_price">현재가</option>
                    <option value="company_name">회사명</option>
                    <option value="industry">산업군</option>
                    <option value="subindustry">하위 산업군</option>
                  </select>
                  <button
                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    {sortDirection === 'asc' ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                  </button>
                </div>
              </div>

              {/* 뷰 모드 전환 - 모바일/태블릿에서만 */}
              <div className="sm:col-span-3 lg:hidden">
                <label className="block text-sm font-medium text-gray-700 mb-1">보기 방식</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setViewMode('card')}
                    className={`flex items-center justify-center p-2 rounded-lg border ${
                      viewMode === 'card'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    <Briefcase size={18} className="mr-2" />
                    카드 보기
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex items-center justify-center p-2 rounded-lg border ${
                      viewMode === 'table'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    <BarChart4 size={18} className="mr-2" />
                    테이블 보기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* 로딩 상태 */}
        {loading && (
          <div className="bg-white rounded-2xl p-10 shadow-md flex justify-center items-center">
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

        {/* 데이터 표시 부분 */}
        {!loading && !error && filteredStocks.length > 0 && (
          <>
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                    그레이엄 가치주 리스트
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      (총 {filteredStocks.length}개 종목)
                    </span>
                  </h2>
                </div>
              </div>

              {/* 카드 뷰 (모바일/태블릿 또는 선택 시) */}
              {viewMode === 'card' && (
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentItems.map((stock) => (
                      <div
                        key={stock.stock_code}
                        className="bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col"
                      >
                        {/* 회사명 및 종목코드 */}
                        <div className="mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {stock.company_name}
                          </h3>
                          <p className="text-sm text-gray-500">{stock.stock_code}</p>
                        </div>

                        {/* 핵심 지표 (PER, 부채비율, 배당률) */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="border rounded-lg p-2 flex flex-col items-center">
                            <span className="text-xs text-gray-600 mb-1 flex items-center">
                              <LineChart size={12} className="mr-1" /> PER
                            </span>
                            <span className="text-gray-800 font-medium">
                              {stock.current_per.toFixed(2)}
                            </span>
                          </div>

                          <div className="border rounded-lg p-2 flex flex-col items-center">
                            <span className="text-xs text-gray-600 mb-1 flex items-center">
                              <BarChart4 size={12} className="mr-1" /> 부채비율
                            </span>
                            <span className="text-gray-800 font-medium">
                              {stock.debtratio.toFixed(1)}%
                            </span>
                          </div>

                          <div className="border rounded-lg p-2 flex flex-col items-center">
                            <span className="text-xs text-gray-600 mb-1 flex items-center">
                              <PercentIcon size={12} className="mr-1" /> 배당률
                            </span>
                            <span className="text-emerald-600 font-medium">
                              {stock.dividend_yield > 0
                                ? `${stock.dividend_yield.toFixed(2)}%`
                                : '-'}
                            </span>
                          </div>
                        </div>

                        {/* 추가 정보 */}
                        <div className="space-y-2 text-sm mb-3 flex-grow">
                          <div className="flex justify-between">
                            <span className="text-gray-600 flex items-center">
                              <DollarSign size={14} className="mr-1 text-gray-400" /> 현재가
                            </span>
                            <span className="font-medium">
                              {formatNumber(stock.current_price)}원
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-600 flex items-center">
                              <Info size={14} className="mr-1 text-gray-400" /> 산업군
                            </span>
                            <span className="font-medium truncate max-w-[180px]">
                              {stock.industry}
                            </span>
                          </div>
                        </div>

                        {/* 주식 관련 링크 버튼 */}
                        <StockLinkButtons stockCode={stock.stock_code} style="card" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 테이블 뷰 (데스크톱 또는 선택 시) */}
              {viewMode === 'table' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => toggleSort('company_name')}
                        >
                          <div className="flex items-center">
                            회사명
                            {sortField === 'company_name' &&
                              (sortDirection === 'asc' ? (
                                <ArrowUp size={14} className="ml-1" />
                              ) : (
                                <ArrowDown size={14} className="ml-1" />
                              ))}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => toggleSort('industry')}
                        >
                          <div className="flex items-center">
                            산업군
                            {sortField === 'industry' &&
                              (sortDirection === 'asc' ? (
                                <ArrowUp size={14} className="ml-1" />
                              ) : (
                                <ArrowDown size={14} className="ml-1" />
                              ))}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => toggleSort('current_per')}
                        >
                          <div className="flex items-center">
                            PER
                            {sortField === 'current_per' &&
                              (sortDirection === 'asc' ? (
                                <ArrowUp size={14} className="ml-1" />
                              ) : (
                                <ArrowDown size={14} className="ml-1" />
                              ))}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => toggleSort('debtratio')}
                        >
                          <div className="flex items-center">
                            부채비율
                            {sortField === 'debtratio' &&
                              (sortDirection === 'asc' ? (
                                <ArrowUp size={14} className="ml-1" />
                              ) : (
                                <ArrowDown size={14} className="ml-1" />
                              ))}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => toggleSort('dividend_yield')}
                        >
                          <div className="flex items-center">
                            배당률
                            {sortField === 'dividend_yield' &&
                              (sortDirection === 'asc' ? (
                                <ArrowUp size={14} className="ml-1" />
                              ) : (
                                <ArrowDown size={14} className="ml-1" />
                              ))}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => toggleSort('current_price')}
                        >
                          <div className="flex items-center">
                            현재가
                            {sortField === 'current_price' &&
                              (sortDirection === 'asc' ? (
                                <ArrowUp size={14} className="ml-1" />
                              ) : (
                                <ArrowDown size={14} className="ml-1" />
                              ))}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          상세
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentItems.map((stock) => (
                        <tr key={stock.stock_code} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {stock.company_name}
                              </div>
                              <div className="text-xs text-gray-500 ml-2">({stock.stock_code})</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{stock.industry}</div>
                            <div className="text-xs text-gray-500">{stock.subindustry}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {stock.current_per.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {stock.debtratio.toFixed(1)}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-emerald-600">
                              {stock.dividend_yield > 0
                                ? `${stock.dividend_yield.toFixed(2)}%`
                                : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatNumber(stock.current_price)}원
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <StockLinkButtons stockCode={stock.stock_code} style="table" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  totalItems={filteredStocks.length}
                  handlePageChange={handlePageChange}
                />
              )}
            </div>

            {/* 데이터 없음 메시지 */}
            {filteredStocks.length === 0 && !loading && !error && (
              <div className="bg-white rounded-2xl p-10 shadow-md flex justify-center items-center">
                <p className="text-lg text-gray-700">조건에 맞는 주식이 없습니다.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
