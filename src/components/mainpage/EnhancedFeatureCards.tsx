import React from 'react';
import { BarChart4, CheckSquare, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const EnhancedFeatureCards = () => {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold text-center mb-12 relative">
        ValueTargeter 핵심 기능
      </h2>
      {/* <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center md:text-left">핵심 기능</h2> */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 가치투자 체크리스트 카드 */}
        <div className="group relative rounded-2xl p-0.5 overflow-hidden bg-gradient-to-br from-gray-800 via-black to-gray-900 transition-all duration-300 hover:shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>

          <div className="relative bg-black rounded-2xl p-6 sm:p-8 h-full">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-white">가치투자 체크리스트</h2>
                <div className="bg-gray-100 p-3 rounded-full transform transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300">
                  <CheckSquare className="h-5 w-5 sm:h-6 sm:w-6 text-gray-800" />
                </div>
              </div>

              <p className="text-gray-300 text-sm sm:text-base mb-6 sm:mb-8">
                기업을 분석하고 투자 등급을 확인합니다.
                <br />
                필수적인 핵심 지표와 재무 안정성을 종합 평가합니다.
              </p>

              <div className="mt-auto">
                <Link href="/checklist" className="block w-full">
                  <button className="w-full border border-white bg-transparent text-white px-5 py-3 rounded-xl font-medium transition-all flex items-center justify-center cursor-pointer group-hover:bg-white group-hover:text-black duration-300">
                    <CheckSquare className="mr-2 h-5 w-5" />
                    체크리스트 사용하기
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 적정가 계산기 카드 */}
        <div className="group relative rounded-2xl p-0.5 overflow-hidden bg-gradient-to-br from-gray-800 via-black to-gray-900 transition-all duration-300 hover:shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>

          <div className="relative bg-black rounded-2xl p-6 sm:p-8 h-full">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-white">적정가 계산기</h2>
                <div className="bg-gray-100 p-3 rounded-full transform transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300">
                  <BarChart4 className="h-5 w-5 sm:h-6 sm:w-6 text-gray-800" />
                </div>
              </div>

              <p className="text-gray-300 text-sm sm:text-base mb-6 sm:mb-8">
                7가지 가치평가 방법들을 통해 적정 가격을 계산합니다.
                <br />
                현재 주가 대비 저평가/고평가 여부를 확인할 수 있습니다.
              </p>

              <div className="mt-auto">
                <Link href="/fairprice" className="block w-full">
                  <button className="w-full bg-white text-black px-5 py-3 rounded-xl font-medium transition-all flex items-center justify-center cursor-pointer group-hover:bg-gray-100 duration-300">
                    <BarChart4 className="mr-2 h-5 w-5" />
                    적정가격 계산하기
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1 duration-300" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedFeatureCards;
