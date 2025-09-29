//src/app/profit-calculator/page.tsx

'use client';

import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  TrendingUp,
  Clock,
  Target,
} from 'lucide-react';
import { formatAsset } from '@/utils/stockUtils';
import RiskWarning from '@/components/RiskWarning';

// ROE 계산 함수
const calculateROE = (netIncome: number, equity: number): number => {
  if (equity <= 0) return 0;
  return (netIncome / equity) * 100;
};

export default function ProfitCalculatorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

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

  // 애니메이션 키프레임
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

  // 회사 선택 핸들러
  const handleCompanySelect = async (company: CompanyInfo, autoSearch: boolean = false) => {
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

        // 소수점 2자리로 반올림하여 적용
        if (avgROE > 0) {
          handleParamChange('settingROE', parseFloat(avgROE.toFixed(2)));
        }
      }
    } catch (error) {
      console.error('ROE 데이터 로드 실패:', error);
    } finally {
      setLoadingROE(false);
    }

    // 엔터키로 선택했으면 바로 분석 시작
    if (autoSearch) {
      console.log('🚀 profit-calculator 자동 분석 시작!');
      setAutoSearchTriggered(true);
      setTimeout(() => performSearch(company.stockCode), 100);
    }
  };

  // URL 쿼리 파라미터 처리
  useEffect(() => {
    const stockCode = searchParams.get('stockCode');

    if (!stockCode) {
      console.log('🧹 stockCode 없음 - 초기화');
      setCompanyName('');
      setSelectedCompany(null);
      setCalculatedResult(null);
      setSuccess(false);
      setError('');
      setShowSearchForm(true);
      setAutoSearchTriggered(false);
      setExpandedROETable(false);
      setRoeHistory(null);
      setAverageHistoricalROE(0);
      setLoadingROE(false);
      return;
    }

    if (selectedCompany?.stockCode !== stockCode) {
      console.log('🔍 새로운 종목 검색:', stockCode);
      const company = Object.values(stockCodeMap).find((c) => c.stockCode === stockCode);
      if (company) {
        handleCompanySelect(company);
        setAutoSearchTriggered(true);
        setTimeout(() => performSearch(company.stockCode), 100);
      }
    }
  }, [searchParams]);

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

      const url = new URL(window.location.href);
      url.searchParams.set('stockCode', stockCode);
      router.push(url.pathname + url.search, { scroll: false });

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
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
    setAutoSearchTriggered(true);
    await performSearch(selectedCompany.stockCode);
  };

  // 파라미터 변경 핸들러
  const handleParamChange = (param: keyof ProfitCalculationParams, value: number) => {
    const cleanValue = isNaN(value) || value < 0 ? 0 : value;
    setProfitParams((prev) => ({
      ...prev,
      [param]: cleanValue,
    }));
  };

  // input 값 정리 함수
  const handleInputChange = (param: keyof ProfitCalculationParams, inputValue: string) => {
    if (inputValue === '') {
      handleParamChange(param, 0);
      return;
    }
    const numValue = parseFloat(inputValue);
    handleParamChange(param, numValue);
  };

  // 계산 버튼 클릭 핸들러
  const handleCalculateClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!selectedCompany) {
      setError('회사를 검색하고 선택해주세요');
      return;
    }

    // 유효성 검사
    if (profitParams.settingROE < 0.1 || profitParams.settingROE > 100) {
      setError('ROE는 0.1%에서 100% 사이여야 합니다');
      return;
    }
    if (profitParams.discountRate < 1 || profitParams.discountRate > 30) {
      setError('목표 수익률은 1%에서 30% 사이여야 합니다');
      return;
    }
    if (profitParams.sustainableYears < 1 || profitParams.sustainableYears > 30) {
      setError('지속 기간은 1년에서 30년 사이여야 합니다');
      return;
    }

    setAutoSearchTriggered(true);
    performSearch(selectedCompany.stockCode);
  };

  // 재계산 함수
  const handleRecalculate = async () => {
    if (selectedCompany) {
      await performSearch(selectedCompany.stockCode);
    }
  };

  // 평균 ROE 적용 함수
  const applyAverageROE = () => {
    if (averageHistoricalROE > 0) {
      handleParamChange('settingROE', averageHistoricalROE);
    }
  };

  // 숫자 포맷팅 함수
  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 px-4 sm:px-6 py-4 sm:py-6">
      <RiskWarning stockCode={selectedCompany?.stockCode || ''} />
      <main className="flex-1 max-w-4xl mx-auto w-full">
        {/* 검색 영역 */}
        {showSearchForm ? (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md mb-6 border border-gray-100">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                💰 수익가치 계산기
              </h2>
              <p className="text-gray-600">기업의 수익성을 바탕으로 적정 투자가치를 계산해보세요</p>
            </div>

            <form onSubmit={handleSearch}>
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  🔍 분석할 기업 선택
                </label>
                <CompanySearchInput
                  onCompanySelect={handleCompanySelect}
                  initialValue={companyName}
                  placeholder="회사명 또는 종목코드 입력"
                  className="transition-all duration-300 focus-within:shadow-md"
                />
              </div>

              {/* 4단계 입력 폼 */}
              {selectedCompany && (
                <div className="animate-fadeIn">
                  <h3 className="text-lg font-bold text-gray-800 mb-6 text-center">
                    🎯 투자 시나리오 설정하기
                  </h3>

                  {/* 간결한 4단계 그리드 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* 1단계 - ROE */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center mb-3">
                        <span className="bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">
                          1
                        </span>
                        <TrendingUp className="h-4 w-4 text-emerald-600 mr-2" />
                        <h3 className="font-bold text-gray-800 text-sm">예상 ROE</h3>
                      </div>
                      <input
                        type="number"
                        min="0.1"
                        max="100"
                        step="0.1"
                        value={profitParams.settingROE === 0 ? '' : profitParams.settingROE}
                        onChange={(e) => handleInputChange('settingROE', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                        placeholder="ROE (%)"
                      />
                      <p className="text-xs text-gray-500 mt-1 text-center">0.1-100% 입력</p>
                    </div>

                    {/* 2단계 - 지속기간 */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center mb-3">
                        <span className="bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">
                          2
                        </span>
                        <Clock className="h-4 w-4 text-emerald-600 mr-2" />
                        <h3 className="font-bold text-gray-800 text-sm">지속기간</h3>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={
                          profitParams.sustainableYears === 0 ? '' : profitParams.sustainableYears
                        }
                        onChange={(e) => handleInputChange('sustainableYears', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                        placeholder="년"
                      />
                      <p className="text-xs text-gray-500 mt-1 text-center">1-30년 입력</p>
                    </div>

                    {/* 3단계 - 목표수익률 */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center mb-3">
                        <span className="bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">
                          3
                        </span>
                        <Target className="h-4 w-4 text-emerald-600 mr-2" />
                        <h3 className="font-bold text-gray-800 text-sm">목표수익률</h3>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        step="0.1"
                        value={profitParams.discountRate === 0 ? '' : profitParams.discountRate}
                        onChange={(e) => handleInputChange('discountRate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                        placeholder="연 %"
                      />
                      <p className="text-xs text-gray-500 mt-1 text-center">1-30% 입력</p>
                    </div>

                    {/* 4단계 - 추천값 */}
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                      <div className="flex items-center mb-3">
                        <span className="bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">
                          💡
                        </span>
                        <h3 className="font-bold text-emerald-800 text-sm">실제 데이터</h3>
                      </div>
                      {loadingROE ? (
                        <div className="text-center py-2">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto text-emerald-600" />
                        </div>
                      ) : averageHistoricalROE > 0 ? (
                        <>
                          <div className="text-center mb-2">
                            <p className="text-xs text-emerald-700 mb-1">3년 평균 ROE</p>
                            <p className="text-2xl font-bold text-emerald-800">
                              {averageHistoricalROE.toFixed(1)}%
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={applyAverageROE}
                            className="w-full text-xs bg-emerald-600 text-white px-2 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            이 값 적용
                          </button>
                        </>
                      ) : (
                        <p className="text-xs text-center text-emerald-700 py-4">
                          데이터 로딩 중...
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 간단한 도움말 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-600 mb-6">
                    <div className="text-center">
                      <p className="font-medium">💡 ROE</p>
                      <p>자기자본 대비 수익률</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">💡 지속기간</p>
                      <p>경쟁우위 유지기간</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">💡 목표수익률</p>
                      <p>투자자 요구 수익률</p>
                    </div>
                  </div>

                  {/* 계산 버튼 */}
                  <button
                    onClick={handleCalculateClick}
                    type="button"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl text-lg font-bold"
                    disabled={loading || !selectedCompany}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={24} className="mr-3 animate-spin" />
                        계산 중...
                      </>
                    ) : (
                      <>
                        <Calculator size={24} className="mr-3" />
                        투자 가치 계산하기
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 sm:px-6 shadow-md mb-6 flex justify-between items-center border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-50 rounded-full mr-3">
                <Calculator className="h-5 w-5 text-emerald-600" />
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
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 text-sm rounded-xl flex items-center transition-all duration-300"
            >
              <SearchIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:block">다른 종목</span>
            </button>
          </div>
        )}

        {/* 로딩 상태 */}
        {loading && (
          <div className="bg-white rounded-2xl p-8 shadow-md flex flex-col items-center justify-center mb-6">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-emerald-600 animate-spin"></div>
            </div>
            <div className="text-center">
              <p className="text-lg text-gray-700 font-medium mb-2">투자 가치를 분석하는 중...</p>
              <p className="text-sm text-gray-500">잠시만 기다려주세요</p>
            </div>
          </div>
        )}

        {/* 오류 메시지 */}
        {error && !loading && (
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-md mb-6 border-l-4 border-red-500 animate-fadeIn">
            <div className="flex items-start">
              <div className="bg-red-50 p-2 rounded-full mr-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="font-medium text-base text-gray-800">오류</p>
                <p className="text-sm text-gray-600 mt-2">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 결과 영역 */}
        {success && calculatedResult && (
          <div className="animate-fadeIn space-y-6">
            {/* 메인 결과 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-md">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 text-center">
                📊 투자 가치 분석 결과
              </h2>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-2">현재 주가</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800">
                    {formatNumber(calculatedResult.currentPrice)}원
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PBR {calculatedResult.currentPBR.toFixed(2)}
                  </p>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-2">예상 수익률</p>
                  <p
                    className={`text-xl sm:text-2xl font-bold ${
                      calculatedResult.expectedReturn > 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {calculatedResult.expectedReturn >= 0 ? '+' : ''}
                    {calculatedResult.expectedReturn.toFixed(1)}%
                  </p>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-2">적정 주가</p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-600">
                    {formatNumber(calculatedResult.expectedPrice)}원
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    PBR {calculatedResult.expectedPBR.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="text-center text-sm text-gray-600 border-t pt-4">
                ({profitParams.sustainableYears}년간 ROE {profitParams.settingROE.toFixed(1)}% 유지,
                목표 수익률 {profitParams.discountRate}% 가정)
              </div>
            </div>

            {/* 파라미터 조정 섹션 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6">🔧 설정 값 조정하기</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💰 자본 효율성 (ROE %)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={profitParams.settingROE === 0 ? '' : profitParams.settingROE}
                    onChange={(e) => handleInputChange('settingROE', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⏰ 지속 기간
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={profitParams.sustainableYears === 0 ? '' : profitParams.sustainableYears}
                    onChange={(e) => handleInputChange('sustainableYears', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🎯 목표 수익률
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    step="0.1"
                    value={profitParams.discountRate === 0 ? '' : profitParams.discountRate}
                    onChange={(e) => handleInputChange('discountRate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                onClick={handleRecalculate}
                className="w-full mt-6 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center font-medium"
              >
                다시 계산하기
              </button>
            </div>

            {/* 투자 시나리오 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6">
                💡 내 투자금은 어떻게 될까요?
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">💰 100만원 투자 시</p>
                    <p className="text-2xl font-bold text-gray-800 mb-2">
                      {profitParams.sustainableYears}년 후 →{' '}
                      {formatNumber(1000000 * (1 + calculatedResult.expectedReturn / 100))}원
                    </p>
                    <p className="text-sm text-gray-600">
                      연평균{' '}
                      {(calculatedResult.expectedReturn / profitParams.sustainableYears).toFixed(1)}
                      % 수익
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">💰 1,000만원 투자 시</p>
                    <p className="text-2xl font-bold text-gray-800 mb-2">
                      {profitParams.sustainableYears}년 후 →{' '}
                      {formatNumber(10000000 * (1 + calculatedResult.expectedReturn / 100))}원
                    </p>
                    <p className="text-sm text-red-600">
                      인플레이션(연 2%) 고려 시 실질수익률:{' '}
                      {(
                        calculatedResult.expectedReturn / profitParams.sustainableYears -
                        2
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                </div>
              </div>

              {/* 경고 메시지 */}
              {profitParams.settingROE < profitParams.discountRate && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ 주의:</strong> 설정한 ROE({profitParams.settingROE.toFixed(1)}%)가
                    목표 수익률(
                    {profitParams.discountRate}%)보다 낮습니다. 이는 기업이 투자자가 요구하는
                    수익률보다 낮은 수익을 내고 있다는 의미로, 보유 기간이 길수록 투자 가치가
                    감소합니다.
                  </p>
                </div>
              )}
            </div>

            {/* ROE 데이터 테이블 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100">
              <button
                className="w-full flex items-center justify-between"
                onClick={() => setExpandedROETable(!expandedROETable)}
              >
                <h3 className="text-lg font-bold text-gray-800">📈 연도별 수익성 현황</h3>
                <div className="bg-gray-100 p-2 rounded-full">
                  {expandedROETable ? (
                    <ChevronUp className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  )}
                </div>
              </button>

              {expandedROETable && (
                <div className="mt-6">
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
                              {formatAsset(data.netIncome)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right">
                              {formatAsset(data.equity)}
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
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">💡 어떻게 계산했나요?</h3>

              <div className="space-y-4 text-sm">
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="font-medium text-yellow-800 mb-2">기본 아이디어</p>
                  <p className="text-yellow-700">
                    "{profitParams.sustainableYears}년 후에 이 회사 지분을 처분한다고 가정하고,
                    그때까지의 가치 증가를 현재 기준으로 계산했습니다"
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-800 mb-2">실제 계산</p>
                  <p className="text-gray-700 mb-3">
                    기업이 매년 자기자본 대비 {profitParams.settingROE.toFixed(1)}%의 수익을 내고,
                    투자자가 원하는 수익률 {profitParams.discountRate}%를 고려하면,
                    {profitParams.sustainableYears}년 후의 적정 PBR은 현재의{' '}
                    {calculatedResult.expectedPBR.toFixed(2)}배가 됩니다.
                  </p>
                  <div className="p-3 bg-white rounded border">
                    <p className="font-mono text-xs text-gray-600">
                      예상 적정 PBR = [(1+{profitParams.settingROE.toFixed(1)}%)÷(1+
                      {profitParams.discountRate}
                      %)]^{profitParams.sustainableYears}
                    </p>
                    <p className="font-mono text-xs text-gray-600 mt-1">
                      = {calculatedResult.expectedPBR.toFixed(2)}
                    </p>
                  </div>
                </div>

                {profitParams.settingROE < profitParams.discountRate && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="font-medium text-red-800 mb-2">가치 파괴 상황</p>
                    <p className="text-red-700">
                      ROE가 목표 수익률보다 낮으면, 이 기업을 오래 보유할수록 기회비용이 커집니다.
                      따라서 보유 기간이 길수록 적정 PBR이 낮아집니다.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 네비게이션 버튼 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100">
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl text-sm mb-6">
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
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                  href={`/checklist?stockCode=${selectedCompany?.stockCode}`}
                  className="w-full"
                >
                  <button className="w-full inline-flex items-center justify-center bg-emerald-600 text-white px-5 py-3 rounded-xl text-sm sm:text-base font-medium hover:bg-emerald-700 transition-all duration-300 shadow-sm hover:shadow group relative overflow-hidden">
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-500 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative flex items-center">
                      체크리스트
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

                <Link
                  href={`/profit-calculator?stockCode=${selectedCompany?.stockCode}`}
                  className="w-full"
                >
                  <button className="w-full inline-flex items-center justify-center bg-emerald-600 text-white px-5 py-3 rounded-xl text-sm sm:text-base font-medium hover:bg-emerald-700 transition-all duration-300 shadow-sm hover:shadow group relative overflow-hidden">
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-500 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative flex items-center">
                      수익가치 계산
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
