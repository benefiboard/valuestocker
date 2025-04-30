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
} from 'lucide-react';

// 그레이엄 주식 데이터 타입 정의 - PBR 추가
interface GrahamStock {
  stock_code: string;
  company_name: string;
  industry: string;
  subindustry: string;
  current_per: number;
  current_pbr: number; // PBR 추가
  debtratio: number;
  current_price: number;
  dividend_yield: number;
}

// 정렬 타입 정의 - PBR 추가
type SortField =
  | 'current_per'
  | 'current_pbr' // PBR 추가
  | 'debtratio'
  | 'company_name'
  | 'industry'
  | 'subindustry'
  | 'current_price'
  | 'dividend_yield';
type SortDirection = 'asc' | 'desc';

export default function GrahamTotalPage() {
  // 상태 관리 - 변경 없음
  const [stocks, setStocks] = useState<GrahamStock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<GrahamStock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('current_per');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [industryFilter, setIndustryFilter] = useState<string>('');
  const [subIndustryFilter, setSubIndustryFilter] = useState<string>('');
  const [industries, setIndustries] = useState<string[]>([]);
  const [subIndustries, setSubIndustries] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;

  // Supabase에서 그레이엄 조건에 맞는 주식 데이터 가져오기
  useEffect(() => {
    const fetchGrahamStocks = async () => {
      try {
        setLoading(true);

        // 1. 부채비율 조건에 맞는 종목 먼저 가져오기
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
          .lt('debtratio', 100)
          .not('debtratio', 'is', null);

        if (checklistError) throw new Error(checklistError.message);

        if (!checklist || checklist.length === 0) {
          setError('부채비율 조건에 맞는 주식을 찾을 수 없습니다.');
          setStocks([]);
          setFilteredStocks([]);
          return;
        }

        // 가져온 종목들의 코드 목록
        const stockCodes = checklist.map((item) => item.stock_code);

        // 2. PER 조건에 맞는 종목 가져오기
        const { data: currentData, error: currentError } = await supabase
          .from('stock_current')
          .select('stock_code, current_per, current_pbr') // current_pbr 추가
          .in('stock_code', stockCodes)
          .gte('current_per', 0.1)
          .lt('current_per', 10)
          .not('current_per', 'is', null);

        if (currentError) throw new Error(currentError.message);

        // 2-1. PBR 조건에 맞는 종목 필터링 (추가된 부분)
        const pbrFilteredCodes = currentData
          .filter((item) => item.current_pbr !== null && item.current_pbr <= 1)
          .map((item) => item.stock_code);

        if (pbrFilteredCodes.length === 0) {
          setError('PBR 조건에 맞는 주식을 찾을 수 없습니다.');
          setStocks([]);
          setFilteredStocks([]);
          return;
        }

        // 3. 현재가 데이터 가져오기 (이제 PBR로 필터링된 종목 코드 사용)
        const { data: priceData, error: priceError } = await supabase
          .from('stock_price')
          .select('stock_code, current_price')
          .in('stock_code', pbrFilteredCodes);

        if (priceError) throw new Error(priceError.message);

        // 4. 배당률 데이터 가져오기
        const { data: dividendData, error: dividendError } = await supabase
          .from('stock_raw_data')
          .select('stock_code, 2024_dividend_yield')
          .in('stock_code', pbrFilteredCodes);

        if (dividendError) throw new Error(dividendError.message);

        // 5. 데이터 조인
        const perPbrMap = new Map(
          currentData.map((item) => [
            item.stock_code,
            { per: item.current_per, pbr: item.current_pbr },
          ])
        );
        const priceMap = new Map(priceData.map((item) => [item.stock_code, item.current_price]));
        const dividendMap = new Map(
          dividendData.map((item) => [item.stock_code, item['2024_dividend_yield'] || 0])
        );

        // 모든 조건을 만족하는 종목만 필터링
        const filteredChecklist = checklist.filter((item) =>
          pbrFilteredCodes.includes(item.stock_code)
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
          current_per: perPbrMap.get(item.stock_code)?.per || 0,
          current_pbr: perPbrMap.get(item.stock_code)?.pbr || 0, // PBR 추가
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

  // 필터 적용 - 변경 없음
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
  }, [stocks, industryFilter, subIndustryFilter, sortField, sortDirection]);

  // 정렬 토글 함수 - 변경 없음
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 필터 초기화 함수 - 변경 없음
  const resetFilters = () => {
    setIndustryFilter('');
    setSubIndustryFilter('');
    setSortField('current_per');
    setSortDirection('asc');
  };

  // 페이지네이션 계산 - 변경 없음
  const totalPages = Math.ceil(filteredStocks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredStocks.slice(startIndex, endIndex);

  // 페이지 변경 핸들러 - 변경 없음
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 숫자 포맷팅 함수 - 변경 없음
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
        {/* 설명 카드 */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-md mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3">
            그레이엄 가치투자 원칙
          </h2>
          <p className="text-sm sm:text-base text-gray-700 mb-3">
            벤자민 그레이엄의 가치투자 원칙에 따른 종목 리스트입니다:
          </p>
          <ul className="list-disc pl-5 text-sm sm:text-base text-gray-700 space-y-2">
            <li>
              <strong>PER 10 미만</strong> - 수익성 대비 저평가된 기업
            </li>
            <li>
              <strong>PBR 1 이하</strong> - 자산가치 대비 저평가된 기업
            </li>
            <li>
              <strong>부채비율 100% 미만</strong> - 재무적으로 안정적인 기업
            </li>
            <li>
              <strong>배당률 정보 제공</strong> - 배당수익률로 정렬 가능
            </li>
          </ul>
        </div>

        {/* 필터 및 정렬 컨트롤 */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-md mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 sm:mb-0 flex items-center">
              <Filter className="w-5 h-5 mr-2 text-emerald-600" />
              필터 및 정렬
            </h2>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
            >
              필터 초기화
            </button>
          </div>

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
                  <option value="current_pbr">PBR</option> {/* PBR 추가 */}
                  <option value="debtratio">부채비율</option>
                  <option value="current_price">현재가</option>
                  <option value="dividend_yield">배당률</option>
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
          </div>
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

        {/* 데이터 테이블 */}
        {!loading && !error && filteredStocks.length > 0 && (
          <>
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                  그레이엄 가치주 리스트
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    (총 {filteredStocks.length}개 종목)
                  </span>
                </h2>
              </div>

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
                        onClick={() => toggleSort('subindustry')}
                      >
                        <div className="flex items-center">
                          하위 산업군
                          {sortField === 'subindustry' &&
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
                      {/* PBR 컬럼 추가 */}
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => toggleSort('current_pbr')}
                      >
                        <div className="flex items-center">
                          PBR
                          {sortField === 'current_pbr' &&
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
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{stock.subindustry}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {stock.current_per.toFixed(2)}
                          </div>
                        </td>
                        {/* PBR 컬럼 추가 */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {stock.current_pbr.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{stock.debtratio.toFixed(2)}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatNumber(stock.current_price)}원
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={`text-sm font-medium ${
                              stock.dividend_yield > 0 ? 'text-emerald-600' : 'text-gray-500'
                            }`}
                          >
                            {stock.dividend_yield > 0 ? `${stock.dividend_yield.toFixed(2)}%` : '-'}
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

              {/* 페이지네이션은 변경 없음 */}
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
