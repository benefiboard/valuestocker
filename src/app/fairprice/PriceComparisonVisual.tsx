// import React from 'react';
// import { Info } from 'lucide-react';

// // 적정가 범위와 현재가를 시각적으로 비교하는 컴포넌트
// const PriceComparisonVisual = ({ currentPrice, fairPriceRange }) => {
//   const { lowRange, midRange, highRange } = fairPriceRange;

//   // 포맷팅 함수
//   const formatNumber = (num) => {
//     if (num === null || num === undefined) return '-';
//     return new Intl.NumberFormat('ko-KR').format(Math.round(num));
//   };

//   // 가격 범위를 정규화된 위치로 변환 (0-100)
//   // 현재가가 매우 높거나 낮더라도 시각적으로 표현 가능하도록 로직 조정
//   const calculatePosition = () => {
//     // 가격 범위의 폭
//     const rangeWidth = highRange - lowRange;

//     // 기본 버퍼 (시각적 여유 공간)
//     const buffer = rangeWidth * 0.2;

//     // 최소값과 최대값 설정 (버퍼 포함)
//     const minValue = Math.max(0, lowRange - buffer);
//     const maxValue = highRange + buffer;

//     // 전체 스케일 범위
//     const scale = maxValue - minValue;

//     // 위치 계산 (0-100 사이의 값)
//     const positions = {
//       low: ((lowRange - minValue) / scale) * 100,
//       mid: ((midRange - minValue) / scale) * 100,
//       high: ((highRange - minValue) / scale) * 100,
//       current: ((currentPrice - minValue) / scale) * 100,
//     };

//     // 위치가 0-100 범위를 벗어나지 않도록 조정
//     for (const key in positions) {
//       positions[key] = Math.min(100, Math.max(0, positions[key]));
//     }

//     return positions;
//   };

//   const positions = calculatePosition();

//   // 현재 가격 상태 평가
//   const getPriceStatus = () => {
//     if (currentPrice < lowRange) {
//       return {
//         text: '저평가',
//         textColor: 'text-green-600',
//         bgColor: 'bg-green-500',
//         description: '적정가 하위 25% 미만',
//       };
//     } else if (currentPrice < midRange) {
//       return {
//         text: '적정가 범위 내',
//         textColor: 'text-green-600',
//         bgColor: 'bg-green-400',
//         description: '하위 25%와 중앙값 사이',
//       };
//     } else if (currentPrice < highRange) {
//       return {
//         text: '적정가 범위 내',
//         textColor: 'text-yellow-600',
//         bgColor: 'bg-yellow-400',
//         description: '중앙값과 상위 25% 사이',
//       };
//     } else {
//       return {
//         text: '고평가',
//         textColor: 'text-red-600',
//         bgColor: 'bg-red-500',
//         description: '적정가 상위 25% 초과',
//       };
//     }
//   };

//   const priceStatus = getPriceStatus();

//   return (
//     <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-8 shadow-sm mb-6 sm:mb-10">
//       <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
//         <Info className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-gray-700" />
//         적정가 범위와 현재가 비교
//       </h2>

//       {/* 상태 설명 */}
//       <div className="mb-4">
//         <div className="flex items-center gap-2">
//           <div className={`h-3 w-3 sm:h-4 sm:w-4 rounded-full ${priceStatus.bgColor}`}></div>
//           <p className={`text-sm sm:text-base font-medium ${priceStatus.textColor}`}>
//             현재 주가는 <span className="font-bold">{priceStatus.text}</span> 상태입니다.
//             <span className="text-xs text-gray-500 ml-2">({priceStatus.description})</span>
//           </p>
//         </div>
//       </div>

//       {/* 주요 가격 정보 (큰 숫자로 표시) */}
//       <div className="grid grid-cols-2 gap-4 mb-6">
//         <div className="bg-gray-50 p-3 rounded-lg">
//           <div className="text-xs text-gray-500 mb-1">현재 주가</div>
//           <div className="text-xl sm:text-2xl font-bold">{formatNumber(currentPrice)}원</div>
//         </div>
//         <div className="bg-gray-50 p-3 rounded-lg">
//           <div className="text-xs text-gray-500 mb-1">적정가 중앙값</div>
//           <div className="text-xl sm:text-2xl font-bold">{formatNumber(midRange)}원</div>
//         </div>
//       </div>

//       {/* 가격 위치 시각화 - 수평 슬라이더 형태 */}
//       <div className="bg-gray-50 p-4 rounded-lg mb-2">
//         <div className="relative h-14 sm:h-16 mb-8">
//           {/* 가격 범위 바 배경 */}
//           <div className="absolute h-2 bg-gray-200 rounded-full w-full top-6 sm:top-7"></div>

//           {/* 적정가 범위 영역 */}
//           <div
//             className="absolute h-2 bg-gradient-to-r from-green-400 to-yellow-400 rounded-full top-6 sm:top-7"
//             style={{
//               left: `${positions.low}%`,
//               width: `${positions.high - positions.low}%`,
//             }}
//           ></div>

//           {/* 낮은 범위 마커 */}
//           <div
//             className="absolute flex flex-col items-center"
//             style={{ left: `${positions.low}%`, top: 0, transform: 'translateX(-50%)' }}
//           >
//             <div className="w-4 h-4 rounded-full bg-green-400 border-2 border-white"></div>
//             <div className="mt-3 text-xs text-gray-600 font-medium">하위 25%</div>
//             <div className="text-xs font-bold">{formatNumber(lowRange)}원</div>
//           </div>

//           {/* 중앙값 마커 */}
//           <div
//             className="absolute flex flex-col items-center"
//             style={{ left: `${positions.mid}%`, top: 0, transform: 'translateX(-50%)' }}
//           >
//             <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
//             <div className="mt-3 text-xs text-gray-600 font-medium">중앙값</div>
//             <div className="text-xs font-bold">{formatNumber(midRange)}원</div>
//           </div>

//           {/* 높은 범위 마커 */}
//           <div
//             className="absolute flex flex-col items-center"
//             style={{ left: `${positions.high}%`, top: 0, transform: 'translateX(-50%)' }}
//           >
//             <div className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-white"></div>
//             <div className="mt-3 text-xs text-gray-600 font-medium">상위 25%</div>
//             <div className="text-xs font-bold">{formatNumber(highRange)}원</div>
//           </div>

//           {/* 현재 가격 마커 */}
//           <div
//             className="absolute flex flex-col items-center"
//             style={{
//               left: `${positions.current}%`,
//               bottom: 0,
//               transform: 'translateX(-50%)',
//             }}
//           >
//             <div className="mb-3 text-xs font-bold">{formatNumber(currentPrice)}원</div>
//             <div className="text-xs text-gray-600 font-medium">현재 주가</div>
//             <div
//               className={`w-5 h-5 rounded-full ${priceStatus.bgColor} border-2 border-white mt-3 flex items-center justify-center text-white text-xs`}
//             >
//               ↑
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* 가격 차이 정보 */}
//       <div className="bg-gray-50 p-3 rounded-lg">
//         <div className="flex justify-between items-center">
//           <div>
//             <span className="text-xs text-gray-500">적정가 대비 차이:</span>
//             <span className={`ml-2 text-sm font-bold ${priceStatus.textColor}`}>
//               {formatNumber(Math.abs(currentPrice - midRange))}원 (
//               {((Math.abs(currentPrice - midRange) / midRange) * 100).toFixed(1)}%)
//             </span>
//           </div>
//           <div className={`px-3 py-1 ${priceStatus.bgColor} text-white text-xs rounded-full`}>
//             {currentPrice < midRange ? '저평가' : '고평가'}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PriceComparisonVisual;
