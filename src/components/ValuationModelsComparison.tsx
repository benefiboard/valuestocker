//src/components/ValuationModelsComparison.tsx

'use client';

import React, { useState } from 'react';
import {
  Gauge,
  Zap,
  ShieldCheck,
  TrendingUp,
  Layers,
  DollarSign,
  Calculator,
  Building,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Define TypeScript interfaces for our data structures
interface Category {
  name: string;
  description: string;
}

interface Model {
  id: string;
  name: string;
  shortDesc: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  formula: string;
  example: string;
  point: string;
}

interface Categories {
  [key: string]: Category;
}

interface AllModels {
  [key: string]: Model[];
}

const ValuationModelsComparison = () => {
  // 카테고리 선택 상태
  const [selectedCategory, setSelectedCategory] = useState<string>('asset');
  // 확장된 모델 상태 (클릭한 모델만 상세 정보 표시)
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  // 카테고리 정의
  const categories: Categories = {
    asset: {
      name: '자산가치 기반',
      description: '기업이 보유한 자산의 가치를 기준으로 평가',
    },
    earnings: {
      name: '수익가치 기반',
      description: '기업의 수익창출 능력을 기준으로 평가',
    },
    mixed: {
      name: '혼합형',
      description: '성장성과 수익의 질을 함께 고려하는 평가',
    },
  };

  // 가치평가 모델 데이터
  const allModels: AllModels = {
    // 자산가치 기반 모델
    asset: [
      {
        id: 'BPS',
        name: 'BPS 기준',
        shortDesc: '회사 청산가치 기반 안전 투자법',
        icon: <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />,
        color: 'bg-gray-100',
        description: 'BPS는 최악의 상황에서도 내 돈은 얼마나 보장될까를 알려주는 안전망입니다.',
        formula: '자기자본 ÷ 발행주식수 = BPS',
        example: '회사 순자산 100억원 ÷ 주식 100만주 = BPS 10,000원',
        point: '주가 < BPS면 땅값보다 싼 집을 사는 것과 같은 가치투자 찬스!',
      },
      {
        id: 'SRIM',
        name: 'S-RIM 모델',
        shortDesc: '초과이익 가치까지 반영한 프리미엄 평가',
        icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />,
        color: 'bg-gray-100',
        description: '기업이 평균보다 얼마나 특별한지를 돈으로 환산합니다.',
        formula: '기본 자산 가치 + (초과이익의 현재가치)',
        example: '인기 치킨집은 초과이익 1천2백만원을 계속 벌 능력이 있어 프리미엄 부여',
        point: 'ROE가 높은 경제적 해자를 가진 우량기업에 공정한 프리미엄을 줄 수 있는 모델',
      },
      {
        id: 'Yamaguchi',
        name: '야마구치 공식',
        shortDesc: '기업 가치를 부품별로 분해해 평가',
        icon: <Building className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />,
        color: 'bg-gray-100',
        description: '본업 영업가치, 비영업자산, 부채를 분리해 평가합니다.',
        formula: '(영업가치 + 비영업자산 - 부채) ÷ 발행주식수',
        example: '음식장사 가치 + 건물 가치 + 현금 - 대출금 = 총 가치',
        point: '기업의 숨은 자산 가치까지 발굴해내는 종합적 가치평가법',
      },
    ],

    // 수익가치 기반 모델
    earnings: [
      {
        id: 'EPS',
        name: 'EPS 기준',
        shortDesc: '주당순이익의 적정 배수로 평가',
        icon: <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />,
        color: 'bg-gray-100',
        description: '기업의 가치는 결국 얼마나 많은 돈을 벌 수 있는가에 달려있습니다.',
        formula: 'EPS × 적정 배수(일반적으로 10~15배)',
        example: 'EPS 3,000원 × 10배 = 적정주가 30,000원',
        point: '복잡한 계산 없이 빠르게 적정가를 판단할 수 있는 실용적인 도구',
      },
      {
        id: 'Industry_PER',
        name: '업종 평균 PER',
        shortDesc: '동종 업계 평균 배수 적용',
        icon: <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />,
        color: 'bg-gray-100',
        description: '각 산업마다 시장이 인정하는 적정 PER이 있습니다.',
        formula: '당기순이익 ÷ 발행주식수 × 산업 평균 PER',
        example: '(순이익 100억원 ÷ 1천만주) × 15배 = 15,000원',
        point: '동종 업계와 비교했을 때 저평가/고평가 여부를 판단하는 기준점',
      },
      {
        id: 'Historic_PER',
        name: '과거 평균 PER',
        shortDesc: '기업 고유의 역사적 평가 적용',
        icon: <Gauge className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />,
        color: 'bg-gray-100',
        description: '시장은 각 회사마다 적정한 가격 수준을 알고 있습니다.',
        formula: '현재 EPS × 과거 3~5년간 평균 PER',
        example: 'EPS 5,000원 × 과거 평균 12배 = 60,000원',
        point: '시장의 역사적 평가 패턴을 존중하는 현실적이고 검증된 접근법',
      },
    ],

    // 혼합형 모델
    mixed: [
      {
        id: 'PEG',
        name: 'PEG 모델',
        shortDesc: '피터 린치의 성장주 발굴 비밀 무기',
        icon: <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />,
        color: 'bg-gray-100',
        description: '성장률을 고려하여 PER의 적정성을 평가합니다.',
        formula: 'PER ÷ 연간 성장률(%) = PEG',
        example: 'PER 30배, 성장률 40% → PEG = 0.75 (저평가)',
        point: 'PEG < 1이면 성장속도를 고려했을 때 저평가된 보석 같은 주식',
      },
      {
        id: 'ROExEPS',
        name: 'ROE×EPS 모델',
        shortDesc: '수익의 질과 양을 모두 고려',
        icon: <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />,
        color: 'bg-gray-100',
        description: '얼마나 많이 버는지와 얼마나 효율적으로 버는지를 모두 고려합니다.',
        formula: 'ROE(%) × EPS × 적정 계수',
        example: '20% × 1,000원 × 0.5 = 10,000원',
        point: '수익의 질(ROE)과 양(EPS)을 모두 고려한 균형 잡힌 평가법',
      },
    ],
  };

  // 모델 확장/축소 토글 핸들러
  const toggleModel = (modelId: string) => {
    if (expandedModel === modelId) {
      setExpandedModel(null);
    } else {
      setExpandedModel(modelId);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-sm">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">7가지 가치평가 모델</h2>

      {/* 카테고리 선택 탭 */}
      <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
        {Object.keys(categories).map((key) => (
          <button
            key={key}
            className={`py-2 px-4 whitespace-nowrap text-sm font-medium transition-all ${
              selectedCategory === key
                ? 'border-b-2 border-gray-900 text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setSelectedCategory(key)}
          >
            {categories[key].name}
          </button>
        ))}
      </div>

      {/* 현재 카테고리 설명 */}
      <p className="text-xs sm:text-sm text-gray-600 mb-4">
        {categories[selectedCategory].description}
      </p>

      {/* 모델 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allModels[selectedCategory].map((model) => (
          <div
            key={model.id}
            className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all"
          >
            {/* 카드 헤더 - 항상 표시 */}
            <div className="p-4 cursor-pointer" onClick={() => toggleModel(model.id)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className={`${model.color} p-2 rounded-full mr-3`}>{model.icon}</div>
                  <h3 className="font-bold text-sm sm:text-base">{model.name}</h3>
                </div>
                {expandedModel === model.id ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-600">{model.shortDesc}</p>
            </div>

            {/* 확장 내용 - 클릭 시에만 표시 */}
            {expandedModel === model.id && (
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <div className="mb-3">
                  <h4 className="text-xs font-bold mb-1 text-gray-700">개념</h4>
                  <p className="text-xs text-gray-600">{model.description}</p>
                </div>

                <div className="mb-3">
                  <h4 className="text-xs font-bold mb-1 text-gray-700">계산식</h4>
                  <div className="bg-white p-2 rounded-md text-xs">{model.formula}</div>
                </div>

                <div className="mb-3">
                  <h4 className="text-xs font-bold mb-1 text-gray-700">예시</h4>
                  <div className="bg-white p-2 rounded-md text-xs">{model.example}</div>
                </div>

                <div>
                  <h4 className="text-xs font-bold mb-1 text-gray-700">투자 포인트</h4>
                  <p className="text-xs text-gray-600">{model.point}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ValuationModelsComparison;
