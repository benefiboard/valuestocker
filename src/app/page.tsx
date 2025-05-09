//메인페이지
//src/app/page.tsx

import Link from 'next/link';
import { BarChart4, CheckSquare, ArrowRight, PercentIcon } from 'lucide-react';

import EnhancedHeader from '@/components/mainpage/EnhancedHeader';
import EnhancedFeatureCards from '@/components/mainpage/EnhancedFeatureCards';
import EnhancedValueInvestingConcept from '@/components/mainpage/EnhancedValueInvestingConcept';
import EnhancedWorkflowComponent from '@/components/mainpage/EnhancedWorkflowComponent';
import ValuationModelMatrix from '@/components/mainpage/ValuationModelMatrix';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 sm:p-6 md:p-10">
      <main className="flex-1 max-w-5xl mx-auto w-full">
        {/* 헤더 섹션 */}
        <EnhancedHeader />

        {/* 카드 섹션 */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm mb-8 sm:mb-12">
          <EnhancedFeatureCards />
        </div>

        {/* 투자 전략 카드 섹션 */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-12 relative">
            전략별 종목 리스트
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            {/* 고배당 가치주 전략 카드 */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="p-5 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-1">고배당 가치주 전략</h3>
                <p className="text-sm text-gray-600">
                  안정적인 배당수익과 가치평가를 모두 고려한 접근법
                </p>
              </div>

              <div className="p-5">
                <div className="mb-5">
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <div className="border border-gray-300 p-1 rounded-full mr-3 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-gray-700" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">PER 10 이하</span>
                        <p className="text-xs text-gray-500">수익성 대비 저평가된 기업</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="border border-gray-300 p-1 rounded-full mr-3 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-gray-700" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">PBR 1 이하</span>
                        <p className="text-xs text-gray-500">자산 가치 대비 저평가된 기업</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="border border-gray-300 p-1 rounded-full mr-3 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-gray-700" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">배당률 5% 이상</span>
                        <p className="text-xs text-gray-500">안정적인 배당 수익 기대</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <Link href="/flavor" className="block w-full">
                  <button className="w-full bg-black hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-medium transition-colors flex items-center justify-center">
                    고배당 종목 보기
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                </Link>
              </div>
            </div>

            {/* 비즈니스 퀄리티 종목 카드 */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="p-5 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-1">비즈니스 퀄리티 종목</h3>
                <p className="text-sm text-gray-600">
                  장기적으로 높은 수익을 창출하는 고품질 비즈니스 기업들
                </p>
              </div>

              <div className="p-5">
                <div className="mb-5">
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <div className="border border-gray-300 p-1 rounded-full mr-3 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-gray-700" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">ROE 10% 이상</span>
                        <p className="text-xs text-gray-500">3년 평균 자기자본수익률</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="border border-gray-300 p-1 rounded-full mr-3 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-gray-700" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">영업이익률 15% 이상</span>
                        <p className="text-xs text-gray-500">3년 평균 영업이익률</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="border border-gray-300 p-1 rounded-full mr-3 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-gray-700" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">경쟁우위를 가진 기업</span>
                        <p className="text-xs text-gray-500">지속적인 고수익 창출</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <Link href="/quality" className="block w-full">
                  <button className="w-full bg-black hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-medium transition-colors flex items-center justify-center">
                    퀄리티 종목 보기
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                </Link>
              </div>
            </div>

            {/* S-RIM 전략 카드 */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="p-5 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-1">S-RIM 내재가치 전략</h3>
                <p className="text-sm text-gray-600">
                  초과이익 모델을 활용한 기업의 본질적 가치 평가 방법론
                </p>
              </div>

              <div className="p-5">
                <div className="mb-5">
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <div className="border border-gray-300 p-1 rounded-full mr-3 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-gray-700" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">ROE 기반 평가</span>
                        <p className="text-xs text-gray-500">초과이익의 현재가치와 순자산 평가</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="border border-gray-300 p-1 rounded-full mr-3 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-gray-700" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">최소 30% 안전마진</span>
                        <p className="text-xs text-gray-500">내재가치 대비 충분한 할인율 적용</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="border border-gray-300 p-1 rounded-full mr-3 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-gray-700" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">장기 계속기업 가치</span>
                        <p className="text-xs text-gray-500">
                          청산가치가 아닌 지속가능 가치에 중점
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>

                <Link href="/s-rim" className="block w-full">
                  <button className="w-full bg-black hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-medium transition-colors flex items-center justify-center">
                    S-RIM 종목 보기
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                </Link>
              </div>
            </div>

            {/* 벤자민 그레이엄 전략 카드 */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="p-5 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-1">벤자민 그레이엄 전략</h3>
                <p className="text-sm text-gray-600">
                  가치투자의 창시자가 벤자민 그레이엄이 제안한 안전한 투자 원칙
                </p>
              </div>

              <div className="p-5">
                <div className="mb-5">
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <div className="border border-gray-300 p-1 rounded-full mr-3 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-gray-700" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">PER 10 이하</span>
                        <p className="text-xs text-gray-500">수익성 대비 저평가된 기업</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="border border-gray-300 p-1 rounded-full mr-3 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-gray-700" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">부채비율 100% 미만</span>
                        <p className="text-xs text-gray-500">재무적으로 안정적인 기업</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="border border-gray-300 p-1 rounded-full mr-3 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-gray-700" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">전통적이고 심플한 방법</span>
                        <p className="text-xs text-gray-500">그레이엄의 기본 전략</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <Link href="/graham" className="block w-full">
                  <button className="w-full bg-black hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-medium transition-colors flex items-center justify-center">
                    그레이엄 종목 보기
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                </Link>
              </div>
            </div>

            {/* 하워드 막스 내재가치 전략 카드 */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="p-5 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-1">하워드 막스 내재가치</h3>
                <p className="text-sm text-gray-600">
                  현금흐름 할인법과 안전마진을 중시하는 하워드 막스의 투자 원칙
                </p>
              </div>

              <div className="p-5">
                <div className="mb-5">
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <div className="border border-gray-300 p-1 rounded-full mr-3 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-gray-700" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">현금흐름 할인법(DCF)</span>
                        <p className="text-xs text-gray-500">미래 현금흐름의 현재가치 평가</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="border border-gray-300 p-1 rounded-full mr-3 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-gray-700" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">최소 30% 안전마진</span>
                        <p className="text-xs text-gray-500">내재가치 대비 충분한 할인율 적용</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="border border-gray-300 p-1 rounded-full mr-3 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-gray-700" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">시나리오 분석 접근법</span>
                        <p className="text-xs text-gray-500">다양한 시나리오로 가치 범위 평가</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <Link href="/howard" className="block w-full">
                  <button className="w-full bg-black hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-medium transition-colors flex items-center justify-center">
                    내재가치 종목 보기
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                </Link>
              </div>
            </div>

            {/* 피터 린치 PEG 전략 카드 */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="p-5 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-1">피터 린치 PEG 전략</h3>
                <p className="text-sm text-gray-600">
                  성장률 대비 저평가된 기업을 발굴하는 성장 가치 투자 접근법
                </p>
              </div>

              <div className="p-5">
                <div className="mb-5">
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <div className="border border-gray-300 p-1 rounded-full mr-3 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-gray-700" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">PEG 비율 1.0 이하</span>
                        <p className="text-xs text-gray-500">PER를 성장률로 나눈 값이 1.0 이하</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="border border-gray-300 p-1 rounded-full mr-3 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-gray-700" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">높은 성장률 기업</span>
                        <p className="text-xs text-gray-500">안정적인 이익 성장 추세 기업</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="border border-gray-300 p-1 rounded-full mr-3 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-gray-700" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">최소 30% 안전마진</span>
                        <p className="text-xs text-gray-500">적정가 대비 충분한 할인률 확보</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <Link href="/lynch" className="block w-full">
                  <button className="w-full bg-black hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-medium transition-colors flex items-center justify-center">
                    PEG 종목 보기
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 가치투자 핵심 원칙 섹션 */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm mb-8 sm:mb-12">
          <EnhancedValueInvestingConcept />
        </div>

        {/* 워크플로우 섹션 */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm mb-8 sm:mb-12">
          <EnhancedWorkflowComponent />
        </div>

        {/* 가치평가 모델 비교 섹션 */}
        <div className="mb-8 sm:mb-12">
          <ValuationModelMatrix />
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">가치투자자를 위한 툴</h2>
          <p className="text-gray-600 text-sm sm:text-base">
            ValueTargeter는 기업의 본질적 가치를 평가하고 합리적인 투자 결정을 내리는 데 도움을
            드립니다. <br /> 검증된 가치투자 원칙을 기반으로 설계되었습니다.
          </p>
        </div>

        {/* 법적 고지사항 섹션 */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">법적 고지사항</h2>
          <p className="text-gray-600 text-sm sm:text-base">
            ValueTargeter의 모든 계산 및 분석은 금융감독원 API 자료와 공공데이터 포털 API를 기반으로
            합니다. 제공되는 모든 정보와 분석 결과는 참고용으로만 제공되며, 투자 결정에 직접적인
            근거로 사용하지 않기를 권장합니다. 실제 투자에 따른 손익에 대해 ValueTargeter는 어떠한
            법적 책임도 지지 않습니다. 모든 투자 결정은 투자자 본인의 판단과 책임하에 이루어져야
            합니다.
          </p>
        </div>

        {/* CTA 섹션 */}
        <div className="bg-black rounded-2xl p-6 sm:p-8 md:p-10 text-white mb-6">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">지금 바로 시작하세요</h2>
            <p className="text-gray-300 text-sm sm:text-base">
              검증된 가치투자 방법론으로 합리적인 투자 결정을 내려보세요
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/checklist" className="block w-full sm:w-auto">
              <button className="w-full border-2 border-white bg-transparent text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-medium  transition-colors flex items-center justify-center text-sm sm:text-base cursor-pointer">
                <CheckSquare className="mr-2 h-5 w-5" />
                체크리스트 사용하기
              </button>
            </Link>
            <Link href="/fairprice" className="block w-full sm:w-auto">
              <button className="w-full bg-white text-black px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-medium  transition-colors flex items-center justify-center text-sm sm:text-base cursor-pointer">
                <BarChart4 className="mr-2 h-5 w-5" />
                적정가 계산하기
              </button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="mt-12 text-center text-gray-500 text-xs sm:text-sm">
        <p>© 2025 ValueTargeter. All rights reserved.</p>
        <p className="mt-2">
          문의사항 및 제안:{' '}
          <a
            href="mailto:benefiboard@gmail.com"
            className="underline hover:text-gray-700 transition-colors"
          >
            benefiboard@gmail.com
          </a>
        </p>
      </footer>
    </div>
  );
}
