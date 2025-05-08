'use client';

import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabaseClient';

// 미디어 아이템 타입 정의
export interface BlogMedia {
  id: string;
  type: 'image' | 'youtube' | 'url';
  url: string;
  title?: string;
}

interface SimpleBlogEditorProps {
  initialValue?: string;
  initialMedia?: BlogMedia[];
  onChange: (content: string, media: BlogMedia[]) => void;
}

export default function SimpleBlogEditor({
  initialValue = '',
  initialMedia = [],
  onChange,
}: SimpleBlogEditorProps) {
  const [content, setContent] = useState(initialValue);
  const [media, setMedia] = useState<BlogMedia[]>(initialMedia);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 유튜브 URL 추출 함수
  const getYoutubeId = (url: string): string | null => {
    if (!url) return null;

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // 내용이 변경될 때 호출되는 함수
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    onChange(newContent, media);
  };

  // 이미지 업로드 버튼 클릭 핸들러
  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  // 파일 선택 후 업로드 처리
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // 이미지 크기 체크
      if (file.size > 5 * 1024 * 1024) {
        alert('이미지 크기는 5MB 이하여야 합니다.');
        return;
      }

      // 파일 타입 체크
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }

      // 고유 파일명 생성
      const fileName = `${uuidv4()}.${file.name.split('.').pop()}`;
      const filePath = `blog-images/${fileName}`;

      // Supabase Storage에 업로드
      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 공개 URL 가져오기
      const { data } = supabase.storage.from('blog-images').getPublicUrl(filePath);
      const imageUrl = data.publicUrl;

      // 이미지 태그 생성 및 삽입
      const imageTag = `\n[이미지: ${imageUrl}]\n`;

      // 에디터에 이미지 태그 삽입
      const textArea = document.getElementById('content-editor') as HTMLTextAreaElement;
      if (textArea) {
        const startPos = textArea.selectionStart;
        const endPos = textArea.selectionEnd;
        const before = content.substring(0, startPos);
        const after = content.substring(endPos);
        const newText = before + imageTag + after;

        setContent(newText);

        // 미디어 목록에 추가
        const newMedia: BlogMedia = {
          id: uuidv4(),
          type: 'image',
          url: imageUrl,
          title: file.name,
        };

        const updatedMedia = [...media, newMedia];
        setMedia(updatedMedia);
        onChange(newText, updatedMedia);

        // 커서 위치 조정
        setTimeout(() => {
          textArea.focus();
          textArea.selectionStart = startPos + imageTag.length;
          textArea.selectionEnd = startPos + imageTag.length;
        }, 0);
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  // 유튜브 삽입 핸들러
  const handleYoutubeInsert = () => {
    const url = prompt('유튜브 URL을 입력하세요:');
    if (!url) return;

    const videoId = getYoutubeId(url);
    if (!videoId) {
      alert('유효한 유튜브 URL이 아닙니다.');
      return;
    }

    // 유튜브 태그 생성
    const youtubeTag = `\n[유튜브: ${url}]\n`;

    // 에디터에 유튜브 태그 삽입
    const textArea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (textArea) {
      const startPos = textArea.selectionStart;
      const endPos = textArea.selectionEnd;
      const before = content.substring(0, startPos);
      const after = content.substring(endPos);
      const newText = before + youtubeTag + after;

      setContent(newText);

      // 미디어 목록에 추가
      const newMedia: BlogMedia = {
        id: uuidv4(),
        type: 'youtube',
        url: url,
        title: '유튜브 비디오',
      };

      const updatedMedia = [...media, newMedia];
      setMedia(updatedMedia);
      onChange(newText, updatedMedia);

      // 커서 위치 조정
      setTimeout(() => {
        textArea.focus();
        textArea.selectionStart = startPos + youtubeTag.length;
        textArea.selectionEnd = startPos + youtubeTag.length;
      }, 0);
    }
  };

  // URL 삽입 핸들러
  const handleUrlInsert = () => {
    const url = prompt('URL을 입력하세요:');
    if (!url) return;

    try {
      // URL 유효성 검사
      const normalizedUrl = url.match(/^https?:\/\//) ? url : `http://${url}`;
      new URL(normalizedUrl); // URL 구문 검증

      // URL 태그 생성
      const urlTag = `\n[링크: ${normalizedUrl}]\n`;

      // 에디터에 URL 태그 삽입
      const textArea = document.getElementById('content-editor') as HTMLTextAreaElement;
      if (textArea) {
        const startPos = textArea.selectionStart;
        const endPos = textArea.selectionEnd;
        const before = content.substring(0, startPos);
        const after = content.substring(endPos);
        const newText = before + urlTag + after;

        setContent(newText);

        // 미디어 목록에 추가
        const newMedia: BlogMedia = {
          id: uuidv4(),
          type: 'url',
          url: normalizedUrl,
          title: new URL(normalizedUrl).hostname,
        };

        const updatedMedia = [...media, newMedia];
        setMedia(updatedMedia);
        onChange(newText, updatedMedia);

        // 커서 위치 조정
        setTimeout(() => {
          textArea.focus();
          textArea.selectionStart = startPos + urlTag.length;
          textArea.selectionEnd = startPos + urlTag.length;
        }, 0);
      }
    } catch (error) {
      alert('유효한 URL 형식이 아닙니다.');
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* 툴바 */}
      <div className="bg-gray-100 p-2 border-b border-gray-300 flex flex-wrap gap-1">
        <button
          type="button"
          className="p-2 rounded hover:bg-gray-200"
          title="이미지 삽입"
          onClick={handleImageUpload}
        >
          📷 이미지
        </button>
        <button
          type="button"
          className="p-2 rounded hover:bg-gray-200"
          title="유튜브 삽입"
          onClick={handleYoutubeInsert}
        >
          📺 유튜브
        </button>
        <button
          type="button"
          className="p-2 rounded hover:bg-gray-200"
          title="URL 삽입"
          onClick={handleUrlInsert}
        >
          🔗 링크
        </button>

        {/* 숨겨진 파일 입력 */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      {/* 에디터 영역 */}
      <textarea
        id="content-editor"
        value={content}
        onChange={handleContentChange}
        className="w-full min-h-[400px] p-4 focus:outline-none resize-y"
        placeholder="내용을 입력하세요. 이미지, 유튜브, 링크 버튼을 사용하여 미디어를 추가할 수 있습니다."
      />

      {/* 미디어 미리보기 */}
      {media.length > 0 && (
        <div className="border-t border-gray-200 p-2">
          <details>
            <summary className="text-sm text-gray-700 cursor-pointer">
              미디어 미리보기 ({media.length}개)
            </summary>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
              {media.map((item) => (
                <div key={item.id} className="border rounded p-2 text-xs">
                  <div className="font-bold mb-1">
                    {item.type === 'image' ? '이미지' : item.type === 'youtube' ? '유튜브' : '링크'}
                  </div>
                  <div className="truncate text-blue-500">{item.url}</div>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* 도움말 */}
      <div className="border-t border-gray-200 p-2 bg-gray-50 text-xs text-gray-500">
        <details>
          <summary className="cursor-pointer">도움말</summary>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>이미지 버튼: 이미지 파일을 선택하여 업로드합니다.</li>
            <li>유튜브 버튼: 유튜브 URL을 입력하여 삽입합니다.</li>
            <li>링크 버튼: 웹사이트 URL을 입력하여 삽입합니다.</li>
            <li>미디어는 자동으로 [미디어: URL] 형태로 삽입됩니다.</li>
            <li>저장 시 미디어는 자동으로 임베드 형태로 변환됩니다.</li>
          </ul>
        </details>
      </div>

      {/* 업로드 로딩 인디케이터 */}
      {isUploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p>이미지 업로드 중...</p>
          </div>
        </div>
      )}
    </div>
  );
}
