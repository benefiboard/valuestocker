// src/app/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BarChart4,
  CheckSquare,
  ArrowRight,
  TrendingUp,
  Shield,
  Search,
  LineChart,
  DollarSign,
  ChevronRight,
  Landmark,
  ChevronDown,
} from 'lucide-react';
import Navigation from '@/components/Navigation';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <main className="flex-1 w-full">
        {/* 히어로 섹션 */}
        <div className="w-full py-24 md:py-36 px-6 md:px-16 flex flex-col items-center text-center bg-gradient-to-b from-white to-emerald-50">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            투자의 본질을 <br className="md:hidden" />
            <span className="text-emerald-600">더 명확하게</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mb-10">
            검증된 가치투자 원칙으로 기업의 내재가치를 발견하고 현명한 투자 결정을 내리세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/fairprice">
              <button className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-1 duration-200">
                <BarChart4 className="mr-2 h-5 w-5" />
                적정가 계산하기
              </button>
            </Link>
            <Link href="/checklist">
              <button className="border-2 border-emerald-600 bg-white text-emerald-700 px-8 py-4 rounded-xl font-medium hover:bg-emerald-50 transition-colors flex items-center shadow-sm hover:shadow transform hover:-translate-y-1 duration-200">
                <CheckSquare className="mr-2 h-5 w-5" />
                투자 체크리스트
              </button>
            </Link>
          </div>
        </div>

        {/* 이미지 섹션 - 앱 목업 */}
        {/* <div className="w-full py-16 bg-white flex justify-center px-6">
          <div className="relative max-w-4xl w-full h-[500px] rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 flex items-center justify-center shadow-lg">
            <div className="absolute inset-0 bg-[url('/images/pattern-dots.svg')] opacity-10"></div>
            <div className="relative z-10 grid grid-cols-2 gap-6 p-8">
              <div className="col-span-1 bg-white p-5 rounded-xl shadow-lg transform hover:-translate-y-2 transition-all duration-300">
                <div className="p-3 bg-emerald-50 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <BarChart4 className="text-emerald-500 h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">적정가치 계산</h3>
                <p className="text-gray-600 text-sm">다양한 모델로 기업의 내재가치를 분석</p>
              </div>
              <div className="col-span-1 bg-white p-5 rounded-xl shadow-lg transform hover:-translate-y-2 transition-all duration-300">
                <div className="p-3 bg-emerald-50 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Landmark className="text-emerald-500 h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">재무제표 분석</h3>
                <p className="text-gray-600 text-sm">기업의 재무 건전성과 성장성 파악</p>
              </div>
              <div className="col-span-1 bg-white p-5 rounded-xl shadow-lg transform hover:-translate-y-2 transition-all duration-300">
                <div className="p-3 bg-emerald-50 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <LineChart className="text-emerald-500 h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">투자 성과 추적</h3>
                <p className="text-gray-600 text-sm">포트폴리오 모니터링과 성과 분석</p>
              </div>
              <div className="col-span-1 bg-white p-5 rounded-xl shadow-lg transform hover:-translate-y-2 transition-all duration-300">
                <div className="p-3 bg-emerald-50 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Search className="text-emerald-500 h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">종목 스크리닝</h3>
                <p className="text-gray-600 text-sm">다양한 조건으로 저평가 기업 발굴</p>
              </div>
            </div>
          </div>
        </div> */}

        {/* 주요 기능 섹션 */}
        <div className="w-full py-24 px-6 md:px-16 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-block py-1 px-3 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-4">
                주요 기능
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                가치투자, 더 쉽고 명확하게
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* 기능 1 */}
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                  <Search className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">기업 가치 발굴</h3>
                <p className="text-gray-600">
                  시장에서 저평가된 우량 기업을 찾아내는 검증된 필터링 시스템으로 투자 기회를
                  발견하세요.
                </p>
              </div>

              {/* 기능 2 */}
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                  <BarChart4 className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">정확한 적정가치</h3>
                <p className="text-gray-600">
                  다양한 가치평가 모델을 활용해 기업의 본질적 가치를 분석하고 최적의 매수 가격을
                  결정하세요.
                </p>
              </div>

              {/* 기능 3 */}
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                  <Shield className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">안전마진 확보</h3>
                <p className="text-gray-600">
                  변동성 높은 시장에서도 안정적인 수익을 위한 안전마진 원칙을 적용해 투자 리스크를
                  최소화하세요.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 투자 전략 섹션 */}
        <div className="w-full py-24 px-6 md:px-16 bg-emerald-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-block py-1 px-3 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-4">
                투자 전략
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                검증된 투자 전략
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                전설적인 투자자들의 성공 철학을 기반으로 한 체계적인 투자 접근법
              </p>

              {/* 새로 추가된 안내 문구와 화살표 */}
              <div className="flex flex-col items-center animate-pulse">
                <p className="text-lg font-medium text-emerald-700 mb-3">
                  아래 6가지 전략 중 하나를 선택하여 자세히 알아보세요
                </p>
                <div className="bg-emerald-100 rounded-full p-2 shadow-md">
                  <ChevronDown className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {/* 벤자민 그레이엄 전략 카드 - 전체 카드 클릭 가능 */}
              <Link
                href="/graham"
                className="block bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
              >
                <div className="h-3 bg-emerald-500 w-full"></div>
                <div className="p-6">
                  <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-5">
                    <Landmark className="h-7 w-7 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors">
                    벤자민 그레이엄 전략
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm">
                    가치투자의 창시자가 제안한 안전한 투자 원칙으로, 안정적인 재무구조와 저평가된
                    기업에 투자합니다.
                  </p>
                  <div className="mb-6 space-y-3">
                    <div className="flex items-start">
                      <div className="bg-emerald-50 p-1 rounded-full mr-2 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="text-sm text-gray-700">PER 10 이하, 안정적 수익성</div>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-emerald-50 p-1 rounded-full mr-2 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="text-sm text-gray-700">부채비율 100% 미만, 재무안정성</div>
                    </div>
                  </div>
                  <div className="flex items-center text-emerald-700 font-medium text-sm group-hover:text-emerald-600">
                    그레이엄 종목 보기
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>

              {/* 고배당 가치주 전략 카드 - 전체 카드 클릭 가능 */}
              <Link
                href="/flavor"
                className="block bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
              >
                <div className="h-3 bg-emerald-500 w-full"></div>
                <div className="p-6">
                  <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-5">
                    <DollarSign className="h-7 w-7 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors">
                    고배당 가치주 전략
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm">
                    안정적인 배당수익과 저평가된 가치 모두를 고려한 균형 잡힌 접근법으로 장기 복리
                    수익을 추구합니다.
                  </p>
                  <div className="mb-6 space-y-3">
                    <div className="flex items-start">
                      <div className="bg-emerald-50 p-1 rounded-full mr-2 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="text-sm text-gray-700">PER 10 이하, PBR 1 이하</div>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-emerald-50 p-1 rounded-full mr-2 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="text-sm text-gray-700">배당률 5% 이상, 안정적 수익</div>
                    </div>
                  </div>
                  <div className="flex items-center text-emerald-700 font-medium text-sm group-hover:text-emerald-600">
                    고배당 종목 보기
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>

              {/* S-RIM 내재가치 전략 카드 - 전체 카드 클릭 가능 */}
              <Link
                href="/s-rim"
                className="block bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
              >
                <div className="h-3 bg-emerald-500 w-full"></div>
                <div className="p-6">
                  <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-5">
                    <BarChart4 className="h-7 w-7 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors">
                    S-RIM 내재가치 전략
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm">
                    초과이익 모델을 활용한 기업의 본질적 가치 평가 방법론으로 장기적 관점의 투자
                    가치를 분석합니다.
                  </p>
                  <div className="mb-6 space-y-3">
                    <div className="flex items-start">
                      <div className="bg-emerald-50 p-1 rounded-full mr-2 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="text-sm text-gray-700">ROE 기반 초과이익의 현재가치 평가</div>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-emerald-50 p-1 rounded-full mr-2 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="text-sm text-gray-700">최소 30% 안전마진 확보</div>
                    </div>
                  </div>
                  <div className="flex items-center text-emerald-700 font-medium text-sm group-hover:text-emerald-600">
                    S-RIM 종목 보기
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>

              {/* 비즈니스 퀄리티 종목 카드 - 전체 카드 클릭 가능 */}
              <Link
                href="/quality"
                className="block bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
              >
                <div className="h-3 bg-emerald-500 w-full"></div>
                <div className="p-6">
                  <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-5">
                    <Shield className="h-7 w-7 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors">
                    비즈니스 퀄리티 전략
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm">
                    장기적으로 높은 수익을 창출하는 고품질 비즈니스 기업들에 투자하여 지속 가능한
                    성장을 추구합니다.
                  </p>
                  <div className="mb-6 space-y-3">
                    <div className="flex items-start">
                      <div className="bg-emerald-50 p-1 rounded-full mr-2 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="text-sm text-gray-700">ROE 10% 이상, 3년 평균</div>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-emerald-50 p-1 rounded-full mr-2 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="text-sm text-gray-700">영업이익률 15% 이상, 지속 성장</div>
                    </div>
                  </div>
                  <div className="flex items-center text-emerald-700 font-medium text-sm group-hover:text-emerald-600">
                    퀄리티 종목 보기
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>

              {/* 피터 린치 PEG 전략 카드 - 전체 카드 클릭 가능 */}
              <Link
                href="/lynch"
                className="block bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
              >
                <div className="h-3 bg-emerald-500 w-full"></div>
                <div className="p-6">
                  <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-5">
                    <TrendingUp className="h-7 w-7 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors">
                    피터 린치 PEG 전략
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm">
                    성장률 대비 저평가된 기업을 발굴하는 성장 가치 투자 접근법으로 합리적 가격의
                    성장주를 선별합니다.
                  </p>
                  <div className="mb-6 space-y-3">
                    <div className="flex items-start">
                      <div className="bg-emerald-50 p-1 rounded-full mr-2 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="text-sm text-gray-700">
                        PEG 비율 1.0 이하, 성장 대비 저평가
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-emerald-50 p-1 rounded-full mr-2 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="text-sm text-gray-700">안정적 이익 성장 추세 기업</div>
                    </div>
                  </div>
                  <div className="flex items-center text-emerald-700 font-medium text-sm group-hover:text-emerald-600">
                    PEG 종목 보기
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>

              {/* 하워드 막스 내재가치 전략 카드 - 전체 카드 클릭 가능 */}
              <Link
                href="/howard"
                className="block bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
              >
                <div className="h-3 bg-emerald-500 w-full"></div>
                <div className="p-6">
                  <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-5">
                    <LineChart className="h-7 w-7 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors">
                    하워드 막스 내재가치
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm">
                    현금흐름 할인법과 안전마진을 중시하는 하워드 막스의 투자 원칙으로 시장 사이클에
                    대응합니다.
                  </p>
                  <div className="mb-6 space-y-3">
                    <div className="flex items-start">
                      <div className="bg-emerald-50 p-1 rounded-full mr-2 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="text-sm text-gray-700">
                        DCF 기반, 미래 현금흐름의 현재가치
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-emerald-50 p-1 rounded-full mr-2 mt-0.5">
                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="text-sm text-gray-700">다양한 시나리오로 가치 범위 평가</div>
                    </div>
                  </div>
                  <div className="flex items-center text-emerald-700 font-medium text-sm group-hover:text-emerald-600">
                    내재가치 종목 보기
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* 가치투자 워크플로우 섹션 - 수정된 원형 숫자 위치 */}
        <div className="w-full py-24 px-6 md:px-16 bg-gradient-to-b from-white to-emerald-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-block py-1 px-3 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-4">
                투자 프로세스
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                체계적인 투자 워크플로우
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                가치투자의 원칙을 따르는 단계별 접근법
              </p>
            </div>

            {/* 워크플로우 단계 */}
            <div className="space-y-12">
              {/* 단계 1 - 수정된 원형 숫자 위치 */}
              <div className="bg-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row gap-6 items-center relative">
                <div className=" items-center justify-center w-12 h-12 bg-emerald-600 text-white rounded-full text-xl font-bold shadow-lg  md:flex hidden">
                  <span>1</span>
                </div>
                <div className="flex items-center justify-center w-10 h-10 bg-emerald-600 text-white rounded-full text-lg font-bold mb-2 md:hidden">
                  <span>1</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-3 text-gray-900">종목 스크리닝</h3>
                  <p className="text-gray-600">
                    재무 데이터와 가치 지표를 바탕으로 저평가된 우량 기업을 발굴합니다. PER, PBR,
                    ROE 등 핵심 지표를 활용해 후보군을 구성합니다.
                  </p>
                </div>
              </div>

              {/* 단계 2 - 수정된 원형 숫자 위치 */}
              <div className="bg-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row gap-6 items-center relative">
                <div className=" items-center justify-center w-12 h-12 bg-emerald-600 text-white rounded-full text-xl font-bold shadow-lg  md:flex hidden">
                  <span>2</span>
                </div>
                <div className="flex items-center justify-center w-10 h-10 bg-emerald-600 text-white rounded-full text-lg font-bold mb-2 md:hidden">
                  <span>2</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-3 text-gray-900">기업 분석</h3>
                  <p className="text-gray-600">
                    비즈니스 모델, 경쟁 우위, 산업 전망 등을 종합적으로 분석하여 장기적 성장
                    가능성과 리스크 요소를 평가합니다.
                  </p>
                </div>
              </div>

              {/* 단계 3 - 수정된 원형 숫자 위치 */}
              <div className="bg-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row gap-6 items-center relative">
                <div className=" items-center justify-center w-12 h-12 bg-emerald-600 text-white rounded-full text-xl font-bold shadow-lg  md:flex hidden">
                  <span>3</span>
                </div>
                <div className="flex items-center justify-center w-10 h-10 bg-emerald-600 text-white rounded-full text-lg font-bold mb-2 md:hidden">
                  <span>3</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-3 text-gray-900">가치 평가</h3>
                  <p className="text-gray-600">
                    S-RIM, DCF, 그레이엄 공식 등 다양한 가치평가 모델을 활용해 기업의 내재가치를
                    계산하고 적정 매수 가격을 결정합니다.
                  </p>
                </div>
              </div>

              {/* 단계 4 - 수정된 원형 숫자 위치 */}
              <div className="bg-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row gap-6 items-center relative">
                <div className=" items-center justify-center w-12 h-12 bg-emerald-600 text-white rounded-full text-xl font-bold shadow-lg md:flex hidden">
                  <span>4</span>
                </div>
                <div className="flex items-center justify-center w-10 h-10 bg-emerald-600 text-white rounded-full text-lg font-bold mb-2 md:hidden">
                  <span>4</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-3 text-gray-900">투자 집행 및 모니터링</h3>
                  <p className="text-gray-600">
                    충분한 안전마진이 확보된 종목에 투자하고, 정기적으로 투자 이유가 여전히 유효한지
                    점검하며 포트폴리오를 관리합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA 섹션 */}
        <div className="w-full py-20 px-6 md:px-16 bg-emerald-700 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">지금 바로 시작하세요</h2>
            <p className="text-xl text-emerald-100 mb-10">
              합리적인 가치투자로 불확실한 시장에서도 안정적인 수익을 추구하세요
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/fairprice">
                <button className="bg-white text-emerald-700 px-8 py-4 rounded-xl font-medium hover:bg-emerald-50 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 duration-200">
                  <BarChart4 className="inline-block mr-2 h-5 w-5" />
                  적정가 계산하기
                </button>
              </Link>
              <Link href="/checklist">
                <button className="border-2 border-white bg-transparent text-white px-8 py-4 rounded-xl font-medium hover:bg-emerald-600 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-1 duration-200">
                  <CheckSquare className="inline-block mr-2 h-5 w-5" />
                  체크리스트 사용하기
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* 법적 고지사항 섹션 */}
        <div className="w-full py-10 px-6 md:px-16 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-4">법적 고지사항</h2>
              <p className="text-sm text-gray-600">
                ValueTargeter의 모든 계산 및 분석은 금융감독원 API 자료와 공공데이터 포털 API를
                기반으로 합니다. 제공되는 모든 정보와 분석 결과는 참고용으로만 제공되며, 투자 결정에
                직접적인 근거로 사용하지 않기를 권장합니다. 실제 투자에 따른 손익에 대해
                ValueTargeter는 어떠한 법적 책임도 지지 않습니다. 모든 투자 결정은 투자자 본인의
                판단과 책임하에 이루어져야 합니다.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-10 px-6 md:px-16 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="font-bold text-xl text-emerald-700 mb-2">ValueTargeter</div>
              <p className="text-gray-500 text-sm">© 2025 ValueTargeter. All rights reserved.</p>
            </div>
            <div className="flex flex-col text-center md:text-right">
              <a
                href="mailto:benefiboard@gmail.com"
                className="text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                benefiboard@gmail.com
              </a>
              <p className="text-gray-400 text-sm mt-2">
                금융감독원 API 자료와 공공데이터 포털 API 기반
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
