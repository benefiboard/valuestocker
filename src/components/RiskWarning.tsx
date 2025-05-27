// components/RiskWarning.tsx
'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

// ===== 리스크 종목 상수 (단순화) =====
const RISK_STOCKS: Record<string, string> = {
  '475560': '오너 리스크', // 더본코리아
  '017670': '해킹 리스크-고객 정보유출', // 해킹 리스크
  // 추가 종목은 여기에 한 줄씩만 추가하면 됨
  // '123456': '회계 리스크',
  // '789012': 'ESG 리스크',
};

// ===== 메인 컴포넌트 =====
interface RiskWarningProps {
  stockCode: string;
  className?: string;
}

const RiskWarning: React.FC<RiskWarningProps> = ({ stockCode, className = '' }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  // 리스크 체크 (단순화)
  const riskReason = RISK_STOCKS[stockCode];

  // 리스크가 없거나 해제되었으면 아무것도 렌더링하지 않음
  if (!riskReason || isDismissed) return null;

  // 리스크 메시지 생성
  const riskMessage = `${riskReason} - 데이터 기반 평가 대비 당분간 투자 주의`;

  // 리스크 해제 핸들러
  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div className={`fixed inset-0 z-40 pointer-events-none ${className}`}>
      {/* 전체 반투명 검은 배경 */}
      <div className="absolute inset-0 bg-black opacity-50" />

      {/* 폴리스 라인 테이프들 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* 메인 테이프 (중앙) */}
        <div
          className="absolute w-full h-16 bg-yellow-400 text-white shadow-2xl transform rotate-12"
          style={{ minWidth: '150%' }}
        >
          <div className="flex items-center justify-center h-full overflow-hidden">
            <div className="flex whitespace-nowrap animate-pulse">
              <span className="mx-8 font-bold text-lg flex items-center">⚠️ {riskMessage}</span>
              <span className="mx-8 font-bold text-lg flex items-center">⚠️ {riskMessage}</span>
              <span className="mx-8 font-bold text-lg flex items-center">⚠️ {riskMessage}</span>
            </div>
          </div>
        </div>

        {/* 상단 테이프 */}
        <div
          className="absolute w-full h-12 bg-yellow-500 text-white shadow-xl transform -rotate-12 -translate-y-20"
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
          className="absolute w-full h-12 bg-yellow-500 text-white shadow-xl transform rotate-12 translate-y-20"
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
      </div>

      {/* 해제 버튼 (옵션) */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <button
          onClick={handleDismiss}
          className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-lg"
          title="리스크 경고 해제"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default RiskWarning;
