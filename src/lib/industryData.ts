// src/lib/industryData.ts
// 산업군별 데이터 가져오기 위한 유틸리티 함수
import industryData from './industry-DATA.json';

export const getIndustryParameters = (industry: string) => {
  // 해당 산업군 데이터 찾기 (없으면 etc 사용)
  const industryInfo =
    industryData.find((item) => item.industry === industry) ||
    industryData.find((item) => item.industry === 'etc');

  console.log('산업군 데이터:', industryInfo);

  return {
    avgPER: industryInfo?.avgPER || 8, // 기본값 8
    avgPEG: industryInfo?.avgPEG || 0.8, // 기본값 0.8
    liabilityMultiplier: industryInfo?.liabilityMultiplier || 1.2, // 기본값 1.2
  };
};
