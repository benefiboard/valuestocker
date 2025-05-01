// //src/components/MiniCalculator.tsx

// 'use client';

// import React, { useState } from 'react';
// import { Calculator, ArrowRight } from 'lucide-react';

// const MiniCalculator = () => {
//   const [eps, setEps] = useState('');
//   const [per, setPer] = useState('');
//   const [result, setResult] = useState(null);
//   const [showResult, setShowResult] = useState(false);

//   const handleCalculate = (e) => {
//     e.preventDefault();

//     if (!eps || !per) return;

//     const fairPrice = parseFloat(eps) * parseFloat(per);
//     setResult(fairPrice);
//     setShowResult(true);
//   };

//   return (
//     <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
//       <div className="flex items-center mb-4">
//         <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 mr-2" />
//         <h2 className="text-lg sm:text-xl font-bold">미니 적정가 계산기</h2>
//       </div>

//       <p className="text-xs sm:text-sm text-gray-600 mb-6">
//         가장 기본적인 EPS×PER 모델로 주식의 예상 적정가를 간단히 계산해보세요.
//       </p>

//       <form onSubmit={handleCalculate}>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4">
//           <div>
//             <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
//               EPS (원)
//             </label>
//             <input
//               type="number"
//               value={eps}
//               onChange={(e) => setEps(e.target.value)}
//               placeholder="ex) 5000"
//               className="w-full p-2 border rounded-lg text-xs sm:text-sm"
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
//               적정 PER (배)
//             </label>
//             <input
//               type="number"
//               value={per}
//               onChange={(e) => setPer(e.target.value)}
//               placeholder="ex) 10"
//               className="w-full p-2 border rounded-lg text-xs sm:text-sm"
//               required
//             />
//           </div>

//           <div className="flex items-end">
//             <button
//               type="submit"
//               className="w-full bg-black hover:bg-gray-800 text-white py-2 px-4 rounded-lg transition-colors text-xs sm:text-sm font-medium"
//             >
//               계산하기
//             </button>
//           </div>
//         </div>
//       </form>

//       {showResult && (
//         <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-xl">
//           <div className="flex items-center text-xs sm:text-sm text-gray-700 mb-2">
//             <span>{eps}원</span>
//             <span className="mx-2">×</span>
//             <span>{per}배</span>
//             <ArrowRight className="mx-2 w-4 h-4" />
//             <span className="text-base sm:text-xl font-bold text-gray-900">
//               {result.toLocaleString()}원
//             </span>
//           </div>

//           <p className="text-xs text-gray-500">
//             * 이는 단순 계산 결과로, 전체 7가지 모델을 종합적으로 분석하려면 적정가 계산기를
//             이용하세요.
//           </p>

//           <button className="mt-3 text-gray-900 hover:text-black text-xs sm:text-sm font-medium">
//             적정가 계산기로 자세히 분석하기 →
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default MiniCalculator;
