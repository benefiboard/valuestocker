//src/app/simple-calculator/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import CompanySearchInput from '@/components/CompanySearchInput';
import { CompanyInfo, stockCodeMap } from '../../lib/stockCodeData';
import {
  TrendingUp,
  Target,
  Clock,
  Loader2,
  X,
  TrendingDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { calculateProfit, getStockRawData } from '../profit-calculator/profitCalculate';
import { ProfitCalculationParams, ProfitResult } from '../profit-calculator/types';

// ROE 계산 함수
const calculateROE = (netIncome: number, equity: number): number => {
  if (equity <= 0) return 0;
  return (netIncome / equity) * 100;
};

export default function SimpleCalculatorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedCompany, setSelectedCompany] = useState<CompanyInfo | null>(null);
  const [calculatedResult, setCalculatedResult] = useState<ProfitResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingROE, setLoadingROE] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [searchInputKey, setSearchInputKey] = useState<number>(0);

  // 입력 파라미터
  const [profitParams, setProfitParams] = useState<ProfitCalculationParams>({
    settingROE: 10,
    discountRate: 10,
    sustainableYears: 10,
  });

  // 회사 선택 핸들러
  const handleCompanySelect = async (company: CompanyInfo) => {
    setSelectedCompany(company);
    setError('');
    setCalculatedResult(null);
    setShowModal(false);

    setLoadingROE(true);
    try {
      const rawData = await getStockRawData(company.stockCode);
      if (rawData) {
        const roeData = [
          calculateROE(rawData['2022_net_income'], rawData['2022_equity']),
          calculateROE(rawData['2023_net_income'], rawData['2023_equity']),
          calculateROE(rawData['2024_net_income'], rawData['2024_equity']),
        ];

        const validROEs = roeData.filter((roe) => roe > 0);
        const avgROE =
          validROEs.length > 0
            ? validROEs.reduce((sum, roe) => sum + roe, 0) / validROEs.length
            : 10;

        setProfitParams((prev) => ({
          ...prev,
          settingROE: parseFloat(avgROE.toFixed(2)),
        }));
      }
    } catch (error) {
      console.error('ROE 데이터 로드 실패:', error);
    } finally {
      setLoadingROE(false);
    }
  };

  useEffect(() => {
    const stockCode = searchParams.get('stockCode');
    if (stockCode && !selectedCompany) {
      const company = Object.values(stockCodeMap).find((c) => c.stockCode === stockCode);
      if (company) {
        handleCompanySelect(company);
      }
    }
  }, [searchParams]);

  const performCalculation = async (
    stockCode: string,
    params: ProfitCalculationParams = profitParams
  ) => {
    setLoading(true);
    setError('');

    try {
      const result = await calculateProfit(stockCode, params);

      if (!result) {
        throw new Error('데이터를 찾을 수 없습니다');
      }

      setCalculatedResult(result);
      setShowModal(true);

      const url = new URL(window.location.href);
      url.searchParams.set('stockCode', stockCode);
      router.push(url.pathname + url.search, { scroll: false });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('계산 중 오류가 발생했습니다');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = () => {
    if (!selectedCompany) {
      setError('회사를 먼저 선택해주세요');
      return;
    }

    if (profitParams.settingROE < 0.1 || profitParams.settingROE > 99) {
      setError('수익성은 0.1%에서 99% 사이여야 합니다');
      return;
    }
    if (profitParams.discountRate < 1 || profitParams.discountRate > 30) {
      setError('목표 수익률은 1%에서 30% 사이여야 합니다');
      return;
    }
    if (profitParams.sustainableYears < 1 || profitParams.sustainableYears > 30) {
      setError('유지 기간은 1년에서 30년 사이여야 합니다');
      return;
    }

    performCalculation(selectedCompany.stockCode);
  };

  const handleInputChange = (field: keyof ProfitCalculationParams, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setProfitParams((prev) => ({
      ...prev,
      [field]: isNaN(numValue) ? 0 : numValue,
    }));
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto ">
        {/* 회사 검색 */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-3">회사 검색</label>
          <CompanySearchInput
            key={searchInputKey}
            onCompanySelect={handleCompanySelect}
            initialValue={selectedCompany?.companyName || ''}
            placeholder="삼성전자, 005930"
            className="transition-all duration-300"
          />
        </div>

        {/* 입력 카드 */}
        {selectedCompany && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <span className="w-2 h-6 bg-emerald-600 rounded-full mr-3"></span>
              예상 조건 입력
            </h2>

            {loadingROE ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600 mb-2" />
                <p className="text-sm text-gray-600">데이터 불러오는 중...</p>
              </div>
            ) : (
              <>
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <label className="text-sm font-semibold text-gray-800">지속가능 수익성</label>
                    </div>
                    <span className="text-xs text-gray-500">(ROE)</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0.1"
                      max="99"
                      step="0.1"
                      value={profitParams.settingROE === 0 ? '' : profitParams.settingROE}
                      onChange={(e) => handleInputChange('settingROE', e.target.value)}
                      className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors text-lg font-semibold text-right pr-12"
                      placeholder="12.5"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-gray-600">
                      %
                    </span>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <label className="text-sm font-semibold text-gray-800">
                        수익성 유지 기간
                      </label>
                    </div>
                    <span className="text-xs text-gray-500">(수익성 유지기간)</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={
                        profitParams.sustainableYears === 0 ? '' : profitParams.sustainableYears
                      }
                      onChange={(e) => handleInputChange('sustainableYears', e.target.value)}
                      className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-lg font-semibold text-right pr-12"
                      placeholder="10"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-gray-600">
                      년
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <label className="text-sm font-semibold text-gray-800">
                        연간 목표 수익률
                      </label>
                    </div>
                    <span className="text-xs text-gray-500">(할인율)</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      step="0.1"
                      value={profitParams.discountRate === 0 ? '' : profitParams.discountRate}
                      onChange={(e) => handleInputChange('discountRate', e.target.value)}
                      className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors text-lg font-semibold text-right pr-12"
                      placeholder="10"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-gray-600">
                      %
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCalculate}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      계산 중...
                    </>
                  ) : (
                    <>적정가 계산하기</>
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* 결과 모달 */}
      {showModal && calculatedResult && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 animate-slideUp overflow-hidden">
            {/* 헤더 - 상태 아이콘 */}
            <div
              className={`pt-10 pb-6 px-8 relative ${
                calculatedResult.expectedReturn >= 0
                  ? 'bg-gradient-to-b from-emerald-50 to-white'
                  : 'bg-gradient-to-b from-red-50 to-white'
              }`}
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              {/* 상태 아이콘 */}
              <div className="flex justify-center mb-6">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center ${
                    calculatedResult.expectedReturn >= 0 ? 'bg-emerald-100' : 'bg-red-100'
                  }`}
                >
                  {calculatedResult.expectedReturn >= 0 ? (
                    <ArrowUp className="w-10 h-10 text-emerald-600" strokeWidth={3} />
                  ) : (
                    <ArrowDown className="w-10 h-10 text-red-600" strokeWidth={3} />
                  )}
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                {calculatedResult.expectedReturn >= 0 ? '저평가 상태' : '고평가 상태'}
              </h2>
              <p className="text-sm text-gray-500 text-center">현재 주가 대비 계산 결과입니다</p>
            </div>

            {/* 본문 */}
            <div className="px-8 pb-8">
              {/* 예상 수익률 - 메인 */}
              <div className="mb-8 text-center">
                <p className="text-sm text-gray-500 mb-2">예상 수익률</p>
                <div
                  className={`mb-1 ${
                    calculatedResult.expectedReturn >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  <span className="text-5xl font-bold">
                    {calculatedResult.expectedReturn >= 0 ? '+' : '-'}
                  </span>
                  <span className="text-5xl font-bold">
                    {Math.abs(calculatedResult.expectedReturn).toFixed(1)}
                  </span>
                  <span className="text-2xl font-semibold"> %</span>
                </div>
                <p className="text-sm text-gray-600">
                  {calculatedResult.expectedReturn >= 0 ? '저평가되었습니다' : '고평가되었습니다'}
                </p>
              </div>

              {/* 가격 비교 */}
              <div className="bg-gray-50 rounded-2xl p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">현재 주가</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatNumber(calculatedResult.currentPrice)}원
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PBR {calculatedResult.currentPBR.toFixed(2)}
                    </p>
                  </div>

                  <div className="w-px h-12 bg-gray-300"></div>

                  <div className="text-right">
                    <p
                      className={`text-xs mb-1 ${
                        calculatedResult.expectedReturn >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      계산된 적정가
                    </p>
                    <p
                      className={`text-xl font-bold ${
                        calculatedResult.expectedReturn >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {formatNumber(calculatedResult.expectedPrice)}원
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        calculatedResult.expectedReturn >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      PBR {calculatedResult.expectedPBR.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* 버튼들 */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  설정값 변경
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedCompany(null);
                    setCalculatedResult(null);
                    setProfitParams({
                      settingROE: 10,
                      discountRate: 10,
                      sustainableYears: 10,
                    });
                    setSearchInputKey((prev) => prev + 1);
                    router.push('/simple-calculator');
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 px-6 rounded-xl font-semibold transition-colors"
                >
                  다른 종목 계산
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}
