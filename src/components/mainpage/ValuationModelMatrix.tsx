'use client';

import React, { JSX, useState } from 'react';
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
  Filter,
  Search,
  Info,
} from 'lucide-react';

// 모델 데이터 타입 정의
interface ModelData {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  shortDesc: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  formula: string;
  example: string;
  point: string;
  complexity: number;
  reliability: number;
  applicability: number;
}

// 카테고리 타입 정의
interface Category {
  id: string;
  name: string;
}

const ValuationModelMatrix = () => {
  // 카테고리 상태 관리
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showComparisonMode, setShowComparisonMode] = useState<boolean>(false);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  // 모델 데이터
  const modelData: ModelData[] = [
    {
      id: 'BPS',
      name: 'BPS 기준',
      category: 'asset',
      categoryName: '자산가치 기반',
      shortDesc: '회사 청산가치 기반 안전 투자법',
      icon: <ShieldCheck className="w-5 h-5 text-gray-900" />,
      color: 'bg-gray-100',
      description: 'BPS는 최악의 상황에서도 내 돈은 얼마나 보장될까를 알려주는 안전망입니다.',
      formula: '자기자본 ÷ 발행주식수 = BPS',
      example: '회사 순자산 100억원 ÷ 주식 100만주 = BPS 10,000원',
      point: '주가 < BPS면 땅값보다 싼 집을 사는 것과 같은 가치투자 찬스!',
      complexity: 1,
      reliability: 4,
      applicability: 3,
    },
    {
      id: 'SRIM',
      name: 'S-RIM 모델',
      category: 'asset',
      categoryName: '자산가치 기반',
      shortDesc: '초과이익 가치까지 반영한 프리미엄 평가',
      icon: <Zap className="w-5 h-5 text-gray-900" />,
      color: 'bg-gray-100',
      description: '기업이 평균보다 얼마나 특별한지를 돈으로 환산합니다.',
      formula: '기본 자산 가치 + (초과이익의 현재가치)',
      example: '인기 치킨집은 초과이익 1천2백만원을 계속 벌 능력이 있어 프리미엄 부여',
      point: 'ROE가 높은 경제적 해자를 가진 우량기업에 공정한 프리미엄을 줄 수 있는 모델',
      complexity: 4,
      reliability: 4,
      applicability: 5,
    },
    {
      id: 'Yamaguchi',
      name: '야마구치 공식',
      category: 'asset',
      categoryName: '자산가치 기반',
      shortDesc: '기업 가치를 파트별로 분해하여 평가',
      icon: <Building className="w-5 h-5 text-gray-900" />,
      color: 'bg-gray-100',
      description: '본업 영업가치, 비영업자산, 부채를 분리해 평가합니다.',
      formula: '(영업가치 + 비영업자산 - 부채) ÷ 발행주식수',
      example: '음식장사 가치 + 건물 가치 + 현금 - 대출금 = 총 가치',
      point: '기업의 숨은 자산 가치까지 발굴해내는 종합적 가치평가법',
      complexity: 5,
      reliability: 4,
      applicability: 4,
    },
    {
      id: 'EPS',
      name: 'EPS 기준',
      category: 'earnings',
      categoryName: '수익가치 기반',
      shortDesc: '주당순이익의 적정 배수로 평가',
      icon: <Calculator className="w-5 h-5 text-gray-900" />,
      color: 'bg-gray-100',
      description: '기업의 가치는 결국 얼마나 많은 돈을 벌 수 있는가에 달려있습니다.',
      formula: 'EPS × 적정 배수(일반적으로 10~15배)',
      example: 'EPS 3,000원 × 10배 = 적정주가 30,000원',
      point: '복잡한 계산 없이 빠르게 적정가를 판단할 수 있는 실용적인 도구',
      complexity: 1,
      reliability: 3,
      applicability: 5,
    },
    {
      id: 'Industry_PER',
      name: '업종 평균 PER',
      category: 'earnings',
      categoryName: '수익가치 기반',
      shortDesc: '동종 업계 평균 배수 적용',
      icon: <DollarSign className="w-5 h-5 text-gray-900" />,
      color: 'bg-gray-100',
      description: '각 산업마다 시장이 인정하는 적정 PER이 있습니다.',
      formula: '당기순이익 ÷ 발행주식수 × 산업 평균 PER',
      example: '(순이익 100억원 ÷ 1천만주) × 15배 = 15,000원',
      point: '동종 업계와 비교했을 때 저평가/고평가 여부를 판단하는 기준점',
      complexity: 2,
      reliability: 3,
      applicability: 4,
    },
    {
      id: 'Historic_PER',
      name: '과거 평균 PER',
      category: 'earnings',
      categoryName: '수익가치 기반',
      shortDesc: '기업 고유의 역사적 평가 적용',
      icon: <Gauge className="w-5 h-5 text-gray-900" />,
      color: 'bg-gray-100',
      description: '시장은 각 회사마다 적정한 가격 수준을 알고 있습니다.',
      formula: '현재 EPS × 과거 3~5년간 평균 PER',
      example: 'EPS 5,000원 × 과거 평균 12배 = 60,000원',
      point: '시장의 역사적 평가 패턴을 존중하는 현실적이고 검증된 접근법',
      complexity: 2,
      reliability: 4,
      applicability: 4,
    },
    {
      id: 'PEG',
      name: 'PEG 모델',
      category: 'mixed',
      categoryName: '혼합형',
      shortDesc: '피터 린치의 성장주 발굴 비밀 무기',
      icon: <TrendingUp className="w-5 h-5 text-gray-900" />,
      color: 'bg-gray-100',
      description: '성장률을 고려하여 PER의 적정성을 평가합니다.',
      formula: 'PER ÷ 연간 성장률(%) = PEG',
      example: 'PER 30배, 성장률 40% → PEG = 0.75 (저평가)',
      point: 'PEG < 1이면 성장속도를 고려했을 때 저평가된 보석 같은 주식',
      complexity: 2,
      reliability: 3,
      applicability: 4,
    },
    {
      id: 'ROExEPS',
      name: 'ROE×EPS 모델',
      category: 'mixed',
      categoryName: '혼합형',
      shortDesc: '수익의 질과 양을 모두 고려',
      icon: <Layers className="w-5 h-5 text-gray-900" />,
      color: 'bg-gray-100',
      description: '얼마나 많이 버는지와 얼마나 효율적으로 버는지를 모두 고려합니다.',
      formula: 'ROE(%) × EPS × 적정 계수',
      example: '20% × 1,000원 × 0.5 = 10,000원',
      point: '수익의 질(ROE)과 양(EPS)을 모두 고려한 균형 잡힌 평가법',
      complexity: 3,
      reliability: 4,
      applicability: 4,
    },
  ];

  // 카테고리 목록
  const categories: Category[] = [
    { id: 'all', name: '전체 모델' },
    { id: 'asset', name: '자산가치 기반' },
    { id: 'earnings', name: '수익가치 기반' },
    { id: 'mixed', name: '혼합형' },
  ];

  // 필터링된 모델 목록
  const filteredModels = modelData.filter((model) => {
    const matchesCategory = activeCategory === 'all' || model.category === activeCategory;
    const matchesSearch =
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.shortDesc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 모델 선택 토글
  const toggleModelSelection = (modelId: string): void => {
    if (selectedModels.includes(modelId)) {
      setSelectedModels(selectedModels.filter((id) => id !== modelId));
    } else {
      if (selectedModels.length < 3) {
        setSelectedModels([...selectedModels, modelId]);
      }
    }
  };

  // 모델 확장 토글
  const toggleModelExpansion = (modelId: string): void => {
    if (expandedModel === modelId) {
      setExpandedModel(null);
    } else {
      setExpandedModel(modelId);
    }
  };

  // 별점 렌더링 함수
  const renderRating = (rating: number): JSX.Element => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <div
            key={star}
            className={`w-2 h-2 md:w-3 md:h-3 rounded-full mx-0.5 ${
              star <= rating ? 'bg-gray-700' : 'bg-gray-200'
            }`}
          ></div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 md:mb-0">
          7가지 가치평가 모델
        </h2>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {/* 검색 입력창 */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="모델 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>

          {/* 비교 모드 토글 */}
          <button
            onClick={() => setShowComparisonMode(!showComparisonMode)}
            className={`px-3 py-2 rounded-lg border text-sm font-medium flex items-center ${
              showComparisonMode
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4 mr-1" />
            비교 모드 {showComparisonMode ? 'OFF' : 'ON'}
          </button>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex overflow-x-auto mb-4 border-b border-gray-200 pb-1 -mx-1 px-1">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-4 py-2 text-sm whitespace-nowrap font-medium transition-colors ${
              activeCategory === category.id
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* 비교 모드 안내 */}
      {showComparisonMode && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-start">
          <Info className="w-5 h-5 text-gray-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600">
              최대 3개까지 모델을 선택하여 비교할 수 있습니다.
            </p>
            <p className="text-xs text-gray-500 mt-1">현재 {selectedModels.length}/3 모델 선택됨</p>
          </div>
        </div>
      )}

      {/* 비교 모드 테이블 */}
      {showComparisonMode && selectedModels.length > 0 && (
        <div className="mb-6 overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 border-b border-gray-200 w-32">
                  비교 항목
                </th>
                {selectedModels.map((modelId) => {
                  const model = modelData.find((m) => m.id === modelId);
                  return model ? (
                    <th
                      key={modelId}
                      className="py-3 px-4 text-left text-xs font-medium text-gray-700 border-b border-gray-200"
                    >
                      <div className="flex items-center">
                        <div className="bg-gray-100 p-2 rounded-full mr-2">{model.icon}</div>
                        {model.name}
                      </div>
                    </th>
                  ) : null;
                })}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-3 px-4 text-xs font-medium text-gray-500 border-b border-gray-100">
                  카테고리
                </td>
                {selectedModels.map((modelId) => {
                  const model = modelData.find((m) => m.id === modelId);
                  return model ? (
                    <td
                      key={`${modelId}-category`}
                      className="py-3 px-4 text-xs text-gray-700 border-b border-gray-100"
                    >
                      {model.categoryName}
                    </td>
                  ) : null;
                })}
              </tr>
              <tr>
                <td className="py-3 px-4 text-xs font-medium text-gray-500 border-b border-gray-100">
                  복잡성
                </td>
                {selectedModels.map((modelId) => {
                  const model = modelData.find((m) => m.id === modelId);
                  return model ? (
                    <td
                      key={`${modelId}-complexity`}
                      className="py-3 px-4 text-xs text-gray-700 border-b border-gray-100"
                    >
                      {renderRating(model.complexity)}
                      <span className="text-xs text-gray-500 ml-1">
                        {model.complexity === 1
                          ? '(매우 쉬움)'
                          : model.complexity === 5
                          ? '(매우 복잡)'
                          : ''}
                      </span>
                    </td>
                  ) : null;
                })}
              </tr>
              <tr>
                <td className="py-3 px-4 text-xs font-medium text-gray-500 border-b border-gray-100">
                  신뢰성
                </td>
                {selectedModels.map((modelId) => {
                  const model = modelData.find((m) => m.id === modelId);
                  return model ? (
                    <td
                      key={`${modelId}-reliability`}
                      className="py-3 px-4 text-xs text-gray-700 border-b border-gray-100"
                    >
                      {renderRating(model.reliability)}
                    </td>
                  ) : null;
                })}
              </tr>
              <tr>
                <td className="py-3 px-4 text-xs font-medium text-gray-500 border-b border-gray-100">
                  적용 범위
                </td>
                {selectedModels.map((modelId) => {
                  const model = modelData.find((m) => m.id === modelId);
                  return model ? (
                    <td
                      key={`${modelId}-applicability`}
                      className="py-3 px-4 text-xs text-gray-700 border-b border-gray-100"
                    >
                      {renderRating(model.applicability)}
                    </td>
                  ) : null;
                })}
              </tr>
              <tr>
                <td className="py-3 px-4 text-xs font-medium text-gray-500 border-b border-gray-100">
                  계산식
                </td>
                {selectedModels.map((modelId) => {
                  const model = modelData.find((m) => m.id === modelId);
                  return model ? (
                    <td
                      key={`${modelId}-formula`}
                      className="py-3 px-4 text-xs text-gray-700 border-b border-gray-100"
                    >
                      <div className="bg-gray-50 p-2 rounded border border-gray-100">
                        {model.formula}
                      </div>
                    </td>
                  ) : null;
                })}
              </tr>
              <tr>
                <td className="py-3 px-4 text-xs font-medium text-gray-500 border-b border-gray-100">
                  핵심 포인트
                </td>
                {selectedModels.map((modelId) => {
                  const model = modelData.find((m) => m.id === modelId);
                  return model ? (
                    <td
                      key={`${modelId}-point`}
                      className="py-3 px-4 text-xs text-gray-700 border-b border-gray-100"
                    >
                      {model.point}
                    </td>
                  ) : null;
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 모델 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModels.map((model) => (
          <div
            key={model.id}
            className={`border rounded-xl overflow-hidden transition-all ${
              showComparisonMode && selectedModels.includes(model.id)
                ? 'ring-2 ring-gray-900 border-transparent'
                : 'border-gray-200 hover:shadow-md'
            } ${showComparisonMode ? 'cursor-pointer' : ''}`}
            onClick={showComparisonMode ? () => toggleModelSelection(model.id) : undefined}
          >
            {/* 카드 헤더 - 항상 표시 */}
            <div
              className={`p-4 ${!showComparisonMode ? 'cursor-pointer' : ''}`}
              onClick={showComparisonMode ? undefined : () => toggleModelExpansion(model.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className={`${model.color} p-2 rounded-full mr-3`}>{model.icon}</div>
                  <h3 className="font-bold text-sm">{model.name}</h3>
                </div>
                {!showComparisonMode &&
                  (expandedModel === model.id ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ))}
              </div>
              <p className="text-xs text-gray-600">{model.shortDesc}</p>
            </div>

            {/* 확장 내용 - 클릭 시에만 표시 */}
            {!showComparisonMode && expandedModel === model.id && (
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <div className="mb-4">
                  <h4 className="text-xs font-bold mb-1 text-gray-700">개념</h4>
                  <p className="text-xs text-gray-600">{model.description}</p>
                </div>

                <div className="mb-4">
                  <h4 className="text-xs font-bold mb-1 text-gray-700">계산식</h4>
                  <div className="bg-white p-2 rounded-md text-xs border border-gray-100">
                    {model.formula}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-xs font-bold mb-1 text-gray-700">예시</h4>
                  <div className="bg-white p-2 rounded-md text-xs border border-gray-100">
                    {model.example}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-xs font-bold mb-1 text-gray-700">투자 포인트</h4>
                  <p className="text-xs text-gray-600">{model.point}</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <h4 className="text-xs font-bold mb-1 text-gray-700">복잡성</h4>
                    {renderRating(model.complexity)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold mb-1 text-gray-700">신뢰성</h4>
                    {renderRating(model.reliability)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold mb-1 text-gray-700">적용범위</h4>
                    {renderRating(model.applicability)}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 결과가 없을 때 */}
      {filteredModels.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-gray-500">검색 조건에 맞는 모델이 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default ValuationModelMatrix;
