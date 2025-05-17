import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

// 컴포넌트의 props 타입 정의
type GrowthRateExplanationProps = {
  type: 'operating' | 'eps' | 'net';
  opMargin: number;
  actualValue: number;
};

// 성장률 지표 설명 컴포넌트
const GrowthRateExplanation: React.FC<GrowthRateExplanationProps> = (props) => {
  const { type, opMargin, actualValue } = props;
  const [isExpanded, setIsExpanded] = useState(false);

  // 접기/펼치기 토글 함수
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // 10% 미만 영업이익률은 표시하지 않음
  if (!opMargin || opMargin < 10) {
    return null;
  }

  // 지표 타입에 따른 제목 설정
  let baseTitle = '';
  if (type === 'operating') {
    baseTitle = '영업이익 성장률';
  } else if (type === 'eps') {
    baseTitle = 'EPS 성장률';
  } else if (type === 'net') {
    baseTitle = '순이익 증가율';
  }

  // 영업이익률 수준에 따른 제목 접미사
  let titleSuffix = '';
  if (opMargin >= 20) {
    titleSuffix = ' (매우 높은 영업이익률 기업용)';
  } else if (opMargin >= 15) {
    titleSuffix = ' (높은 영업이익률 기업용)';
  } else if (opMargin >= 10) {
    titleSuffix = ' (양호한 영업이익률 기업용)';
  }

  const title = baseTitle + titleSuffix;

  // 지표 타입에 따른 기본 설명
  let baseDescription = '';
  if (type === 'operating') {
    baseDescription = '영업이익이 전년 대비 얼마나 성장했는지 나타내는 지표입니다.';
  } else if (type === 'eps') {
    baseDescription = '주당순이익이 전년 대비 얼마나 성장했는지 나타내는 지표입니다.';
  } else if (type === 'net') {
    baseDescription = '순이익이 전년 대비 얼마나 성장했는지 나타내는 지표입니다.';
  }

  // 영업이익률 수준에 따른 추가 설명
  let additionalDescription = '';
  if (opMargin >= 20) {
    additionalDescription = ` 영업이익률이 매우 높은(${opMargin.toFixed(
      1
    )}%) 기업의 경우, 현재 수준을 유지하는 것만으로도 어렵기 때문에 -10%까지도 양호한 것으로 평가합니다.`;
  } else if (opMargin >= 15) {
    additionalDescription = ` 영업이익률이 높은(${opMargin.toFixed(
      1
    )}%) 기업의 경우, -5%까지의 감소는 정상적인 변동 범위로 간주합니다.`;
  } else if (opMargin >= 10) {
    additionalDescription = ` 영업이익률이 양호한(${opMargin.toFixed(
      1
    )}%) 기업의 경우, 현상 유지(0% 이상)만으로도 양호한 것으로 평가합니다.`;
  }

  const description = baseDescription + additionalDescription;

  // 영업이익률 수준에 따른 통과 기준
  let threshold = '';
  if (opMargin >= 20) {
    threshold = '-10%';
  } else if (opMargin >= 15) {
    threshold = '-5%';
  } else if (opMargin >= 10) {
    threshold = '0%';
  } else {
    threshold = '10%';
  }

  // 실제값과 기준에 따른 상태 결정
  let status = '';
  let statusColor = '';

  if (actualValue >= 0) {
    status = '양호';
    statusColor = 'text-emerald-600';
  } else if (
    (opMargin >= 20 && actualValue >= -10) ||
    (opMargin >= 15 && actualValue >= -5) ||
    (opMargin >= 10 && actualValue >= 0)
  ) {
    status = '정상 범위';
    statusColor = 'text-gray-600';
  } else {
    status = '주의';
    statusColor = 'text-amber-600';
  }

  // 컴포넌트 렌더링
  return (
    <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
      {/* 항상 표시되는 요약 정보 */}
      <button
        onClick={toggleExpand}
        className="w-full text-left flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
      >
        <div className="flex items-center">
          <Info className="h-4 w-4 text-gray-600 mr-2" />
          <span className="font-medium text-sm text-gray-800">
            {opMargin >= 20 ? '매우 높은' : opMargin >= 15 ? '높은' : '양호한'} 영업이익률 기업용
            조정 기준
          </span>
        </div>
        <div className="flex items-center">
          <span className={`text-sm font-medium mr-2 ${statusColor}`}>
            {status} ({actualValue.toFixed(2)}%)
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-600" />
          )}
        </div>
      </button>

      {/* 펼쳐졌을 때만 표시되는 상세 설명 */}
      {isExpanded && (
        <div className="p-4 bg-white animate-fadeIn">
          <h3 className="font-medium text-gray-800 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-3">{description}</p>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <div>
                <span className="text-sm text-gray-500">통과 기준: </span>
                <span className="text-sm font-medium">{threshold} 이상</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">현재 상태: </span>
                <span className={`text-sm font-medium ${statusColor}`}>
                  {status} ({actualValue.toFixed(2)}%)
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-2 italic">
              * 일반적인 기업은 {type === 'operating' || type === 'eps' ? '10%' : '20%'} 이상의
              성장률을 요구하지만, 영업이익률이 {opMargin.toFixed(1)}%로 높은 경우 {threshold}{' '}
              이상만으로도 양호한 평가를 받습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrowthRateExplanation;
