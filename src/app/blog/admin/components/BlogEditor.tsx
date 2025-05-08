'use client';

import { useState, useCallback, useEffect } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabaseClient';

// 블로그 포스트 타입 정의
export interface BlogPostMedia {
  type: 'image' | 'youtube' | 'url';
  url: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  position?: number; // 콘텐츠 내 위치
}

// 유튜브 URL에서 비디오 ID 추출 - 컴포넌트 외부로 이동
const getYoutubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// URL 메타데이터 추출 함수 - 컴포넌트 외부로 이동
const fetchUrlMetadata = async (url: string): Promise<Partial<BlogPostMedia>> => {
  // 실제 구현에서는 서버 측 API를 호출하여 메타데이터 추출
  // 여기서는 간단한 데모 구현
  try {
    // 유튜브 URL인 경우 별도 처리
    const youtubeId = getYoutubeId(url);
    if (youtubeId) {
      return {
        type: 'youtube',
        url,
        title: '유튜브 비디오',
        thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/0.jpg`,
      };
    }

    // 일반 URL의 경우 최소한의 정보만 반환
    // 실제로는 서버에서 OG 태그 등을 파싱하여 제목, 설명, 썸네일 등 추출
    return {
      type: 'url',
      url,
      title: new URL(url).hostname,
    };
  } catch (error) {
    console.error('URL 메타데이터 추출 실패:', error);
    return { type: 'url', url };
  }
};

// 툴바 버튼 컴포넌트
interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, isActive = false, children }) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={`p-2 rounded hover:bg-gray-200 ${isActive ? 'bg-gray-200' : ''}`}
  >
    {children}
  </button>
);

interface BlogEditorProps {
  initialContent?: string;
  initialMediaItems?: BlogPostMedia[];
  onChange: (html: string, mediaItems?: BlogPostMedia[]) => void;
  onSave?: (publish: boolean) => Promise<void>;
  isSaving?: boolean;
}

export default function BlogEditor({
  initialContent = '',
  initialMediaItems = [],
  onChange,
  onSave,
  isSaving = false,
}: BlogEditorProps) {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editorReady, setEditorReady] = useState<boolean>(false);
  const [mediaItems, setMediaItems] = useState<BlogPostMedia[]>(initialMediaItems);
  const [showMediaLibrary, setShowMediaLibrary] = useState<boolean>(false);

  // 컴포넌트가 마운트된 후에만 에디터를 초기화하기 위한 상태
  useEffect(() => {
    setEditorReady(true);
  }, []);

  // 이미지 사이즈 체크 (10MB 제한)
  const isFileSizeValid = (file: File): boolean => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return file.size <= maxSize;
  };

  // 이미지를 WebP로 변환하는 함수 - 오류 처리 강화
  const convertToWebP = async (file: File): Promise<File> => {
    try {
      // 이미 WebP인 경우 변환 건너뛰기
      if (file.type === 'image/webp') return file;

      // 파일 크기 검사
      if (!isFileSizeValid(file)) {
        throw new Error('이미지 크기가 10MB를 초과합니다.');
      }

      // 이미지를 캔버스에 그려서 WebP로 직접 변환
      const imgElement = new window.Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // 이미지 로드 프로미스
      await new Promise<void>((resolve, reject) => {
        imgElement.onload = () => {
          // 이미지 크기 제한 (너무 큰 이미지 처리 방지)
          const maxDimension = 1920;
          let width = imgElement.width;
          let height = imgElement.height;

          // 이미지 크기 조정
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(imgElement, 0, 0, width, height);
          resolve();
        };
        imgElement.onerror = () => reject(new Error('이미지 로드 실패'));
        imgElement.src = URL.createObjectURL(file);
      });

      // WebP로 변환 (중간 품질로 설정하여 파일 크기 감소)
      const webpBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('WebP 변환 실패'));
          },
          'image/webp',
          0.8
        );
      });

      // 새 파일 생성
      const fileName = file.name.split('.')[0] + '.webp';
      return new File([webpBlob], fileName, { type: 'image/webp' });
    } catch (error: any) {
      console.error('이미지 변환 에러:', error);
      throw error;
    }
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = useCallback(async (file: File): Promise<string | null> => {
    setIsUploading(true);
    setUploadError(null);

    try {
      // 이미지 크기 검사
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('이미지 크기가 10MB를 초과합니다.');
      }

      // 이미지 타입 검사
      if (!file.type.startsWith('image/')) {
        throw new Error('이미지 파일만 업로드 가능합니다.');
      }

      // WebP로 변환
      const webpFile = await convertToWebP(file);

      // 고유 파일명 생성
      const fileName = `${uuidv4()}.webp`;
      const filePath = `blog-images/${fileName}`;

      // Supabase Storage에 업로드
      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, webpFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/webp',
        });

      if (uploadError) {
        throw uploadError;
      }

      // 공개 URL 가져오기
      const { data } = supabase.storage.from('blog-images').getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      console.error('이미지 업로드 에러:', error);
      setUploadError(error.message || '이미지 업로드 중 오류가 발생했습니다.');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  // 에디터 초기화
  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        ImageExtension,
        Link.configure({
          openOnClick: false,
        }),
        Placeholder.configure({
          placeholder: '내용을 입력하세요...',
        }),
        Underline,
      ],
      content: initialContent,
      onUpdate: ({ editor }) => {
        // 에디터 콘텐츠와 미디어 아이템을 함께 부모 컴포넌트에 전달
        onChange(editor.getHTML(), mediaItems);
      },
      editorProps: {
        attributes: {
          class: 'prose max-w-none focus:outline-none min-h-[300px]',
        },
      },
      // SSR 경고 해결을 위한 설정
      immediatelyRender: false,
    },
    // editorReady가 true일 때만 에디터 초기화
    [editorReady]
  );

  // 미디어 아이템 추가 및 콘텐츠 업데이트 함수
  const addMediaItem = useCallback(
    (item: BlogPostMedia) => {
      // 미디어 아이템 목록 업데이트
      const updatedMediaItems = [...mediaItems, item];
      setMediaItems(updatedMediaItems);

      // 에디터에 추가 (editor가 있는 경우에만 실행)
      if (editor) {
        if (item.type === 'image') {
          // 이미지 삽입
          editor.chain().focus().setImage({ src: item.url }).run();
        } else if (item.type === 'youtube') {
          // 유튜브 삽입 (임베드 방식)
          const videoId = getYoutubeId(item.url);
          if (videoId) {
            // data-media-id 속성을 추가하여 미디어 아이템과 연결
            const iframeHTML = `<div class="youtube-embed" data-media-id="${item.url}">
              <iframe 
                width="100%" 
                height="315" 
                src="https://www.youtube.com/embed/${videoId}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen
              ></iframe>
            </div>`;
            editor.chain().focus().insertContent(iframeHTML).run();
          }
        } else if (item.type === 'url') {
          // URL 삽입 (링크 카드 방식)
          const urlCardHTML = `<div class="url-card" data-media-id="${item.url}">
            <a href="${
              item.url
            }" target="_blank" rel="noopener noreferrer" class="flex items-center p-4 border rounded-lg hover:bg-gray-50">
              ${
                item.thumbnailUrl
                  ? `<div class="flex-shrink-0 mr-4">
                      <img src="${item.thumbnailUrl}" alt="${
                      item.title || '링크 이미지'
                    }" class="w-16 h-16 object-cover rounded" />
                    </div>`
                  : ''
              }
              <div class="flex-grow">
                <h4 class="font-medium">${item.title || item.url}</h4>
                ${
                  item.description ? `<p class="text-sm text-gray-500">${item.description}</p>` : ''
                }
                <span class="text-xs text-blue-500">${new URL(item.url).hostname}</span>
              </div>
            </a>
          </div>`;
          editor.chain().focus().insertContent(urlCardHTML).run();
        }

        // 에디터 콘텐츠와 미디어 아이템 목록을 함께 부모 컴포넌트에 전달
        onChange(editor.getHTML(), updatedMediaItems);
      }
    },
    [mediaItems, onChange] // editor 제거, getYoutubeId 제거 (컴포넌트 외부로 이동됨)
  );

  // 유튜브 비디오 삽입 핸들러
  const handleYoutubeInsert = useCallback(async () => {
    const url = window.prompt('유튜브 URL을 입력하세요:');
    if (!url) return;

    const videoId = getYoutubeId(url);
    if (!videoId) {
      alert('유효한 YouTube URL이 아닙니다.');
      return;
    }

    // 미디어 아이템 추가
    const mediaItem: BlogPostMedia = {
      type: 'youtube',
      url,
      title: '유튜브 비디오',
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/0.jpg`,
    };

    addMediaItem(mediaItem);
  }, [addMediaItem]);

  // URL 삽입 핸들러
  const handleUrlInsert = useCallback(async () => {
    const url = window.prompt('URL을 입력하세요:');
    if (!url) return;

    try {
      // URL 유효성 검사
      const normalizedUrl = url.match(/^https?:\/\//) ? url : `http://${url}`;
      new URL(normalizedUrl); // URL 구문 검사

      // URL 메타데이터 가져오기
      const metadata = await fetchUrlMetadata(normalizedUrl);

      // 미디어 아이템 추가
      addMediaItem({
        ...metadata,
        url: normalizedUrl,
      } as BlogPostMedia);
    } catch (error) {
      alert('유효한 URL 형식이 아닙니다.');
    }
  }, [addMediaItem]);

  // 이미지 파일 선택 핸들러
  const handleImageSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const imageUrl = await handleImageUpload(file);
        if (imageUrl) {
          // 미디어 아이템 추가
          addMediaItem({
            type: 'image',
            url: imageUrl,
            title: file.name.split('.')[0], // 파일 이름에서 확장자 제거
          });
        }
      } catch (error) {
        console.error('이미지 처리 오류:', error);
      } finally {
        // 파일 입력 요소 초기화
        event.target.value = '';
      }
    },
    [handleImageUpload, addMediaItem]
  );

  if (!editorReady) {
    return <div>에디터를 로드 중입니다...</div>;
  }

  if (!editor) {
    return <div>에디터를 초기화 중입니다...</div>;
  }

  return (
    <div className="relative flex flex-col">
      {/* 에디터 스타일링 */}
      <style jsx global>{`
        .ProseMirror h1 {
          font-size: 2em;
          font-weight: bold;
          margin-top: 0.67em;
          margin-bottom: 0.67em;
        }
        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 0.83em;
          margin-bottom: 0.83em;
        }
        .ProseMirror h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 1em;
        }
        .ProseMirror p {
          margin-top: 1em;
          margin-bottom: 1em;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 2em;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 2em;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
        }
        .ProseMirror iframe {
          max-width: 100%;
          margin: 1em 0;
        }
        .ProseMirror .youtube-embed {
          position: relative;
          padding-bottom: 56.25%; /* 16:9 비율 */
          height: 0;
          overflow: hidden;
          margin: 1em 0;
        }
        .ProseMirror .youtube-embed iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        .ProseMirror .url-card {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          margin: 1em 0;
          overflow: hidden;
        }
      `}</style>

      <div className="border border-gray-300 rounded-lg overflow-hidden">
        {/* 편집 툴바 */}
        <div className="flex flex-wrap gap-1 p-2 bg-gray-100 border-b border-gray-300">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
          >
            <span className="font-bold">B</span>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
          >
            <span className="italic">I</span>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
          >
            <span className="underline">U</span>
          </ToolbarButton>

          <div className="h-6 w-px mx-1 bg-gray-300"></div>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
          >
            <span className="font-bold">H2</span>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
          >
            <span className="font-bold">H3</span>
          </ToolbarButton>

          <div className="h-6 w-px mx-1 bg-gray-300"></div>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
          >
            •
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
          >
            1.
          </ToolbarButton>

          <div className="h-6 w-px mx-1 bg-gray-300"></div>

          <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            —
          </ToolbarButton>

          <div className="h-6 w-px mx-1 bg-gray-300"></div>

          {/* 미디어 삽입 버튼 그룹 */}
          <label className="relative cursor-pointer p-2 rounded hover:bg-gray-200 flex items-center">
            <span>이미지</span>
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleImageSelect}
              disabled={isUploading}
            />
          </label>

          <ToolbarButton
            onClick={() => {
              const url = window.prompt('링크 URL을 입력하세요:');
              if (url) {
                // 일반 텍스트 링크
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            isActive={editor.isActive('link')}
          >
            링크
          </ToolbarButton>

          <ToolbarButton onClick={handleUrlInsert}>URL 카드</ToolbarButton>

          <ToolbarButton onClick={handleYoutubeInsert}>유튜브</ToolbarButton>
        </div>

        {/* 업로드 오류 메시지 */}
        {uploadError && (
          <div className="p-2 bg-red-100 text-red-700 text-sm">
            <strong>오류:</strong> {uploadError}
          </div>
        )}

        {/* 미디어 라이브러리 토글 버튼 */}
        <div className="px-2 py-1 bg-gray-50 border-b border-gray-300 flex justify-between items-center">
          <button
            type="button"
            onClick={() => setShowMediaLibrary(!showMediaLibrary)}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {showMediaLibrary ? '미디어 라이브러리 숨기기 ▲' : '미디어 라이브러리 보기 ▼'}
          </button>
          <span className="text-xs text-gray-500">
            포스트에 사용된 미디어: {mediaItems.length}개
          </span>
        </div>

        {/* 미디어 라이브러리 */}
        {showMediaLibrary && (
          <div className="p-2 bg-gray-50 border-b border-gray-300">
            {mediaItems.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-2">
                아직 추가된 미디어가 없습니다. 이미지, URL 카드, 유튜브 비디오를 추가해보세요.
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {mediaItems.map((item, index) => (
                  <div key={index} className="border rounded p-2 bg-white text-xs overflow-hidden">
                    {item.type === 'image' && (
                      <img
                        src={item.url}
                        alt={item.title || '이미지'}
                        className="h-20 w-full object-cover mb-1 rounded"
                      />
                    )}
                    {item.type === 'youtube' && (
                      <div className="h-20 bg-gray-100 flex items-center justify-center mb-1 rounded relative">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt="유튜브 썸네일"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>유튜브</span>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-red-600 rounded-full p-1">
                            <svg
                              className="w-6 h-6 text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                    {item.type === 'url' && (
                      <div className="h-20 bg-gray-100 flex items-center justify-center mb-1 rounded">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt="URL 썸네일"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>URL</span>
                        )}
                      </div>
                    )}
                    <div className="truncate">{item.title || item.url}</div>
                    <div className="flex justify-between mt-1">
                      <span className="bg-gray-200 rounded px-1">{item.type}</span>
                      <button
                        onClick={() => {
                          const updatedItems = [...mediaItems];
                          updatedItems.splice(index, 1);
                          setMediaItems(updatedItems);
                          onChange(editor.getHTML(), updatedItems);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 에디터 콘텐츠 영역 */}
        <EditorContent
          editor={editor}
          className="prose max-w-none p-4 min-h-[300px] focus:outline-none"
        />

        {/* 선택된 텍스트에 대한 버블 메뉴 */}
        {editor && (
          <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 150 }}
            className="bg-white shadow-lg rounded-lg overflow-hidden flex border border-gray-200"
          >
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
            >
              <span className="font-bold">B</span>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
            >
              <span className="italic">I</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const url = window.prompt('링크 URL을 입력하세요:');
                if (url) {
                  editor.chain().focus().setLink({ href: url }).run();
                }
              }}
              className={`p-2 ${editor.isActive('link') ? 'bg-gray-200' : ''}`}
            >
              링크
            </button>
          </BubbleMenu>
        )}
      </div>

      {/* 저장 및 발행 버튼 영역 */}
      {onSave && (
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={() => onSave(false)}
            disabled={isSaving || isUploading}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400"
          >
            {isSaving ? '저장 중...' : '임시 저장'}
          </button>

          <button
            type="button"
            onClick={() => onSave(true)}
            disabled={isSaving || isUploading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-emerald-400"
          >
            {isSaving ? '발행 중...' : '발행하기'}
          </button>
        </div>
      )}

      {/* 이미지 업로드 로딩 인디케이터 */}
      {isUploading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-xl shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mb-3"></div>
            <p className="text-gray-700">이미지 최적화 중...</p>
            <p className="text-xs text-gray-500 mt-1">WebP 포맷으로 변환하는 중입니다</p>
          </div>
        </div>
      )}
    </div>
  );
}
