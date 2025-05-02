import { ArrowRight, Quote } from 'lucide-react';
import Link from 'next/link';

const GrahamWisdomCard = () => {
  return (
    <div className="bg-gray-100 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden h-full flex flex-col">
      {/* 이미지 섹션 */}
      <div className="h-48 bg-gray-800 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 opacity-50 bg-gray-900"></div>
        <img
          src="/api/placeholder/300/200"
          alt="벤자민 그레이엄"
          className="opacity-60 object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-xl font-bold">벤자민 그레이엄</h3>
          <p className="text-sm text-gray-200">가치투자의 아버지</p>
        </div>
      </div>

      {/* 콘텐츠 섹션 */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="mb-4 flex-1">
          <div className="flex items-start mb-4">
            <Quote className="h-8 w-8 text-gray-400 mr-2 mt-1 flex-shrink-0" />
            <p className="text-gray-800 font-medium italic">
              "투자는 투기가 아니라 분석이다. 안전한 원금과 적절한 수익이 당신의 목표가 되어야
              한다."
            </p>
          </div>

          <div className="mt-4">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
              투자 철학
            </h4>
            <p className="text-sm text-gray-600">
              그레이엄의 핵심 원칙은 <span className="font-semibold">Low Risk & Medium Return</span>
              . 안전마진을 확보하고, 시장의 변동성에 휘둘리지 않는 합리적인 투자를 추구합니다.
            </p>
          </div>
        </div>

        <Link href="/graham-wisdom" className="block w-full mt-4">
          <button className="w-full bg-gray-800 hover:bg-black text-white px-5 py-3 rounded-xl font-medium transition-colors flex items-center justify-center">
            투자 지혜 더 보기
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </Link>
      </div>
    </div>
  );
};

export default GrahamWisdomCard;
