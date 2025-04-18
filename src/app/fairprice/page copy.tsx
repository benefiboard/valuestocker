//src/app/fairprice/page.tsx

'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import CompanySearchInput from '../components/CompanySearchInput';
import { CompanyInfo } from '@/lib/stockCodeData';
import {
  ApiResponse,
  CalculatedResults,
  FinancialData,
  StockPrice,
  UserData,
} from '@/lib/finance/types';
import { fetchStockPrices, fetchFinancialData, fetchStockPrice } from '@/lib/finance/apiService';
import { extractFinancialData, convertToPriceData } from '@/lib/finance/dataProcessor';
import { calculateAllPrices } from './PriceCalculate';

export default function DartTotalPage() {
  // 상태 관리
  const [companyName, setCompanyName] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyInfo | null>(null);
  const [userData, setUserData] = useState<UserData>({
    treasuryShares: '', // 자사주
    targetPER: '10', // 적정 PER 배수(기본값 10)
    expectedReturn: '8', // 기대수익률(기본값 8%)
    pegRatio: '1.0', // PEG 비율(기본값 1.0 - 피터 린치 기준)
  });
  const [stockPrices, setStockPrices] = useState<Record<string, StockPrice>>({});
  const [latestPrice, setLatestPrice] = useState<StockPrice | null>(null);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [rawFinancialData, setRawFinancialData] = useState<ApiResponse | null>(null);
  const [calculatedResults, setCalculatedResults] = useState<CalculatedResults | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  // 회사 선택 핸들러
  const handleCompanySelect = (company: CompanyInfo) => {
    setCompanyName(company.companyName);
    setSelectedCompany(company);
  };

  // 사용자 입력 핸들러
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
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
    setStockPrices({});
    setFinancialData(null);
    setRawFinancialData(null);
    setCalculatedResults(null);
    setSuccess(false);
    setError('');

    setLoading(true);

    try {
      // 1. 주가 데이터 가져오기 - 공통 모듈 사용
      //3년간
      const { priceDataMap, baseYearData } = await fetchStockPrices(selectedCompany.stockCode);
      //최신주가
      const latestPriceData = await fetchStockPrice(selectedCompany.stockCode, true);

      if (!baseYearData) {
        throw new Error(`${companyName}의 주가 데이터를 찾을 수 없습니다`);
      }

      // 상태 업데이트
      setStockPrices(priceDataMap);
      setLatestPrice(latestPriceData || null);

      // 2. 재무 데이터 가져오기 - 공통 모듈 사용
      const rawData = await fetchFinancialData(selectedCompany.dartCode);
      setRawFinancialData(rawData);

      // 3. 재무 데이터 추출 - 공통 모듈 사용
      const extractedData = extractFinancialData(rawData);
      const priceData = convertToPriceData(extractedData);
      setFinancialData(priceData);

      // 4. 적정가 계산 - priceDataMap을 직접 전달
      const results = calculateAllPrices(priceData, baseYearData, priceDataMap);
      setCalculatedResults(results);

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

  // 수정 계산하기 함수
  const handleRecalculate = () => {
    if (!financialData || !stockPrices) {
      setError('재계산을 위한 데이터가 없습니다. 먼저 회사를 검색해주세요.');
      return;
    }

    try {
      const currentYear = new Date().getFullYear();
      const baseYear = currentYear - 1;
      const baseYearData = stockPrices[baseYear];

      if (!baseYearData) {
        throw new Error('기준연도 데이터가 없습니다');
      }

      const results = calculateAllPrices(financialData, baseYearData);
      setCalculatedResults(results);
    } catch (error) {
      if (error instanceof Error) {
        setError('재계산 중 오류가 발생했습니다: ' + error.message);
      } else {
        setError('재계산 중 알 수 없는 오류가 발생했습니다');
      }
    }
  };

  // 숫자 포맷팅 함수
  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  // 원형 프로그레스 바 컴포넌트
  const CircularProgress = ({
    value,
    max,
    size = 80,
    label,
  }: {
    value: number;
    max: number;
    size?: number;
    label: string;
  }) => {
    const radius = size / 2;
    const circumference = radius * 2 * Math.PI;
    const fillPercentage = Math.min(value, max) / max;
    const strokeDashoffset = circumference - fillPercentage * circumference;

    return (
      <div className="flex flex-col items-center justify-center">
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
            <span className="text-xl font-bold">{Math.round(fillPercentage * 100)}%</span>
          </div>
        </div>
        <span className="mt-2 text-sm text-gray-500">{label}</span>
      </div>
    );
  };

  // 가격 비교 컴포넌트 (현재가 vs 적정가)
  const PriceComparison = ({
    currentPrice,
    fairPrice,
  }: {
    currentPrice: number;
    fairPrice: number;
  }) => {
    const percentage = Math.round((currentPrice / fairPrice) * 100);
    const isUndervalued = currentPrice < fairPrice;

    return (
      <div className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm">
        <div className="mb-4 w-full flex justify-between items-center">
          <span className="text-sm text-gray-500">현재 주가</span>
          <span className="text-sm text-gray-500">적정 주가</span>
        </div>
        <div className="relative w-full h-4 bg-gray-100 rounded-full my-3">
          <div
            className={`absolute top-0 left-0 h-4 rounded-full ${
              isUndervalued ? 'bg-gray-700' : 'bg-gray-400'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
          <div
            className="absolute top-0 left-0 h-full w-1 bg-black"
            style={{ left: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
        <div className="w-full flex justify-between items-center mt-1">
          <span className="font-bold">{formatNumber(currentPrice)}원</span>
          <span className="font-bold">{formatNumber(fairPrice)}원</span>
        </div>
        <div className="mt-6 text-center">
          <span
            className={`px-4 py-2 rounded-full text-white ${
              isUndervalued ? 'bg-gray-800' : 'bg-gray-400'
            }`}
          >
            {isUndervalued ? '저평가' : '고평가'} ({Math.abs(100 - percentage)}%)
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-12 text-center text-gray-900">
        통합 주식 적정가 계산기
      </h1>

      {/* 검색 영역 */}
      <div className="bg-white p-8 rounded-2xl shadow-sm mb-10">
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
              className="w-full bg-black text-white py-3 px-4 rounded-xl hover:bg-gray-800 transition shadow-sm mt-2"
              disabled={loading}
            >
              {loading ? '검색 중...' : '검색'}
            </button>
          </div>
        </form>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-10 border-l-4 border-red-500">
          <p className="font-bold text-gray-900">오류</p>
          <p className="text-gray-700 mt-1">{error}</p>
        </div>
      )}

      {/* 결과 영역 */}
      {success && financialData && calculatedResults && (
        <>
          {/* 사용자 설정 영역 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm mb-10">
            <h2 className="text-xl font-bold mb-6 text-gray-900">적정가 계산 설정</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  자기주식수(자사주)
                </label>
                <input
                  type="number"
                  name="treasuryShares"
                  value={userData.treasuryShares}
                  onChange={handleInputChange}
                  placeholder="예: 399000000"
                  className="w-full p-3 border-b border-gray-300 focus:border-gray-900 transition bg-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  적정 PER 배수
                </label>
                <input
                  type="number"
                  name="targetPER"
                  value={userData.targetPER}
                  onChange={handleInputChange}
                  className="w-full p-3 border-b border-gray-300 focus:border-gray-900 transition bg-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  기대수익률/할인율(%)
                </label>
                <input
                  type="number"
                  name="expectedReturn"
                  value={userData.expectedReturn}
                  onChange={handleInputChange}
                  className="w-full p-3 border-b border-gray-300 focus:border-gray-900 transition bg-transparent outline-none"
                />
              </div>
            </div>
            <div className="mt-8">
              <button
                onClick={handleRecalculate}
                className="w-full bg-black text-white py-3 px-4 rounded-xl hover:bg-gray-800 transition shadow-sm"
              >
                수정 계산하기
              </button>
            </div>
          </div>

          {/* 주요 데이터 요약 */}
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-10">
            <h2 className="text-xl font-bold mb-8 text-gray-900">주요 데이터 요약</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center">
                <CircularProgress
                  value={financialData.epsByYear[financialData.years[0]] || 0}
                  max={financialData.epsByYear[financialData.years[0]] * 1.5 || 1}
                  label="EPS(최신)"
                />
                <span className="mt-2 font-bold">
                  {formatNumber(financialData.epsByYear[financialData.years[0]])} 원
                </span>
              </div>
              <div className="flex flex-col items-center">
                <CircularProgress
                  value={calculatedResults.averageEps}
                  max={calculatedResults.averageEps * 1.5 || 1}
                  label="EPS(3년 평균)"
                />
                <span className="mt-2 font-bold">
                  {formatNumber(calculatedResults.averageEps)} 원
                </span>
              </div>
              <div className="flex flex-col items-center">
                <CircularProgress
                  value={(financialData.netIncome / financialData.equityAttributableToOwners) * 100}
                  max={20}
                  label="ROE"
                />
                <span className="mt-2 font-bold">
                  {(
                    (financialData.netIncome / financialData.equityAttributableToOwners) *
                    100
                  ).toFixed(2)}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* 가격 비교 - 새로운 컴포넌트 */}
          <PriceComparison
            currentPrice={
              latestPrice?.price || stockPrices[String(new Date().getFullYear() - 1)]?.price || 0
            }
            fairPrice={
              [
                calculatedResults.epsPer,
                calculatedResults.controllingShareHolder,
                calculatedResults.threeIndicatorsBps,
                calculatedResults.threeIndicatorsEps,
                calculatedResults.threeIndicatorsRoeEps,
                calculatedResults.yamaguchi,
                calculatedResults.sRimBase,
              ].sort((a, b) => a - b)[3]
            }
          />

          {/* 적정가 계산 결과 카드 형태로 표시 */}
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-6 text-gray-900">적정 주가 계산 결과</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-md font-medium text-gray-500 mb-3">예상 EPS × 과거 평균 PER</h3>
                <p className="text-2xl font-bold">{formatNumber(calculatedResults.epsPer)}원</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-md font-medium text-gray-500 mb-3">당기순이익 기반 PER 모델</h3>
                <p className="text-2xl font-bold">
                  {formatNumber(calculatedResults.controllingShareHolder)}원
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-md font-medium text-gray-500 mb-3">
                  PEG 기반 적정주가 (성장률: {calculatedResults.growthRate.toFixed(1)}%)
                </h3>
                <p className="text-2xl font-bold">{formatNumber(calculatedResults.pegBased)}원</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-md font-medium text-gray-500 mb-3">야마구치 요해이 공식</h3>
                <p className="text-2xl font-bold">{formatNumber(calculatedResults.yamaguchi)}원</p>
              </div>
            </div>

            {/* 3가지 지표 비교 방식 */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-10">
              <h3 className="text-lg font-bold mb-6">3가지 지표 비교 방식</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">BPS 기준(P₁, 순자산가치)</p>
                  <p className="text-xl font-bold">
                    {formatNumber(calculatedResults.threeIndicatorsBps)}원
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">EPS 기준(P₂)</p>
                  <p className="text-xl font-bold">
                    {formatNumber(calculatedResults.threeIndicatorsEps)}원
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">ROE×EPS 기준(P₃)</p>
                  <p className="text-xl font-bold">
                    {formatNumber(calculatedResults.threeIndicatorsRoeEps)}원
                  </p>
                </div>
              </div>
            </div>

            {/* S-rim 모델 */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-10">
              <h3 className="text-lg font-bold mb-6">사경인의 S-rim(초과이익모델)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">기본 시나리오</p>
                  <p className="text-xl font-bold">{formatNumber(calculatedResults.sRimBase)}원</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">ROE 10% 감소 시나리오</p>
                  <p className="text-xl font-bold">
                    {formatNumber(calculatedResults.sRimDecline10pct)}원
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">ROE 20% 감소 시나리오</p>
                  <p className="text-xl font-bold">
                    {formatNumber(calculatedResults.sRimDecline20pct)}원
                  </p>
                </div>
              </div>
            </div>

            {/* 종합 요약 */}
            <div className="bg-white rounded-2xl shadow-sm p-8 mb-10">
              <h3 className="text-lg font-bold mb-6">종합 분석</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="flex flex-col items-center">
                  <CircularProgress
                    value={
                      [
                        calculatedResults.epsPer,
                        calculatedResults.controllingShareHolder,
                        calculatedResults.threeIndicatorsBps,
                        calculatedResults.threeIndicatorsEps,
                        calculatedResults.threeIndicatorsRoeEps,
                        calculatedResults.yamaguchi,
                        calculatedResults.sRimBase,
                      ].sort((a, b) => a - b)[3]
                    }
                    max={
                      [
                        calculatedResults.epsPer,
                        calculatedResults.controllingShareHolder,
                        calculatedResults.threeIndicatorsBps,
                        calculatedResults.threeIndicatorsEps,
                        calculatedResults.threeIndicatorsRoeEps,
                        calculatedResults.yamaguchi,
                        calculatedResults.sRimBase,
                      ].sort((a, b) => a - b)[6]
                    }
                    label="적정가 중앙값"
                    size={120}
                  />
                  <span className="mt-4 text-2xl font-bold">
                    {formatNumber(
                      [
                        calculatedResults.epsPer,
                        calculatedResults.controllingShareHolder,
                        calculatedResults.threeIndicatorsBps,
                        calculatedResults.threeIndicatorsEps,
                        calculatedResults.threeIndicatorsRoeEps,
                        calculatedResults.yamaguchi,
                        calculatedResults.sRimBase,
                      ].sort((a, b) => a - b)[3]
                    )}
                    원
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <CircularProgress
                    value={
                      (calculatedResults.epsPer +
                        calculatedResults.controllingShareHolder +
                        calculatedResults.threeIndicatorsBps +
                        calculatedResults.threeIndicatorsEps +
                        calculatedResults.threeIndicatorsRoeEps +
                        calculatedResults.yamaguchi +
                        calculatedResults.sRimBase +
                        calculatedResults.pegBased) /
                      8
                    }
                    max={
                      [
                        calculatedResults.epsPer,
                        calculatedResults.controllingShareHolder,
                        calculatedResults.threeIndicatorsBps,
                        calculatedResults.threeIndicatorsEps,
                        calculatedResults.threeIndicatorsRoeEps,
                        calculatedResults.yamaguchi,
                        calculatedResults.sRimBase,
                      ].sort((a, b) => a - b)[6]
                    }
                    label="적정가 평균"
                    size={120}
                  />
                  <span className="mt-4 text-2xl font-bold">
                    {formatNumber(
                      (calculatedResults.epsPer +
                        calculatedResults.controllingShareHolder +
                        calculatedResults.threeIndicatorsBps +
                        calculatedResults.threeIndicatorsEps +
                        calculatedResults.threeIndicatorsRoeEps +
                        calculatedResults.yamaguchi +
                        calculatedResults.sRimBase +
                        calculatedResults.pegBased) /
                        8
                    )}
                    원
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
