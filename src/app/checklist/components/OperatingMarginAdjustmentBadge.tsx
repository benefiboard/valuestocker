import React from 'react';
import { Info } from 'lucide-react';

interface OperatingMarginAdjustmentBadgeProps {
  currentOpMargin: number;
}

const OperatingMarginAdjustmentBadge: React.FC<OperatingMarginAdjustmentBadgeProps> = ({
  currentOpMargin,
}) => {
  // 영업이익률이 10% 미만이면 표시하지 않음
  if (!currentOpMargin || currentOpMargin < 10) return null;

  // 영업이익률 구간에 따른 메시지와 스타일 결정
  let message: string;
  let bgColorClass: string;
  let textColorClass: string;

  if (currentOpMargin >= 20) {
    message = `매우 높은 영업이익률(${currentOpMargin.toFixed(
      1
    )}%)을 고려하여 성장률 평가 기준이 조정되었습니다. -10%까지 성장률은 양호한 것으로 평가됩니다.`;
    bgColorClass = 'bg-emerald-50';
    textColorClass = 'text-emerald-800';
  } else if (currentOpMargin >= 15) {
    message = `높은 영업이익률(${currentOpMargin.toFixed(
      1
    )}%)을 고려하여 성장률 평가 기준이 조정되었습니다. -5%까지 성장률은 양호한 것으로 평가됩니다.`;
    bgColorClass = 'bg-gray-100';
    textColorClass = 'text-gray-600';
  } else {
    message = `양호한 영업이익률(${currentOpMargin.toFixed(
      1
    )}%)을 고려하여 성장률 평가 기준이 조정되었습니다. 0% 이상 유지만으로도 양호한 것으로 평가됩니다.`;
    bgColorClass = 'bg-sky-50';
    textColorClass = 'text-sky-800';
  }

  // 각 색상 클래스에서 접두사 추출하여 테두리 색상 생성
  const borderColorClass = bgColorClass.replace('bg-', 'border-');

  return (
    <div
      className={`${bgColorClass} p-4 rounded-xl mb-4 border ${borderColorClass} transition-all duration-300 hover:shadow-md`}
    >
      <div className="flex items-start">
        <div className="p-2 rounded-full mr-3 flex-shrink-0 bg-white">
          <Info className={`h-4 w-4 sm:h-5 sm:w-5 ${textColorClass}`} />
        </div>
        <div>
          <p className={`font-medium text-sm sm:text-base ${textColorClass}`}>
            영업이익률 기반 평가 조정
          </p>
          <p className={`text-sm ${textColorClass} mt-1`}>{message}</p>
        </div>
      </div>
    </div>
  );
};

export default OperatingMarginAdjustmentBadge;
