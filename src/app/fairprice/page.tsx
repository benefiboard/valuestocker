//src/app/fairprice/page.tsx
//12345222

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
  const [isSrimExpanded, setIsSrimExpanded] = useState<boolean>(false);

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

  //토글함수
  const toggleSrimScenarios = () => {
    setIsSrimExpanded(!isSrimExpanded);
  };

  // 신호등 컴포넌트
  const PriceSignal = ({ signal, message }: { signal: string; message: string }) => {
    let bgColor = 'bg-gray-200';

    if (signal === 'green') bgColor = 'bg-green-500';
    else if (signal === 'lightgreen') bgColor = 'bg-green-300';
    else if (signal === 'yellow') bgColor = 'bg-yellow-400';
    else if (signal === 'orange') bgColor = 'bg-orange-400';
    else if (signal === 'red') bgColor = 'bg-red-500';

    return (
      <div className="flex items-center gap-2">
        <div className={`w-4 h-4 rounded-full ${bgColor}`}></div>
        <span>{message}</span>
      </div>
    );
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
      const results = calculateAllPrices(
        priceData,
        baseYearData,
        priceDataMap,
        userData,
        latestPriceData
      );
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

      const results = calculateAllPrices(
        financialData,
        baseYearData,
        stockPrices,
        userData,
        latestPrice
      );
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

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">통합 주식 적정가 계산기</h1>

      {/* 검색 영역 */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <form onSubmit={handleSearch}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <label className="block text-sm font-medium text-gray-700 mb-1">회사명</label>
              <CompanySearchInput
                onCompanySelect={handleCompanySelect}
                initialValue={companyName}
                placeholder="회사명 또는 종목코드 입력"
              />
            </div>
            <div className="self-end">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-8 rounded hover:bg-blue-700 transition"
                disabled={loading}
              >
                {loading ? '검색 중...' : '검색'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          <p className="font-bold">오류</p>
          <p>{error}</p>
        </div>
      )}

      {/* 결과 영역 - UI 부분은 동일하게 유지 */}
      {success && financialData && calculatedResults && (
        <>
          {/* 사용자 설정 영역 */}
          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-3">적정가 계산 설정</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  자기주식수(자사주)
                </label>
                <input
                  type="number"
                  name="treasuryShares"
                  value={userData.treasuryShares}
                  onChange={handleInputChange}
                  placeholder="예: 399000000"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  적정 PER 배수
                </label>
                <input
                  type="number"
                  name="targetPER"
                  value={userData.targetPER}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  기대수익률/할인율(%)
                </label>
                <input
                  type="number"
                  name="expectedReturn"
                  value={userData.expectedReturn}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={handleRecalculate}
                className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
              >
                수정 계산하기
              </button>
            </div>
          </div>

          {/* 주요 데이터 요약 */}
          <div className="bg-white shadow-md rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">주요 데이터 요약</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-600 text-sm">EPS(최신)</p>
                <p className="font-medium">
                  {formatNumber(financialData.epsByYear[financialData.years[0]])} 원
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">EPS(3년 평균)</p>
                <p className="font-medium">{formatNumber(calculatedResults.averageEps)} 원</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">BPS(주당순자산)</p>
                <p className="font-medium">
                  {formatNumber(
                    financialData.equityAttributableToOwners /
                      (stockPrices[String(new Date().getFullYear() - 1)]?.sharesOutstanding || 1)
                  )}{' '}
                  원
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">ROE</p>
                <p className="font-medium">
                  {(
                    (financialData.netIncome / financialData.equityAttributableToOwners) *
                    100
                  ).toFixed(2)}
                  %
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">평균 PER</p>
                <p className="font-medium">{calculatedResults.averagePER.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">적정 PER 배수</p>
                <p className="font-medium">{formatNumber(Number(userData.targetPER))}</p>
              </div>
            </div>
          </div>

          {/* 적정가 계산 결과 테이블 수정 11*/}
          <div className="bg-white shadow-md rounded-xl overflow-hidden mt-6">
            <div className="bg-gray-100 px-6 py-4 border-b">
              <h2 className="text-xl font-bold">적정 주가 계산 결과</h2>
            </div>

            {/* PER 분석 결과 표시 */}
            {calculatedResults.perAnalysis && calculatedResults.perAnalysis.status !== 'normal' && (
              <div
                className={`p-4 ${
                  calculatedResults.perAnalysis.status === 'negative' ||
                  calculatedResults.perAnalysis.status === 'extreme_high'
                    ? 'bg-yellow-50'
                    : 'bg-blue-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-yellow-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm font-medium">{calculatedResults.perAnalysis.message}</p>
                </div>
                {(calculatedResults.perAnalysis.status === 'negative' ||
                  calculatedResults.perAnalysis.status === 'extreme_high') && (
                  <p className="mt-2 text-xs text-gray-600 ml-7">
                    이런 경우 PER 기반 모델의 결과는 신뢰성이 낮을 수 있으며, 자산 기반 모델을 더
                    참고하는 것이 좋습니다.
                  </p>
                )}
              </div>
            )}

            {/* 이상치 경고 표시 */}
            {calculatedResults.hasOutliers && (
              <div className="p-4 bg-yellow-50">
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-yellow-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm font-medium">
                    일부 평가 모델에서 비정상적인 결과가 검출되었습니다. 결과 해석에 주의가
                    필요합니다.
                  </p>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              {/* 자산 가치 기반 모델 */}
              <div className="px-6 py-3 bg-blue-50">
                <h3 className="font-medium">자산 가치 기반 모델</h3>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="bg-white divide-y divide-gray-200">
                  {calculatedResults.categorizedModels?.assetBased.map((model) => (
                    <tr
                      key={model.name}
                      className={
                        calculatedResults.outliers?.some((o) => o.name === model.name)
                          ? 'bg-gray-100'
                          : ''
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {model.name}
                        {model.name === 'S-RIM 기본 시나리오' &&
                          calculatedResults.categorizedModels?.srimScenarios &&
                          calculatedResults.categorizedModels.srimScenarios.length > 0 && (
                            <button
                              onClick={toggleSrimScenarios}
                              className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
                            >
                              {isSrimExpanded ? '▼' : '▶'}
                            </button>
                          )}
                        {calculatedResults.outliers?.some((o) => o.name === model.name) && (
                          <span className="ml-2 text-xs text-yellow-600">⚠️ 참고용</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {formatNumber(model.value)}원
                      </td>
                    </tr>
                  ))}

                  {/* S-RIM 시나리오 섹션 - 토글 상태에 따라 표시/숨김 */}
                  {isSrimExpanded &&
                    calculatedResults.categorizedModels?.srimScenarios &&
                    calculatedResults.categorizedModels.srimScenarios.length > 0 && (
                      <tr>
                        <td colSpan={2}>
                          <div className="mt-2 mb-2 pl-8 pr-6 py-2 bg-gray-50 rounded-md">
                            <h4 className="text-sm font-medium text-gray-600">
                              S-RIM 추가 시나리오 (참고용)
                            </h4>
                            <div className="ml-4">
                              {calculatedResults.categorizedModels.srimScenarios.map((model) => (
                                <div
                                  key={model.name}
                                  className="flex justify-between text-sm text-gray-600 mt-1"
                                >
                                  <span>{model.name}:</span>
                                  <span>{formatNumber(model.value)}원</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>

              {/* 수익 가치 기반 모델 */}
              <div className="px-6 py-3 bg-green-50">
                <h3 className="font-medium">수익 가치 기반 모델</h3>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="bg-white divide-y divide-gray-200">
                  {calculatedResults.categorizedModels?.earningsBased.map((model) => (
                    <tr
                      key={model.name}
                      className={
                        calculatedResults.outliers?.some((o) => o.name === model.name)
                          ? 'bg-gray-100'
                          : ''
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {model.name}
                        {calculatedResults.outliers?.some((o) => o.name === model.name) && (
                          <span className="ml-2 text-xs text-yellow-600">⚠️ 참고용</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {formatNumber(model.value)}원
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 혼합 모델 */}
              <div className="px-6 py-3 bg-purple-50">
                <h3 className="font-medium">혼합 모델</h3>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="bg-white divide-y divide-gray-200">
                  {calculatedResults.categorizedModels?.mixedModels.map((model) => (
                    <tr
                      key={model.name}
                      className={
                        calculatedResults.outliers?.some((o) => o.name === model.name)
                          ? 'bg-gray-100'
                          : ''
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {model.name}
                        {calculatedResults.outliers?.some((o) => o.name === model.name) && (
                          <span className="ml-2 text-xs text-yellow-600">⚠️ 참고용</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {formatNumber(model.value)}원
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 종합 요약 수정 */}
          <div className="p-6 bg-yellow-50">
            <h3 className="font-semibold mb-4">종합 분석:</h3>

            {/* 신호등 시스템 */}
            <div className="mb-4 p-3 bg-white rounded-lg shadow-sm">
              <h4 className="font-medium mb-2">가격 평가</h4>
              <PriceSignal
                signal={calculatedResults.priceSignal.signal}
                message={calculatedResults.priceSignal.message}
              />
            </div>

            {/* 가격 범위 */}
            <div className="mb-4 p-3 bg-white rounded-lg shadow-sm">
              <h4 className="font-medium mb-2">적정가 범위</h4>
              {calculatedResults.hasOutliers && (
                <p className="text-xs text-gray-600 mb-2">
                  * 이상치를 제외한 값으로 계산된 범위입니다.
                </p>
              )}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-blue-100 rounded">
                  <div className="text-xs text-gray-600">하위 25%</div>
                  <div className="font-bold">
                    {formatNumber(calculatedResults.priceRange.lowRange)}원
                  </div>
                </div>
                <div className="p-2 bg-blue-200 rounded">
                  <div className="text-xs text-gray-600">중앙값</div>
                  <div className="font-bold">
                    {formatNumber(calculatedResults.priceRange.midRange)}원
                  </div>
                </div>
                <div className="p-2 bg-blue-100 rounded">
                  <div className="text-xs text-gray-600">상위 25%</div>
                  <div className="font-bold">
                    {formatNumber(calculatedResults.priceRange.highRange)}원
                  </div>
                </div>
              </div>
            </div>

            {/* 데이터 신뢰성 및 위험 프로필 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <h4 className="font-medium mb-2">데이터 신뢰성</h4>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        calculatedResults.dataReliability.score >= 8
                          ? 'bg-green-500'
                          : calculatedResults.dataReliability.score >= 5
                          ? 'bg-yellow-400'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${calculatedResults.dataReliability.score * 10}%` }}
                    ></div>
                  </div>
                  <span className="text-sm">{calculatedResults.dataReliability.score}/10</span>
                </div>
                <p className="text-xs mt-1 text-gray-600">
                  {calculatedResults.dataReliability.message}
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg shadow-sm">
                <h4 className="font-medium mb-2">위험 프로필</h4>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-white text-xs ${
                      calculatedResults.riskProfile.riskLevel === '낮음'
                        ? 'bg-green-500'
                        : calculatedResults.riskProfile.riskLevel === '중간'
                        ? 'bg-yellow-400'
                        : 'bg-red-500'
                    }`}
                  >
                    {calculatedResults.riskProfile.riskLevel}
                  </span>
                  <span className="text-xs">{calculatedResults.riskProfile.message}</span>
                </div>
              </div>
            </div>

            {/* 기존 요약 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm">
                  <span className="font-medium">적정가 중앙값: </span>
                  <span className="text-lg font-bold">
                    {formatNumber(calculatedResults.priceRange.midRange)}원
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm">
                  <span className="font-medium">현재 주가: </span>
                  <span className="text-lg font-bold">
                    {formatNumber(
                      latestPrice?.price ||
                        stockPrices[String(new Date().getFullYear() - 1)]?.price ||
                        0
                    )}
                    원
                    {latestPrice && latestPrice.formattedDate && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({latestPrice.formattedDate})
                      </span>
                    )}
                  </span>
                </p>
              </div>
            </div>

            {/* 이상치 정보 (접이식) */}
            {calculatedResults.hasOutliers && (
              <details className="mt-4 p-3 bg-white rounded-lg shadow-sm">
                <summary className="cursor-pointer font-medium">
                  참고용 이상치 값 정보 (클릭하여 확인)
                </summary>
                <div className="mt-2">
                  <p className="text-xs text-gray-600 mb-2">
                    다음 값들은 다른 모델과 큰 차이를 보여 적정가 계산에서 제외되었습니다:
                  </p>
                  <ul className="pl-5 text-sm">
                    {calculatedResults.outliers?.map((outlier) => (
                      <li key={outlier.name} className="mb-1">
                        {outlier.name}: {formatNumber(outlier.value)}원
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            )}

            {/* 투자 조언 메시지 */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="font-medium text-blue-800">투자 참고 사항:</p>
              <ul className="list-disc pl-5 mt-1 text-blue-700">
                <li>위 평가는 기초적인 가이드라인으로, 추가 분석이 권장됩니다.</li>
                <li>적정가 범위는 다양한 모델의 결과 분포를 보여줍니다.</li>
                <li>데이터 신뢰성이 낮을 경우 결과 해석에 주의가 필요합니다.</li>
                <li>최종 투자 결정 전에 기업의 사업 모델, 경쟁력, 성장성도 함께 고려하세요.</li>
                {calculatedResults.perAnalysis?.status === 'negative' && (
                  <li>이 기업은 현재 손실을 기록하고 있어 수익 기반 모델의 신뢰도가 낮습니다.</li>
                )}
                {calculatedResults.perAnalysis?.status === 'extreme_high' && (
                  <li>
                    이 기업은 현재 PER이 매우 높아 수익 기반 모델의 신뢰도가 낮을 수 있습니다.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
