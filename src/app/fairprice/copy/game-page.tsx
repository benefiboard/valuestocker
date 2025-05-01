'use client';

import { useState, FormEvent } from 'react';
import CompanySearchInput from '@/components/CompanySearchInput';
import { CompanyInfo } from '../../../lib/stockCodeData';
import { CalculatedResults, StockPrice } from '../types';
import { getIndustryParameters } from '../../../lib/industryData';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BarChart4,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  Search,
  TrendingUp,
  Trophy,
  Target,
  Shield,
  Zap,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Percent,
} from 'lucide-react';
import { extractCalculatedResultsFromJson, getStockDataFromJson } from '../FairpriceCalculate';

export default function SportStockApp() {
  // 상태 관리 (기존 코드와 동일)
  const [companyName, setCompanyName] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyInfo | null>(null);
  const [latestPrice, setLatestPrice] = useState<StockPrice | null>(null);
  const [calculatedResults, setCalculatedResults] = useState<CalculatedResults | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [isSrimExpanded, setIsSrimExpanded] = useState<boolean>(false);
  const [showSearchForm, setShowSearchForm] = useState<boolean>(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [industryParams, setIndustryParams] = useState({
    avgPER: 10,
    avgPEG: 1.0,
    liabilityMultiplier: 1.2,
  });
  const [activeTab, setActiveTab] = useState('overview');

  // 회사 선택 핸들러 (기존 코드와 동일)
  const handleCompanySelect = (company: CompanyInfo) => {
    setCompanyName(company.companyName);
    setSelectedCompany(company);
    const params = getIndustryParameters(company.industry);
    setIndustryParams(params);
  };

  // 토글 함수 (기존 코드와 동일)
  const toggleSrimScenarios = () => {
    setIsSrimExpanded(!isSrimExpanded);
  };

  // 카테고리 확장/축소 핸들러 (기존 코드와 동일)
  const toggleCategory = (category: string) => {
    setExpandedCategories((prevState) => {
      const newState = new Set(prevState);
      if (newState.has(category)) {
        newState.delete(category);
      } else {
        newState.add(category);
      }
      return newState;
    });
  };

  // 메인 검색 함수 (기존 로직 유지)
  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedCompany) {
      setError('회사를 선택해주세요');
      return;
    }

    const stockCode = selectedCompany.stockCode;
    const stockDataItem = getStockDataFromJson(stockCode);

    if (!stockDataItem) {
      setError(`${companyName}의 데이터를 찾을 수 없습니다`);
      return;
    }

    setCalculatedResults(null);
    setSuccess(false);
    setError('');
    setLoading(true);

    try {
      const calculatedResults = extractCalculatedResultsFromJson(stockCode);

      if (!calculatedResults) {
        throw new Error(`${companyName}의 데이터를 찾을 수 없습니다`);
      }

      setLatestPrice(calculatedResults.latestPrice || null);
      setCalculatedResults(calculatedResults);
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

  // 숫자 포맷팅 함수 (기존 코드와 동일)
  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  // 메인 상태 링 계산
  const getMainRingStats = () => {
    if (!calculatedResults) return { percentage: 0, color: 'text-gray-500', label: '?' };

    const ratio = calculatedResults.priceRatio;

    if (ratio < 0.7) {
      return {
        percentage: 100 - ratio * 100,
        color: 'text-emerald-400',
        label: '저',
        desc: '저평가',
      };
    } else if (ratio < 0.9) {
      return {
        percentage: 80 - (ratio - 0.7) * 100,
        color: 'text-emerald-400',
        label: '저',
        desc: '저평가',
      };
    } else if (ratio < 1.1) {
      return {
        percentage: 50,
        color: 'text-yellow-400',
        label: '적',
        desc: '적정',
      };
    } else if (ratio < 1.3) {
      return {
        percentage: 30,
        color: 'text-orange-400',
        label: '고',
        desc: '고평가',
      };
    } else {
      return {
        percentage: 15,
        color: 'text-red-500',
        label: '고',
        desc: '고평가',
      };
    }
  };

  // 성능 차트 계산
  const performanceStats = [
    { label: 'P₁', value: calculatedResults?.threeIndicatorsBps || 0, max: 100 },
    { label: 'P₂', value: calculatedResults?.threeIndicatorsEps || 0, max: 100 },
    { label: 'P₃', value: calculatedResults?.threeIndicatorsRoeEps || 0, max: 100 },
    { label: 'EP', value: calculatedResults?.epsPer || 0, max: 100 },
    { label: 'PG', value: calculatedResults?.pegBased || 0, max: 100 },
    { label: 'SR', value: calculatedResults?.sRimBase || 0, max: 100 },
    { label: 'YM', value: calculatedResults?.yamaguchi || 0, max: 100 },
  ];

  // 성능 차트 바 계산
  const calculatePerformanceBar = (value: number) => {
    if (!calculatedResults) return { width: '0%', color: 'bg-gray-500' };

    const fairPrice = calculatedResults.priceRange.midRange;
    const pct = (value / fairPrice) * 100;

    // 값이 적정가 대비 얼마나 다른지 결정
    let color = 'bg-yellow-400'; // 기본값 (적정)

    if (pct < 70) {
      color = 'bg-red-500'; // 매우 낮음
    } else if (pct < 90) {
      color = 'bg-orange-400'; // 낮음
    } else if (pct > 130) {
      color = 'bg-emerald-400'; // 매우 높음
    } else if (pct > 110) {
      color = 'bg-green-500'; // 높음
    }

    // 바 너비
    const maxWidth = Math.min(Math.max(pct, 10), 100); // 10%~100% 범위로 제한

    return { width: `${maxWidth}%`, color };
  };

  // 선수 스탯 점수 계산
  const getPlayerStats = () => {
    if (!calculatedResults) return { value: 0, growth: 0, stability: 0, potential: 0 };

    // 적정가 대비 저평가 정도를 점수화 (100점 만점)
    const valueScore = Math.max(0, Math.min(100, (1 / calculatedResults.priceRatio) * 50));

    // 신뢰도 점수 (0-10 -> 0-100)
    const stabilityScore = calculatedResults.trustScore * 10;

    // 위험 점수 (0-1 -> 0-100, 반전된 값)
    const growthScore = (1 - calculatedResults.riskScore) * 100;

    // 잠재력 점수 (적정가 범위의 폭)
    const priceRange = calculatedResults.priceRange;
    const potentialScore = Math.min(
      100,
      ((priceRange.highRange - priceRange.lowRange) / priceRange.midRange) * 100
    );

    return {
      value: Math.round(valueScore),
      growth: Math.round(growthScore),
      stability: Math.round(stabilityScore),
      potential: Math.round(potentialScore),
    };
  };

  // 선수 스탯
  const playerStats = getPlayerStats();
  const mainRingStats = getMainRingStats();

  // 현재가 차이 계산
  const getPriceDiffInfo = () => {
    if (!calculatedResults || !latestPrice) return { diff: 0, percent: 0, isPositive: false };

    const fairPrice = calculatedResults.priceRange.midRange;
    const currentPrice = latestPrice.price;
    const diff = fairPrice - currentPrice;
    const percent = Math.abs((diff / fairPrice) * 100);

    return {
      diff,
      percent: percent.toFixed(1),
      isPositive: diff > 0,
    };
  };

  const priceDiffInfo = getPriceDiffInfo();

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      {/* 상단 헤더 */}
      <header className="py-4 px-4 bg-gray-800 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="mr-3 text-gray-400 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">
            {showSearchForm ? '종목 검색' : selectedCompany?.companyName || '주식 분석'}
          </h1>
        </div>
        {!showSearchForm && (
          <button
            onClick={() => setShowSearchForm(true)}
            className="text-white bg-gray-700 p-2 rounded-full"
          >
            <Search size={18} />
          </button>
        )}
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-16">
        {/* 검색 폼 */}
        {showSearchForm ? (
          <div className="mt-6">
            <form onSubmit={handleSearch} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-sm">종목 검색</label>
                <CompanySearchInput
                  onCompanySelect={handleCompanySelect}
                  initialValue={companyName}
                  placeholder="회사명 또는 종목코드 입력"
                />
              </div>
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-white py-4 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="mr-3 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  '분석 시작'
                )}
              </button>
            </form>
          </div>
        ) : success && calculatedResults ? (
          <>
            {/* 탭 네비게이션 */}
            <div className="flex border-b border-gray-800 mt-4">
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'overview'
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-gray-400'
                }`}
                onClick={() => setActiveTab('overview')}
              >
                개요
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'stats'
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-gray-400'
                }`}
                onClick={() => setActiveTab('stats')}
              >
                세부 스탯
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'models'
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-gray-400'
                }`}
                onClick={() => setActiveTab('models')}
              >
                모델 분석
              </button>
            </div>

            {/* 개요 탭 내용 */}
            {activeTab === 'overview' && (
              <div className="mt-6">
                {/* 종목 정보 카드 */}
                <div className="bg-gray-800 rounded-xl p-4 mb-6 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center overflow-hidden mr-4">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">{selectedCompany?.companyName}</h2>
                      <div className="flex items-center mt-1">
                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                          {latestPrice?.code}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          {latestPrice?.formattedDate}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 메인 지표 원형 차트 */}
                <div className="bg-gray-800 rounded-xl p-6 mb-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-4">가치평가 지수</h3>

                  <div className="flex items-center justify-between">
                    <div className="relative h-36 w-36">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        {/* 배경 원 */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#374151"
                          strokeWidth="8"
                        />
                        {/* 진행 원 */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeDasharray="251.2"
                          strokeDashoffset={251.2 - (251.2 * mainRingStats.percentage) / 100}
                          className={`${mainRingStats.color} transform -rotate-90 origin-center`}
                        />
                        {/* 중앙 텍스트 */}
                        <text
                          x="50"
                          y="45"
                          textAnchor="middle"
                          className={`${mainRingStats.color} font-bold text-2xl`}
                        >
                          {mainRingStats.label}
                        </text>
                        <text
                          x="50"
                          y="60"
                          textAnchor="middle"
                          className="text-xs text-gray-400 font-medium"
                        >
                          {mainRingStats.desc}
                        </text>
                      </svg>
                    </div>

                    <div className="flex-1 ml-6">
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-400">적정가</span>
                          <span className="text-lg font-bold">
                            {formatNumber(calculatedResults.priceRange.midRange)}원
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">현재가</span>
                          <span className="text-lg font-bold">
                            {formatNumber(latestPrice?.price || 0)}원
                          </span>
                        </div>
                      </div>

                      <div
                        className={`flex items-center p-2 rounded ${
                          priceDiffInfo.isPositive
                            ? 'bg-emerald-900/30 text-emerald-400'
                            : 'bg-red-900/30 text-red-400'
                        }`}
                      >
                        {priceDiffInfo.isPositive ? (
                          <ArrowUpRight size={16} className="mr-1" />
                        ) : (
                          <ArrowDownRight size={16} className="mr-1" />
                        )}
                        <span className="text-sm font-medium">
                          {priceDiffInfo.isPositive ? '저평가' : '고평가'} {priceDiffInfo.percent}%
                          ({formatNumber(Math.abs(priceDiffInfo.diff))}원)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 플레이어 스탯 카드 */}
                <div className="bg-gray-800 rounded-xl p-6 mb-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-4">종합 스탯</h3>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-gray-900/50 p-3 rounded-lg">
                      <div className="text-xl font-bold text-emerald-400">{playerStats.value}</div>
                      <div className="text-xs text-gray-500 mt-1">가치</div>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded-lg">
                      <div className="text-xl font-bold text-blue-400">{playerStats.growth}</div>
                      <div className="text-xs text-gray-500 mt-1">성장</div>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded-lg">
                      <div className="text-xl font-bold text-yellow-400">
                        {playerStats.stability}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">안정</div>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded-lg">
                      <div className="text-xl font-bold text-purple-400">
                        {playerStats.potential}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">잠재</div>
                    </div>
                  </div>
                </div>

                {/* 적정가 범위 카드 */}
                <div className="bg-gray-800 rounded-xl p-6 mb-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-4">
                    적정가 범위
                    {calculatedResults.hasOutliers && (
                      <span className="text-xs text-yellow-400 ml-2">(이상치 제외)</span>
                    )}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-400">하위 25%</span>
                        <span className="text-sm font-medium">
                          {formatNumber(calculatedResults.priceRange.lowRange)}원
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{
                            width: `${
                              (calculatedResults.priceRange.lowRange /
                                calculatedResults.priceRange.highRange) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-400">중앙값</span>
                        <span className="text-sm font-medium">
                          {formatNumber(calculatedResults.priceRange.midRange)}원
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{
                            width: `${
                              (calculatedResults.priceRange.midRange /
                                calculatedResults.priceRange.highRange) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-400">상위 25%</span>
                        <span className="text-sm font-medium">
                          {formatNumber(calculatedResults.priceRange.highRange)}원
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-purple-500 h-1.5 rounded-full"
                          style={{ width: '100%' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 종합 데이터 신뢰성 */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-400">신뢰성 & 위험</h3>
                    <Info size={16} className="text-gray-500" />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-400">데이터 신뢰도</span>
                        <span className="text-sm font-medium">
                          {calculatedResults.trustScore}/10
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            calculatedResults.trustScore >= 8
                              ? 'bg-emerald-500'
                              : calculatedResults.trustScore >= 5
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${calculatedResults.trustScore * 10}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-400">위험도</span>
                        <span className="text-sm font-medium">
                          {calculatedResults.riskScore < 0.3
                            ? '낮음'
                            : calculatedResults.riskScore < 0.6
                            ? '중간'
                            : '높음'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            calculatedResults.riskScore < 0.3
                              ? 'bg-emerald-500'
                              : calculatedResults.riskScore < 0.6
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${calculatedResults.riskScore * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 세부 스탯 탭 내용 */}
            {activeTab === 'stats' && (
              <div className="mt-6">
                {/* 모델별 성능 차트 */}
                <div className="bg-gray-800 rounded-xl p-6 mb-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-6">모델별 가치 평가</h3>

                  <div className="space-y-5">
                    {performanceStats.map((stat, idx) => {
                      const barStyle = calculatePerformanceBar(stat.value);

                      return (
                        <div key={idx}>
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center">
                              <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-white font-mono">
                                {stat.label}
                              </span>
                              <span className="text-xs text-gray-400 ml-2">
                                {stat.label === 'P₁'
                                  ? 'BPS 기준'
                                  : stat.label === 'P₂'
                                  ? 'EPS 기준'
                                  : stat.label === 'P₃'
                                  ? 'ROE×EPS 기준'
                                  : stat.label === 'EP'
                                  ? 'EPS×PER'
                                  : stat.label === 'PG'
                                  ? 'PEG 기반'
                                  : stat.label === 'SR'
                                  ? 'S-RIM 기본'
                                  : stat.label === 'YM'
                                  ? '야마구치'
                                  : ''}
                              </span>
                            </div>
                            <span className="text-sm font-medium">
                              {formatNumber(stat.value)}원
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className={`${barStyle.color} h-2 rounded-full`}
                              style={{ width: barStyle.width }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 가치 평가 지표 */}
                <div className="bg-gray-800 rounded-xl p-6 mb-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-4">투자 가치 분석</h3>

                  <div className="space-y-4">
                    <div className="p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 text-emerald-400 mr-2" />
                          <span className="text-sm font-medium">적정가 중앙값</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-400">
                          {formatNumber(calculatedResults.priceRange.midRange)}원
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Percent className="w-4 h-4 text-blue-400 mr-2" />
                          <span className="text-sm font-medium">주가/적정가 비율</span>
                        </div>
                        <span className="text-sm font-bold">
                          {(calculatedResults.priceRatio * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Shield className="w-4 h-4 text-yellow-400 mr-2" />
                          <span className="text-sm font-medium">데이터 신뢰도</span>
                        </div>
                        <span className="text-sm font-bold">{calculatedResults.trustScore}/10</span>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <PieChart className="w-4 h-4 text-red-400 mr-2" />
                          <span className="text-sm font-medium">위험도</span>
                        </div>
                        <span className="text-sm font-bold">
                          {(calculatedResults.riskScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 이상치 정보 */}
                {calculatedResults.hasOutliers && (
                  <div className="bg-gray-800 rounded-xl p-6">
                    <div className="flex items-center mb-4">
                      <AlertTriangle className="w-4 h-4 text-yellow-400 mr-2" />
                      <h3 className="text-sm font-medium text-yellow-400">참고용 이상치 값</h3>
                    </div>

                    <div className="space-y-2">
                      {calculatedResults.outliers?.map((outlier, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-gray-900/50 rounded flex justify-between items-center"
                        >
                          <span className="text-xs text-gray-400">{outlier.name}</span>
                          <span className="text-xs font-medium">
                            {formatNumber(outlier.value)}원
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 모델 분석 탭 내용 */}
            {activeTab === 'models' && (
              <div className="mt-6">
                {/* 자산 가치 기반 모델 */}
                <div className="bg-gray-800 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-blue-400">자산 가치 기반 모델</h3>
                    <Shield className="w-4 h-4 text-blue-400" />
                  </div>

                  <div className="space-y-3">
                    {calculatedResults.categorizedModels?.assetBased.map((model, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg"
                      >
                        <span className="text-sm">{model.name}</span>
                        <span className="text-sm font-bold text-blue-400">
                          {formatNumber(model.value)}원
                        </span>
                      </div>
                    ))}

                    {/* S-RIM 시나리오 버튼 */}
                    {calculatedResults.categorizedModels?.srimScenarios &&
                      calculatedResults.categorizedModels.srimScenarios.length > 0 && (
                        <button
                          onClick={toggleSrimScenarios}
                          className="w-full flex items-center justify-between text-sm text-gray-400 p-2 rounded-lg hover:bg-gray-700/30"
                        >
                          <span>S-RIM 추가 시나리오</span>
                          {isSrimExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      )}

                    {/* S-RIM 시나리오 내용 */}
                    {isSrimExpanded && calculatedResults.categorizedModels?.srimScenarios && (
                      <div className="ml-4 p-3 bg-gray-700/20 rounded-lg space-y-2">
                        {calculatedResults.categorizedModels.srimScenarios.map((model, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">{model.name}</span>
                            <span className="text-xs font-medium">
                              {formatNumber(model.value)}원
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 수익 가치 기반 모델 */}
                <div className="bg-gray-800 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-red-400">수익 가치 기반 모델</h3>
                    <Zap className="w-4 h-4 text-red-400" />
                  </div>

                  <div className="space-y-3">
                    {calculatedResults.categorizedModels?.earningsBased.map((model, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg"
                      >
                        <span className="text-sm">{model.name}</span>
                        <span className="text-sm font-bold text-red-400">
                          {formatNumber(model.value)}원
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 혼합 모델 */}
                <div className="bg-gray-800 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-purple-400">혼합 모델</h3>
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                  </div>

                  <div className="space-y-3">
                    {calculatedResults.categorizedModels?.mixedModels.map((model, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg"
                      >
                        <span className="text-sm">{model.name}</span>
                        <span className="text-sm font-bold text-purple-400">
                          {formatNumber(model.value)}원
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 최종 투자 조언 */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <Info className="w-4 h-4 text-yellow-400 mr-2" />
                    <h3 className="text-sm font-medium text-yellow-400">투자 참고 사항</h3>
                  </div>

                  <ul className="space-y-2 text-xs text-gray-400">
                    <li className="flex items-start">
                      <span className="text-yellow-400 mr-2">•</span>위 평가는 기초적인
                      가이드라인으로, 추가 분석이 권장됩니다.
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-400 mr-2">•</span>
                      적정가 범위는 다양한 모델의 결과 분포를 보여줍니다.
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-400 mr-2">•</span>
                      데이터 신뢰성이 낮을 경우 결과 해석에 주의가 필요합니다.
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-400 mr-2">•</span>
                      최종 투자 결정 전에 기업의 사업 모델, 경쟁력, 성장성도 함께 고려하세요.
                    </li>
                    {calculatedResults.perAnalysis?.status === 'negative' && (
                      <li className="flex items-start">
                        <span className="text-red-400 mr-2">•</span>이 기업은 현재 손실을 기록하고
                        있어 수익 기반 모델의 신뢰도가 낮습니다.
                      </li>
                    )}
                    {calculatedResults.perAnalysis?.status === 'extreme_high' && (
                      <li className="flex items-start">
                        <span className="text-red-400 mr-2">•</span>이 기업은 현재 PER이 매우 높아
                        수익 기반 모델의 신뢰도가 낮을 수 있습니다.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </>
        ) : (
          // 오류 메시지
          error && (
            <div className="mt-6 bg-gray-800 p-5 rounded-xl border border-red-500/30">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-white">오류</p>
                  <p className="text-sm text-gray-400 mt-2">{error}</p>
                </div>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}
