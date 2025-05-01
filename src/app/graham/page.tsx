//src/app/graham/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart4,
  Filter,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  PercentIcon,
  LineChart,
  Info,
  TrendingUp,
  ExternalLink,
  Briefcase,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// 주식 데이터 타입 정의
interface GrahamStock {
  stock_code: string;
  company_name: string;
  industry: string;
  subindustry: string;
  current_per: number;
  debtratio: number;
  current_price: number;
  dividend_yield: number;
}

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
    const fetchGrahamStocks = async () => {
      try {
        setLoading(true);

        // 1. PER 조건에 맞는 종목 먼저 가져오기
        const { data: currentData, error: currentError } = await supabase
          .from('stock_current')
          .select('stock_code, current_per')
          .gt('current_per', 0) // PER이 0보다 큰 경우 (0 초과)
          .lte('current_per', 10) // PER이 10 이하
          .not('current_per', 'is', null);

        if (currentError) throw new Error(currentError.message);

        if (!currentData || currentData.length === 0) {
          setError('PER 조건에 맞는 주식을 찾을 수 없습니다.');
          setStocks([]);
          setFilteredStocks([]);
          return;
        }

        // PER 조건을 만족하는 종목 코드
        const perStockCodes = currentData.map((item) => item.stock_code);

        // 2. 부채비율 조건에 맞는 종목 가져오기
        const { data: checklist, error: checklistError } = await supabase
          .from('stock_checklist')
          .select(
            `
            stock_code,
            company_name,
            industry,
            subindustry,
            debtratio
          `
          )
          .in('stock_code', perStockCodes) // PER 조건을 만족하는 종목만 필터링
          .lt('debtratio', 100)
          .not('debtratio', 'is', null);

        if (checklistError) throw new Error(checklistError.message);

        if (!checklist || checklist.length === 0) {
          setError('부채비율 조건에 맞는 주식을 찾을 수 없습니다.');
          setStocks([]);
          setFilteredStocks([]);
          return;
        }

        // 최종 조건을 만족하는 종목 코드
        const filteredCodes = checklist.map((item) => item.stock_code);

        // 3. 현재가 데이터 가져오기
        const { data: priceData, error: priceError } = await supabase
          .from('stock_price')
          .select('stock_code, current_price')
          .in('stock_code', filteredCodes);

        if (priceError) throw new Error(priceError.message);

        // 4. 배당률 데이터 가져오기
        const { data: dividendAssetsData, error: dividendError } = await supabase
          .from('stock_current')
          .select('stock_code, 2024_dividend_yield')
          .in('stock_code', filteredCodes);

        if (dividendError) throw new Error(dividendError.message);

        // 5. 데이터 조인
        const perMap = new Map(currentData.map((item) => [item.stock_code, item.current_per]));
        const priceMap = new Map(priceData.map((item) => [item.stock_code, item.current_price]));
        const dividendMap = new Map(
          dividendAssetsData.map((item) => [item.stock_code, item['2024_dividend_yield'] || 0])
        );

        // 모든 조건을 만족하는 종목만 필터링
        const filteredChecklist = checklist.filter((item) =>
          filteredCodes.includes(item.stock_code)
        );

        if (filteredChecklist.length === 0) {
          setError('조건에 맞는 주식을 찾을 수 없습니다.');
          setStocks([]);
          setFilteredStocks([]);
          return;
        }

        // 데이터 형식 변환
        const grahamStocks: GrahamStock[] = filteredChecklist.map((item) => ({
          stock_code: item.stock_code,
          company_name: item.company_name,
          industry: item.industry || '미분류',
          subindustry: item.subindustry || '미분류',
          current_per: perMap.get(item.stock_code) || 0,
          debtratio: item.debtratio || 0,
          current_price: priceMap.get(item.stock_code) || 0,
          dividend_yield: dividendMap.get(item.stock_code) || 0,
        }));

        // 산업군과 하위 산업군 목록 생성
        const uniqueIndustries = Array.from(
          new Set(grahamStocks.map((stock) => stock.industry))
        ).sort();
        const uniqueSubIndustries = Array.from(
          new Set(grahamStocks.map((stock) => stock.subindustry))
        ).sort();

        setStocks(grahamStocks);
        setFilteredStocks(grahamStocks);
        setIndustries(uniqueIndustries);
        setSubIndustries(uniqueSubIndustries);
        setCurrentPage(1);
      } catch (err) {
        console.error('데이터 가져오기 오류:', err);
        setError(err instanceof Error ? err.message : '데이터를 가져오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchGrahamStocks();
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

  // 자산 억/조 단위 변환 함수
  const formatAsset = (num: number): string => {
    if (num >= 1000000000000) {
      // 조 단위 (10^12)
      const jo = Math.floor(num / 1000000000000);
      const eok = Math.floor((num % 1000000000000) / 100000000);
      if (eok > 0) {
        return `${jo}조 ${eok}억`;
      }
      return `${jo}조`;
    } else {
      return `${Math.floor(num / 100000000)}억`;
    }
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

  // 숫자 포맷팅 함수
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
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
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-md mb-6">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsConditionExpanded(!isConditionExpanded)}
          >
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
              그레이엄 가치투자 원칙
            </h2>
            <div className="text-gray-500">
              {isConditionExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>

          {isConditionExpanded && (
            <div className="mt-4">
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
            </div>
          )}
        </div>

        {/* 필터 및 정렬 컨트롤 - 아코디언 방식 */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-md mb-6">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          >
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <Filter className="w-5 h-5 mr-2 text-emerald-600" />
              필터 및 정렬
            </h2>
            <div className="flex items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // 버튼 클릭 시 아코디언 확장/축소 방지
                  resetFilters();
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors mr-4"
              >
                필터 초기화
              </button>
              <div className="text-gray-500">
                {isFilterExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>
          </div>

          {isFilterExpanded && (
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    하위 산업군
                  </label>
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

                {/* 자산 규모 제거 - 필터만 제거 */}

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
          )}
        </div>

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

                        {/* 적정가 확인 링크 */}
                        <Link
                          href={`/fairprice?stockCode=${stock.stock_code}`}
                          className="mt-auto text-center py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors text-sm font-medium flex items-center justify-center"
                        >
                          <TrendingUp size={16} className="mr-1.5" />
                          적정가 확인
                          <ExternalLink size={14} className="ml-1" />
                        </Link>
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
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link href={`/fairprice?stockCode=${stock.stock_code}`} passHref>
                              <span className="text-emerald-600 hover:text-emerald-900 cursor-pointer">
                                적정가 확인
                              </span>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        총 <span className="font-medium">{filteredStocks.length}</span> 개 중{' '}
                        <span className="font-medium">{startIndex + 1}</span> -{' '}
                        <span className="font-medium">
                          {Math.min(endIndex, filteredStocks.length)}
                        </span>{' '}
                        보기
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
                          <span className="sr-only">이전</span>
                          <ChevronLeft className="h-5 w-5" />
                        </button>

                        {/* 페이지 번호 버튼 */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          // 현재 페이지를 중심으로 표시할 페이지 범위 계산
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                                currentPage === pageNum
                                  ? 'z-10 bg-emerald-50 border-emerald-500 text-emerald-600'
                                  : 'text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
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
                          <span className="sr-only">다음</span>
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>

                  {/* 모바일 페이지네이션 */}
                  <div className="flex items-center justify-between w-full sm:hidden">
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
                    <span className="text-sm text-gray-700">
                      {currentPage} / {totalPages}
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
