// components/RiskWarning.tsx
'use client';

import { useState } from 'react';
import { AlertTriangle, X, Shield, FileText, Scale } from 'lucide-react';

// ===== 리스크 종목 상수들 =====
const OWNER_RISK_STOCKS = ['475560']; // 더본코리아
const ACCOUNTING_RISK_STOCKS: string[] = []; // 회계 리스크 (나중 확장용)
const REGULATORY_RISK_STOCKS: string[] = []; // 규제 리스크 (나중 확장용)
const ESG_RISK_STOCKS: string[] = []; // ESG 리스크 (나중 확장용)

// ===== 리스크 타입 정의 =====
type RiskType = 'OWNER_RISK' | 'ACCOUNTING_RISK' | 'REGULATORY_RISK' | 'ESG_RISK';

interface RiskInfo {
  type: RiskType;
  message: string;
  bgColor: string;
  textColor: string;
  icon: React.ReactNode;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
}

// ===== 리스크 메시지 설정 =====
const RISK_MESSAGES: Record<RiskType, Omit<RiskInfo, 'type'>> = {
  OWNER_RISK: {
    message: '오너리스크 - 데이터 기반 평가 대비 당분간 투자 주의',
    bgColor: 'bg-red-600',
    textColor: 'text-white',
    icon: <AlertTriangle size={20} />,
    level: 'HIGH',
  },
  ACCOUNTING_RISK: {
    message: '회계 리스크 - 재무제표 신뢰성 검토 필요',
    bgColor: 'bg-orange-600',
    textColor: 'text-white',
    icon: <FileText size={20} />,
    level: 'MEDIUM',
  },
  REGULATORY_RISK: {
    message: '규제 리스크 - 관련 법규 변경 가능성 주의',
    bgColor: 'bg-yellow-600',
    textColor: 'text-white',
    icon: <Scale size={20} />,
    level: 'MEDIUM',
  },
  ESG_RISK: {
    message: 'ESG 리스크 - 환경·사회·지배구조 이슈 존재',
    bgColor: 'bg-purple-600',
    textColor: 'text-white',
    icon: <Shield size={20} />,
    level: 'LOW',
  },
};

// ===== 리스크 체크 로직 =====
const checkRisks = (stockCode: string): RiskInfo[] => {
  if (!stockCode) return [];

  const risks: RiskInfo[] = [];

  // 오너리스크 체크
  if (OWNER_RISK_STOCKS.includes(stockCode)) {
    risks.push({
      type: 'OWNER_RISK',
      ...RISK_MESSAGES.OWNER_RISK,
    });
  }

  // 회계리스크 체크
  if (ACCOUNTING_RISK_STOCKS.includes(stockCode)) {
    risks.push({
      type: 'ACCOUNTING_RISK',
      ...RISK_MESSAGES.ACCOUNTING_RISK,
    });
  }

  // 규제리스크 체크
  if (REGULATORY_RISK_STOCKS.includes(stockCode)) {
    risks.push({
      type: 'REGULATORY_RISK',
      ...RISK_MESSAGES.REGULATORY_RISK,
    });
  }

  // ESG리스크 체크
  if (ESG_RISK_STOCKS.includes(stockCode)) {
    risks.push({
      type: 'ESG_RISK',
      ...RISK_MESSAGES.ESG_RISK,
    });
  }

  return risks;
};

// ===== 메인 컴포넌트 =====
interface RiskWarningProps {
  stockCode: string;
  className?: string;
}

const RiskWarning: React.FC<RiskWarningProps> = ({ stockCode, className = '' }) => {
  const [dismissedRisks, setDismissedRisks] = useState<Set<RiskType>>(new Set());

  // 리스크 체크
  const risks = checkRisks(stockCode);

  // 해제되지 않은 리스크만 필터링
  const activeRisks = risks.filter((risk) => !dismissedRisks.has(risk.type));

  // 리스크가 없으면 아무것도 렌더링하지 않음
  if (activeRisks.length === 0) return null;

  // 가장 높은 리스크 레벨 찾기 (HIGH > MEDIUM > LOW)
  const getHighestRisk = (risks: RiskInfo[]): RiskInfo => {
    const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return risks.reduce((highest, current) =>
      priorityOrder[current.level] > priorityOrder[highest.level] ? current : highest
    );
  };

  const primaryRisk = getHighestRisk(activeRisks);

  // 리스크 해제 핸들러
  const handleDismiss = (riskType: RiskType) => {
    setDismissedRisks((prev) => new Set([...prev, riskType]));
  };

  return (
    <div className={`fixed inset-0 z-40 pointer-events-none ${className}`}>
      {/* 전체 반투명 검은 배경 */}
      <div className="absolute inset-0 bg-black opacity-50" />

      {/* 폴리스 라인 테이프들 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* 메인 테이프 (중앙) */}
        <div
          className="absolute w-full h-16 bg-red-600 text-white shadow-2xl transform rotate-12"
          style={{ minWidth: '150%' }}
        >
          <div className="flex items-center justify-center h-full overflow-hidden">
            <div className="flex whitespace-nowrap animate-pulse">
              <span className="mx-8 font-bold text-lg flex items-center">
                <AlertTriangle className="mr-2" size={20} />
                ⚠️ {primaryRisk.message}
              </span>
              <span className="mx-8 font-bold text-lg flex items-center">
                <AlertTriangle className="mr-2" size={20} />
                ⚠️ {primaryRisk.message}
              </span>
              <span className="mx-8 font-bold text-lg flex items-center">
                <AlertTriangle className="mr-2" size={20} />
                ⚠️ {primaryRisk.message}
              </span>
            </div>
          </div>
        </div>

        {/* 상단 테이프 */}
        <div
          className="absolute w-full h-12 bg-red-700 text-white shadow-xl transform -rotate-12 -translate-y-20"
          style={{ minWidth: '140%' }}
        >
          <div className="flex items-center justify-center h-full overflow-hidden">
            <div className="flex whitespace-nowrap">
              <span className="mx-6 font-semibold text-sm">
                🚨 투자 주의 🚨 CAUTION 🚨 투자 주의 🚨 CAUTION
              </span>
              <span className="mx-6 font-semibold text-sm">
                🚨 투자 주의 🚨 CAUTION 🚨 투자 주의 🚨 CAUTION
              </span>
            </div>
          </div>
        </div>

        {/* 하단 테이프 */}
        <div
          className="absolute w-full h-12 bg-red-700 text-white shadow-xl transform rotate-12 translate-y-20"
          style={{ minWidth: '140%' }}
        >
          <div className="flex items-center justify-center h-full overflow-hidden">
            <div className="flex whitespace-nowrap">
              <span className="mx-6 font-semibold text-sm">
                🚨 투자 주의 🚨 CAUTION 🚨 투자 주의 🚨 CAUTION
              </span>
              <span className="mx-6 font-semibold text-sm">
                🚨 투자 주의 🚨 CAUTION 🚨 투자 주의 🚨 CAUTION
              </span>
            </div>
          </div>
        </div>

        {/* 추가 리스크 테이프 (있을 경우) */}
        {activeRisks.length > 1 && (
          <div
            className="absolute w-full h-10 bg-orange-600 text-white shadow-lg transform -rotate-6 translate-y-40"
            style={{ minWidth: '120%' }}
          >
            <div className="flex items-center justify-center h-full overflow-hidden">
              <div className="flex whitespace-nowrap">
                <span className="mx-4 font-medium text-xs">
                  ⚠️ +{activeRisks.length - 1}개 추가 리스크 존재 ⚠️ ADDITIONAL RISKS
                </span>
                <span className="mx-4 font-medium text-xs">
                  ⚠️ +{activeRisks.length - 1}개 추가 리스크 존재 ⚠️ ADDITIONAL RISKS
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskWarning;
