// loading.tsx
'use client';

import React from 'react';

export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
      <div className="flex flex-col items-center">
        <div className="relative h-16 w-16">
          {/* 외부 원 */}
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          {/* 회전하는 내부 부분 */}
          <div className="absolute inset-0 border-4 border-t-black border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-lg font-medium text-black">loading...</p>
      </div>
    </div>
  );
}
