// import React from 'react';

// const PriceRangeGraph = ({
//   lowRange,
//   midRange,
//   highRange,
//   currentPrice,
//   formatNumber = (num) => new Intl.NumberFormat('ko-KR').format(Math.round(num)),
// }) => {
//   // 그래프 높이 설정
//   const GRAPH_HEIGHT = 280;
//   const GRAPH_VISIBLE_AREA = 216; // 32px~248px 사이의 가용 높이

//   // 고정된 위치 설정 (그래프 높이의 비율에 맞게 조정)
//   const TOP_LIMIT = 32; // 최상단 제한 (px)
//   const BOTTOM_LIMIT = 248; // 최하단 제한 (px)

//   // 첫 번째 이미지의 비율에 맞게 조정된 위치
//   const HIGH_Y = Math.round(GRAPH_HEIGHT * 0.3); // 상위 25% 위치 (전체 높이의 30%)
//   const MID_Y = Math.round(GRAPH_HEIGHT * 0.5); // 중앙값 위치 (전체 높이의 50%)
//   const LOW_Y = Math.round(GRAPH_HEIGHT * 0.75); // 하위 25% 위치 (전체 높이의 75%)

//   // 현재가격 위치 계산 - 범위 내로 제한
//   const calculateCurrentPosition = () => {
//     // 상하위 25% 사이의 가격 범위
//     const priceRange = highRange - lowRange;

//     if (priceRange <= 0) {
//       return MID_Y; // 가격 범위가 0이면 중앙에 표시
//     }

//     // 현재가격이 하위 25%보다 낮은 경우
//     if (currentPrice <= lowRange) {
//       return BOTTOM_LIMIT;
//     }

//     // 현재가격이 상위 25%보다 높은 경우
//     if (currentPrice >= highRange) {
//       return TOP_LIMIT;
//     }

//     // 하위 25%와 상위 25% 사이에 있는 경우
//     // 전체 가격 범위 내에서의 비율 계산
//     const ratio = (currentPrice - lowRange) / priceRange;

//     // 그래프 상의 위치 계산 (하위 25% ~ 상위 25% 사이)
//     // 낮은 가격은 높은 Y값, 높은 가격은 낮은 Y값을 가짐
//     const position = LOW_Y - ratio * (LOW_Y - HIGH_Y);

//     return position;
//   };

//   // 현재가격 위치 계산
//   const currentY = calculateCurrentPosition();

//   return (
//     <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
//       <h3 className="text-lg font-bold text-gray-800 mb-4">적정가 범위 그래프</h3>

//       <div className="flex">
//         {/* Y축 레이블 */}
//         <div className="flex flex-col justify-between mr-2 text-sm text-gray-600 py-4">
//           <div>{formatNumber(highRange)}원</div>
//           <div>{formatNumber(midRange)}원</div>
//           <div>{formatNumber(lowRange)}원</div>
//         </div>

//         {/* 그래프 영역 */}
//         <div className="relative w-64 h-64 border border-gray-200 bg-gray-50 rounded-lg">
//           {/* 상위 25% 선 - 그래프 높이의 30% 위치 */}
//           <div
//             className="absolute w-full border-t border-dashed border-gray-400"
//             style={{ top: `${HIGH_Y}px` }}
//           >
//             <span className="absolute right-full mr-2 text-xs text-gray-500 whitespace-nowrap">
//               상위 25%
//             </span>
//           </div>

//           {/* 중앙값 선 - 그래프 높이의 50% 위치 */}
//           <div
//             className="absolute w-full border-t border-dashed border-gray-400"
//             style={{ top: `${MID_Y}px` }}
//           >
//             <span className="absolute right-full mr-2 text-xs text-gray-500 whitespace-nowrap">
//               중앙값
//             </span>
//           </div>

//           {/* 하위 25% 선 - 그래프 높이의 75% 위치 */}
//           <div
//             className="absolute w-full border-t border-dashed border-gray-400"
//             style={{ top: `${LOW_Y}px` }}
//           >
//             <span className="absolute right-full mr-2 text-xs text-gray-500 whitespace-nowrap">
//               하위 25%
//             </span>
//           </div>

//           {/* 현재가격 선 - 가격에 비례하여 계산된 위치 */}
//           <div
//             className="absolute w-full border-t-2 border-emerald-600"
//             style={{ top: `${currentY}px` }}
//           >
//             <div className="absolute -top-3 right-0 bg-emerald-600 text-white px-2 py-1 rounded text-xs">
//               {formatNumber(currentPrice)}원
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="mt-4 text-sm text-gray-600">
//         <p>※ 현재가격이 적정가 범위 내에서 어디에 위치하는지 표시합니다.</p>
//       </div>
//     </div>
//   );
// };

// export default PriceRangeGraph;
