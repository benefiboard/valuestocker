'use client';

import { useState } from 'react';

interface AdminBlogEditorProps {
  onLogout: () => void;
}

// 메시지 타입 정의
type MessageType = {
  text: string;
  type: 'success' | 'error';
} | null;

export default function AdminBlogEditor({ onLogout }: AdminBlogEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<MessageType>(null);

  // 임시 저장 기능 (나중에 Supabase와 연동)
  const handleSave = async () => {
    setIsSaving(true);

    try {
      // 여기에 Supabase 저장 코드가 추가될 예정
      console.log('저장될 데이터:', { title, content });

      // 성공 메시지 표시 (테스트용)
      setMessage({ text: '임시 저장되었습니다', type: 'success' });

      // 3초 후 메시지 숨김
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error) {
      console.error('저장 오류:', error);
      setMessage({ text: '저장 중 오류가 발생했습니다', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">블로그 글 관리</h1>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
        >
          로그아웃
        </button>
      </div>

      {/* 상태 메시지 표시 */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="블로그 제목을 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg h-60"
            placeholder="내용을 입력하세요..."
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-emerald-300"
          >
            {isSaving ? '저장 중...' : '임시 저장'}
          </button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-700 mb-2">향후 구현 예정 기능:</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>Rich Text Editor 통합</li>
          <li>이미지 업로드</li>
          <li>글 목록 보기 및 수정</li>
          <li>Supabase 연동 데이터 저장</li>
          <li>발행 기능</li>
        </ul>
      </div>
    </div>
  );
}
