// src/utils/stockUtils.ts

// 공통 포맷팅 함수
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('ko-KR').format(Math.round(num));
};

export const formatAsset = (num: number): string => {
  if (num >= 1000000000000) {
    const jo = Math.floor(num / 1000000000000);
    const eok = Math.floor((num % 1000000000000) / 100000000);
    if (eok > 0) {
      return `${jo}조 ${eok}억`;
    }
    return `${jo}조`;
  } else {
    return `${Math.floor(num / 100000000)}억`;
  }
};
