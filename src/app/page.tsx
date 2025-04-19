import Link from 'next/link';
import { BarChart4, CheckSquare } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 md:p-10">
      <main className="flex-1 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">ValueTargeter</h1>
          <p className="text-gray-600 text-lg">주식 가치 평가를 위한 포괄적인 도구 모음</p>
        </div>

        {/* Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 적정가 계산기 카드 */}
          <Link href="/fairprice" className="block">
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 h-full">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">적정가 계산기</h2>
                  <div className="bg-gray-100 p-3 rounded-full">
                    <BarChart4 className="h-6 w-6 text-gray-900" />
                  </div>
                </div>
                <p className="text-gray-600 text-base mb-8">
                  다양한 가치평가 방법론을 통해 주식의 적정 가치를 계산합니다.
                </p>
                <div className="mt-auto">
                  <div className="inline-flex items-center bg-black text-white px-5 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors">
                    시작하기
                    <svg
                      className="ml-2 w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* 가치투자 체크리스트 카드 */}
          <Link href="/checklist" className="block">
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 h-full">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">가치투자 체크리스트</h2>
                  <div className="bg-gray-100 p-3 rounded-full">
                    <CheckSquare className="h-6 w-6 text-gray-900" />
                  </div>
                </div>
                <p className="text-gray-600 text-base mb-8">
                  워렌 버핏, 피터 린치 스타일의 가치투자 체크리스트로 기업을 분석합니다.
                </p>
                <div className="mt-auto">
                  <div className="inline-flex items-center bg-black text-white px-5 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors">
                    시작하기
                    <svg
                      className="ml-2 w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">가치투자자를 위한 툴</h2>
          <p className="text-gray-600">
            워렌 버핏, 피터 린치 스타일의 가치투자자를 위한 최적의 도구입니다. 기업의 본질적 가치를
            평가하고 합리적인 투자 결정을 내리는 데 도움을 드립니다.
          </p>
        </div>
      </main>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>© 2024 ValueTargeter. All rights reserved.</p>
      </footer>
    </div>
  );
}
