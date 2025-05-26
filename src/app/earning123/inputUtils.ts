// src/app/earning/inputUtils.ts

/**
 * 한국어 금액 표현을 숫자로 변환
 * 예: "1000만원" → 10000000
 *     "5천만" → 50000000
 *     "3억" → 300000000
 */
export function parseKoreanAmount(input: string): number {
  // 숫자와 한글만 남기고 제거
  const cleaned = input.replace(/[^\d만천억조]/g, '');

  // 이미 순수 숫자인 경우
  if (/^\d+$/.test(cleaned)) {
    return parseInt(cleaned) || 0;
  }

  let result = 0;

  // 조 단위 처리
  const joMatch = cleaned.match(/(\d+)조/);
  if (joMatch) {
    result += parseInt(joMatch[1]) * 1000000000000;
  }

  // 억 단위 처리
  const eokMatch = cleaned.match(/(\d+)억/);
  if (eokMatch) {
    result += parseInt(eokMatch[1]) * 100000000;
  }

  // 천만 단위 처리
  const cheonmanMatch = cleaned.match(/(\d+)천만/);
  if (cheonmanMatch) {
    result += parseInt(cheonmanMatch[1]) * 10000000;
  } else {
    // 천 단위 처리
    const cheonMatch = cleaned.match(/(\d+)천/);
    if (cheonMatch) {
      result += parseInt(cheonMatch[1]) * 1000;
    }

    // 만 단위 처리 (천만이 아닌 경우만)
    const manMatch = cleaned.match(/(\d+)만/);
    if (manMatch && !cleaned.includes('천만')) {
      result += parseInt(manMatch[1]) * 10000;
    }
  }

  // 나머지 숫자 처리
  const remainingMatch = cleaned.match(/(\d+)(?!만|천|억|조)/);
  if (
    remainingMatch &&
    !cleaned.includes('만') &&
    !cleaned.includes('천') &&
    !cleaned.includes('억') &&
    !cleaned.includes('조')
  ) {
    result += parseInt(remainingMatch[1]);
  }

  return result;
}

/**
 * 숫자를 한국어 금액 표현으로 변환
 * 예: 10000000 → "1천만원"
 *     50000000 → "5천만원"
 *     300000000 → "3억원"
 */
export function formatKoreanAmount(amount: number): string {
  if (amount === 0) return '0원';

  const units = [
    { value: 1000000000000, name: '조' },
    { value: 100000000, name: '억' },
    { value: 10000000, name: '천만' },
    { value: 10000, name: '만' },
    { value: 1000, name: '천' },
  ];

  let result = '';
  let remaining = amount;

  for (const unit of units) {
    const unitAmount = Math.floor(remaining / unit.value);
    if (unitAmount > 0) {
      result += `${unitAmount}${unit.name} `;
      remaining %= unit.value;
    }
  }

  if (remaining > 0) {
    result += `${remaining}`;
  }

  return result.trim() + '원';
}
