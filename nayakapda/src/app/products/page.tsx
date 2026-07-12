import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/products/ProductCard';
import { formatINR } from '@/lib/utils';

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
    prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <div className="page-container py-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {activeCategory ? activeCategory.name : 'All Products'}
            </h1>
            <p className="text-gray-500">{total} product{total !== 1 ? 's' : ''} found</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="w-full lg:w-56 flex-shrink-0">
              <div className="card p-4 sticky top-24">
                <h3 className="font-semibold mb-4 text-sm text-gray-400 uppercase tracking-wider">Category</h3>
                <nav className="space-y-1">
                  <a
                    href="/products"
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${!category ? 'bg-orange-500/10 text-orange-400 font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                  >
                    All Products
                  </a>
                  {categories.map((cat) => (
                    <a
                      key={cat.id}
                      href={`/products?category=${cat.slug}`}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${category === cat.slug ? 'bg-orange-500/10 text-orange-400 font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                    >
                      {cat.name}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              {products.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <div className="text-5xl mb-4">📦</div>
                  <p className="text-lg font-medium">No products found</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        id={product.id}
                        name={product.name}
                        slug={product.slug}
                        gsm={product.gsm}
                        fabricComposition={product.fabricComposition}
                        basePrice={Number(product.basePrice)}
                        priceFrom={product.pricingTiers[0] ? Number(product.pricingTiers[0].pricePerPiece) : Number(product.basePrice)}
                        category={product.category}
                        photo={product.photos[0] ?? null}
                        variantCount={product._count.variants}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-10">
                      {page > 1 && (
                        <a href={`/products?${category ? `category=${category}&` : ''}page=${page - 1}`} className="btn-secondary py-2 px-4 text-sm">← Prev</a>
                      )}
                      <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                      {page < totalPages && (
                        <a href={`/products?${category ? `category=${category}&` : ''}page=${page + 1}`} className="btn-secondary py-2 px-4 text-sm">Next →</a>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
