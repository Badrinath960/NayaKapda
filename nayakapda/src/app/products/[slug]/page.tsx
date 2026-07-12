import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SizeQuantityMatrix } from '@/components/products/SizeQuantityMatrix';
import { formatINR } from '@/lib/utils';
import type { Metadata } from 'next';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug }, select: { name: true, description: true } });
  if (!product) return { title: 'Product Not Found' };
  return { title: product.name, description: product.description ?? undefined };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug, active: true },
    include: {
      category: { select: { id: true, name: true, slug: true, qtyMultiple: true } },
      variants: { where: { active: true }, orderBy: [{ size: 'asc' }, { color: 'asc' }] },
      photos: { orderBy: { sortOrder: 'asc' } },
      pricingTiers: { orderBy: { minQty: 'asc' } },
      sizeChart: true,
    },
  });

  if (!product) notFound();

  const colors = [...new Set(product.variants.map((v) => v.color))];
  const sizes = [...new Set(product.variants.map((v) => v.size))];

  const tiers = product.pricingTiers.map((t) => ({
    id: t.id,
    minQty: t.minQty,
    maxQty: t.maxQty,
    pricePerPiece: Number(t.pricePerPiece),
  }));

  const variants = product.variants.map((v) => ({
    id: v.id,
    size: v.size,
    color: v.color,
    sku: v.sku,
    stockQty: v.stockQty,
  }));

  const basePrice = Number(product.basePrice);

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <div className="page-container py-10">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
            <a href="/" className="hover:text-white">Home</a>
            <span>/</span>
            <a href="/products" className="hover:text-white">Products</a>
            <span>/</span>
            <a href={`/products?category=${product.category.slug}`} className="hover:text-white">{product.category.name}</a>
            <span>/</span>
            <span className="text-gray-300">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
            {/* Photo Gallery */}
            <div className="space-y-3">
              <div className="aspect-square rounded-2xl overflow-hidden bg-gray-900 border border-gray-800">
                {product.photos[0] ? (
                  <img src={product.photos[0].url} alt={product.photos[0].altText ?? product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                    <span className="text-7xl">
                      {product.category.slug === 'tshirts' ? '👕' : product.category.slug === 'hoodies' ? '🧥' : '👔'}
                    </span>
                    <p className="mt-4 text-sm">{product.name}</p>
                  </div>
                )}
              </div>
              {product.photos.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.photos.slice(1, 5).map((photo) => (
                    <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-gray-900 border border-gray-800">
                      <img src={photo.url} alt={photo.altText ?? ''} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge-orange">{product.category.name}</span>
                  {product.gsm && <span className="badge-gray">{product.gsm} GSM</span>}
                </div>
                <h1 className="text-3xl font-bold">{product.name}</h1>
                {product.fabricComposition && (
                  <p className="text-gray-400 mt-1">{product.fabricComposition}</p>
                )}
                {product.description && (
                  <p className="text-gray-500 text-sm mt-3 leading-relaxed">{product.description}</p>
                )}
              </div>

              {/* Pricing Tiers */}
              <div className="card p-5 space-y-3">
                <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wider">Volume Pricing</h3>
                {tiers.length === 0 ? (
                  <div className="tier-row">
                    <span>Base Price</span>
                    <span className="font-bold gradient-text">{formatINR(basePrice)}/pc</span>
                  </div>
                ) : (
                  tiers.map((tier, i) => (
                    <div key={tier.id} className="tier-row">
                      <span className="text-gray-400">
                        {tier.minQty}–{tier.maxQty ?? '∞'} pieces
                      </span>
                      <span className="font-bold gradient-text">{formatINR(tier.pricePerPiece)}/pc</span>
                    </div>
                  ))
                )}
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="glass rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Min. Order</p>
                  <p className="font-bold text-orange-400">{product.category.qtyMultiple} pcs</p>
                </div>
                <div className="glass rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Available Sizes</p>
                  <p className="font-bold">{sizes.length} sizes</p>
                </div>
                <div className="glass rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Available Colors</p>
                  <p className="font-bold">{colors.length} colors</p>
                </div>
                <div className="glass rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Delivery</p>
                  <p className="font-bold text-green-400">5–7 days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Size × Quantity Matrix */}
          <SizeQuantityMatrix
            productId={product.id}
            productName={product.name}
            variants={variants}
            sizes={sizes}
            colors={colors}
            tiers={tiers}
            basePrice={basePrice}
            qtyMultiple={product.category.qtyMultiple}
            categoryId={product.category.id}
          />

          {/* Size Chart */}
          {product.sizeChart && (
            <div className="mt-10 card p-6">
              <h3 className="font-bold text-lg mb-4">Size Chart</h3>
              <img src={product.sizeChart.imageUrl ?? ''} alt="Size Chart" className="max-w-full rounded-xl" />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
