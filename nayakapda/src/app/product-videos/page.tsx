import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export const metadata = {
  title: 'Product Videos — NayaKapda',
  description: 'Watch product videos and fabric demonstrations for NayaKapda bulk apparel.',
};

export default async function ProductVideosPage() {
  const videos = await prisma.productVideo.findMany({
    include: {
      product: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const getEmbedUrl = (url: string) => {
    // Handle YouTube URLs
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?\/]+)/);
    if (ytMatch) return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
    // Return as-is for direct video URLs
    return url;
  };

  const isYouTube = (url: string) => /youtu/.test(url);
  const isDirectVideo = (url: string) => /\.(mp4|webm|ogg)(\?|$)/i.test(url);

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
        {/* Hero */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(249,115,22,0.08) 0%, transparent 60%)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            padding: '4rem 0 3rem',
          }}
        >
          <div className="page-container" style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, color: '#f9fafb', margin: '0 0 0.75rem' }}>
              🎬 Product Videos
            </h1>
            <p style={{ color: '#9ca3af', margin: 0 }}>
              See our fabrics in action — quality demonstrations, unboxings, and print results
            </p>
          </div>
        </div>

        <div className="page-container" style={{ paddingTop: '3rem' }}>
          {videos.length === 0 ? (
            <div className="glass" style={{ padding: '4rem', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎬</div>
              <h2 style={{ color: '#f9fafb', fontWeight: 700, marginBottom: '0.5rem' }}>No Videos Yet</h2>
              <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
                Product videos will appear here once added. Check back soon!
              </p>
              <Link href="/products" className="btn-primary">
                Browse Products
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {videos.map((video) => {
                const embedUrl = getEmbedUrl(video.url);
                const isYT = isYouTube(video.url);
                const isDirect = isDirectVideo(video.url);

                return (
                  <div
                    key={video.id}
                    className="card"
                    style={{ overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  >
                    {/* Video embed */}
                    <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000' }}>
                      {isYT ? (
                        <iframe
                          src={embedUrl}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            border: 'none',
                          }}
                          title={video.title ?? video.product.name}
                        />
                      ) : isDirect ? (
                        <video
                          src={video.url}
                          controls
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(249,115,22,0.08)',
                            textDecoration: 'none',
                          }}
                        >
                          <div
                            style={{
                              width: 64,
                              height: 64,
                              borderRadius: '50%',
                              background: '#f97316',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <svg width={28} height={28} fill="white" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                          <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.75rem' }}>
                            Click to watch
                          </p>
                        </a>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: '1rem' }}>
                      <p style={{ fontWeight: 600, color: '#f9fafb', margin: '0 0 0.25rem', fontSize: '0.9rem' }}>
                        {video.title ?? `${video.product.name} — Demo`}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <Link
                          href={`/products/${video.product.slug}`}
                          style={{ color: '#f97316', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 500 }}
                        >
                          {video.product.name} →
                        </Link>
                        <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                          {formatDate(video.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
