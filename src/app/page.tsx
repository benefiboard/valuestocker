//메인페이지
//src/app/page.tsx

import Link from 'next/link';
import { BarChart4, CheckSquare, ArrowRight } from 'lucide-react';

// 가치투자 개념 컴포넌트
import ValueInvestingConcept from '../components/ValueInvestingConcept';
// 가치평가 모델 비교 컴포넌트
import ValuationModelsComparison from '../components/ValuationModelsComparison';
// 워크플로우 컴포넌트
import WorkflowComponent from '../components/WorkflowComponent';
// 미니 계산기 컴포넌트
//import MiniCalculator from '../components/MiniCalculator';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 sm:p-6 md:p-10">
      <main className="flex-1 max-w-5xl mx-auto w-full">
        {/* 헤더 섹션 - 더 강력한 CTA 포함 */}
        <div className="mb-8 sm:mb-12 text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            ValueTargeter
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            주식 가치 평가를 위한 포괄적인 도구 모음
          </p>
          {/* <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center md:justify-start gap-4">
            <Link href="/fairprice" className="block">
              <button className="w-full bg-black text-white px-5 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center">
                <BarChart4 className="mr-2 h-5 w-5" />
                적정가 계산하기
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </Link>
            <Link href="/checklist" className="block">
              <button className="w-full border-2 border-black bg-white text-black px-5 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors flex items-center justify-center">
                <CheckSquare className="mr-2 h-5 w-5" />
                체크리스트 사용하기
              </button>
            </Link>
          </div> */}
        </div>

        {/* 카드 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12">
          {/* 가치투자 체크리스트 카드 */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300 h-full">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">가치투자 체크리스트</h2>
                <div className="bg-gray-100 p-3 rounded-full">
                  <CheckSquare className="h-5 w-5 sm:h-6 sm:w-6 text-gray-900" />
                </div>
              </div>
              <p className="text-gray-600 text-sm sm:text-base mb-6 sm:mb-8">
                가치투자흫 위해 기업을 분석하고 투자 등급을 확인합니다.
                <br />
                필수적인 핵심 지표와 재무 안정성을 종합 평가합니다.
              </p>
              <Link href="/checklist" className="block">
                <button className="w-full border-2 border-black bg-white text-black px-5 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors flex items-center justify-center">
                  <CheckSquare className="mr-2 h-5 w-5" />
                  체크리스트 사용하기
                </button>
              </Link>
            </div>
          </div>

          {/* 적정가 계산기 카드 */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300 h-full">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">적정가 계산기</h2>
                <div className="bg-gray-100 p-3 rounded-full">
                  <BarChart4 className="h-5 w-5 sm:h-6 sm:w-6 text-gray-900" />
                </div>
              </div>
              <p className="text-gray-600 text-sm sm:text-base mb-6 sm:mb-8">
                7가지 검증된 가치평가 방법을 통해 적정 가격을 계산합니다.
                <br />
                현재 주가 대비 저평가/고평가 여부를 확인할 수 있습니다.
              </p>
              <Link href="/fairprice" className="block">
                <button className="w-full bg-black text-white px-5 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center">
                  <BarChart4 className="mr-2 h-5 w-5" />
                  적정가격 계산하기
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* 가치투자 핵심 원칙 섹션 */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm mb-12">
          <ValueInvestingConcept />
        </div>

        {/* 워크플로우 섹션 */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm mb-12">
          <WorkflowComponent />
        </div>

        {/* 가치평가 모델 비교 섹션 */}
        <div className="mb-12">
          <ValuationModelsComparison />
        </div>

        {/* 미니 계산기 섹션 */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              기본 적정가 계산해보기
            </h2>
            <p className="text-gray-600 text-sm sm:text-base mb-6">
              가장 기본적인 EPS×PER 적정가 계산 방식으로 주식의 예상 적정가를 간단히 계산해보세요.
              더 정확한 분석을 위해서는 적정가 계산기를 이용해보세요.
            </p>
            <Link href="/fairprice">
              <button className="inline-flex items-center bg-black text-white px-5 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors text-sm sm:text-base">
                전체 모델로 정밀 분석하기
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </Link>
          </div>
          <div>
            <MiniCalculator />
          </div>
        </div> */}

        {/* CTA 섹션 */}
        <div className="bg-black rounded-2xl p-6 sm:p-8 md:p-10 text-white mb-12">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">지금 바로 시작하세요</h2>
            <p className="text-gray-300 text-sm sm:text-base">
              검증된 가치투자 방법론으로 합리적인 투자 결정을 내려보세요
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/fairprice" className="block w-full sm:w-auto">
              <button className="w-full bg-white text-black px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-medium hover:bg-gray-100 transition-colors flex items-center justify-center text-sm sm:text-base">
                <BarChart4 className="mr-2 h-5 w-5" />
                적정가 계산하기
              </button>
            </Link>
            <Link href="/checklist" className="block w-full sm:w-auto">
              <button className="w-full border-2 border-white bg-transparent text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-medium hover:bg-white hover:bg-opacity-10 transition-colors flex items-center justify-center text-sm sm:text-base">
                <CheckSquare className="mr-2 h-5 w-5" />
                체크리스트 사용하기
              </button>
            </Link>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">가치투자자를 위한 툴</h2>
          <p className="text-gray-600 text-sm sm:text-base">
            ValueTargeter는 기업의 본질적 가치를 평가하고 합리적인 투자 결정을 내리는 데 도움을
            드립니다. <br /> 검증된 가치투자 원칙을 기반으로 설계되었습니다.
          </p>
        </div>
      </main>

      <footer className="mt-12 text-center text-gray-500 text-xs sm:text-sm">
        <p>© 2025 ValueTargeter. All rights reserved.</p>
      </footer>
    </div>
  );
}

//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////

// import Link from 'next/link';
// import { BarChart4, CheckSquare } from 'lucide-react';

// export default function Home() {
//   return (
//     <div className="flex flex-col min-h-screen bg-gray-50 p-6 md:p-10">
//       <main className="flex-1 max-w-5xl mx-auto w-full">
//         {/* Header */}
//         <div className="mb-12 text-center md:text-left">
//           <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">ValueTargeter</h1>
//           <p className="text-gray-600 text-lg">주식 가치 평가를 위한 포괄적인 도구 모음</p>
//         </div>

//         {/* Cards Container */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//           {/* 적정가 계산기 카드 */}
//           <Link href="/fairprice" className="block">
//             <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 h-full">
//               <div className="flex flex-col h-full">
//                 <div className="flex items-center justify-between mb-8">
//                   <h2 className="text-2xl font-bold text-gray-900">적정가 계산기</h2>
//                   <div className="bg-gray-100 p-3 rounded-full">
//                     <BarChart4 className="h-6 w-6 text-gray-900" />
//                   </div>
//                 </div>
//                 <p className="text-gray-600 text-base mb-8">
//                   다양한 가치평가 방법론을 통해 주식의 적정 가치를 계산합니다.
//                 </p>
//                 <div className="mt-auto">
//                   <div className="inline-flex items-center bg-black text-white px-5 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors">
//                     시작하기
//                     <svg
//                       className="ml-2 w-4 h-4"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                       xmlns="http://www.w3.org/2000/svg"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={2}
//                         d="M9 5l7 7-7 7"
//                       />
//                     </svg>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </Link>

//           {/* 가치투자 체크리스트 카드 */}
//           <Link href="/checklist" className="block">
//             <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 h-full">
//               <div className="flex flex-col h-full">
//                 <div className="flex items-center justify-between mb-8">
//                   <h2 className="text-2xl font-bold text-gray-900">가치투자 체크리스트</h2>
//                   <div className="bg-gray-100 p-3 rounded-full">
//                     <CheckSquare className="h-6 w-6 text-gray-900" />
//                   </div>
//                 </div>
//                 <p className="text-gray-600 text-base mb-8">
//                   가치투자 체크리스트로 기업을 분석합니다.
//                 </p>
//                 <div className="mt-auto">
//                   <div className="inline-flex items-center bg-black text-white px-5 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors">
//                     시작하기
//                     <svg
//                       className="ml-2 w-4 h-4"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                       xmlns="http://www.w3.org/2000/svg"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={2}
//                         d="M9 5l7 7-7 7"
//                       />
//                     </svg>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </Link>
//         </div>

//         {/* Info Section */}
//         <div className="mt-12 bg-white rounded-2xl p-8 shadow-sm">
//           <h2 className="text-2xl font-bold text-gray-900 mb-4">가치투자자를 위한 툴</h2>
//           <p className="text-gray-600">
//             가치투자자를 위한 최적의 도구입니다.
//             <br />
//             기업의 본질적 가치를 평가하고 합리적인 투자 결정을 내리는 데 도움을 드립니다.
//           </p>
//         </div>
//       </main>

//       <footer className="mt-12 text-center text-gray-500 text-sm">
//         <p>© 2025 ValueTargeter. All rights reserved.</p>
//       </footer>
//     </div>
//   );
// }
