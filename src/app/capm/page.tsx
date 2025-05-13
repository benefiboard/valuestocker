//src/app/capm/page.tsx

'use client';

import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import CompanySearchInput from '@/components/CompanySearchInput';
import { CompanyInfo, stockCodeMap } from '../../lib/stockCodeData';
import { CAPMResult, CAPMCalculationParams } from './types';
import { calculateCAPM } from './capmCalculate';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  BarChart4,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  Search as SearchIcon,
  Target,
  DollarSign,
  TrendingUp,
  X,
} from 'lucide-react';

export default function CAPMPage() {
  // URL 쿼리 파라미터 가져오기
  const searchParams = useSearchParams();

  // 상태 관리
  const [companyName, setCompanyName] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyInfo | null>(null);
  const [calculatedResult, setCalculatedResult] = useState<CAPMResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [showSearchForm, setShowSearchForm] = useState<boolean>(true);
  const [expandedROETable, setExpandedROETable] = useState<boolean>(false);
  const [autoSearchTriggered, setAutoSearchTriggered] = useState<boolean>(false);

  // CAPM 계산 파라미터
  const [capmParams, setCAPMParams] = useState<CAPMCalculationParams>({
    settingROE: 10,
    discountRate: 10,
    sustainableYears: 10,
  });

  // 드롭다운 옵션
  const discountRateOptions = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const sustainableYearsOptions = Array.from({ length: 16 }, (_, i) => i + 5); // 5-20년
  const settingROEOptions = Array.from({ length: 16 }, (_, i) => i + 5); // 5-20%

  // 회사 선택 핸들러
  const handleCompanySelect = (company: CompanyInfo) => {
    setCompanyName(company.companyName);
    setSelectedCompany(company);
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
      const result = await calculateCAPM(stockCode, capmParams);

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
  const handleParamChange = (param: keyof CAPMCalculationParams, value: number) => {
    setCAPMParams((prev) => ({
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

  // 애니메이션 키프레임 추가
  const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  .animate-pulse-slow {
    animation: pulse 2s ease-in-out infinite;
  }
  `;

  // 스타일 태그 추가
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleTag = document.createElement('style');
      styleTag.textContent = styles;
      document.head.appendChild(styleTag);

      return () => {
        document.head.removeChild(styleTag);
      };
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 px-4 sm:px-6 py-8">
      {/* 헤더 */}
      <header className="mb-6 max-w-4xl mx-auto w-full sticky top-0 z-10">
        <div className="bg-white bg-opacity-90 backdrop-blur-md shadow-sm rounded-2xl p-4 flex items-center">
          <Link
            href="/"
            className="mr-3 sm:mr-4 text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
            <div className="hidden sm:block p-2 bg-emerald-50 rounded-full mr-3">
              <TrendingUp className="text-emerald-600 w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            CAPM 기반 PBR 분석
          </h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full">
        {/* 검색 영역 */}
        {showSearchForm ? (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md mb-6 border border-gray-100 transition-all duration-300 hover:shadow-lg">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">기업 검색</h2>
                <p className="text-sm text-gray-600">PBR 분석할 기업을 검색하세요</p>
              </div>
              <button
                onClick={() => setShowSearchForm(false)}
                className="bg-gray-100 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 group"
                aria-label="닫기"
              >
                <X
                  size={16}
                  className="text-gray-400 group-hover:text-gray-600 transition-colors duration-200"
                />
              </button>
            </div>

            <form onSubmit={handleSearch} className="transition-all duration-300">
              <div className="flex flex-col gap-5 sm:gap-6">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                    회사명
                  </label>
                  <div className="group transition-all duration-300 hover:shadow-md rounded-xl">
                    <CompanySearchInput
                      onCompanySelect={handleCompanySelect}
                      initialValue={companyName}
                      placeholder="회사명 또는 종목코드 입력"
                      className="transition-all duration-300 focus-within:shadow-md"
                    />
                  </div>
                </div>

                {/* CAPM 파라미터 입력 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      할인율 (%)
                    </label>
                    <select
                      value={capmParams.discountRate}
                      onChange={(e) => handleParamChange('discountRate', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {discountRateOptions.map((rate) => (
                        <option key={rate} value={rate}>
                          {rate}%
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      지속가능기간 (년)
                    </label>
                    <select
                      value={capmParams.sustainableYears}
                      onChange={(e) =>
                        handleParamChange('sustainableYears', Number(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {sustainableYearsOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}년
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      설정 ROE (%)
                    </label>
                    <select
                      value={capmParams.settingROE}
                      onChange={(e) => handleParamChange('settingROE', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {settingROEOptions.map((roe) => (
                        <option key={roe} value={roe}>
                          {roe}%
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 sm:py-4 px-4 rounded-xl transition-all duration-300 flex items-center justify-center mt-3 shadow-sm hover:shadow group relative overflow-hidden"
                  disabled={loading}
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-500 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative flex items-center">
                    {loading ? (
                      <>
                        <Loader2 size={20} className="mr-3 animate-spin" />
                        계산 중...
                      </>
                    ) : (
                      <>
                        <TrendingUp
                          size={20}
                          className="mr-3 group-hover:scale-110 transition-transform duration-300"
                        />
                        PBR 분석하기
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 sm:px-6 shadow-md mb-6 flex justify-between items-center border border-gray-100 transition-all duration-300 hover:shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-50 rounded-full mr-3">
                <Target className="h-5 w-5 sm:h-5 sm:w-5 text-emerald-600" />
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
          <div className="bg-white rounded-2xl p-8 shadow-md flex flex-col items-center justify-center mb-6 transition-all duration-300 border border-gray-100">
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

        {/* 결과 영역 */}
        {success && calculatedResult && (
          <div className="animate-fadeIn">
            {/* 파라미터 조정 섹션 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md mb-6 border border-gray-100 transition-all duration-300 hover:shadow-lg">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-5 flex items-center">
                <div className="p-2 bg-emerald-50 rounded-full mr-3">
                  <BarChart4 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                </div>
                분석 파라미터
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">할인율 (%)</label>
                  <select
                    value={capmParams.discountRate}
                    onChange={(e) => handleParamChange('discountRate', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {discountRateOptions.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}%
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    지속가능기간 (년)
                  </label>
                  <select
                    value={capmParams.sustainableYears}
                    onChange={(e) => handleParamChange('sustainableYears', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {sustainableYearsOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}년
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    설정 ROE (%)
                  </label>
                  <select
                    value={capmParams.settingROE}
                    onChange={(e) => handleParamChange('settingROE', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {settingROEOptions.map((roe) => (
                      <option key={roe} value={roe}>
                        {roe}%
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
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md mb-6 border border-gray-100 transition-all duration-300 hover:shadow-lg">
              <button
                className="w-full flex items-center justify-between mb-5"
                onClick={() => setExpandedROETable(!expandedROETable)}
              >
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
                  <div className="p-2 bg-emerald-50 rounded-full mr-3">
                    <Info className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                  </div>
                  연도별 ROE 현황
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
                <div className="animate-fadeIn">
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

            {/* PBR 분석 결과 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md mb-6 border border-gray-100 transition-all duration-300 hover:shadow-lg">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-5 flex items-center">
                <div className="p-2 bg-emerald-50 rounded-full mr-3">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                </div>
                PBR 분석 결과
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">현재 PBR</h4>
                  <p className="text-2xl font-bold text-gray-800">
                    {calculatedResult.currentPBR.toFixed(2)}
                  </p>
                </div>

                <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">예상 적정 PBR</h4>
                  <p className="text-2xl font-bold text-emerald-600">
                    {calculatedResult.expectedPBR.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* 주가 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">현재 주가</h4>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatNumber(calculatedResult.currentPrice)}원
                  </p>
                </div>

                <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">예상 적정 주가</h4>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatNumber(calculatedResult.expectedPrice)}원
                  </p>
                </div>
              </div>

              {/* 예상 수익률 표시 */}
              <div className="p-6 bg-gradient-to-r from-gray-50 to-emerald-50 rounded-xl border border-gray-100">
                <h4 className="text-lg font-medium text-gray-800 mb-3">예상 수익률</h4>
                <p
                  className={`text-3xl font-bold ${getReturnColor(
                    calculatedResult.expectedReturn
                  )}`}
                >
                  {calculatedResult.expectedReturn >= 0 ? '+' : ''}
                  {calculatedResult.expectedReturn.toFixed(2)}%
                </p>
                <p className="text-sm text-gray-600 mt-2">현재 PBR 대비 예상 적정 PBR 기준</p>
              </div>

              {/* 계산 공식 표시 */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 font-medium mb-2">계산 공식:</p>
                <p className="text-sm text-gray-600">
                  예상 적정 PBR = [(1+{capmParams.settingROE}%)/(1+{capmParams.discountRate}%)]^
                  {capmParams.sustainableYears}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  예상 적정 주가 = BPS × 예상 적정 PBR (BPS = 현재 주가 / 현재 PBR)
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  예상 수익률 = (예상 적정 PBR - 현재 PBR) / 현재 PBR × 100%
                </p>
              </div>
            </div>

            {/* 투자 참고사항 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100">
              <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                <div className="font-medium text-gray-800 mb-3 flex items-center">
                  <div className="p-1 bg-emerald-50 rounded-full mr-2">
                    <Info className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                  </div>
                  투자 참고 사항:
                </div>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>예상 수익률은 설정한 파라미터에 따라 달라질 수 있습니다.</li>
                  <li>과거 ROE 추세와 기업의 사업 안정성을 함께 고려해야 합니다.</li>
                  <li>PBR만으로 투자 결정을 내리기보다는 다른 지표들과 함께 분석하세요.</li>
                  <li>시장 상황과 업종 특성에 따라 적정 PBR 수준이 달라질 수 있습니다.</li>
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
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-500 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-500 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
