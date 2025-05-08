'use client';

export default function BlogContent({ content }: { content: string }) {
  return (
    <>
      {/* 스타일 적용을 위한 CSS */}
      <style jsx global>{`
        .blog-content h1 {
          font-size: 2em;
          font-weight: bold;
          margin-top: 1.5em;
          margin-bottom: 0.67em;
        }
        .blog-content h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 1.2em;
          margin-bottom: 0.83em;
        }
        .blog-content h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 1em;
        }
        .blog-content p {
          margin-top: 1em;
          margin-bottom: 1em;
          line-height: 1.7;
        }
        .blog-content img {
          max-width: 100%;
          height: auto;
          margin: 1.5em 0;
          border-radius: 0.5rem;
        }
        .blog-content ul,
        .blog-content ol {
          padding-left: 2em;
          margin: 1em 0;
        }
        .blog-content ul {
          list-style-type: disc;
        }
        .blog-content ol {
          list-style-type: decimal;
        }
        .blog-content a {
          color: #059669;
          text-decoration: underline;
        }
        .blog-content a:hover {
          color: #047857;
        }
        .blog-content blockquote {
          margin: 1.5em 0;
          padding: 1em 1.5em;
          border-left: 4px solid #10b981;
          background-color: #f0fdf4;
          font-style: italic;
        }
        .blog-content iframe {
          width: 100%;
          margin: 1.5em 0;
          border-radius: 0.5rem;
        }
        .blog-content .youtube-embed {
          position: relative;
          padding-bottom: 56.25%; /* 16:9 비율 */
          height: 0;
          overflow: hidden;
          margin: 1.5em 0;
        }
        .blog-content .youtube-embed iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 0.5rem;
        }
      `}</style>

      {/* 블로그 내용 */}
      <div
        className="blog-content prose max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </>
  );
}
