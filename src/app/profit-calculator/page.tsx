//src/app/profit-calculator/page.tsx

'use client';

import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import CompanySearchInput from '@/components/CompanySearchInput';
import { CompanyInfo, stockCodeMap } from '../../lib/stockCodeData';
import { ProfitResult, ProfitCalculationParams, ROEData } from './types';
import { calculateProfit, getStockRawData } from './profitCalculate';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Calculator,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Loader2,
  Search as SearchIcon,
  DollarSign,
  X,
} from 'lucide-react';

// ROE 계산 함수 (중복 방지를 위해 import 또는 여기서 정의)
const calculateROE = (netIncome: number, equity: number): number => {
  if (equity <= 0) return 0;
  return (netIncome / equity) * 100;
};

export default function ProfitCalculatorPage() {
  // URL 쿼리 파라미터 가져오기
  const searchParams = useSearchParams();

  // 상태 관리
  const [companyName, setCompanyName] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyInfo | null>(null);
  const [calculatedResult, setCalculatedResult] = useState<ProfitResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [showSearchForm, setShowSearchForm] = useState<boolean>(true);
  const [expandedROETable, setExpandedROETable] = useState<boolean>(false);
  const [autoSearchTriggered, setAutoSearchTriggered] = useState<boolean>(false);
  const [roeHistory, setRoeHistory] = useState<ROEData[] | null>(null);
  const [averageHistoricalROE, setAverageHistoricalROE] = useState<number>(0);
  const [loadingROE, setLoadingROE] = useState<boolean>(false);

  // 수익가치 계산 파라미터
  const [profitParams, setProfitParams] = useState<ProfitCalculationParams>({
    settingROE: 10,
    discountRate: 10,
    sustainableYears: 10,
  });

  // 드롭다운 옵션
  const discountRateOptions = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const sustainableYearsOptions = Array.from({ length: 16 }, (_, i) => i + 5); // 5-20년
  const settingROEOptions = Array.from({ length: 16 }, (_, i) => i + 5); // 5-20%

  // 회사 선택 핸들러
  const handleCompanySelect = async (company: CompanyInfo) => {
    setCompanyName(company.companyName);
    setSelectedCompany(company);

    // ROE 히스토리 로드
    setLoadingROE(true);
    try {
      const rawData = await getStockRawData(company.stockCode);
      if (rawData) {
        const roeData: ROEData[] = [
          {
            year: 2022,
            netIncome: rawData['2022_net_income'],
            equity: rawData['2022_equity'],
            roe: calculateROE(rawData['2022_net_income'], rawData['2022_equity']),
          },
          {
            year: 2023,
            netIncome: rawData['2023_net_income'],
            equity: rawData['2023_equity'],
            roe: calculateROE(rawData['2023_net_income'], rawData['2023_equity']),
          },
          {
            year: 2024,
            netIncome: rawData['2024_net_income'],
            equity: rawData['2024_equity'],
            roe: calculateROE(rawData['2024_net_income'], rawData['2024_equity']),
          },
        ];

        const validROEs = roeData.filter((data) => data.roe > 0);
        const avgROE =
          validROEs.length > 0
            ? validROEs.reduce((sum, data) => sum + data.roe, 0) / validROEs.length
            : 0;

        setRoeHistory(roeData);
        setAverageHistoricalROE(avgROE);

        // 평균 ROE를 기본값으로 설정
        if (avgROE > 0) {
          handleParamChange('settingROE', Math.round(avgROE));
        }
      }
    } catch (error) {
      console.error('ROE 데이터 로드 실패:', error);
    } finally {
      setLoadingROE(false);
    }
  };

  // URL 쿼리 파라미터에서 stockCode를 읽어 자동 검색 수행
  useEffect(() => {
    const stockCode = searchParams.get('stockCode');

    if (autoSearchTriggered || !stockCode) {
      return;
    }

    const company = Object.values(stockCodeMap).find((company) => company.stockCode === stockCode);

    if (company) {
      handleCompanySelect(company);
      setAutoSearchTriggered(true);
      setTimeout(() => {
        performSearch(company.stockCode);
      }, 100);
    }
  }, [searchParams, autoSearchTriggered]);

  // 검색 수행 함수
  const performSearch = async (stockCode: string) => {
    setCalculatedResult(null);
    setSuccess(false);
    setError('');
    setLoading(true);

    try {
      const result = await calculateProfit(stockCode, profitParams);

      if (!result) {
        throw new Error(`${selectedCompany?.companyName || '주식'}의 데이터를 찾을 수 없습니다`);
      }

      setCalculatedResult(result);
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

    if (!selectedCompany) {
      setError('회사를 검색하고 선택해주세요');
      return;
    }

    const stockCode = selectedCompany.stockCode;
    await performSearch(stockCode);
  };

  // 파라미터 변경 시 재계산
  const handleParamChange = (param: keyof ProfitCalculationParams, value: number) => {
    setProfitParams((prev) => ({
      ...prev,
      [param]: value,
    }));
  };

  // 재계산 함수
  const handleRecalculate = async () => {
    if (selectedCompany) {
      await performSearch(selectedCompany.stockCode);
    }
  };

  // 숫자 포맷팅 함수
  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  // 수익률 색상 결정 함수
  const getReturnColor = (returnRate: number): string => {
    if (returnRate > 20) return 'text-emerald-600 font-bold';
    if (returnRate > 10) return 'text-emerald-500';
    if (returnRate > 0) return 'text-blue-600';
    if (returnRate > -10) return 'text-gray-600';
    return 'text-red-500';
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 px-4 sm:px-6 py-4 sm:py-6">
      {/* 헤더 */}
      {/* <header className="mb-6 max-w-4xl mx-auto w-full">
        <div className="bg-white shadow-sm rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/"
              className="mr-3 sm:mr-4 text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
            
                수익가치 계산기
              </h1>
              <p className="text-sm text-gray-600 mt-1">기업이 버는 돈으로 적정 주가 계산하기</p>
            </div>
          </div>
        </div>
      </header> */}

      <main className="flex-1 max-w-4xl mx-auto w-full">
        {/* 검색 영역 */}
        {showSearchForm ? (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md mb-6 border border-gray-100">
            <div className="mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">기업 검색</h2>
              <p className="text-sm text-gray-600">적정가격을 계산할 기업을 검색하세요</p>
            </div>

            <form onSubmit={handleSearch}>
              <div className="flex flex-col gap-5 sm:gap-6">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                    회사명
                  </label>
                  <CompanySearchInput
                    onCompanySelect={handleCompanySelect}
                    initialValue={companyName}
                    placeholder="회사명 또는 종목코드 입력"
                  />
                </div>

                {/* 선택된 회사의 ROE 히스토리 표시 */}
                {selectedCompany && roeHistory && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-3">
                      📊 {selectedCompany.companyName}의 최근 3년 수익성
                    </h3>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {roeHistory.map((data) => (
                        <div key={data.year} className="bg-white rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-600">{data.year}년</p>
                          <p className="text-lg font-bold text-blue-700">{data.roe.toFixed(1)}%</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-blue-100 rounded-lg p-3 text-center">
                      <p className="text-sm text-blue-800">3년 평균 ROE</p>
                      <p className="text-xl font-bold text-blue-900">
                        {averageHistoricalROE.toFixed(1)}%
                      </p>
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      💡 위 데이터를 참고하여 미래 수익성을 예측해보세요
                    </p>
                  </div>
                )}

                {/* 3단계 설명 박스 - 검색 폼에서만 보임 */}
                <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
                  <h3 className="font-bold text-green-900 mb-3 text-lg">
                    💰 3단계로 적정가격 찾기
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">
                        1
                      </span>
                      <div>
                        <p className="font-medium text-green-800">기업이 얼마나 버나요?</p>
                        <p className="text-sm text-green-700">
                          자기자본 대비 수익률(ROE)을 입력하세요
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">
                        2
                      </span>
                      <div>
                        <p className="font-medium text-green-800">얼마나 오래 버나요?</p>
                        <p className="text-sm text-green-700">
                          이 수익이 지속될 기간을 예상하세요 (보통 5-10년)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">
                        3
                      </span>
                      <div>
                        <p className="font-medium text-green-800">내가 원하는 수익률은?</p>
                        <p className="text-sm text-green-700">
                          최소한 얻고 싶은 연 수익률을 정하세요
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 수익가치 파라미터 입력 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      💵 기업 수익성 (ROE %)
                    </label>
                    <select
                      value={profitParams.settingROE}
                      onChange={(e) => handleParamChange('settingROE', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {settingROEOptions.map((roe) => (
                        <option key={roe} value={roe}>
                          {roe}% {roe >= 15 ? '(우수)' : roe >= 10 ? '(양호)' : '(보통)'}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">자본 100원당 연간 수익</p>
                    {selectedCompany && averageHistoricalROE > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          handleParamChange('settingROE', Math.round(averageHistoricalROE))
                        }
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                      >
                        → 평균값({Math.round(averageHistoricalROE)}%) 사용하기
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ⏰ 예상 유지 기간
                    </label>
                    <select
                      value={profitParams.sustainableYears}
                      onChange={(e) =>
                        handleParamChange('sustainableYears', Number(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {sustainableYearsOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}년 {year <= 5 ? '(단기)' : year <= 10 ? '(중기)' : '(장기)'}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">이 수익이 지속될 기간</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🎯 목표 수익률
                    </label>
                    <select
                      value={profitParams.discountRate}
                      onChange={(e) => handleParamChange('discountRate', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {discountRateOptions.map((rate) => (
                        <option key={rate} value={rate}>
                          연 {rate}% {rate <= 7 ? '(안정형)' : rate <= 10 ? '(균형형)' : '(공격형)'}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">내가 원하는 최소 수익률</p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 sm:py-4 px-4 rounded-xl transition-all duration-300 flex items-center justify-center mt-3 shadow-sm hover:shadow group relative overflow-hidden"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="mr-3 animate-spin" />
                      계산 중...
                    </>
                  ) : (
                    <>
                      <Calculator size={20} className="mr-3" />
                      적정가격 계산하기
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 sm:px-6 shadow-md mb-6 flex justify-between items-center border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-50 rounded-full mr-3">
                <Calculator className="h-5 w-5 sm:h-5 sm:w-5 text-emerald-600" />
              </div>
              <p className="text-lg font-semibold text-gray-800 truncate">
                {selectedCompany?.companyName}{' '}
                <span className="font-normal text-sm text-gray-500">
                  ({selectedCompany?.stockCode})
                </span>
              </p>
            </div>
            <button
              onClick={() => setShowSearchForm(true)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 text-sm rounded-xl flex items-center transition-all duration-300 group"
            >
              <SearchIcon className="h-4 w-4 sm:mr-2 group-hover:scale-110 transition-transform duration-300" />
              <span className="hidden sm:block">다른 종목</span>
            </button>
          </div>
        )}

        {/* 로딩 상태 */}
        {loading && (
          <div className="bg-white rounded-2xl p-8 shadow-md flex flex-col items-center justify-center mb-6 border border-gray-100">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-emerald-600 animate-spin"></div>
            </div>
            <div className="text-center">
              <p className="text-lg text-gray-700 font-medium mb-2">데이터를 분석하는 중...</p>
              <p className="text-sm text-gray-500">잠시만 기다려주세요</p>
            </div>
          </div>
        )}

        {/* 오류 메시지 */}
        {error && !loading && (
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-md mb-6 border-l-4 border-red-500">
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

        {/* 결과 영역 */}
        {success && calculatedResult && (
          <div>
            {/* 수익가치 분석 결과 */}
            <div className="bg-gradient-to-tl from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl p-6 sm:p-8 shadow-md mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-5">
                💰 예상 수익률 분석
              </h2>

              <div className="grid grid-cols-3  sm:gap-4">
                {/* 현재 주가 */}
                <div className="text-center p-4">
                  <p className="text-sm text-gray-600 mb-1">현재 주가</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-800">
                    {formatNumber(calculatedResult.currentPrice)}원
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PBR {calculatedResult.currentPBR.toFixed(2)}
                  </p>
                </div>

                {/* 화살표와 수익률 */}
                <div className="flex items-center justify-center">
                  <div className="text-center ">
                    {/* <svg
                      className="w-8 h-8 mx-auto text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg> */}
                    <p
                      className={`text-xl font-bold mt-2 sm:text-4xl ${
                        calculatedResult.expectedReturn > 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {calculatedResult.expectedReturn >= 0 ? '+ ' : ' '}
                      {calculatedResult.expectedReturn.toFixed(1)}
                      <span className="text-sm sm:text-xl"> %</span>
                    </p>
                  </div>
                </div>

                {/* 적정 주가 */}
                <div className="text-center p-4">
                  <p className="text-sm text-gray-600 mb-1">적정 주가</p>
                  <p className="text-lg sm:text-2xl font-bold text-emerald-600">
                    {formatNumber(calculatedResult.expectedPrice)}원
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    PBR {calculatedResult.expectedPBR.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="rounded-b-xl text-center">
                <hr />
                <p className="text-xs sm:text-sm text-gray-600 mt-2">
                  ({profitParams.sustainableYears}년간 ROE {profitParams.settingROE}% 유지, 목표
                  수익률 {profitParams.discountRate}% 가정)
                </p>
              </div>

              {/* 수익 예상 설명 */}
              {/* <div
                className={`p-5 rounded-xl text-center ${
                  calculatedResult.expectedReturn > 0
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
                    : 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200'
                }`}
              >
                <p className="text-gray-700 mb-2">지금 사면</p>
                <p
                  className={`text-xl font-bold ${
                    calculatedResult.expectedReturn > 0 ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  <span className="text-2xl mx-1">
                    {calculatedResult.expectedReturn >= 0 ? '+' : ''}
                    {calculatedResult.expectedReturn.toFixed(1)}%
                  </span>
                  {calculatedResult.expectedReturn > 0 ? '수익' : '손실'} 예상
                </p>
                <p className="text-sm text-gray-600 mt-3">
                  ({profitParams.sustainableYears}년간 ROE {profitParams.settingROE}% 유지, 목표
                  수익률 {profitParams.discountRate}% 가정)
                </p>
              </div> */}

              {/* ROE가 할인율보다 낮을 때 경고 메시지 */}
              {profitParams.settingROE < profitParams.discountRate && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-xs sm:text-sm text-yellow-800">
                    <strong>⚠️ 주의:</strong> 설정한 ROE({profitParams.settingROE}%)가 목표 수익률(
                    {profitParams.discountRate}%)보다 낮습니다. 이는 기업이 투자자가 요구하는
                    수익률보다 낮은 수익을 내고 있다는 의미로, 보유 기간이 길수록 투자 가치가
                    감소합니다.
                  </p>
                </div>
              )}
            </div>

            {/* 파라미터 조정 섹션 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md mb-6 border border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-5">📊 계산 파라미터</h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💵 기업 수익성 (ROE %)
                  </label>
                  <select
                    value={profitParams.settingROE}
                    onChange={(e) => handleParamChange('settingROE', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {settingROEOptions.map((roe) => (
                      <option key={roe} value={roe}>
                        {roe}% {roe >= 15 ? '(우수)' : roe >= 10 ? '(양호)' : '(보통)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⏰ 예상 유지 기간
                  </label>
                  <select
                    value={profitParams.sustainableYears}
                    onChange={(e) => handleParamChange('sustainableYears', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {sustainableYearsOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}년 {year <= 5 ? '(단기)' : year <= 10 ? '(중기)' : '(장기)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🎯 목표 수익률
                  </label>
                  <select
                    value={profitParams.discountRate}
                    onChange={(e) => handleParamChange('discountRate', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {discountRateOptions.map((rate) => (
                      <option key={rate} value={rate}>
                        연 {rate}% {rate <= 7 ? '(안정형)' : rate <= 10 ? '(균형형)' : '(공격형)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleRecalculate}
                className="w-full mt-5 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center"
              >
                재계산하기
              </button>
            </div>

            {/* ROE 데이터 테이블 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md mb-6 border border-gray-100">
              <button
                className="w-full flex items-center justify-between mb-5"
                onClick={() => setExpandedROETable(!expandedROETable)}
              >
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                  📈 연도별 수익성 현황
                </h2>
                <div className="bg-gray-100 p-2 rounded-full">
                  {expandedROETable ? (
                    <ChevronUp className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  )}
                </div>
              </button>

              {expandedROETable && (
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                            연도
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                            순이익
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                            자기자본
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                            ROE (%)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculatedResult.roeData.map((data) => (
                          <tr key={data.year} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm">{data.year}년</td>
                            <td className="py-3 px-4 text-sm text-right">
                              {formatNumber(data.netIncome)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right">
                              {formatNumber(data.equity)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right font-medium">
                              {data.roe.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-bold">
                          <td className="py-3 px-4 text-sm" colSpan={3}>
                            3년 평균 ROE
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-emerald-600">
                            {calculatedResult.averageROE.toFixed(2)}%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* 계산 방법 설명 */}
            <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
              <h3 className="font-bold text-gray-800 mb-4">💡 어떻게 계산했나요?</h3>

              <div className="space-y-3 text-sm">
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="font-medium text-yellow-800 mb-1">기본 아이디어</p>
                  <p className="text-yellow-700">
                    "{profitParams.sustainableYears}년 후에 이 회사를 팔아버린다고 가정하고,
                    그때까지 벌어들일 돈을 현재 가치로 계산했어요"
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-800 mb-1">실제 계산</p>
                  <p className="text-gray-700">
                    기업이 매년 {profitParams.settingROE}%씩 성장하고, 내가 원하는 수익률{' '}
                    {profitParams.discountRate}%를 고려하면,
                    {profitParams.sustainableYears}년 후의 가치는 현재의{' '}
                    {calculatedResult.expectedPBR.toFixed(2)}배가 됩니다.
                  </p>
                </div>

                {profitParams.settingROE < profitParams.discountRate && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="font-medium text-red-800 mb-1">가치 파괴 상황</p>
                    <p className="text-red-700">
                      ROE가 목표 수익률보다 낮으면, 이 기업을 오래 보유할수록 기회비용이 커집니다.
                      따라서 보유 기간이 길수록 적정 PBR이 낮아집니다.
                    </p>
                  </div>
                )}

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="font-mono text-xs text-gray-600">
                    예상 적정 PBR = [(1+{profitParams.settingROE}%)/(1+{profitParams.discountRate}
                    %)]^{profitParams.sustainableYears}
                  </p>
                  <p className="font-mono text-xs text-gray-600 mt-1">
                    = {calculatedResult.expectedPBR.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* 투자 참고사항 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100">
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                <div className="font-medium text-amber-800 mb-3 flex items-center">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  투자 결정 전 확인사항
                </div>
                <ul className="list-disc pl-5 space-y-2 text-amber-700">
                  <li>
                    본 계산기는 {profitParams.sustainableYears}년 후 청산을 가정한 참고 도구입니다
                  </li>
                  <li>실제 기업가치는 더 높을 수 있습니다 (영구가치 미반영)</li>
                  <li>ROE, 목표 수익률, 지속기간은 투자자의 주관적 판단사항입니다</li>
                  <li>다른 평가 지표와 함께 종합적으로 검토하세요</li>
                </ul>
              </div>

              <hr className="mt-6" />

              {/* 페이지 하단 네비게이션 버튼 */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <Link
                  href={`/fairprice?stockCode=${selectedCompany?.stockCode}`}
                  className="w-full"
                >
                  <button className="w-full inline-flex items-center justify-center bg-emerald-600 text-white px-5 py-3 rounded-xl text-sm sm:text-base font-medium hover:bg-emerald-700 transition-all duration-300 shadow-sm hover:shadow group relative overflow-hidden">
                    <span className="relative flex items-center">
                      적정가 계산
                      <svg
                        className="ml-2 w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform duration-300"
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
                    </span>
                  </button>
                </Link>

                <a
                  href={`https://finance.naver.com/item/main.naver?code=${selectedCompany?.stockCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <button className="w-full inline-flex items-center justify-center bg-emerald-600 text-white px-5 py-3 rounded-xl text-sm sm:text-base font-medium hover:bg-emerald-700 transition-all duration-300 shadow-sm hover:shadow group relative overflow-hidden">
                    <span className="relative flex items-center">
                      네이버증권
                      <svg
                        className="ml-2 w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </span>
                  </button>
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
