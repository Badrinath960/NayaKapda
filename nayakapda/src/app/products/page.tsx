import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/products/ProductCard';

type Props = { searchParams: Promise<{ category?: string; page?: string }> };

export default async function ProductsPage({ searchParams }: Props) {
  const { category, page: pageStr } = await searchParams;
  const page = parseInt(pageStr ?? '1');
  const limit = 12;
  const skip = (page - 1) * limit;

  const where: any = { active: true };
  if (category) where.category = { slug: category };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true, slug: true, qtyMultiple: true } },
        photos: { orderBy: { sortOrder: 'asc' }, take: 1 },
        pricingTiers: { orderBy: { minQty: 'asc' }, take: 1 },
        _count: { select: { variants: { where: { active: true } } } },
      },
    }),
    prisma.product.count({ where }),
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

  const totalPages = Math.ceil(total / limit);
  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-grow">
        <div className="page-container content-wrapper">
          {/* Category Tab Pills */}
          <div className="mb-6 flex overflow-x-auto whitespace-nowrap gap-2 pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
            <a
              href="/products"
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border inline-block ${
                !category
                  ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:text-orange-600'
              }`}
            >
              All
            </a>
            {categories.map((cat) => {
              const productSlug = cat.products[0]?.slug;
              const href = productSlug ? `/products/${productSlug}` : `/products?category=${cat.slug}`;
              return (
                <a
                  key={cat.id}
                  href={href}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all border inline-block ${
                    category === cat.slug
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:text-orange-600'
                  }`}
                >
                  {cat.name}
                </a>
              );
            })}
          </div>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-black text-slate-900 mb-1">
              {activeCategory ? activeCategory.name : 'All Products'}
            </h1>
            <p className="text-slate-500 text-sm font-medium">{total} product{total !== 1 ? 's' : ''} available for bulk ordering</p>
          </div>

          {/* Products Catalog Grid */}
          <div>
            {products.length === 0 ? (
              <div className="text-center py-20 card bg-white border-slate-200 p-8 max-w-md mx-auto">
                <div className="text-5xl mb-4">📦</div>
                <p className="text-lg font-bold text-slate-800">No products found</p>
                <p className="text-slate-500 text-xs mt-1">Try selecting another category.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {products.map((product) => {
                    const priceFrom = product.pricingTiers[0]
                      ? Number(product.pricingTiers[0].pricePerPiece)
                      : Number(product.basePrice);

                    return (
                      <ProductCard
                        key={product.id}
                        id={product.id}
                        name={product.name}
                        slug={product.slug}
                        gsm={product.gsm}
                        fabricComposition={product.fabricComposition}
                        basePrice={Number(product.basePrice)}
                        priceFrom={priceFrom}
                        category={product.category}
                        photo={product.photos[0] ?? null}
                        variantCount={product._count.variants}
                      />
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-3">
                    {page > 1 ? (
                      <a
                        href={`/products?${new URLSearchParams({ ...(category ? { category } : {}), page: String(page - 1) })}`}
                        className="btn-secondary py-2 px-4 text-xs font-bold"
                      >
                        ← Previous
                      </a>
                    ) : (
                      <span className="btn-secondary py-2 px-4 text-xs font-bold opacity-40 cursor-not-allowed">← Previous</span>
                    )}

                    <span className="text-xs text-slate-500 font-semibold px-2">
                      Page {page} of {totalPages}
                    </span>

                    {page < totalPages ? (
                      <a
                        href={`/products?${new URLSearchParams({ ...(category ? { category } : {}), page: String(page + 1) })}`}
                        className="btn-secondary py-2 px-4 text-xs font-bold"
                      >
                        Next →
                      </a>
                    ) : (
                      <span className="btn-secondary py-2 px-4 text-xs font-bold opacity-40 cursor-not-allowed">Next →</span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
