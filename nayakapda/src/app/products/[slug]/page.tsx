import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SizeQuantityMatrix } from '@/components/products/SizeQuantityMatrix';
import { ProductGallery } from '@/components/products/ProductGallery';
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

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { slug, active: true },
      include: {
        category: { select: { id: true, name: true, slug: true, qtyMultiple: true } },
        variants: { where: { active: true }, orderBy: [{ size: 'asc' }, { color: 'asc' }] },
        photos: { orderBy: { sortOrder: 'asc' } },
        pricingTiers: { orderBy: { minQty: 'asc' } },
        sizeChart: true,
      },
    }),
    prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        products: {
          where: { active: true },
          select: { slug: true }
        }
      }
    }),
  ]);

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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-grow">
        <div className="page-container content-wrapper">
          {/* Category Tab Pills */}
          <div className="mb-6 flex overflow-x-auto whitespace-nowrap gap-2 pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
            <a
              href="/products"
              className="px-4 py-2 rounded-full text-xs font-bold transition-all border inline-block bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:text-orange-600"
            >
              All
            </a>
            {categories.map((cat) => {
              const productSlug = cat.products[0]?.slug;
              const href = productSlug ? `/products/${productSlug}` : `/products?category=${cat.slug}`;
              const isActive = product.category.slug === cat.slug;
              return (
                <a
                  key={cat.id}
                  href={href}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all border inline-block ${
                    isActive
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:text-orange-600'
                  }`}
                >
                  {cat.name}
                </a>
              );
            })}
          </div>

          {/* Breadcrumb */}
          <nav className="text-xs text-slate-500 mb-6 flex items-center gap-2 font-medium flex-wrap">
            <a href="/" className="hover:text-orange-600">Home</a>
            <span>/</span>
            <a href="/products" className="hover:text-orange-600">Products</a>
            <span>/</span>
            <span className="text-slate-800 font-bold">{product.category.name}</span>
            <span>/</span>
            <span className="text-orange-600 font-bold">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
            {/* Gallery */}
            <ProductGallery
              photos={product.photos}
              productName={product.name}
              categoryName={product.category.name}
              gsm={product.gsm}
            />

            {/* Product Overview & Slab Pricing */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge-orange text-xs font-bold">{product.category.name}</span>
                  {product.gsm && <span className="badge-gray text-xs font-bold">{product.gsm} GSM</span>}
                </div>
                <h1 className="text-3xl font-black text-slate-900 leading-tight mb-2">{product.name}</h1>
                {product.fabricComposition && (
                  <p className="text-xs font-semibold text-slate-500">{product.fabricComposition}</p>
                )}
                {product.description && (
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed font-medium">{product.description}</p>
                )}
              </div>

              {/* Volume Pricing Slab Table */}
              <div className="card p-5 bg-white border-slate-200 shadow-sm space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Volume Pricing</div>
                <div className="space-y-2">
                  {tiers.map((tier) => (
                    <div key={tier.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <span className="font-semibold text-slate-700">
                        {tier.minQty}–{tier.maxQty ?? '∞'} pieces
                      </span>
                      <span className="font-black text-orange-600 text-sm">
                        {formatINR(tier.pricePerPiece)}/pc
                      </span>
                    </div>
                  ))}
                  {tiers.length === 0 && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <span className="font-semibold text-slate-700">Base Price</span>
                      <span className="font-black text-orange-600 text-sm">{formatINR(basePrice)}/pc</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="card p-3.5 bg-white border-slate-200 text-center">
                  <span className="text-slate-400 font-medium block text-[10px]">Min. Order</span>
                  <span className="font-bold text-orange-600 text-sm">{product.category.qtyMultiple} pcs</span>
                </div>
                <div className="card p-3.5 bg-white border-slate-200 text-center">
                  <span className="text-slate-400 font-medium block text-[10px]">Available Sizes</span>
                  <span className="font-bold text-slate-800 text-sm">{sizes.length} sizes</span>
                </div>
                <div className="card p-3.5 bg-white border-slate-200 text-center">
                  <span className="text-slate-400 font-medium block text-[10px]">Available Colors</span>
                  <span className="font-bold text-slate-800 text-sm">{colors.length} colors</span>
                </div>
                <div className="card p-3.5 bg-white border-slate-200 text-center">
                  <span className="text-slate-400 font-medium block text-[10px]">Delivery</span>
                  <span className="font-bold text-emerald-600 text-sm">5–7 days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Size Chart (if available) */}
          {product.sizeChart && (
            <div className="card p-6 bg-white border-slate-200 shadow-sm mb-12 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Size Chart Specs</h3>
              <div className="table-container border-slate-200 shadow-none">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Size</th>
                      <th>Chest (Inches)</th>
                      <th>Length (Inches)</th>
                      <th>Sleeve (Inches)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(product.sizeChart.measurements as Record<string, { chest: number; length: number; sleeve: number }>).map(
                      ([sz, m]) => (
                        <tr key={sz}>
                          <td className="font-bold text-slate-900">{sz}</td>
                          <td>{m.chest}″</td>
                          <td>{m.length}″</td>
                          <td>{m.sleeve}″</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Size x Quantity Matrix Form */}
          <div id="order-matrix">
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
              productSlug={product.slug}
              productPhotoUrl={product.photos[0]?.url ?? null}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
