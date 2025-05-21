//src/app/checklist/page.tsx

'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

import { CompanyInfo, stockCodeMap } from '@/lib/stockCodeData';
import { ScoredChecklistItem, InvestmentRating, StockPrice } from './types';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  CircleDollarSign,
  Info,
  LineChart,
  Percent,
  ShieldAlert,
  TrendingUp,
  XCircle,
  CheckSquare,
  Award,
  AlertTriangle,
  Search as SearchIcon,
  Target,
  ExternalLink,
  X,
  TrendingDown,
  DollarSign,
  Calculator,
} from 'lucide-react';
import {
  calculateChecklist,
  calculateInvestmentRating,
  getStockPriceFromSupabase,
} from './ChecklistCalculate';
import Link from 'next/link';
import React from 'react';
import CompanySearchInput from '../../components/CompanySearchInput';
import { FINANCIAL_COMPANIES } from './constants/industryThresholds';

// 계층적 카테고리 구조 정의
interface HierarchicalCategory {
  [mainCategory: string]: {
    [subCategory: string]: ScoredChecklistItem[];
  };
}

// 위험 플래그별 아이콘 및 설명 추가
const getRiskFlagDetails = (flag: string) => {
  const flagDetails = {
    has_consecutive_operating_losses: {
      icon: <TrendingDown className="w-4 h-4" />,
      title: '연속 영업적자',
      description: '2년 이상 연속으로 영업적자를 기록하고 있습니다.',
      penalty: 2.0,
    },
    operating_to_net_income_discrepancy: {
      icon: <DollarSign className="w-4 h-4" />,
      title: '영업외수익 의존',
      description: '영업이익은 적자이나 순이익이 큰 흑자로, 영업외수익에 의존하고 있습니다.',
      penalty: 1.5,
    },
    operating_margin_critical: {
      icon: <AlertCircle className="w-4 h-4" />,
      title: '영업이익률 위험',
      description: '평균 영업이익률이 음수로 수익성에 심각한 문제가 있습니다.',
      penalty: 2.0,
    },
    insufficient_profitable_years: {
      icon: <Calculator className="w-4 h-4" />,
      title: '수익성 부족',
      description: '최근 3년 중 2년 이상 영업흑자를 달성하지 못했습니다.',
      penalty: 1.5,
    },
  };
  return flagDetails[flag as keyof typeof flagDetails];
};

// 영업이익률 조정 설명 배지 컴포넌트
const OperatingMarginAdjustmentBadge = ({ currentOpMargin }: { currentOpMargin: number }) => {
  // 영업이익률 수준에 따른 메시지 및 스타일 조정
  let title = '';
  let description = '';
  let bgColor = 'bg-blue-50';
  let iconColor = 'text-blue-600';
  let textColor = 'text-blue-800';
  let textDetailColor = 'text-blue-700';

  if (currentOpMargin >= 20) {
    title = '매우 높은 영업이익률 (20% 이상)';
    description =
      '높은 영업이익률을 갖추어 일부 성장률 지표에서 마이너스 성장(-10%)까지 허용됩니다.';
    bgColor = 'bg-emerald-50';
    iconColor = 'text-emerald-600';
    textColor = 'text-emerald-800';
    textDetailColor = 'text-emerald-700';
  } else if (currentOpMargin >= 15) {
    title = '우수한 영업이익률 (15% 이상)';
    description =
      '우수한 영업이익률을 갖추어 일부 성장률 지표에서 소폭 마이너스 성장(-5%)까지 허용됩니다.';
    bgColor = 'bg-emerald-50';
    iconColor = 'text-emerald-600';
    textColor = 'text-emerald-800';
    textDetailColor = 'text-emerald-700';
  } else if (currentOpMargin >= 10) {
    title = '양호한 영업이익률 (10% 이상)';
    description = '양호한 영업이익률을 갖추어 일부 성장률 지표에서 성장률 0%까지 허용됩니다.';
    bgColor = 'bg-blue-50';
    iconColor = 'text-blue-600';
    textColor = 'text-blue-800';
    textDetailColor = 'text-blue-700';
  }

  return (
    <div
      className={`${bgColor} p-4 sm:p-5 rounded-xl mb-5 border border-${bgColor.replace(
        'bg-',
        'border-'
      )} transition-all duration-300 hover:shadow-md`}
    >
      <div className="flex items-start">
        <div className={`p-2 ${bgColor.replace('50', '100')} rounded-full mr-3 flex-shrink-0`}>
          <TrendingUp className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`} />
        </div>
        <div>
          <p className={`font-medium text-sm sm:text-base ${textColor}`}>{title}</p>
          <p className={`text-sm ${textDetailColor} mt-2`}>{description}</p>
        </div>
      </div>
    </div>
  );
};

// 성장률 지표 관련 추가 설명 컴포넌트
const GrowthRateExplanation = ({
  type,
  opMargin,
  actualValue,
}: {
  type: 'operating' | 'eps' | 'net';
  opMargin: number;
  actualValue: number;
}) => {
  // 지표 유형별 텍스트 조정
  const getTitle = () => {
    switch (type) {
      case 'operating':
        return '영업이익 성장률';
      case 'eps':
        return 'EPS 성장률';
      case 'net':
        return '순이익 증가율';
      default:
        return '성장률';
    }
  };

  // 영업이익률 수준별 기준치 조정
  let threshold = '10%';
  let explanation = '';

  if (opMargin >= 20) {
    threshold = '-10%';
    explanation =
      '매우 높은 영업이익률(20% 이상)을 가진 기업은 소폭의 마이너스 성장도 건전한 비즈니스의 일부로 볼 수 있습니다.';
  } else if (opMargin >= 15) {
    threshold = '-5%';
    explanation = '우수한 영업이익률(15% 이상)을 가진 기업은 약간의 마이너스 성장도 용인됩니다.';
  } else if (opMargin >= 10) {
    threshold = '0%';
    explanation =
      '양호한 영업이익률(10% 이상)을 가진 기업은 성장이 정체되어도(0%) 합리적인 평가가 가능합니다.';
  }

  // 실제값이 기준치를 넘는지 평가
  const isPassing =
    (opMargin >= 20 && actualValue >= -10) ||
    (opMargin >= 15 && actualValue >= -5) ||
    (opMargin >= 10 && actualValue >= 0);

  return (
    <div className={`mt-3 p-3 text-xs rounded-lg ${isPassing ? 'bg-emerald-50' : 'bg-amber-50'}`}>
      <p className="font-medium flex items-center mb-1">
        <Info className="w-3 h-3 mr-1 inline" />
        <span>{getTitle()} 조정 기준 적용</span>
      </p>
      <p className="text-gray-700">
        영업이익률 {opMargin.toFixed(1)}%에 따라 기준치가 {threshold}로 조정되었습니다.
      </p>
      <p className="text-gray-700 mt-1">{explanation}</p>
    </div>
  );
};

export default function ChecklistPage() {
  // URL 쿼리 파라미터 가져오기
  const searchParams = useSearchParams();

  // 상태 관리
  const [companyName, setCompanyName] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyInfo | null>(null);
  const [stockPrice, setStockPrice] = useState<StockPrice | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showSearchForm, setShowSearchForm] = useState<boolean>(true);
  const [autoSearchTriggered, setAutoSearchTriggered] = useState<boolean>(false);

  // 체크리스트 결과 상태
  const [checklistResults, setChecklistResults] = useState<ScoredChecklistItem[]>([]);
  const [investmentRating, setInvestmentRating] = useState<InvestmentRating | null>(null);
  // 등급에 따른 설명 상태 추가
  const [ratingDescription, setRatingDescription] = useState<string>('');
  // 현재 영업이익률 상태 추가
  const [currentOpMargin, setCurrentOpMargin] = useState<number>(0);

  // URL 쿼리 파라미터에서 stockCode를 읽어 자동 검색 수행
  useEffect(() => {
    const stockCode = searchParams.get('stockCode');

    // 이미 자동 검색을 수행했거나 stockCode가 없으면 리턴
    if (autoSearchTriggered || !stockCode) {
      return;
    }

    // stockCodeMap에서 해당 종목 코드 찾기
    const company = Object.values(stockCodeMap).find((company) => company.stockCode === stockCode);

    if (company) {
      // 회사 정보 설정
      handleCompanySelect(company);

      // 자동 검색 트리거 표시 (중복 실행 방지)
      setAutoSearchTriggered(true);

      // 약간의 딜레이 후 검색 실행 (UI가 업데이트될 시간 제공)
      setTimeout(() => {
        performSearch(company);
      }, 100);
    }
  }, [searchParams, autoSearchTriggered]);

  // 등급에 따른 설명 생성 함수
  const getGradeDescription = (
    grade: string,
    hasCriticalFailure: boolean,
    isFinancialCompany: boolean
  ): string => {
    if (hasCriticalFailure) {
      if (grade === 'F') return '핵심 지표에 심각한 문제가 있어 투자에 적합하지 않습니다.';
      return '핵심 지표에 심각한 문제가 있어 투자에 주의가 필요합니다.';
    }

    // 등급별 설명 생성
    const descriptions: Record<string, string> = {
      'A+': '우수한 투자 대상입니다. 모든 핵심 지표가 매우 양호합니다.',
      A: '양호한 투자 대상입니다. 핵심 지표가 대부분 양호합니다.',
      'B+': '괜찮은 투자 대상입니다. 일부 보완이 필요한 지표가 있습니다.',
      B: '평균적인 투자 대상입니다. 몇몇 지표에서 개선이 필요합니다.',
      'C+': '투자 시 주의가 필요합니다. 여러 지표에서 문제점이 발견되었습니다.',
      C: '투자 위험이 큽니다. 많은 지표에서 문제점이 발견되었습니다.',
      D: '투자에 적합하지 않습니다. 대부분의 지표가 기준에 미달합니다.',
    };

    let description = descriptions[grade] || '평가할 데이터가 부족합니다.';

    // 금융회사인 경우 설명 조정
    if (isFinancialCompany) {
      description += ' (금융회사에 최적화된 평가 기준 적용)';
    }

    return description;
  };

  // 회사 선택 핸들러
  const handleCompanySelect = (company: CompanyInfo) => {
    setCompanyName(company.companyName);
    setSelectedCompany(company);
  };

  // 검색 수행 함수 (URL 파라미터에서도 사용)
  const performSearch = async (company: CompanyInfo) => {
    // 모든 상태 초기화
    setStockPrice(null);
    setChecklistResults([]);
    setInvestmentRating(null);
    setRatingDescription('');
    setSuccess(false);
    setError('');
    setLoading(true);
    setCurrentOpMargin(0); // 영업이익률 초기화

    try {
      console.log('===== 검색 시작 =====');
      console.log(`회사명: ${company.companyName} (${company.stockCode})`);
      console.log(`DART 코드: ${company.dartCode}`);
      console.log(`산업군: ${company.industry}`);

      // 체크리스트 계산 (Supabase 데이터 활용)
      console.log('체크리스트 계산 시작...');
      const checklist = await calculateChecklist(company.stockCode, company.industry);

      if (checklist.length === 0) {
        throw new Error(`${company.companyName}의 데이터를 찾을 수 없습니다`);
      }

      console.log('체크리스트 계산 결과:', checklist);
      setChecklistResults(checklist);

      // 주가 정보 직접 가져오기
      const stockPriceData = await getStockPriceFromSupabase(company.stockCode);
      if (!stockPriceData) {
        throw new Error(`${company.companyName}의 주가 데이터를 찾을 수 없습니다`);
      }

      // 주가 정보 설정
      setStockPrice(stockPriceData);

      // 투자 등급 계산
      console.log('투자 등급 계산 시작...');
      const rating = calculateInvestmentRating(checklist, company.stockCode, company.industry);

      console.log('투자 등급 계산 결과:', rating);

      // 등급 설명 생성 및 설정
      const description = getGradeDescription(
        rating.grade,
        rating.hasCriticalFailure,
        rating.isFinancialCompany
      );
      setRatingDescription(description);
      setInvestmentRating(rating);

      // 현재 영업이익률 설정 (stockData에서 가져옴)
      const stockData = (window as any).tempStockData?.[company.stockCode];
      if (stockData && typeof stockData.avgOpMargin === 'number') {
        setCurrentOpMargin(stockData.avgOpMargin);
        console.log('현재 영업이익률:', stockData.avgOpMargin);
      }

      console.log('분석 완료!');
      setSuccess(true);
      setShowSearchForm(false); // 검색 결과가 표시되면 검색 폼 숨기기
    } catch (error) {
      console.error('오류 발생:', error);
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

    // 선택된 회사가 없으면 에러 표시
    if (!selectedCompany) {
      setError('회사를 검색하고 선택해주세요');
      return;
    }

    // 검색 수행
    await performSearch(selectedCompany);
  };

  // 카테고리 확장/축소 핸들러
  const toggleCategory = (category: string) => {
    if (expandedCategory === category) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(category);
    }
  };

  // 중요도를 별로 표시하는 함수
  const renderImportance = (level: 1 | 2 | 3 | 4 | 5, isFailCriteria: boolean) => {
    const starColorClass = isFailCriteria ? 'text-red-500' : 'text-gray-800';

    return Array(level)
      .fill(0)
      .map((_, i) => (
        <span key={i} className={starColorClass}>
          ★
        </span>
      ));
  };

  // 점수 바 렌더링 함수
  const renderScoreBar = (score: number, maxScore: number = 10) => {
    const percentage = (score / maxScore) * 100;
    let barColor = 'bg-gray-600';
    let glowEffect = '';

    if (percentage >= 70) {
      barColor = 'bg-gradient-to-r from-emerald-500 to-emerald-600';
      glowEffect = 'shadow-[0_0_8px_rgba(16,185,129,0.4)]';
    } else if (percentage < 20) {
      barColor = 'bg-gradient-to-r from-red-400 to-red-500';
      glowEffect = 'shadow-[0_0_8px_rgba(248,113,113,0.4)]';
    }

    return (
      <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 overflow-hidden">
        <div
          className={`${barColor} ${glowEffect} h-1.5 sm:h-2 rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  // 등급에 따른 배경색 결정
  const getGradeColor = (grade: string) => {
    switch (grade) {
      // 상위 등급: 녹색 계열 (A+, A, B+)
      case 'A+':
        return 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md'; // 짙은 녹색
      case 'A':
        return 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md'; // 녹색
      case 'B+':
        return 'bg-gradient-to-br from-emerald-300 to-emerald-500 text-white shadow-md'; // 밝은 녹색

      // 중간 등급: 회색 계열 (B, C+, C)
      case 'B':
        return 'bg-gradient-to-br from-gray-500 to-gray-700 text-white shadow-md'; // 짙은 회색
      case 'C+':
        return 'bg-gradient-to-br from-gray-400 to-gray-600 text-white shadow-md'; // 회색
      case 'C':
        return 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md'; // 밝은 회색

      // 하위 등급: 빨간색 계열 (D, F)
      case 'D':
        return 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-md'; // 빨간색
      case 'F':
        return 'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-md'; // 짙은 빨간색

      // 기본값
      default:
        return 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md';
    }
  };

  // 숫자 포맷팅 함수
  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('ko-KR').format(Math.round(num * 100) / 100);
  };

  // 카테고리별 항목 그룹화
  const getCategorizedItems = () => {
    const categories: { [key: string]: ScoredChecklistItem[] } = {};

    checklistResults.forEach((item) => {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    });

    return categories;
  };

  // 계층적 카테고리 구조를 생성하는 함수
  const getHierarchicalCategories = (): HierarchicalCategory => {
    const hierarchical: HierarchicalCategory = {};

    checklistResults.forEach((item) => {
      const categoryParts = item.category.split(' - ');
      const mainCategory = categoryParts[0];
      // 핵심 지표인 경우 subCategory도 '핵심 지표'로 설정
      const subCategory =
        mainCategory === '핵심 지표'
          ? '핵심 지표'
          : categoryParts.length > 1
          ? categoryParts[1]
          : '일반';

      if (!hierarchical[mainCategory]) {
        hierarchical[mainCategory] = {};
      }

      if (!hierarchical[mainCategory][subCategory]) {
        hierarchical[mainCategory][subCategory] = [];
      }

      hierarchical[mainCategory][subCategory].push(item);
    });

    return hierarchical;
  };

  // 카테고리 아이콘 매핑
  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      '핵심 지표': <LineChart className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />,
      '세부 지표': <Info className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />,
      수익성: <CircleDollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />,
      재무안정성: <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />,
      성장성: <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />,
      가치평가: <Percent className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />,
    };

    return iconMap[category] || <Info className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />;
  };

  // 카테고리 평균 점수 계산
  const getCategoryScore = (items: ScoredChecklistItem[]) => {
    if (items.length === 0) return 0;
    return Math.round((items.reduce((sum, item) => sum + item.score, 0) / items.length) * 10) / 10;
  };

  // 서브카테고리 점수 계산
  const getSubCategoryScore = (items: ScoredChecklistItem[]) => {
    if (items.length === 0) return 0;
    const score = items.reduce((sum, item) => sum + item.score, 0) / items.length;
    return Math.round(score * 10) / 10;
  };

  // 점수 +20점 하기
  // 디버깅을 위한 콘솔 로그가 추가된 함수
  const getDisplayScore = (value: number): number => {
    console.log('getDisplayScore 함수 호출됨 - 입력값:', value);
    console.log('investmentRating 존재 여부:', !!investmentRating);

    // investmentRating이 있을 때만 보너스 점수 계산
    if (investmentRating) {
      const coreItemsPassCount = investmentRating.coreItemsPassCount;
      const coreItemsCount = investmentRating.coreItemsCount;

      console.log('핵심 지표 정보:', {
        통과개수: coreItemsPassCount,
        전체개수: coreItemsCount,
        통과율: ((coreItemsPassCount / coreItemsCount) * 100).toFixed(2) + '%',
      });

      // 핵심 지표 통과 비율
      const corePassRatio = coreItemsCount > 0 ? coreItemsPassCount / coreItemsCount : 0;

      // 핵심 지표 통과 비율에 따른 보너스 점수
      let bonus = 0;
      if (corePassRatio >= 0.8) {
        bonus = 20; // 80% 이상 통과: +20점
        console.log('보너스: 20점 (80% 이상 통과)');
      } else if (corePassRatio >= 0.5) {
        bonus = 10; // 50% 이상 통과: +10점
        console.log('보너스: 10점 (50% 이상 통과)');
      } else {
        bonus = 0; // 50% 미만 통과: 보너스 없음
        console.log('보너스: 0점 (50% 미만 통과)');
      }

      const result = Math.min(Math.round(value + bonus), 100);
      console.log('최종 계산 결과:', {
        원점수: value,
        보너스: bonus,
        최종점수: result,
      });

      return result;
    }

    // investmentRating이 없는 경우 기존처럼 20점 더하기
    console.log('investmentRating이 없음 - 기본 보너스 20점 적용');
    const result = Math.min(Math.round(value + 20), 100);
    console.log('최종 계산 결과:', {
      원점수: value,
      보너스: 20,
      최종점수: result,
    });

    return result;
  };

  // 원형 프로그레스 바 컴포넌트
  const CircularProgress = ({
    value,
    grade,
    size = 120,
  }: {
    value: number;
    grade: string;
    size?: number;
  }) => {
    // 반응형 크기 조절 - 화면 크기별로 다른 사이즈 적용
    const [progressSize, setProgressSize] = useState(size);
    const [gradeSize, setGradeSize] = useState(40); // 등급 원 크기
    const [gradePosition, setGradePosition] = useState({ top: -4, right: -4 }); // 등급 원 위치

    // 화면 크기에 따라 프로그레스 바 크기 및 관련 요소 조정
    useEffect(() => {
      const updateSizes = () => {
        let newSize, newGradeSize, newGradePosition;

        if (window.innerWidth < 640) {
          // 모바일 (sm 미만)
          newSize = 90;
          newGradeSize = 32; // w-8 h-8
          newGradePosition = { top: -4, right: -4 }; // -top-1 -right-1
        } else if (window.innerWidth < 768) {
          // 태블릿 (sm)
          newSize = 140;
          newGradeSize = 40; // w-10 h-10
          newGradePosition = { top: -5, right: -5 };
        } else if (window.innerWidth < 1024) {
          // 작은 데스크탑 (md)
          newSize = 160;
          newGradeSize = 48;
          newGradePosition = { top: -6, right: -6 };
        } else {
          // 큰 데스크탑 (lg 이상)
          newSize = 180;
          newGradeSize = 56;
          newGradePosition = { top: -8, right: -8 };
        }

        setProgressSize(newSize);
        setGradeSize(newGradeSize);
        setGradePosition(newGradePosition);
      };

      // 초기 사이즈 설정
      if (typeof window !== 'undefined') {
        updateSizes();
        // 윈도우 리사이즈 이벤트 리스너
        window.addEventListener('resize', updateSizes);
        // 클린업 함수
        return () => window.removeEventListener('resize', updateSizes);
      }
    }, []);

    const radius = progressSize / 2;
    const strokeWidth = Math.max(8, progressSize * 0.067); // 최소 8px, 크기에 비례
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    // 실제 값으로 원 채우기 계산 (시각적 표현은 원래 값 그대로 유지)
    const strokeDashoffset = circumference - (value / 100) * circumference;
    // 화면에 표시될 점수는 20점 추가
    const displayValue = getDisplayScore(value);

    // 메인 숫자 텍스트 크기 계산
    const getFontSizeClass = () => {
      if (progressSize <= 90) return 'text-2xl';
      if (progressSize <= 140) return 'text-3xl';
      if (progressSize <= 160) return 'text-4xl';
      return 'text-5xl';
    };

    return (
      <div className="relative" style={{ width: progressSize, height: progressSize }}>
        {/* 배경 원 */}
        <svg
          width={progressSize}
          height={progressSize}
          viewBox={`0 0 ${progressSize} ${progressSize}`}
          className="rotate-[-90deg]"
        >
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out stroke-emerald-600"
            style={{
              filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.4))',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${getFontSizeClass()} font-bold`}>{displayValue}</span>
        </div>

        {/* 등급 표시 원 */}
        <div
          className="absolute"
          style={{
            top: `${gradePosition.top}px`,
            right: `${gradePosition.right}px`,
          }}
        >
          <div
            className={`rounded-full flex items-center justify-center ${getGradeColor(grade)}`}
            style={{ width: `${gradeSize}px`, height: `${gradeSize}px` }}
          >
            <span
              className={`${
                gradeSize <= 40 ? 'text-sm' : gradeSize <= 48 ? 'text-base' : 'text-lg'
              } font-medium`}
            >
              {grade}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 px-4 sm:px-6 py-4 sm:py-6">
      {/* 헤더 - 글래스모픽 스타일 */}
      {/* <header className="mb-6 max-w-4xl mx-auto w-full sticky top-0 z-10">
        <div className="bg-white bg-opacity-90 backdrop-blur-md shadow-sm rounded-2xl p-4 flex items-center">
          <Link
            href="/"
            className="mr-3 sm:mr-4 text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
            <div className="hidden sm:block p-2 bg-emerald-50 rounded-full mr-3">
              <CheckSquare className="text-emerald-600 w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            가치투자 체크리스트
          </h1>
        </div>
      </header> */}

      <main className="flex-1 max-w-4xl mx-auto w-full">
        {/* 로딩 상태 - 세련된 로딩 애니메이션 */}
        {loading && (
          <div className="bg-white rounded-2xl p-8 shadow-md flex flex-col items-center justify-center mb-6 transition-all duration-300">
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

        {/* 검색 영역 - 세련된 카드 디자인 */}

        {showSearchForm && !loading ? (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md mb-6 border border-gray-100 transition-all duration-300 hover:shadow-lg">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">기업 검색</h2>
                <p className="text-sm text-gray-600">분석하고 싶은 기업을 검색하세요</p>
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
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 sm:py-4 px-4 rounded-xl transition-all duration-300 flex items-center justify-center mt-3 shadow-sm hover:shadow group relative overflow-hidden"
                  disabled={loading}
                >
                  {/* 버튼 배경 효과 */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-500 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {/* 버튼 텍스트 */}
                  <span className="relative flex items-center">
                    {loading ? (
                      <>
                        <Loader2 size={20} className="mr-3 animate-spin" />
                        분석 중...
                      </>
                    ) : (
                      <>
                        <SearchIcon
                          size={20}
                          className="mr-3 group-hover:scale-110 transition-transform duration-300"
                        />
                        기업 분석하기
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          !loading && (
            <div className="bg-white rounded-2xl p-5 sm:px-6 shadow-md mb-6 flex justify-between items-center border border-gray-100 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-50 rounded-full mr-3">
                  <Target className="h-5 w-5 sm:h-5 sm:w-5 text-emerald-600" />
                </div>
                <p className="text-lg font-semibold text-gray-800 truncate">
                  {selectedCompany?.companyName}{' '}
                  <span className="font-normal text-sm text-gray-500">({stockPrice?.code})</span>
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
          )
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

        {/* 결과 영역 */}
        {success && stockPrice && checklistResults.length > 0 && investmentRating && (
          <>
            {/* 기업 요약 정보 - 세련된 카드 디자인 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md mb-6 border border-gray-100 transition-all duration-300 hover:shadow-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 sm:mb-6">
                <div className="w-full">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center break-words">
                    {selectedCompany?.companyName}{' '}
                    <span className="text-xs sm:text-sm text-gray-500 ml-2">
                      ({stockPrice.code})
                    </span>
                  </h2>

                  <p className="text-sm sm:text-base text-gray-600 mt-1 flex items-center">
                    <span>현재 주가: </span>
                    <span className="text-gray-800 text-lg sm:text-xl font-semibold ml-1">
                      {stockPrice.price}원
                    </span>
                    {stockPrice.formattedDate && (
                      <span className="text-gray-500 text-xs sm:text-sm ml-2 bg-gray-100 px-2 py-0.5 rounded-full">
                        {stockPrice.formattedDate}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* 금융사인 경우 안내 메시지 추가 - 세련된 알림 디자인 */}
              {investmentRating.isFinancialCompany && (
                <div className="bg-blue-50 p-4 sm:p-5 rounded-xl mb-5 border border-blue-100 transition-all duration-300 hover:shadow-md">
                  <div className="flex items-start">
                    <div className="p-2 bg-blue-100 rounded-full mr-3 flex-shrink-0">
                      <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm sm:text-base text-blue-800">
                        금융회사 특화 평가
                      </p>
                      <p className="text-sm text-blue-700 mt-2">
                        금융회사는 일반 기업과 다른 회계구조를 가지고 있어, 금융업 특성에 맞게
                        평가되었습니다. 일부 지표(매출액, 영업이익률 등)는 평가에서 제외되었습니다.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 영업이익률 기반 성장률 평가 조정 배지 - 업데이트됨 */}
              {!investmentRating.isFinancialCompany && currentOpMargin >= 10 && (
                <OperatingMarginAdjustmentBadge currentOpMargin={currentOpMargin} />
              )}

              {/* 위험 요소 경고 섹션 - 업데이트됨 */}
              {investmentRating.riskFlags &&
                Object.entries(investmentRating.riskFlags).some(([_, value]) => value) && (
                  <div className="bg-red-50 p-4 sm:p-5 rounded-xl mb-5 border border-red-100 transition-all duration-300 hover:shadow-md">
                    <div className="flex items-start">
                      <div className="p-2 bg-red-100 rounded-full mr-3 flex-shrink-0">
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm sm:text-base text-red-800 mb-3">
                          위험 요소 감지
                        </p>
                        <div className="space-y-2">
                          {Object.entries(investmentRating.riskFlags)
                            .filter(([_, value]) => value)
                            .map(([flag, _]) => {
                              const details = getRiskFlagDetails(flag);
                              return (
                                <div key={flag} className="flex items-start">
                                  <div className="mr-2 text-red-600">{details?.icon}</div>
                                  <div>
                                    <p className="text-sm font-medium text-red-800">
                                      {details?.title}{' '}
                                      <span className="text-red-600">(-{details?.penalty}점)</span>
                                    </p>
                                    <p className="text-xs text-red-700">{details?.description}</p>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* 구분선 */}
              <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-6"></div>

              {/* 투자 등급 영역 - 세련된 그리드 레이아웃 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative mb-3 transform transition-transform duration-300 hover:scale-105">
                    {/* grade 속성 추가 */}
                    <CircularProgress
                      value={investmentRating.percentage}
                      grade={investmentRating.grade}
                    />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 mt-2">투자 등급</h3>
                  <p className="text-xs sm:text-sm text-gray-600 text-center">
                    종합 점수: {getDisplayScore(investmentRating.percentage)}점
                  </p>
                </div>

                <div className="col-span-2 flex flex-col justify-center space-y-4">
                  <div className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-100 transition-all duration-300 hover:shadow-md group">
                    <div className="flex justify-between mb-2">
                      <p className="text-sm sm:text-base font-medium text-gray-700 flex items-center">
                        <LineChart className="w-4 h-4 mr-2 text-emerald-600 group-hover:scale-110 transition-transform duration-300" />
                        핵심 지표 점수
                      </p>
                      <p className="text-base sm:text-lg font-bold group-hover:text-emerald-600 transition-colors duration-300">
                        {investmentRating.coreItemsScore}
                        <span className="text-xs text-gray-400">/10</span>
                      </p>
                    </div>
                    {renderScoreBar(investmentRating.coreItemsScore)}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3">
                      <p className="text-xs sm:text-sm">
                        핵심 지표 통과:{' '}
                        <span className="text-base sm:text-lg font-bold group-hover:text-emerald-600 transition-colors duration-300">
                          {investmentRating.coreItemsPassCount}
                        </span>
                        <span className="text-xs text-gray-400">
                          /{investmentRating.coreItemsCount}
                        </span>
                      </p>
                      <p>
                        {investmentRating.hasCriticalFailure && (
                          <span className="text-red-500 mt-1 sm:ml-2 flex items-center text-xs sm:text-sm">
                            <AlertTriangle size={14} className="mr-1 sm:mr-2 animate-pulse" /> 미달
                            항목 있음
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-100 transition-all duration-300 hover:shadow-md group">
                    <div className="flex justify-between mb-2">
                      <p className="text-sm sm:text-base font-medium text-gray-700 flex items-center">
                        <Info className="w-4 h-4 mr-2 text-emerald-600 group-hover:scale-110 transition-transform duration-300" />
                        세부 지표 점수
                      </p>
                      <p className="text-base sm:text-lg font-bold group-hover:text-emerald-600 transition-colors duration-300">
                        {investmentRating.detailedItemsScore}
                        <span className="text-xs text-gray-400">/10</span>
                      </p>
                    </div>
                    {renderScoreBar(investmentRating.detailedItemsScore)}
                  </div>

                  {/* 점수 분해 표시 - 업데이트됨 */}
                  <div className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-100">
                    <h4 className="font-medium text-sm text-gray-700 mb-3 flex items-center">
                      <Calculator className="w-4 h-4 mr-2 text-emerald-600" />
                      점수 구성
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>기본 점수 (가중 평균)</span>
                        <span className="font-medium">{investmentRating.baseScore}점</span>
                      </div>
                      {investmentRating.riskPenalty > 0 && (
                        <>
                          <div className="border-t pt-2 mt-2"></div>
                          <div className="flex justify-between text-red-600">
                            <span>위험 요소 차감</span>
                            <span className="font-medium">-{investmentRating.riskPenalty}점</span>
                          </div>
                          <div className="border-t pt-2 mt-2"></div>
                          <div className="flex justify-between font-bold">
                            <span>최종 점수</span>
                            <span>{investmentRating.score}점</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            * 핵심 지표(70%), 세부 지표(30%) 가중치 적용
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-amber-50 p-4 sm:p-5 rounded-xl border border-amber-100 transition-all duration-300 hover:shadow-md">
                    <p className="text-sm sm:text-base font-medium text-amber-800 mb-2 flex items-center">
                      <Award className="w-4 h-4 mr-2 text-amber-700" />
                      투자 분석
                    </p>
                    <p className="text-sm text-gray-700">{ratingDescription}</p>
                  </div>
                </div>
              </div>

              {/* 핵심 지표 요약 - 세련된 그리드 레이아웃 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* ROE 자리 */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 transition-all duration-300 hover:shadow-md hover:bg-white group">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1 text-emerald-600 group-hover:scale-110 transition-transform duration-300" />
                    ROE
                  </p>
                  <p className="text-base sm:text-xl font-bold truncate group-hover:text-emerald-600 transition-colors duration-300">
                    {formatNumber(
                      (checklistResults.find((item) => item.title === 'ROE (자기자본이익률)')
                        ?.actualValue as number) || 0
                    )}
                    %<span className="text-xs text-gray-400 ml-1">(최근 3년)</span>
                  </p>
                </div>
                {/* PER 자리 */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 transition-all duration-300 hover:shadow-md hover:bg-white group">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1 flex items-center">
                    <Percent className="w-3 h-3 mr-1 text-emerald-600 group-hover:scale-110 transition-transform duration-300" />
                    PER
                  </p>
                  <p className="text-base sm:text-xl font-bold truncate group-hover:text-emerald-600 transition-colors duration-300">
                    {formatNumber(
                      (checklistResults.find((item) => item.title === 'PER')
                        ?.actualValue as number) || 0
                    )}
                    배
                  </p>
                </div>
                {/* 금융회사가 아닐 때만 매출 성장률 표시 */}
                {!investmentRating.isFinancialCompany && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 transition-all duration-300 hover:shadow-md hover:bg-white group">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1 text-emerald-600 group-hover:scale-110 transition-transform duration-300" />
                      매출 성장률
                    </p>
                    <p className="text-base sm:text-xl font-bold truncate group-hover:text-emerald-600 transition-colors duration-300">
                      {formatNumber(
                        (checklistResults.find((item) => item.title === '매출액 성장률')
                          ?.actualValue as number) || 0
                      )}
                      %<span className="text-xs text-gray-400 ml-1">(최근 3년)</span>
                    </p>
                  </div>
                )}

                {/* 금융회사가 아닐 때만 부채비율 표시 */}
                {!investmentRating.isFinancialCompany && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 transition-all duration-300 hover:shadow-md hover:bg-white group">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 flex items-center">
                      <ShieldAlert className="w-3 h-3 mr-1 text-emerald-600 group-hover:scale-110 transition-transform duration-300" />
                      부채비율
                    </p>
                    <p className="text-base sm:text-xl font-bold truncate group-hover:text-emerald-600 transition-colors duration-300">
                      {formatNumber(
                        (checklistResults.find((item) => item.title === '부채비율')
                          ?.actualValue as number) || 0
                      )}
                      %
                    </p>
                  </div>
                )}

                {/* 금융회사일 때 대체 지표 표시 */}
                {investmentRating.isFinancialCompany && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 transition-all duration-300 hover:shadow-md hover:bg-white group">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1 text-emerald-600 group-hover:scale-110 transition-transform duration-300" />
                      순이익 증가율
                    </p>
                    <p className="text-base sm:text-xl font-bold truncate group-hover:text-emerald-600 transition-colors duration-300">
                      {formatNumber(
                        (checklistResults.find((item) => item.title === '순이익 증가율')
                          ?.actualValue as number) || 0
                      )}
                      %<span className="text-xs text-gray-400 ml-1">(최근 3년)</span>
                    </p>
                  </div>
                )}

                {/* 금융회사일 때 대체 지표 표시 */}
                {investmentRating.isFinancialCompany && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 transition-all duration-300 hover:shadow-md hover:bg-white group">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1 text-emerald-600 group-hover:scale-110 transition-transform duration-300" />
                      BPS 성장률
                    </p>
                    <p className="text-base sm:text-xl font-bold truncate group-hover:text-emerald-600 transition-colors duration-300">
                      {formatNumber(
                        (checklistResults.find((item) => item.title === 'BPS 성장률')
                          ?.actualValue as number) || 0
                      )}
                      %
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 체크리스트 결과 - 세련된 아코디언 디자인 */}
            <div className="space-y-6">
              {Object.entries(getHierarchicalCategories()).map(([mainCategory, subCategories]) => (
                <div key={mainCategory} className="mb-6">
                  <h2 className="text-base sm:text-lg font-medium text-gray-800 mb-3 flex items-center">
                    {getCategoryIcon(mainCategory)}
                    <span className="ml-2">{mainCategory}</span>
                  </h2>
                  <div className="space-y-4">
                    {Object.entries(subCategories).map(([subCategory, items]) => (
                      <div
                        key={`${mainCategory}-${subCategory}`}
                        className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-lg"
                      >
                        <button
                          className="w-full flex items-center justify-between p-4 sm:p-5 text-left focus:outline-none group"
                          onClick={() => toggleCategory(`${mainCategory}-${subCategory}`)}
                        >
                          <div className="flex items-center min-w-0">
                            <div className="p-2 bg-emerald-50 rounded-full mr-3 group-hover:bg-emerald-100 transition-colors duration-300">
                              {getCategoryIcon(mainCategory)}
                            </div>
                            {mainCategory === '핵심 지표' ? (
                              <h3 className="text-base sm:text-lg font-medium text-gray-700 truncate group-hover:text-gray-900 transition-colors duration-300">
                                핵심 지표
                              </h3>
                            ) : (
                              <span className="text-base sm:text-lg font-bold text-gray-800 truncate group-hover:text-gray-900 transition-colors duration-300">
                                {subCategory}
                              </span>
                            )}
                            <div className="flex items-center ml-3">
                              <p className="bg-gray-100 text-gray-800 font-semibold rounded-full px-2.5 py-1 text-sm group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors duration-300">
                                {getSubCategoryScore(items)}
                                <span className="text-xs text-gray-400">/10</span>
                              </p>
                            </div>
                          </div>
                          <div className="bg-gray-100 p-2 rounded-full group-hover:bg-emerald-50 transition-colors duration-300">
                            {expandedCategory === `${mainCategory}-${subCategory}` ? (
                              <ChevronUp className="h-5 w-5 text-gray-600 group-hover:text-emerald-600 transition-colors duration-300 transform rotate-0 group-hover:rotate-180 " />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-600 group-hover:text-emerald-600 transition-colors duration-300 transform rotate-0 group-hover:rotate-180 " />
                            )}
                          </div>
                        </button>

                        {expandedCategory === `${mainCategory}-${subCategory}` && (
                          <div className="px-5 sm:px-6 pb-5 sm:pb-6 animate-fadeIn">
                            {items.map((item, idx) => (
                              <div
                                key={idx}
                                className={`py-4 ${
                                  idx > 0 ? 'border-t border-gray-100' : ''
                                } transition-all duration-300 hover:bg-gray-50 rounded-lg p-2`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center flex-wrap mb-2">
                                      <span
                                        className={`text-base sm:text-lg font-bold truncate ${
                                          item.isFailCriteria
                                            ? 'text-red-500 line-through'
                                            : 'text-gray-800'
                                        }`}
                                      >
                                        {item.title}
                                      </span>
                                      <span
                                        className={`ml-2 text-sm ${
                                          item.isFailCriteria
                                            ? 'text-red-500 line-through'
                                            : 'text-gray-800'
                                        }`}
                                      >
                                        {renderImportance(item.importance, item.isFailCriteria)}
                                      </span>
                                      {item.isFailCriteria && (
                                        <span className="ml-2 text-xs text-white bg-red-500 px-2 py-0.5 rounded-full flex items-center animate-pulse">
                                          <AlertTriangle size={12} className="mr-1" /> 미달
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center">
                                      <span
                                        className={`px-3 py-1 rounded-xl text-sm font-semibold transition-all duration-300
                  ${
                    item.isFailCriteria
                      ? 'border-2 border-red-500 text-red-700 bg-red-50'
                      : item.score >= 7
                      ? 'border-2 border-emerald-600 text-emerald-800 bg-emerald-50'
                      : 'border border-gray-400 text-gray-800 bg-gray-50'
                  }`}
                                      >
                                        {typeof item.actualValue === 'number' &&
                                        item.actualValue < 0
                                          ? `${item.actualValue.toFixed(2)} `
                                          : typeof item.actualValue === 'number'
                                          ? `${item.actualValue.toFixed(2)}`
                                          : item.actualValue || '-'}
                                      </span>
                                      <span className="text-xs text-gray-500 ml-4 mt-0">
                                        | 기준: {item.targetValue}
                                      </span>
                                    </div>
                                    <div className="mt-3">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-gray-600">점수</span>
                                        <span className="text-xs text-gray-600">
                                          <span
                                            className={`text-base sm:text-lg font-bold ${
                                              item.score >= 7
                                                ? 'text-emerald-600'
                                                : item.score <= 3
                                                ? 'text-red-500'
                                                : 'text-gray-800'
                                            }`}
                                          >
                                            {item.score}
                                          </span>
                                          /{item.maxScore}
                                        </span>
                                      </div>
                                      {renderScoreBar(item.score, item.maxScore)}
                                    </div>

                                    {/* 성장률 관련 지표에 대한 추가 설명 컴포넌트 */}
                                    {(item.title === '영업이익 성장률' ||
                                      item.title === 'EPS 성장률' ||
                                      item.title === '순이익 증가율') &&
                                      !investmentRating.isFinancialCompany &&
                                      currentOpMargin >= 10 && (
                                        <GrowthRateExplanation
                                          type={
                                            item.title === '영업이익 성장률'
                                              ? 'operating'
                                              : item.title === 'EPS 성장률'
                                              ? 'eps'
                                              : 'net'
                                          }
                                          opMargin={currentOpMargin}
                                          actualValue={item.actualValue as number}
                                        />
                                      )}
                                  </div>
                                  <div className="ml-4 flex-shrink-0">
                                    {item.isPassed === true ? (
                                      <div className="bg-emerald-600 rounded-full p-1.5 shadow-md transition-transform duration-300 hover:scale-110 transform">
                                        <Check className="h-4 w-4 text-white" />
                                      </div>
                                    ) : item.isPassed === false ? (
                                      <div className="bg-gray-200 rounded-full p-1.5 shadow-sm transition-transform duration-300 hover:scale-110 transform">
                                        <XCircle className="h-4 w-4 text-gray-600" />
                                      </div>
                                    ) : (
                                      <div className="bg-gray-100 rounded-full p-1.5 shadow-sm transition-transform duration-300 hover:scale-110 transform">
                                        <AlertCircle className="h-4 w-4 text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 종합 평가 - 세련된 카드 디자인 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md mt-6 border border-gray-100 transition-all duration-300 hover:shadow-lg">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center">
                <div className="p-2 bg-emerald-50 rounded-full mr-3">
                  <Award className="mr-1 w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                </div>
                종합 투자 평가
              </h2>

              <div className="bg-gray-50 p-5 sm:p-6 rounded-xl mb-6 border border-gray-100 transition-all duration-300 hover:shadow-md">
                <div
                  className={`inline-block ${getGradeColor(
                    investmentRating.grade
                  )} text-base sm:text-lg font-bold rounded-xl px-3 py-1 mb-3`}
                >
                  {investmentRating.grade}등급 ({getDisplayScore(investmentRating.percentage)}점)
                </div>
                <p className="text-sm sm:text-base text-gray-800">{ratingDescription}</p>
              </div>

              <div className="mt-5">
                <h3 className="font-bold mb-3 text-sm sm:text-base text-gray-800 flex items-center">
                  <LineChart className="w-4 h-4 mr-2 text-emerald-600" />
                  카테고리별 평가
                </h3>
                <div className="space-y-3">
                  {Object.entries(getHierarchicalCategories()).map(
                    ([mainCategory, subCategories]) => (
                      <React.Fragment key={mainCategory}>
                        {Object.entries(subCategories).map(([subCategory, items]) => {
                          const categoryScore = getSubCategoryScore(items);
                          // 핵심 지표는 그대로 표시하고, 세부 지표는 세부 카테고리만 표시
                          const displayName =
                            mainCategory === '핵심 지표' ? '핵심 지표' : subCategory;

                          return (
                            <div
                              key={`${mainCategory}-${subCategory}`}
                              className="flex items-center text-sm group hover:bg-gray-50 rounded-lg p-2 transition-colors duration-300"
                            >
                              <div className="w-1/3 truncate flex items-center">
                                <div className="w-2 h-2 rounded-full bg-emerald-600 mr-2 group-hover:scale-150 transition-transform duration-300"></div>
                                {displayName}
                              </div>
                              <div className="w-1/2 px-2">{renderScoreBar(categoryScore)}</div>
                              <div className="w-1/6 text-right font-semibold group-hover:text-emerald-600 transition-colors duration-300">
                                {categoryScore}/10
                              </div>
                            </div>
                          );
                        })}
                      </React.Fragment>
                    )
                  )}
                </div>
              </div>

              <hr className="mt-6" />

              <div className="mt-6 w-full sm:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4 ">
                <Link href={`/fairprice?stockCode=${stockPrice.code}`} className="w-full">
                  <button className="w-full inline-flex items-center justify-center bg-emerald-600 text-white px-5 py-3 rounded-xl text-sm sm:text-base font-medium hover:bg-emerald-700 transition-all duration-300 shadow-sm hover:shadow group relative overflow-hidden">
                    {/* 버튼 배경 효과 */}
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-500 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* 버튼 텍스트 */}
                    <span className="relative flex items-center">
                      적정가계산
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

                {/* 네이버 증권 버튼 추가 */}
                <a
                  href={`https://finance.naver.com/item/main.naver?code=${stockPrice.code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <button className="w-full inline-flex items-center justify-center bg-emerald-600 text-white px-5 py-3 rounded-xl text-sm sm:text-base font-medium hover:bg-emerald-700 transition-all duration-300 shadow-sm hover:shadow group relative overflow-hidden">
                    {/* 버튼 배경 효과 */}
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-500 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* 버튼 텍스트 */}
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
          </>
        )}
      </main>
    </div>
  );
}

// 애니메이션 키프레임 추가
const styles = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}
`;

// 스타일 태그 추가
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.textContent = styles;
  document.head.appendChild(styleTag);
}
