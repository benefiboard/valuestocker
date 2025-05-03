import React from 'react';
import { Search, DollarSign, ShieldAlert, TrendingUp } from 'lucide-react';

const EnhancedValueInvestingConcept = () => {
  const concepts = [
    {
      icon: <Search className="w-6 h-6 text-gray-900" />,
      title: '기업 내재가치 발견',
      description: '시장 가격이 아닌 기업의 실제 가치를 찾아내는 과정',
      color: 'from-gray-200 to-gray-100',
    },
    {
      icon: <DollarSign className="w-6 h-6 text-gray-900" />,
      title: '안전마진',
      description: '내재가치보다 낮은 가격에 투자하여 위험을 줄이는 전략',
      color: 'from-gray-300 to-gray-100',
    },
    {
      icon: <ShieldAlert className="w-6 h-6 text-gray-900" />,
      title: '경제적 해자',
      description: '기업의 지속적인 경쟁우위를 제공하는 방어 요소',
      color: 'from-gray-200 to-gray-100',
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-gray-900" />,
      title: '복리의 힘',
      description: '시간이 지남에 따라 투자 수익이 기하급수적으로 증가',
      color: 'from-gray-300 to-gray-100',
    },
  ];

  return (
    <div className="py-6 sm:py-8 px-4 relative overflow-hidden bg-white rounded-2xl shadow-sm">
      {/* 배경 도트 패턴 */}
      {/* <div className="absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div> */}

      <h2 className="text-xl sm:text-2xl font-bold text-center mb-12 relative">
        가치투자의 4가지 핵심 원칙
      </h2>

      <div className="relative">
        {/* 연결선 - 데스크탑에서만 표시 */}
        {/* <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div> */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {concepts.map((concept, index) => (
            <div key={index} className="group flex flex-col items-center text-center relative">
              {/* 인덱스 표시 (데스크탑에서만) */}
              <div className="hidden lg:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-12 h-12 rounded-full bg-gray-50 border border-gray-200 items-center justify-center font-bold text-gray-400">
                {index + 1}
              </div>

              {/* 아이콘 컨테이너 */}
              <div
                className={`relative p-4 rounded-full bg-gradient-to-b ${concept.color} shadow-sm mb-4 transform transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md`}
              >
                {concept.icon}
                {/* 호버 시 표시되는 글로우 효과 */}
                <div className="absolute inset-0 rounded-full bg-gray-200 opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300"></div>
              </div>

              {/* 모바일에서만 표시되는 인덱스 */}
              <div className="lg:hidden flex w-6 h-6 rounded-full bg-gray-100 items-center justify-center text-xs font-bold text-gray-500 mb-2">
                {index + 1}
              </div>

              {/* 텍스트 컨텐츠 */}
              <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-xl p-4 w-full transform transition-all duration-300 group-hover:shadow-md border border-transparent group-hover:border-gray-100">
                <h3 className="font-bold text-base sm:text-lg mb-2">{concept.title}</h3>
                <p className="text-gray-600 text-xs sm:text-sm">{concept.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 좌측 하단 장식 요소 */}
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-gray-100 to-transparent opacity-50 rounded-tr-full"></div>

      {/* 우측 상단 장식 요소 */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-gray-100 to-transparent opacity-50 rounded-bl-full"></div>
    </div>
  );
};

export default EnhancedValueInvestingConcept;
