'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CompanySearchInput from '@/components/CompanySearchInput';
import { CompanyInfo, stockCodeMap } from '@/lib/stockCodeData';
import {
  AlertCircle,
  CheckSquare,
  DollarSign,
  Loader2,
  Search as SearchIcon,
  Target,
  X,
  BarChart3,
  TrendingUp,
  Sparkles,
  MessageCircleQuestion,
} from 'lucide-react';

// 체크리스트 관련 임포트
import {
  calculateChecklist,
  calculateInvestmentRating,
  getStockPriceFromSupabase,
} from './checklist/ChecklistCalculate';
import { InvestmentRating, ScoredChecklistItem, StockPrice } from './checklist/types';

// 적정가 계산 관련 임포트
import { extractCalculatedResultsFromSupabase } from './fairprice/FairpriceCalculate';
import { CalculatedResults } from './fairprice/types';
import MarqueeNav from '@/components/marquee/MarqueeNav';
import RiskWarning from '@/components/RiskWarning';

// 가격 비교 막대 차트 컴포넌트
const PriceGauge = ({
  currentPrice,
  lowRange,
  midRange,
  highRange,
}: {
  currentPrice: number;
  lowRange: number;
  midRange: number;
  highRange: number;
}) => {
  // 현재가와 적정가(중간값) 비교
  const priceDiff = currentPrice - midRange;
  const priceDiffPercent = (priceDiff / midRange) * 100;
  const isPriceDiffPositive = priceDiff < 0;

  // 상태에 따른 색상과 텍스트 결정
  const statusColor = isPriceDiffPositive ? 'text-blue-600' : 'text-red-500';
  const statusText = isPriceDiffPositive ? '저가' : '고가';

  // 현재주가 막대 색상 결정 (±10% 기준)
  let currentPriceBarColor;
  if (Math.abs(priceDiffPercent) <= 10) {
    // ±10% 이내면 회색
    currentPriceBarColor = 'bg-gradient-to-r from-gray-500 to-gray-600';
  } else if (isPriceDiffPositive) {
    // 저가면 파란색
    currentPriceBarColor = 'bg-gradient-to-r from-blue-500 to-blue-600';
  } else {
    // 고가면 빨간색
    currentPriceBarColor = 'bg-gradient-to-r from-red-500 to-red-600';
  }

  // 막대 길이 계산 - 더 직관적으로
  const diffPercent = Math.abs(priceDiffPercent);
  let fairBarWidth, currentBarWidth;

  if (diffPercent < 2) {
    // 2% 미만 차이면 거의 같은 길이
    fairBarWidth = currentBarWidth = '100%';
  } else if (diffPercent < 5) {
    // 2-5% 차이면 약간의 차이
    fairBarWidth = isPriceDiffPositive ? '100%' : '90%';
    currentBarWidth = isPriceDiffPositive ? '90%' : '100%';
  } else if (diffPercent < 10) {
    // 5-10% 차이면 명확한 차이
    fairBarWidth = isPriceDiffPositive ? '100%' : '80%';
    currentBarWidth = isPriceDiffPositive ? '80%' : '100%';
  } else if (diffPercent < 20) {
    // 10-20% 차이면 큰 차이
    fairBarWidth = isPriceDiffPositive ? '100%' : '70%';
    currentBarWidth = isPriceDiffPositive ? '70%' : '100%';
  } else if (diffPercent < 30) {
    // 20-30% 차이면 매우 큰 차이
    fairBarWidth = isPriceDiffPositive ? '100%' : '60%';
    currentBarWidth = isPriceDiffPositive ? '60%' : '100%';
  } else {
    // 30% 이상 차이면 극단적 차이
    fairBarWidth = isPriceDiffPositive ? '100%' : '50%';
    currentBarWidth = isPriceDiffPositive ? '50%' : '100%';
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {/* 상단 비교 텍스트 (차이금액 제거) */}
      <div className="mb-6 ">
        <span className="text-xs text-gray-400 text-start">적정가 대비</span>
        <p className={`-mt-1 text-xl font-bold ${statusColor}`}>
          {Math.abs(priceDiffPercent).toFixed(1)}
          <span className="text-sm ">% {statusText}</span>
        </p>
      </div>

      <div className="w-full space-y-3">
        {/* 적정가 막대 */}
        <div className="flex items-center">
          <div
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-8 flex items-center justify-center rounded-r-lg shadow-sm relative"
            style={{ width: fairBarWidth }}
          >
            <span className="text-white text-sm font-medium">적정가</span>
          </div>
          <div className="ml-3 text-sm font-medium whitespace-nowrap">
            {new Intl.NumberFormat('ko-KR').format(Math.round(midRange))}원
          </div>
        </div>

        {/* 현재주가 막대 */}
        <div className="flex items-center">
          <div
            className={`${currentPriceBarColor} h-8 flex items-center justify-center rounded-r-lg shadow-sm relative`}
            style={{ width: currentBarWidth }}
          >
            <span className="text-white text-sm font-medium">현재주가</span>
          </div>
          <div className="ml-3 text-sm font-medium whitespace-nowrap">
            {new Intl.NumberFormat('ko-KR').format(Math.round(currentPrice))}원
          </div>
        </div>
      </div>

      {/* 적정가 범위 정보 */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>
          적정가 범위: {new Intl.NumberFormat('ko-KR').format(Math.round(lowRange))}원 ~{' '}
          {new Intl.NumberFormat('ko-KR').format(Math.round(highRange))}원
        </p>
      </div>
    </div>
  );
};

export default function HomePage() {
  // URL 쿼리 파라미터 가져오기
  const searchParams = useSearchParams();
  const router = useRouter();

  // 상태 관리
  const [companyName, setCompanyName] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyInfo | null>(null);
  const [stockPrice, setStockPrice] = useState<StockPrice | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [showSearchForm, setShowSearchForm] = useState<boolean>(true);
  const [autoSearchTriggered, setAutoSearchTriggered] = useState<boolean>(false);

  // 추가 검색창 관련 상태
  const [showNewSearchForm, setShowNewSearchForm] = useState<boolean>(false);
  const [newCompanyName, setNewCompanyName] = useState<string>('');
  const [newSelectedCompany, setNewSelectedCompany] = useState<CompanyInfo | null>(null);

  // 체크리스트 결과 상태
  const [checklistResults, setChecklistResults] = useState<ScoredChecklistItem[]>([]);
  const [investmentRating, setInvestmentRating] = useState<InvestmentRating | null>(null);

  // 적정가 계산 결과 상태
  const [calculatedResults, setCalculatedResults] = useState<CalculatedResults | null>(null);

  // 안전한 회사명 표시 함수
  const getDisplayCompanyName = () => {
    const name = selectedCompany?.companyName || companyName;
    console.log('🏷️ 표시할 회사명:', {
      selectedCompany: selectedCompany?.companyName,
      companyName,
      result: name,
    });
    return name || '회사명 불러오는 중...';
  };

  // 상태 변화 모니터링
  useEffect(() => {
    console.log('🔄 상태 변화 감지:', {
      companyName,
      selectedCompany: selectedCompany?.companyName,
      stockPrice: stockPrice?.name,
      success,
      loading,
    });
  }, [companyName, selectedCompany, stockPrice, success, loading]);

  // ⭐ 수정된 useEffect - 검색 전/후 상태 구분
  useEffect(() => {
    const stockCode = searchParams.get('stockCode');

    if (!stockCode) {
      // URL에 stockCode 없으면 → 무조건 초기화 (조건 없이!)
      console.log('🧹 stockCode 없음 - 무조건 초기화');
      setCompanyName('');
      setSelectedCompany(null);
      setStockPrice(null);
      setChecklistResults([]);
      setInvestmentRating(null);
      setCalculatedResults(null);
      setSuccess(false);
      setError('');
      setShowSearchForm(true);
      setAutoSearchTriggered(false);
      return;
    }

    // URL에 stockCode 있으면 → 검색 (현재 종목과 다를 때만)
    if (selectedCompany?.stockCode !== stockCode) {
      console.log('🔍 새로운 종목 검색:', stockCode);
      const company = Object.values(stockCodeMap).find((c) => c.stockCode === stockCode);
      if (company) {
        handleCompanySelect(company);
        setAutoSearchTriggered(true);
        setTimeout(() => performSearch(company), 100);
      }
    }
  }, [searchParams]);

  // 회사 선택 핸들러 (첫 화면용)
  const handleCompanySelect = (company: CompanyInfo) => {
    console.log('🏢 회사 선택:', company.companyName, company.stockCode);
    setCompanyName(company.companyName);
    setSelectedCompany(company);
    console.log('✅ 상태 설정 완료');
  };

  // 새 검색창 회사 선택 핸들러
  const handleNewCompanySelect = (company: CompanyInfo) => {
    console.log('🔄 새 회사 선택:', company.companyName, company.stockCode);
    setNewCompanyName(company.companyName);
    setNewSelectedCompany(company);
    console.log('✅ 새 검색 상태 설정 완료');
  };

  // ⭐ 수정된 performSearch 함수 - URL 업데이트 타이밍 조정
  const performSearch = async (company: CompanyInfo) => {
    console.log('===== 종합 검색 시작 =====');
    console.log(`전달받은 회사 정보:`, company);
    console.log(`현재 상태 - companyName: ${companyName}, selectedCompany:`, selectedCompany);

    console.log('🧹 상태 초기화 시작');

    // 나머지 상태 초기화 (회사 정보는 건드리지 않음)
    setStockPrice(null);
    setChecklistResults([]);
    setInvestmentRating(null);
    setCalculatedResults(null);
    setSuccess(false);
    setError('');
    setLoading(true);
    setShowNewSearchForm(false);

    console.log('✅ 상태 초기화 완료');
    console.log(`상태 확인 - companyName: ${companyName}, selectedCompany:`, selectedCompany);

    try {
      console.log('📊 데이터 가져오기 시작');

      // 주가 정보 가져오기
      console.log('💰 주가 데이터 요청...');
      const stockPriceData = await getStockPriceFromSupabase(company.stockCode);
      if (!stockPriceData) {
        throw new Error(`${company.companyName}의 주가 데이터를 찾을 수 없습니다`);
      }

      console.log('✅ 주가 데이터 설정:', stockPriceData);
      setStockPrice(stockPriceData);

      // 두 분석을 병렬로 실행
      console.log('🔄 병렬 분석 시작...');
      const [checklistPromise, fairPricePromise] = await Promise.allSettled([
        // 체크리스트 계산
        (async () => {
          const checklist = await calculateChecklist(company.stockCode, company.industry);
          if (checklist.length === 0) {
            throw new Error(`${company.companyName}의 체크리스트 데이터를 찾을 수 없습니다`);
          }
          return checklist;
        })(),

        // 적정가 계산
        (async () => {
          const fairPriceResults = await extractCalculatedResultsFromSupabase(company.stockCode);
          if (!fairPriceResults) {
            throw new Error(`${company.companyName}의 적정가 데이터를 찾을 수 없습니다`);
          }
          return fairPriceResults;
        })(),
      ]);

      // 체크리스트 결과 처리
      if (checklistPromise.status === 'fulfilled') {
        const checklist = checklistPromise.value;
        console.log('✅ 체크리스트 데이터 설정');
        setChecklistResults(checklist);

        // 투자 등급 계산
        const rating = calculateInvestmentRating(checklist, company.stockCode, company.industry);
        console.log('✅ 투자 등급 설정:', rating.grade);
        setInvestmentRating(rating);
      }

      // 적정가 계산 결과 처리
      if (fairPricePromise.status === 'fulfilled') {
        const fairPriceResults = fairPricePromise.value;
        console.log('✅ 적정가 데이터 설정');
        setCalculatedResults(fairPriceResults);
      }

      // 결과 표시를 위한 설정
      console.log('🎯 성공 상태 설정');
      setSuccess(true);
      setShowSearchForm(false);

      // 새 검색창 관련 상태 초기화
      setNewCompanyName('');
      setNewSelectedCompany(null);

      console.log('🎉 전체 분석 완료!');

      // ⭐ 중요: URL 업데이트를 성공 후에 실행 (useEffect 충돌 방지)
      setTimeout(() => {
        console.log('🔗 URL 업데이트 시작');
        const url = new URL(window.location.href);
        url.searchParams.set('stockCode', company.stockCode);
        router.push(url.pathname + url.search, { scroll: false });
        console.log('✅ URL 업데이트 완료');
      }, 100);
    } catch (error) {
      console.error('❌ 오류 발생:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('알 수 없는 오류가 발생했습니다');
      }
    } finally {
      setLoading(false);
    }
  };

  // 메인 검색 함수 (첫 화면용)
  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log('🔍 검색 시작');
    console.log('선택된 회사:', selectedCompany);
    console.log('현재 companyName 상태:', companyName);

    // 선택된 회사가 없으면 에러 표시
    if (!selectedCompany) {
      setError('회사를 검색하고 선택해주세요');
      return;
    }

    // 수동 검색이므로 자동 검색 트리거를 true로 설정 (중복 방지)
    setAutoSearchTriggered(true);

    console.log('🚀 performSearch 호출 직전');
    console.log('전달할 회사 정보:', selectedCompany);

    // 검색 수행
    await performSearch(selectedCompany);
  };

  // 새 검색창 검색 함수
  const handleNewSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 선택된 회사가 없으면 에러 표시
    if (!newSelectedCompany) {
      setError('회사를 검색하고 선택해주세요');
      return;
    }

    console.log('🆕 새 검색 시작:', newSelectedCompany.companyName);

    // 새로 선택된 회사 정보를 메인 상태로 복사
    setCompanyName(newSelectedCompany.companyName);
    setSelectedCompany(newSelectedCompany);

    // 수동 검색이므로 자동 검색 트리거를 true로 설정 (중복 방지)
    setAutoSearchTriggered(true);

    // 검색 수행
    await performSearch(newSelectedCompany);
  };

  // "다른 종목" 버튼 핸들러
  const handleShowNewSearch = () => {
    // 새 검색창 관련 상태 초기화
    setNewCompanyName('');
    setNewSelectedCompany(null);
    setError('');

    // 새 검색창 표시
    setShowNewSearchForm(true);
  };

  // 숫자 포맷팅 함수
  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  // 점수 표시 함수 (체크리스트에서 가져옴)
  const getDisplayScore = (value: number): number => {
    if (investmentRating) {
      const coreItemsPassCount = investmentRating.coreItemsPassCount;
      const coreItemsCount = investmentRating.coreItemsCount;
      const isFinancialCompany = investmentRating.isFinancialCompany;

      // 핵심 지표 통과 비율
      const corePassRatio = coreItemsCount > 0 ? coreItemsPassCount / coreItemsCount : 0;

      // 금융회사와 일반 기업에 대해 다른 보너스 점수 적용
      let bonus = 0;

      if (isFinancialCompany) {
        // 금융회사용 보너스 체계 (3개 핵심지표 기준)
        if (corePassRatio === 1) bonus = 20; // 100% 통과: +20점
        else if (corePassRatio >= 0.67) bonus = 15; // 67% 통과: +15점
        else if (corePassRatio >= 0.33) bonus = 10; // 33% 통과: +10점
      } else {
        // 일반 기업용 보너스 체계
        if (corePassRatio >= 0.8) bonus = 20; // 80% 이상 통과: +20점
        else if (corePassRatio >= 0.5) bonus = 10; // 50% 이상 통과: +10점
      }

      return Math.min(Math.round(value + bonus), 100);
    }

    // 기본값: 20점 추가
    return Math.min(Math.round(value + 20), 100);
  };

  // 등급에 따른 색상 결정 (체크리스트에서 가져옴)
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

  // 원형 프로그레스 바 컴포넌트 (체크리스트에서 가져옴)
  const CircularProgress = ({
    value,
    grade,
    size = 120,
  }: {
    value: number;
    grade: string;
    size?: number;
  }) => {
    // 반응형 크기 조절
    const [progressSize, setProgressSize] = useState(size);
    const [gradeSize, setGradeSize] = useState(40); // 등급 원 크기
    const [gradePosition, setGradePosition] = useState({ top: -4, right: -4 }); // 등급 원 위치

    // 화면 크기에 따라 프로그레스 바 크기 및 관련 요소 조정
    useEffect(() => {
      const updateSizes = () => {
        let newSize, newGradeSize, newGradePosition;

        if (window.innerWidth >= 1024) {
          // 큰 데스크탑 (lg 이상)
          newSize = 180;
          newGradeSize = 56;
          newGradePosition = { top: -8, right: -8 };
        } else {
          // lg 미만은 모두 md 설정으로 통일
          newSize = 160;
          newGradeSize = 48;
          newGradePosition = { top: -6, right: -6 };
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
    // 실제 값으로 원 채우기 계산
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

  // 마키아이템
  const marqueeItems = [
    { href: '/fairprice', text: '적정가 계산' },
    { href: '/checklist', text: '체크리스트' },
    { href: '/profit-calculator', text: '수익가치 계산' },
    { href: '/graham', text: '벤자민 그레이엄 전략' },
    { href: '/lynch', text: '피터 린치 PEG 전략' },
    { href: '/howard', text: '하워드 막스 내재가치' },
    { href: '/flavor', text: '고배당 가치주 전략' },
    { href: '/quality', text: '비즈니스 퀄리티 전략' },
    { href: '/s-rim', text: 'S-RIM 내재가치 전략' },
    { href: '/profit', text: '수익가치 전략' },
    { href: '/info', text: '서비스 소개' },
  ];

  // Google 스타일 첫 화면 렌더링 - 네비게이션바 고려한 높이 계산
  if (showSearchForm && !loading && !success) {
    return (
      <div className="h-[calc(100vh-73px)] bg-white flex flex-col justify-center items-center px-6 sm:px-8">
        {/* 로고/브랜드 영역 */}
        <div className="mb-4 text-center">
          {/* 메인 헤드라인 */}
          <div className="flex items-start sm:gap-2">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-400 mb-2 leading-tight">
              투자 전 필수 체크포인트
            </h1>

            <h1 className="-mt-4 text-xl md:text-2xl font-extrabold text-emerald-400 mb-4 leading-tight">
              VT
            </h1>
          </div>
        </div>

        {/* 검색 영역 */}
        <div className="w-full max-w-lg">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="relative group">
              <CompanySearchInput
                onCompanySelect={handleCompanySelect}
                initialValue={companyName}
                placeholder="분석할 기업명 또는 종목코드 입력"
                className="shadow-lg hover:shadow-xl transition-all duration-300"
              />
            </div>

            <div className="text-center">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center mx-auto"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="mr-3 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <SearchIcon size={20} className="mr-3" />
                    종합 분석 시작하기
                  </>
                )}
              </button>
            </div>

            <Link href="/info">
              <div className="flex items-center justify-center gap-1 text-xs sm:text-sm mt-16 text-center text-gray-400 ">
                <MessageCircleQuestion size={16} />
                <p className="hover:text-gray-800">밸류타게터 서비스 소개</p>
              </div>
            </Link>

            {/* 마키 UI - 네비게이션 메뉴들이 흐르는 자막 */}

            <div className="mt-8 w-full overflow-hidden">
              <MarqueeNav items={marqueeItems} />
            </div>
          </form>

          {/* 오류 메시지 */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 px-4 sm:px-6 py-4 sm:py-6">
      <RiskWarning stockCode={selectedCompany?.stockCode || ''} />
      <main className="flex-1 max-w-4xl mx-auto w-full">
        {/* 로딩 상태 */}
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

        {/* 검색 후 상단 바 - 수정된 부분 */}
        {!loading && success && (
          <>
            <div className="bg-white rounded-2xl p-5 sm:px-6 shadow-md mb-6 flex justify-between items-center border border-gray-100 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-50 rounded-full mr-3">
                  <Target className="h-5 w-5 sm:h-5 sm:w-5 text-emerald-600" />
                </div>
                <p className="text-lg font-semibold text-gray-800 truncate">
                  {getDisplayCompanyName()}{' '}
                  <span className="font-normal text-sm text-gray-500">({stockPrice?.code})</span>
                </p>
              </div>
              <button
                onClick={handleShowNewSearch}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 text-sm rounded-xl flex items-center transition-all duration-300 group"
              >
                <SearchIcon className="h-4 w-4 sm:mr-2 group-hover:scale-110 transition-transform duration-300" />
                <span className="hidden sm:block">다른 종목</span>
              </button>
            </div>
          </>
        )}

        {/* 새로운 검색 폼 - 결과 화면에서 추가 검색용 */}
        {showNewSearchForm && success && (
          <div className="bg-white rounded-2xl p-6 shadow-md mb-6 border border-gray-100 transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">다른 종목 검색</h3>
              <button
                onClick={() => setShowNewSearchForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                aria-label="닫기"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleNewSearch} className="space-y-4">
              <div className="relative">
                <CompanySearchInput
                  onCompanySelect={handleNewCompanySelect}
                  initialValue={newCompanyName}
                  placeholder="새로 분석할 기업명 또는 종목코드 입력"
                  className="transition-all duration-300 focus-within:shadow-md"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      분석 중...
                    </>
                  ) : (
                    <>
                      <SearchIcon size={18} className="mr-2" />
                      분석하기
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowNewSearchForm(false)}
                  className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all duration-300"
                >
                  취소
                </button>
              </div>
            </form>
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

        {/* 결과 영역 - 수정된 부분 */}
        {success && stockPrice && (
          <>
            {/* 주요 정보 요약 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md mb-6 border border-gray-100 transition-all duration-300 hover:shadow-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 sm:mb-6">
                <div className="w-full">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center break-words">
                    {getDisplayCompanyName()}{' '}
                    <span className="text-xs sm:text-sm text-gray-500 ml-2">
                      ({stockPrice.code})
                    </span>
                  </h2>

                  <p className="text-sm sm:text-base text-gray-600 mt-1 flex items-center">
                    <span>현재 주가: </span>
                    <span className="text-gray-800 text-lg sm:text-xl font-semibold ml-1">
                      {formatNumber(stockPrice.price)}원
                    </span>
                    {stockPrice.formattedDate && (
                      <span className="text-gray-500 text-xs sm:text-sm ml-2 bg-gray-100 px-2 py-0.5 rounded-full">
                        {stockPrice.formattedDate}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* 구분선 */}
              <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-6"></div>

              {/* 투자 분석 결과 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* 왼쪽: 투자 등급 */}
                <div className="bg-white px-6 pt-4 pb-1 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 grid grid-rows-12">
                  <h3 className="text-lg font-bold text-gray-800 row-span-1">투자 등급</h3>

                  <div className="flex flex-col items-center justify-center row-span-8">
                    {investmentRating && (
                      <div className="relative transform transition-transform duration-300 hover:scale-105">
                        <CircularProgress
                          value={investmentRating.percentage}
                          grade={investmentRating.grade}
                        />
                      </div>
                    )}

                    {!investmentRating && (
                      <div className="h-40 w-40 flex items-center justify-center bg-gray-100 rounded-full">
                        <p className="text-gray-400 text-lg">데이터 없음</p>
                      </div>
                    )}
                  </div>

                  <div className="row-span-3 flex items-center">
                    <Link href={`/checklist?stockCode=${stockPrice.code}`} className="w-full">
                      <button className="w-full border-2 border-gray-200 text-gray-600 py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center group cursor-pointer">
                        <span className="mr-2">
                          <CheckSquare size={18} />
                        </span>
                        체크리스트 자세히 보기
                      </button>
                    </Link>
                  </div>
                </div>

                {/* 오른쪽: 적정가 범위 - 게이지 바로 교체 */}
                <div className="bg-white px-6 pt-4 pb-1 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 grid grid-rows-12">
                  <h3 className="text-lg font-bold text-gray-800 row-span-1">적정가</h3>

                  <div className="flex flex-col items-center justify-center row-span-8">
                    {calculatedResults && stockPrice ? (
                      <PriceGauge
                        currentPrice={stockPrice.price}
                        lowRange={calculatedResults.priceRange.lowRange}
                        midRange={calculatedResults.priceRange.midRange}
                        highRange={calculatedResults.priceRange.highRange}
                      />
                    ) : (
                      <div className="h-40 w-40 flex items-center justify-center bg-gray-100 rounded-xl">
                        <p className="text-gray-400 text-lg">데이터 없음</p>
                      </div>
                    )}
                  </div>

                  <div className="row-span-3 flex items-center">
                    <Link href={`/fairprice?stockCode=${stockPrice.code}`} className="w-full">
                      <button className="w-full border-2 border-gray-200 text-gray-600 py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center group cursor-pointer">
                        <span className="mr-2">
                          <DollarSign size={18} />
                        </span>
                        적정가 자세히 보기
                      </button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* 종합 평가 문구 - 수정된 부분 */}
              {investmentRating && calculatedResults && (
                <div className="bg-gray-50 p-5 rounded-xl text-center">
                  <p className="text-gray-700">
                    <strong>{getDisplayCompanyName()}</strong>는(은) 현재{' '}
                    <span className="font-bold">{investmentRating.grade}등급</span> 투자 대상으로,{' '}
                    {stockPrice.price < calculatedResults.priceRange.midRange ? (
                      <span className="text-emerald-600 font-semibold">
                        적정가({formatNumber(calculatedResults.priceRange.midRange)}원) 대비 약{' '}
                        {Math.round(
                          (1 - stockPrice.price / calculatedResults.priceRange.midRange) * 100
                        )}
                        % 저평가
                      </span>
                    ) : (
                      <span className="text-red-500 font-semibold">
                        적정가({formatNumber(calculatedResults.priceRange.midRange)}원) 대비 약{' '}
                        {Math.round(
                          (stockPrice.price / calculatedResults.priceRange.midRange - 1) * 100
                        )}
                        % 고평가
                      </span>
                    )}{' '}
                    되어 있습니다.
                  </p>
                </div>
              )}

              <hr className="mt-6" />

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Link
                  href={`/checklist?stockCode=${selectedCompany?.stockCode}`}
                  className="w-full"
                >
                  <button className="w-full inline-flex items-center justify-center border-2 border-gray-200 text-gray-600 px-5 py-3 rounded-xl text-sm sm:text-base font-medium hover:bg-gray-200 transition-all duration-300 shadow-sm hover:shadow group relative overflow-hidden cursor-pointer">
                    {/* 버튼 배경 효과 */}
                    {/* <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-500 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div> */}

                    {/* 버튼 텍스트 */}
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

                <Link href={`/fairprice?stockCode=${stockPrice.code}`} className="w-full">
                  <button className="w-full inline-flex items-center justify-center border-2 border-gray-200 text-gray-600 px-5 py-3 rounded-xl text-sm sm:text-base font-medium hover:bg-gray-200 transition-all duration-300 shadow-sm hover:shadow group relative overflow-hidden cursor-pointer">
                    {/* 버튼 배경 효과 */}
                    {/* <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-500 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div> */}

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

                {/* 수익가치 계산 버튼 추가 */}
                <Link
                  href={`/profit-calculator?stockCode=${selectedCompany?.stockCode}`}
                  className="w-full"
                >
                  <button className="w-full inline-flex items-center justify-center border-2 border-gray-200 text-gray-600 px-5 py-3 rounded-xl text-sm sm:text-base font-medium hover:bg-gray-200 transition-all duration-300 shadow-sm hover:shadow group relative overflow-hidden cursor-pointer">
                    {/* 버튼 배경 효과 */}
                    {/* <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-500 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div> */}

                    {/* 버튼 텍스트 */}
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
                  <button className="w-full inline-flex items-center justify-center border-2 border-gray-200 text-gray-600 px-5 py-3 rounded-xl text-sm sm:text-base font-medium hover:bg-gray-200 transition-all duration-300 shadow-sm hover:shadow group relative overflow-hidden cursor-pointer">
                    {/* 버튼 배경 효과 */}
                    {/* <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-500 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div> */}

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
