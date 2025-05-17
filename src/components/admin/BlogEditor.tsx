'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import SunEditorCore from 'suneditor/src/lib/core';
import 'suneditor/dist/css/suneditor.min.css';
import { AlertCircle, Save, Eye, ArrowLeft } from 'lucide-react';

// plugins 불러오기
import plugins from 'suneditor/src/plugins';

// Next.js에서는 SunEditor를 동적으로 import 해야 합니다
const SunEditor = dynamic(() => import('suneditor-react'), {
  ssr: false,
});

interface BlogEditorProps {
  initialData?: {
    id?: string;
    title?: string;
    content?: string;
    image?: string;
    slug?: string;
    status?: 'draft' | 'published';
  };
  mode?: 'create' | 'edit';
}

export default function BlogEditor({ initialData = {}, mode = 'create' }: BlogEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData.title || '');
  const [content, setContent] = useState(initialData.content || '');
  const [status, setStatus] = useState<'draft' | 'published'>(initialData.status || 'draft');
  const [image, setImage] = useState(initialData.image || '');
  const [slug, setSlug] = useState(initialData.slug || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const editor = useRef<SunEditorCore | null>(null);

  // SunEditor 인스턴스 가져오기
  const getSunEditorInstance = (sunEditor: SunEditorCore) => {
    editor.current = sunEditor;
  };

  // 제목으로부터 슬러그 자동 생성 useEffect 수정
  useEffect(() => {
    if (mode === 'create' && !slug) {
      // 1. 랜덤 4자리 숫자 생성 (1000-9999)
      const randomNum = Math.floor(1000 + Math.random() * 9000);

      // 2. 오늘 날짜 가져오기 (한국 시간 기준)
      const now = new Date();
      // 한국 시간으로 변환 (+9시간)
      const koreaTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
      const year = koreaTime.getFullYear();
      const month = String(koreaTime.getMonth() + 1).padStart(2, '0');
      const day = String(koreaTime.getDate()).padStart(2, '0');

      // 3. YYYYMMDD 형식의 날짜 생성
      const dateString = `${year}${month}${day}`;

      // 4. 최종 슬러그 생성: 랜덤숫자-날짜
      const newSlug = `${randomNum}-${dateString}`;

      setSlug(newSlug);
    }
  }, [mode, slug]);

  // 유튜브 URL에서 비디오 ID 추출 함수
  const extractYoutubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // 반응형이면서 적절한 크기의 유튜브 임베드 생성
  const createYoutubeEmbed = (videoId: string) => {
    return `
      <div class="youtube-embed" style="width: 500px; max-width: 100%; margin: 10px auto;">
        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px;">
          <iframe 
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
            src="https://www.youtube.com/embed/${videoId}" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen
          ></iframe>
        </div>
      </div>
    `;
  };

  // 이미지 업로드 핸들러
  const handleImageUploadBefore = (files: Array<File>, info: object, uploadHandler: any) => {
    // 단일 파일만 처리 (첫 번째 파일)
    if (files.length === 0) return;

    const file = files[0];

    // 파일명을 고유하게 생성
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `blog/${fileName}`;

    // Supabase Storage에 업로드
    supabase.storage
      .from('blog-images')
      .upload(filePath, file)
      .then(({ data, error }) => {
        if (error) {
          console.error('이미지 업로드 실패:', error);
          return;
        }

        // 업로드된 이미지의 공개 URL 가져오기
        const publicUrl = supabase.storage.from('blog-images').getPublicUrl(filePath)
          .data.publicUrl;

        // 에디터에 이미지 삽입 (uploadHandler 사용)
        const response = {
          result: [
            {
              url: publicUrl,
              name: file.name,
              size: file.size,
            },
          ],
        };

        uploadHandler(response);
      })
      .catch((error) => {
        console.error('이미지 업로드 오류:', error);
      });

    // suneditor가 기본 업로드 프로세스를 처리하지 않도록 반환
    return false;
  };

  // 커스텀 유튜브 핸들러
  const handleYoutubeEmbed = () => {
    if (!editor.current) return;

    const videoUrl = prompt('유튜브 URL을 입력하세요:') || '';
    if (!videoUrl) return;

    // 유튜브 ID 추출
    const videoId = extractYoutubeVideoId(videoUrl);
    if (!videoId) {
      alert('올바른 유튜브 URL이 아닙니다.');
      return;
    }

    // 새로운 반응형 iframe 코드 사용
    const iframeHTML = createYoutubeEmbed(videoId);

    // 에디터에 HTML 삽입 (커서 위치에)
    editor.current.insertHTML(iframeHTML);
  };

  // 외부 URL 삽입 핸들러
  const handleLinkInsert = () => {
    if (!editor.current) return;

    const url = prompt('웹사이트 URL을 입력하세요:', 'https://') || '';
    if (!url || url === 'https://') return;

    try {
      // URL 유효성 검사
      new URL(url);

      // URL 텍스트 생성 (target과 rel 속성 직접 지정)
      const linkHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #007bff; text-decoration: underline;">${url}</a>`;

      // 에디터에 HTML 삽입 (커서 위치에)
      editor.current.insertHTML(linkHTML);
    } catch (e) {
      alert('유효한 URL을 입력해주세요.');
    }
  };

  // 비디오 업로드 전 핸들러 (유튜브 URL 처리)
  const handleVideoUploadBefore = (files: Array<File>, info: object, uploadHandler: any) => {
    // info가 linkValue 속성을 가진 객체인지 확인
    const infoObj = info as any;

    // 유튜브 URL 처리
    if (infoObj.linkValue) {
      const videoUrl = infoObj.linkValue;
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        const videoId = extractYoutubeVideoId(videoUrl);
        if (videoId && editor.current) {
          // 반응형 iframe HTML 생성 (업데이트된 함수 사용)
          const iframeHTML = createYoutubeEmbed(videoId);

          // 에디터에 직접 HTML 삽입
          editor.current.insertHTML(iframeHTML);

          // 기본 처리 방지
          return false;
        }
      }
    }

    // 파일이 있으면 기본 처리 허용
    return true;
  };

  // SunEditor 초기화 후 추가 설정
  const handleEditorLoad = (reload: boolean) => {
    if (!editor.current) return;

    // 링크 기본 설정 변경
    if (editor.current.core && editor.current.core.options) {
      // @ts-ignore - SunEditor 내부 구조에 접근
      editor.current.core.options.linkTargetNewWindow = true;
    }

    // CSS 스타일을 추가하여 유튜브 임베드와 URL 스타일 통일
    const styleTag = `
      <style>
        .youtube-embed {
          width: 500px;
          max-width: 100%;
          margin: 10px auto;
        }
        .external-link {
          color: #007bff;
          text-decoration: underline;
        }
      </style>
    `;

    // head에 스타일 추가
    if (typeof document !== 'undefined') {
      const existingStyle = document.getElementById('sun-editor-custom-styles');
      if (!existingStyle) {
        const head = document.head;
        const style = document.createElement('style');
        style.id = 'sun-editor-custom-styles';
        style.innerHTML = styleTag;
        head.appendChild(style);
      }
    }
  };

  // 블로그 게시물 저장
  const handleSave = async (saveStatus: 'draft' | 'published' = status) => {
    if (!title) {
      setError('제목을 입력해주세요');
      return;
    }

    if (!content) {
      setError('내용을 입력해주세요');
      return;
    }

    if (!slug) {
      setError('URL 슬러그를 입력해주세요');
      return;
    }

    try {
      setSaving(true);

      // 수정 모드인 경우
      if (mode === 'edit' && initialData.id) {
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({
            title,
            content,
            image,
            slug,
            status: saveStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', initialData.id);

        if (updateError) throw updateError;
      } else {
        // 새로운 게시물 생성
        const { error: insertError } = await supabase.from('blog_posts').insert([
          {
            title,
            content,
            image,
            slug,
            status: saveStatus,
          },
        ]);

        if (insertError) throw insertError;
      }

      // 저장 후 관리자 블로그 목록으로 이동
      router.push('/admin/blog');
      router.refresh();
    } catch (error: any) {
      setError(error.message || '저장 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  };

  // 미리보기 모드
  if (preview) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-5xl mx-auto my-8">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setPreview(false)}
            className="flex items-center text-gray-600 hover:text-emerald-700"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            에디터로 돌아가기
          </button>

          <div className="flex space-x-3">
            <button
              onClick={() => handleSave('draft')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              disabled={saving}
            >
              임시저장
            </button>
            <button
              onClick={() => handleSave('published')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex items-center"
              disabled={saving}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? '저장 중...' : '발행하기'}
            </button>
          </div>
        </div>

        <div className="preview-container">
          <h1 className="text-3xl font-bold mb-4">{title}</h1>
          {image && (
            <img src={image} alt={title} className="w-full h-64 object-cover rounded-lg mb-6" />
          )}
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-5xl mx-auto my-8">
      <div className="mb-6">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          제목
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="블로그 제목을 입력하세요"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
          URL 슬러그
        </label>
        <div className="flex items-center">
          <span className="text-gray-500 mr-2">/blog/</span>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.replace(/\s+/g, '-').toLowerCase())}
            className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="url-slug"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          URL에 사용될 고유 식별자입니다. 자동으로 생성된 숫자 형식을 사용하는 것을 권장합니다.
        </p>
      </div>

      <div className="mb-6">
        <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
          대표 이미지 URL (선택사항)
        </label>
        <input
          id="image"
          type="text"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
        <SunEditor
          getSunEditorInstance={getSunEditorInstance}
          setContents={content}
          onChange={setContent}
          onLoad={handleEditorLoad}
          setOptions={{
            height: '500px',
            plugins: plugins, // 모든 플러그인 로드
            buttonList: [
              ['undo', 'redo'],
              ['font', 'fontSize', 'formatBlock'],
              ['bold', 'underline', 'italic', 'strike', 'subscript', 'superscript'],
              ['removeFormat'],
              ['fontColor', 'hiliteColor'],
              ['align', 'horizontalRule', 'list', 'table'],
              ['link', 'image', 'video'],
              ['fullScreen', 'showBlocks', 'codeView'],
            ],
            // 유튜브 동영상 처리 설정
            videoFileInput: false, // 파일 입력 비활성화 (URL만 사용)
            videoUrlInput: true, // URL 입력 활성화
            videoRatio: 0.5625, // 16:9 비율 (9/16)
            // 링크 설정
            linkRelDefault: {
              default: 'noopener noreferrer',
            },
            // 'linkTargetDefault' 속성 제거 (존재하지 않음)
            // 대신 onLoad 이벤트에서 처리
          }}
          lang="ko"
          // 이미지 업로드 핸들러 (SunEditor props로 전달)
          onImageUploadBefore={handleImageUploadBefore}
          // 비디오 업로드 핸들러 (유튜브 URL 처리)
          onVideoUploadBefore={handleVideoUploadBefore}
        />

        {/* 추가 버튼 */}
        <div className="mt-2 flex space-x-2">
          <button
            type="button"
            onClick={handleYoutubeEmbed}
            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center text-sm"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 576 512"
            >
              <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
            </svg>
            유튜브 삽입
          </button>

          <button
            type="button"
            onClick={handleLinkInsert}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path
                d="M13.0605 8.11073L15.3035 5.86773C16.7043 4.46693 18.9972 4.46693 20.398 5.86773C21.7988 7.26853 21.7988 9.56140 20.398 10.9622L18.155 13.2052M10.5587 15.7071L8.31573 17.9499C6.91493 19.3507 4.62206 19.3507 3.22126 17.9499C1.82046 16.5491 1.82046 14.2563 3.22126 12.8555L5.46426 10.6125M8.11226 15.5034L15.5017 8.11395"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            URL 삽입
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          onClick={() => setPreview(true)}
          className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 flex items-center"
        >
          <Eye className="mr-2 h-4 w-4" />
          미리보기
        </button>
        <button
          onClick={() => handleSave('draft')}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          disabled={saving}
        >
          임시저장
        </button>
        <button
          onClick={() => handleSave('published')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex items-center"
          disabled={saving}
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? '저장 중...' : '발행하기'}
        </button>
      </div>
    </div>
  );
}
