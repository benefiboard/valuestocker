//src/components/WorkflowComponent.tsx

import React from 'react';
import { Search, Calculator, CheckSquare, TrendingUp } from 'lucide-react';

const WorkflowComponent = () => {
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

      <div className="relative">
        {/* 연결선 */}
        <div className="absolute top-16 left-1/2 h-2/3 w-1 bg-gray-200 -z-10 hidden md:block"></div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm p-4 sm:p-6 flex flex-col items-center text-center transition-all hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center mb-4">
                {step.icon}
              </div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-gray-700 font-bold text-xs sm:text-sm">
                {index + 1}
              </div>
              <h3 className="font-bold text-base sm:text-lg mb-2">{step.title}</h3>
              <p className="text-gray-600 text-xs sm:text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkflowComponent;
