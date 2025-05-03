import React from 'react';
import { Search, Calculator, CheckSquare, TrendingUp } from 'lucide-react';

const EnhancedWorkflowComponent = () => {
  const steps = [
    {
      icon: <Search className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,
      title: '종목 검색',
      description: '관심 있는 주식을 검색하세요',
    },
    {
      icon: <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,
      title: '가치투자 체크리스트',
      description: '투자 적정성을 평가합니다',
    },
    {
      icon: <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,
      title: '적정가 계산',
      description: '7가지 모델로 적정 주가 산출',
    },
    {
      icon: <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,
      title: '종합 평가 확인',
      description: '확인 후 투자하기',
    },
  ];

  return (
    <div className="py-6 sm:py-8">
      <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8">
        ValueTargeter 사용 과정
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {steps.map((step, index) => (
          <div
            key={index}
            className="group bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 flex flex-col items-center text-center transition-all duration-300 hover:shadow-md"
          >
            {/* 아이콘 컨테이너 - 호버 시 회전 및 스케일 효과 */}
            <div className="relative mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center z-10 relative transform transition-transform duration-300 group-hover:scale-110">
                {step.icon}
              </div>
              {/* 호버 시 나타나는 글로우 효과 */}
              <div className="absolute inset-0 rounded-full bg-gray-500 opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300 scale-110"></div>
            </div>

            {/* 단계 번호 - 호버 시 배경색 변경 */}
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mb-2 text-gray-700 font-bold text-sm transition-colors duration-300 group-hover:bg-gray-200">
              {index + 1}
            </div>

            {/* 텍스트 컨텐츠 */}
            <h3 className="font-bold text-base sm:text-lg mb-2 transition-colors duration-300 group-hover:text-gray-900">
              {step.title}
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm transition-colors duration-300 group-hover:text-gray-700">
              {step.description}
            </p>

            {/* 하단 장식선 - 호버 시 나타남 */}
            <div className="w-0 group-hover:w-1/3 h-0.5 bg-gray-200 mt-3 transition-all duration-300"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnhancedWorkflowComponent;
