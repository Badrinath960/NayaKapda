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
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?\/]+)/);
    if (ytMatch) return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
    return url;
  };

  const isYouTube = (url: string) => /youtu/.test(url);
  const isDirectVideo = (url: string) => /\.(mp4|webm|ogg)(\?|$)/i.test(url);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-grow">
        {/* Hero */}
        <div className="bg-white border-b border-slate-200 py-12 text-center">
          <div className="page-container">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">
              🎬 Product Videos
            </h1>
            <p className="text-slate-600 text-sm font-medium">
              See our fabrics in action — quality demonstrations, unboxings, and print results
            </p>
          </div>
        </div>

        <div className="page-container py-10">
          {videos.length === 0 ? (
            <div className="card p-12 text-center bg-white border-slate-200 shadow-sm max-w-md mx-auto space-y-4">
              <div className="text-5xl">🎬</div>
              <h2 className="text-lg font-bold text-slate-900">No Videos Yet</h2>
              <p className="text-slate-500 text-xs font-medium">
                Product videos will appear here once added. Check back soon!
              </p>
              <Link href="/products" className="btn-primary py-2.5 px-6 text-xs font-bold shadow-md">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => {
                const embedUrl = getEmbedUrl(video.url);
                const isYT = isYouTube(video.url);
                const isDirect = isDirectVideo(video.url);

                return (
                  <div
                    key={video.id}
                    className="card overflow-hidden bg-white border-slate-200 shadow-sm flex flex-col"
                  >
                    {/* Video embed */}
                    <div className="relative aspect-video bg-black">
                      {isYT ? (
                        <iframe
                          src={embedUrl}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full border-none"
                          title={video.title ?? video.product.name}
                        />
                      ) : isDirect ? (
                        <video
                          src={video.url}
                          controls
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/10 hover:bg-slate-900/20 transition-colors text-decoration-none"
                        >
                          <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
                            <svg className="w-7 h-7 fill-white ml-0.5" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                          <p className="text-slate-700 text-xs font-bold mt-2">
                            Click to watch
                          </p>
                        </a>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col flex-1 justify-between gap-2">
                      <p className="font-bold text-slate-900 text-sm leading-tight">
                        {video.title ?? `${video.product.name} — Demo`}
                      </p>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <Link
                          href={`/products/${video.product.slug}`}
                          className="text-orange-600 hover:underline text-xs font-bold"
                        >
                          {video.product.name} →
                        </Link>
                        <span className="text-slate-400 text-[10px] font-medium">
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
    </div>
  );
}
