//src/components/ValueInvestingConcept.tsx

import React from 'react';
import { Search, DollarSign, ShieldAlert, TrendingUp } from 'lucide-react';

const ValueInvestingConcept = () => {
  const concepts = [
    {
      icon: <Search className="w-6 h-6 sm:w-8 sm:h-8 text-gray-900" />,
      title: '기업 내재가치 발견',
      description: '시장 가격이 아닌 기업의 실제 가치를 찾아내는 과정',
    },
    {
      icon: <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-gray-900" />,
      title: '안전마진',
      description: '내재가치보다 낮은 가격에 투자하여 위험을 줄이는 전략',
    },
    {
      icon: <ShieldAlert className="w-6 h-6 sm:w-8 sm:h-8 text-gray-900" />,
      title: '경제적 해자',
      description: '기업의 지속적인 경쟁우위를 제공하는 방어 요소',
    },
    {
      icon: <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-gray-900" />,
      title: '복리의 힘',
      description: '시간이 지남에 따라 투자 수익이 기하급수적으로 증가',
    },
  ];

  return (
    <div className="py-6 sm:py-8">
      <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8">
        가치투자의 4가지 핵심 원칙
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {concepts.map((concept, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-200 p-4 sm:p-6 flex flex-col items-center text-center transition-all hover:shadow-md bg-white"
          >
            <div className="p-3 rounded-full bg-gray-100 shadow-sm mb-4">{concept.icon}</div>
            <h3 className="font-bold text-base sm:text-lg mb-2">{concept.title}</h3>
            <p className="text-gray-600 text-xs ">{concept.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ValueInvestingConcept;
