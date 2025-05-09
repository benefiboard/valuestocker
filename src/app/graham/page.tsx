//src/app/graham/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { EnhancedGrahamStock, fetchEnhancedGrahamStocks } from '@/utils/stockDataService';
import Link from 'next/link';
import { formatNumber, formatAsset } from '../../utils/stockUtils';
import { Pagination } from '../../components/StockPageComponents';
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
  List,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  X,
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
  | 'dividend_yield'
  | 'graham_price'
  | 'modified_graham_price'
  | 'discount_rate'
  | 'consecutive_dividend'
  | 'ncav'
  | 'ncav_price'; // NCAV 관련 정렬 필드 추가

type SortDirection = 'asc' | 'desc';
type ViewMode = 'card' | 'table' | 'mobileTable';

export default function EnhancedGrahamPage() {
  // 상태 관리
  const [stocks, setStocks] = useState<EnhancedGrahamStock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<EnhancedGrahamStock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('current_per');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [industryFilter, setIndustryFilter] = useState<string>('');
  const [subIndustryFilter, setSubIndustryFilter] = useState<string>('');
  const [dividendMinFilter, setDividendMinFilter] = useState<number | ''>('');
  const [dividendMaxFilter, setDividendMaxFilter] = useState<number | ''>('');
  const [consecutiveDividendFilter, setConsecutiveDividendFilter] = useState<boolean | null>(null);
  const [industries, setIndustries] = useState<string[]>([]);
  const [subIndustries, setSubIndustries] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(false);
  const [isConditionExpanded, setIsConditionExpanded] = useState<boolean>(false);
  const [showScrollHint, setShowScrollHint] = useState<boolean>(false);
  const itemsPerPage = 20;

  // Supabase에서 조건에 맞는 주식 데이터 가져오기
  useEffect(() => {
    const loadStockData = async () => {
      setLoading(true);

      // 그레이엄 종목 데이터 가져오기
      const result = await fetchEnhancedGrahamStocks();

      if (result.error) {
        setError(result.error);
        setStocks([]);
        setFilteredStocks([]);
      } else {
        console.log(`가져온 종목 수: ${result.stocks.length}`);
        // 디버그: 가져온 종목들의 저평가율 확인
        result.stocks.forEach((stock) => {
          const discountRate =
            ((stock.modified_graham_price - stock.current_price) / stock.modified_graham_price) *
            100;
          // console.log(
          //   `${stock.company_name}: 현재가 ${stock.current_price}, 수정그레이엄가 ${
          //     stock.modified_graham_price
          //   }, 저평가율 ${discountRate.toFixed(2)}%`
          // );
          if (stock.current_price > stock.modified_graham_price) {
            console.warn(`경고: ${stock.company_name}은 고평가 종목입니다!`);
          }
        });

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

    // 연속 배당 필터 추가
    if (consecutiveDividendFilter !== null) {
      filtered = filtered.filter(
        (stock) => stock.consecutive_dividend === consecutiveDividendFilter
      );
    }

    // 정렬 적용
    filtered.sort((a, b) => {
      // 저평가율 정렬 특별 처리
      if (sortField === 'discount_rate') {
        const discountRateA =
          ((a.modified_graham_price - a.current_price) / a.modified_graham_price) * 100;
        const discountRateB =
          ((b.modified_graham_price - b.current_price) / b.modified_graham_price) * 100;
        return sortDirection === 'asc'
          ? discountRateA - discountRateB
          : discountRateB - discountRateA;
      }

      // 특별한 경우 처리: consecutive_dividend는 boolean이라 별도 처리
      if (sortField === 'consecutive_dividend') {
        return sortDirection === 'asc'
          ? a.consecutive_dividend === b.consecutive_dividend
            ? 0
            : a.consecutive_dividend
            ? 1
            : -1
          : a.consecutive_dividend === b.consecutive_dividend
          ? 0
          : a.consecutive_dividend
          ? -1
          : 1;
      }

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
    consecutiveDividendFilter,
    sortField,
    sortDirection,
  ]);

  // 뷰 모드 감지 (화면 크기에 따라 자동 변경)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // 데스크톱: lg 브레이크포인트
        setViewMode('table');
        setShowScrollHint(false);
      } else {
        // 태블릿 및 모바일
        setViewMode('mobileTable');
        setShowScrollHint(true);
      }
    };

    // 초기 설정
    handleResize();

    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 스크롤 힌트 5초 후 자동 숨김
  useEffect(() => {
    if (showScrollHint) {
      const timer = setTimeout(() => {
        setShowScrollHint(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showScrollHint]);

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
    setConsecutiveDividendFilter(null);
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

  // 정렬 아이콘 렌더링 함수
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;

    return sortDirection === 'asc' ? (
      <ArrowUp size={12} className="ml-1 text-emerald-600 sort-icon" />
    ) : (
      <ArrowDown size={12} className="ml-1 text-emerald-600 sort-icon" />
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 px-4 sm:px-6 py-8">
      {/* 헤더 - 글래스모픽 스타일 */}
      <header className="mb-6 max-w-6xl mx-auto w-full sticky top-0 z-10">
        <div className="bg-white bg-opacity-90 backdrop-blur-md shadow-sm rounded-2xl p-4 flex items-center">
          <Link
            href="/"
            className="mr-3 sm:mr-4 text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
            <div className="p-2 bg-emerald-50 rounded-full mr-3">
              <BarChart4 className="text-emerald-600 w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            그레이엄 가치투자 종목
          </h1>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full animate-fadeIn">
        <div className="flex flex-col mb-6">
          {/* 설명 카드 - 아코디언 방식 (개선된 디자인) */}
          <div className="mb-4 bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md overflow-hidden">
            <div
              className="flex items-center justify-between p-4 sm:p-5 cursor-pointer"
              onClick={() => setIsConditionExpanded(!isConditionExpanded)}
            >
              <div className="flex items-center">
                <div className="p-2 bg-emerald-50 rounded-full mr-3">
                  <Info className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                  그레이엄 가치투자 원칙
                </h2>
              </div>
              <div
                className={`p-1 rounded-full bg-gray-100 transform transition-transform duration-300 ${
                  isConditionExpanded ? 'rotate-180' : 'rotate-0'
                }`}
              >
                {isConditionExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </div>

            <div className={`accordion-content ${isConditionExpanded ? 'open' : ''}`}>
              <div className="p-4 sm:p-5 pt-0 border-t border-gray-100">
                <p className="text-sm sm:text-base text-gray-700 mb-3">
                  벤자민 그레이엄의 가치투자 원칙에 따른 종목 리스트입니다:
                </p>
                <ul className="list-disc pl-5 text-sm sm:text-base text-gray-700 space-y-2">
                  <li>
                    <strong className="text-emerald-700">PER 10 미만</strong> - 수익성 대비 저평가된
                    기업
                  </li>
                  <li>
                    <strong className="text-emerald-700">부채비율 100% 미만</strong> - 재무적으로
                    안정적인 기업
                  </li>
                  <li>
                    <strong className="text-emerald-700">그레이엄 가격 계산</strong> - [(3년간 EPS
                    평균 × 8) + 2024년 BPS ÷ 2] × 67%
                  </li>
                  <li>
                    <strong className="text-emerald-700">현재가 ≤ 그레이엄 가격</strong> -
                    그레이엄의 가격 원칙에 따른 고평가 여부
                  </li>
                  <li>
                    <strong className="text-emerald-700">NCAV 가격</strong> - (유동자산 - 총부채) ÷
                    발행주식수 × 67%
                  </li>
                  <li>
                    <strong className="text-emerald-700">연속 배당 여부 표시</strong> - 3년
                    연속(2022-2024) 배당금 지급 체크
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 필터 및 정렬 컨트롤 - 아코디언 방식 (개선된 디자인) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md overflow-hidden">
            <div
              className="flex items-center justify-between p-3 sm:p-4 cursor-pointer"
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            >
              <div className="flex items-center">
                <div className="p-1.5 bg-emerald-50 rounded-full mr-2">
                  <Filter className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="text-sm sm:text-base font-semibold text-gray-800">필터 및 정렬</h2>
              </div>
              <div className="flex items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // 버튼 클릭 시 아코디언 확장/축소 방지
                    resetFilters();
                  }}
                  className="filter-button bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors mr-3 hover:shadow-sm"
                >
                  필터 초기화
                </button>
                <div
                  className={`p-1 rounded-full bg-gray-100 transform transition-transform duration-300 ${
                    isFilterExpanded ? 'rotate-180' : 'rotate-0'
                  }`}
                >
                  {isFilterExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </div>
            </div>

            <div className={`accordion-content ${isFilterExpanded ? 'open' : ''}`}>
              <div className="filter-container border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {/* 산업군 필터 */}
                  <div className="filter-section">
                    <label className="filter-label block font-medium text-gray-700">산업군</label>
                    <select
                      value={industryFilter}
                      onChange={(e) => setIndustryFilter(e.target.value)}
                      className="filter-select w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
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
                  <div className="filter-section">
                    <label className="filter-label block font-medium text-gray-700">
                      하위 산업군
                    </label>
                    <select
                      value={subIndustryFilter}
                      onChange={(e) => setSubIndustryFilter(e.target.value)}
                      className="filter-select w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
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
                  <div className="filter-section">
                    <label className="filter-label block font-medium text-gray-700">
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
                        className="filter-input w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                      />
                      <span className="self-center text-gray-400 text-sm">~</span>
                      <input
                        type="number"
                        value={dividendMaxFilter}
                        onChange={(e) =>
                          setDividendMaxFilter(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        placeholder="최대"
                        min="0"
                        step="0.1"
                        className="filter-input w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* 연속 배당 필터 추가 */}
                  <div className="filter-section">
                    <label className="filter-label block font-medium text-gray-700">
                      연속 배당 여부
                    </label>
                    <select
                      value={
                        consecutiveDividendFilter === null
                          ? ''
                          : consecutiveDividendFilter
                          ? 'true'
                          : 'false'
                      }
                      onChange={(e) => {
                        if (e.target.value === '') {
                          setConsecutiveDividendFilter(null);
                        } else {
                          setConsecutiveDividendFilter(e.target.value === 'true');
                        }
                      }}
                      className="filter-select w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                    >
                      <option value="">전체</option>
                      <option value="true">O (3년 연속 배당)</option>
                      <option value="false">X (연속 배당 아님)</option>
                    </select>
                  </div>

                  {/* 정렬 필드 */}
                  <div className="filter-section">
                    <label className="filter-label block font-medium text-gray-700">
                      정렬 기준
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value as SortField)}
                        className="filter-select flex-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                      >
                        <option value="current_per">PER</option>
                        <option value="debtratio">부채비율</option>
                        <option value="dividend_yield">배당률</option>
                        <option value="current_price">현재가</option>
                        <option value="graham_price">그레이엄 가격</option>
                        <option value="ncav">NCAV</option>
                        <option value="ncav_price">NCAV 가격</option>
                        <option value="discount_rate">저평가율</option>
                        <option value="company_name">회사명</option>
                        <option value="industry">산업군</option>
                        <option value="consecutive_dividend">연속 배당</option>
                      </select>
                      <button
                        onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                        className="filter-button bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 group p-1"
                      >
                        {sortDirection === 'asc' ? (
                          <ArrowUp
                            size={16}
                            className="group-hover:scale-125 transition-transform duration-200"
                          />
                        ) : (
                          <ArrowDown
                            size={16}
                            className="group-hover:scale-125 transition-transform duration-200"
                          />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 로딩 상태 - 세련된 로딩 애니메이션 */}
        {loading && (
          <div className="bg-white rounded-2xl p-8 shadow-md flex flex-col items-center justify-center mb-6 transition-all duration-300 border border-gray-100">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-emerald-600 animate-spin"></div>
            </div>
            <div className="text-center">
              <p className="text-lg text-gray-700 font-medium mb-2">데이터를 불러오는 중...</p>
              <p className="text-sm text-gray-500">잠시만 기다려주세요</p>
            </div>
          </div>
        )}

        {/* 오류 메시지 - 세련된 알림 디자인 */}
        {error && !loading && (
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-md mb-6 border-l-4 border-red-500 transition-all duration-300 hover:shadow-lg animate-fadeIn">
            <div className="flex items-start">
              <div className="bg-red-50 p-2 rounded-full mr-3">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
              </div>
              <div>
                <p className="font-medium text-base sm:text-lg text-gray-800">오류</p>
                <p className="text-sm sm:text-base text-gray-600 mt-2">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 데이터 표시 부분 - 개선된 테이블 디자인 */}
        {!loading && !error && filteredStocks.length > 0 && (
          <>
            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-lg">
              <div className="p-4 sm:p-5 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
                    <span>그레이엄 가치주 리스트</span>
                    <span className="ml-2 text-sm font-normal bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                      총 {filteredStocks.length}개 종목
                    </span>
                  </h2>
                </div>
              </div>

              {/* 모바일 테이블 뷰 (개선된 디자인) */}
              {viewMode === 'mobileTable' && (
                <div className="relative overflow-x-auto">
                  {showScrollHint && <div className="scrollable-hint"></div>}
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        {/* 고정된 회사명 헤더 */}
                        <th
                          scope="col"
                          className="sticky-left sticky left-0 z-10 bg-white px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer border-r border-gray-200 shadow-sm min-w-[120px] table-head-cell"
                          onClick={() => toggleSort('company_name')}
                        >
                          <div className="flex items-center">
                            회사명
                            {renderSortIcon('company_name')}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="bg-gray-50 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200 table-head-cell"
                          onClick={() => toggleSort('current_price')}
                        >
                          <div className="flex items-center whitespace-nowrap">
                            현재가
                            {renderSortIcon('current_price')}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="bg-gray-50 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200 table-head-cell"
                          onClick={() => toggleSort('modified_graham_price')}
                        >
                          <div className="flex items-center whitespace-nowrap">
                            그레이엄가
                            {renderSortIcon('modified_graham_price')}
                          </div>
                        </th>

                        <th
                          scope="col"
                          className="bg-gray-50 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200 table-head-cell"
                          onClick={() => toggleSort('discount_rate')}
                        >
                          <div className="flex items-center whitespace-nowrap">
                            저평가율
                            {renderSortIcon('discount_rate')}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="bg-gray-50 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200 table-head-cell"
                          onClick={() => toggleSort('current_per')}
                        >
                          <div className="flex items-center whitespace-nowrap">
                            PER
                            {renderSortIcon('current_per')}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="bg-gray-50 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200 table-head-cell"
                          onClick={() => toggleSort('consecutive_dividend')}
                        >
                          <div className="flex items-center whitespace-nowrap">
                            연속배당
                            {renderSortIcon('consecutive_dividend')}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="bg-gray-50 px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          상세
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentItems.map((stock) => (
                        <tr
                          key={stock.stock_code}
                          className="hover:bg-gray-50 transition-colors duration-200 table-row-hover"
                        >
                          {/* 고정된 회사명 셀 */}
                          <td className="sticky-left sticky left-0 z-10 bg-white px-3 py-3 border-r border-gray-200 shadow-sm min-w-[120px]">
                            <div className="text-xs font-semibold text-gray-900">
                              {stock.company_name}
                            </div>
                            <div className="text-xs text-gray-500">({stock.stock_code})</div>
                          </td>
                          <td className="bg-gray-50 px-3 py-3 whitespace-nowrap">
                            <div className="text-xs font-semibold text-gray-900">
                              {formatNumber(stock.current_price)}원
                            </div>
                          </td>
                          <td className="bg-gray-50 px-3 py-3 whitespace-nowrap">
                            <div className="text-xs font-semibold text-blue-600">
                              {formatNumber(stock.modified_graham_price)}원
                            </div>
                          </td>

                          <td className="bg-gray-50 px-3 py-3 whitespace-nowrap">
                            <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">
                              <div>
                                {stock.modified_graham_price > 0
                                  ? (
                                      ((stock.modified_graham_price - stock.current_price) /
                                        stock.modified_graham_price) *
                                      100
                                    ).toFixed(1)
                                  : 0}
                                %
                              </div>
                              <div>저평가</div>
                            </div>
                          </td>
                          <td className="bg-gray-50 px-3 py-3 whitespace-nowrap">
                            <div className="text-xs font-semibold text-gray-900">
                              {stock.current_per.toFixed(2)}
                            </div>
                          </td>
                          <td className="bg-gray-50 px-3 py-3 whitespace-nowrap text-center">
                            {stock.consecutive_dividend ? (
                              <div className="inline-flex items-center justify-center bg-emerald-50 w-5 h-5 rounded-full">
                                <Check size={12} className="text-emerald-600" />
                              </div>
                            ) : (
                              <div className="inline-flex items-center justify-center bg-red-50 w-5 h-5 rounded-full">
                                <X size={12} className="text-red-600" />
                              </div>
                            )}
                          </td>
                          <td className="bg-gray-50 px-3 py-3 text-right whitespace-nowrap">
                            <StockLinkButtons stockCode={stock.stock_code} style="mobileTable" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 테이블 뷰 (데스크톱 또는 선택 시) (개선된 디자인) */}
              {viewMode === 'table' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200 table-head-cell"
                          onClick={() => toggleSort('company_name')}
                        >
                          <div className="flex items-center">
                            회사명
                            {renderSortIcon('company_name')}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200 table-head-cell"
                          onClick={() => toggleSort('current_price')}
                        >
                          <div className="flex items-center">
                            현재가
                            {renderSortIcon('current_price')}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200 table-head-cell"
                          onClick={() => toggleSort('modified_graham_price')}
                        >
                          <div className="flex items-center">
                            그레이엄 가격
                            {renderSortIcon('modified_graham_price')}
                          </div>
                        </th>

                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200 table-head-cell"
                          onClick={() => toggleSort('ncav_price')}
                        >
                          <div className="flex items-center">
                            NCAV
                            {renderSortIcon('ncav_price')}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200 table-head-cell"
                          onClick={() => toggleSort('discount_rate')}
                        >
                          <div className="flex items-center">
                            저평가율
                            {renderSortIcon('discount_rate')}
                          </div>
                        </th>

                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200 table-head-cell"
                          onClick={() => toggleSort('current_per')}
                        >
                          <div className="flex items-center">
                            PER
                            {renderSortIcon('current_per')}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200 table-head-cell"
                          onClick={() => toggleSort('debtratio')}
                        >
                          <div className="flex items-center">
                            부채비율
                            {renderSortIcon('debtratio')}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200 table-head-cell"
                          onClick={() => toggleSort('dividend_yield')}
                        >
                          <div className="flex items-center">
                            배당률
                            {renderSortIcon('dividend_yield')}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200 table-head-cell"
                          onClick={() => toggleSort('consecutive_dividend')}
                        >
                          <div className="flex items-center">
                            연속배당
                            {renderSortIcon('consecutive_dividend')}
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
                        <tr
                          key={stock.stock_code}
                          className="hover:bg-gray-50 transition-all duration-200 table-row-hover"
                        >
                          <td className="px-6 py-4 whitespace-normal max-w-[160px]">
                            <div className="text-sm font-bold text-gray-900">
                              {stock.company_name}
                            </div>
                            <div className="text-xs text-gray-500">({stock.stock_code})</div>
                            <div className="text-xs text-gray-500">{stock.industry}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatNumber(stock.current_price)}원
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg inline-block">
                              {formatNumber(stock.modified_graham_price)}원
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg inline-block">
                              {formatNumber(stock.ncav_price)}원
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg inline-block text-center">
                              <div>
                                {stock.modified_graham_price > 0
                                  ? (
                                      ((stock.modified_graham_price - stock.current_price) /
                                        stock.modified_graham_price) *
                                      100
                                    ).toFixed(1)
                                  : 0}
                                %
                              </div>
                              <div>저평가</div>
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {stock.current_per.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {stock.debtratio.toFixed(1)}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg inline-block">
                              {stock.dividend_yield > 0
                                ? `${stock.dividend_yield.toFixed(2)}%`
                                : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {stock.consecutive_dividend ? (
                              <div className="inline-flex items-center justify-center bg-emerald-50 w-7 h-7 rounded-full">
                                <Check size={16} className="text-emerald-600" />
                              </div>
                            ) : (
                              <div className="inline-flex items-center justify-center bg-red-50 w-7 h-7 rounded-full">
                                <X size={16} className="text-red-600" />
                              </div>
                            )}
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

              {/* 개선된 페이지네이션 */}
              {totalPages > 1 && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6 flex items-center justify-between">
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">{startIndex + 1}</span> ~{' '}
                        <span className="font-medium">
                          {Math.min(endIndex, filteredStocks.length)}
                        </span>{' '}
                        / <span className="font-medium">{filteredStocks.length}</span> 개 결과
                      </p>
                    </div>
                    <div>
                      <nav
                        className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                        aria-label="Pagination"
                      >
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                            currentPage === 1
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-5 w-5" />
                        </button>

                        {[...Array(totalPages)].map((_, i) => {
                          const pageNumber = i + 1;
                          // 현재 페이지, 첫 페이지, 마지막 페이지, 그리고 현재 페이지 양쪽 1페이지만 표시
                          const isVisible =
                            pageNumber === 1 ||
                            pageNumber === totalPages ||
                            Math.abs(pageNumber - currentPage) <= 1;

                          // 생략 부호(...) 표시 조건
                          const showEllipsisBefore = i === 1 && currentPage > 3;
                          const showEllipsisAfter =
                            i === totalPages - 2 && currentPage < totalPages - 2;

                          if (showEllipsisBefore) {
                            return (
                              <span
                                key={`ellipsis-before`}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                              >
                                ...
                              </span>
                            );
                          }

                          if (showEllipsisAfter) {
                            return (
                              <span
                                key={`ellipsis-after`}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                              >
                                ...
                              </span>
                            );
                          }

                          if (isVisible) {
                            return (
                              <button
                                key={pageNumber}
                                onClick={() => handlePageChange(pageNumber)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors duration-200 ${
                                  currentPage === pageNumber
                                    ? 'z-10 bg-emerald-50 border-emerald-500 text-emerald-600 hover:bg-emerald-100'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {pageNumber}
                              </button>
                            );
                          }

                          return null;
                        })}

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                            currentPage === totalPages
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>

                  {/* 모바일 페이지네이션 */}
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        currentPage === 1
                          ? 'text-gray-300 bg-gray-50 cursor-not-allowed'
                          : 'text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      이전
                    </button>
                    <span className="text-sm text-gray-700 pt-2">
                      <span className="font-medium">{currentPage}</span> / {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        currentPage === totalPages
                          ? 'text-gray-300 bg-gray-50 cursor-not-allowed'
                          : 'text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      다음
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 개선된 데이터 없음 메시지 */}
            {filteredStocks.length === 0 && !loading && !error && (
              <div className="bg-white rounded-2xl p-8 shadow-md flex flex-col items-center justify-center animate-fadeIn">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <Filter className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg text-gray-700 font-medium mb-2">
                  조건에 맞는 주식이 없습니다
                </p>
                <p className="text-sm text-gray-500 mb-4 text-center">
                  필터 조건을 조정하여 다시 시도해보세요
                </p>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  필터 초기화
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
