import { Metadata } from 'next';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export const metadata: Metadata = {
  title: 'ValueTargeter 블로그',
  description: '가치투자에 관한 유용한 정보와 투자 팁을 제공합니다',
};

export const revalidate = 3600; // 1시간마다 재검증

export default async function BlogPage() {
  // 발행된 게시물만 가져오기
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">ValueTargeter 블로그</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          가치투자에 관한 인사이트와 투자 팁을 공유합니다
        </p>
      </div>

      {!posts || posts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">아직 발행된 글이 없습니다</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {posts.map((post) => (
            <Link
              href={`/blog/${post.slug}`}
              key={post.id}
              className="block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <h2 className="text-xl md:text-2xl font-bold mb-3 hover:text-emerald-600 transition-colors duration-300">
                  {post.title}
                </h2>

                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <span>
                    {new Date(post.published_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                {/* 콘텐츠 미리보기 - 간단한 처리 */}
                <div className="text-gray-600 line-clamp-3">
                  {post.content
                    .replace(/<[^>]*>/g, ' ') // HTML 태그 제거
                    .substring(0, 200)}
                  {post.content.length > 200 && '...'}
                </div>

                <div className="mt-4">
                  <span className="inline-flex items-center text-emerald-600 font-medium text-sm">
                    더 읽기
                    <svg
                      className="ml-1 w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
