import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Set DATABASE_URL before creating anything
process.env.DATABASE_URL = 'postgresql://postgres:badri@123@localhost:5432/nayakapda_tshirt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🌱 Starting seed...');

  // ─────────────────────────────────────────
  // CATEGORIES
  // ─────────────────────────────────────────

  const tshirts = await prisma.category.upsert({
    where: { slug: 'tshirts' },
    update: {},
    create: {
      name: 'T-Shirts',
      slug: 'tshirts',
      description: 'Plain round-neck and polo T-shirts for printing',
      qtyMultiple: 10,
      sortOrder: 1,
    },
  });

  const hoodies = await prisma.category.upsert({
    where: { slug: 'hoodies' },
    update: {},
    create: {
      name: 'Hoodies',
      slug: 'hoodies',
      description: 'Heavy-weight hoodies and sweatshirts',
      qtyMultiple: 6,
      sortOrder: 2,
    },
  });

  const polo = await prisma.category.upsert({
    where: { slug: 'polo-shirts' },
    update: {},
    create: {
      name: 'Polo Shirts',
      slug: 'polo-shirts',
      description: 'Classic polo collar shirts for bulk printing',
      qtyMultiple: 12,
      sortOrder: 3,
    },
  });

  console.log('✅ Categories created');

  // ─────────────────────────────────────────
  // PRODUCTS
  // ─────────────────────────────────────────

  // Product 1: Classic Round-Neck T-Shirt
  const product1 = await prisma.product.upsert({
    where: { slug: 'classic-round-neck-tshirt' },
    update: {},
    create: {
      categoryId: tshirts.id,
      name: 'Classic Round-Neck T-Shirt',
      slug: 'classic-round-neck-tshirt',
      description:
        'Premium 180 GSM round-neck T-shirt made from 100% combed cotton. Ideal for screen printing, DTF, and sublimation. Pre-shrunk and double-stitched for durability.',
      gsm: 180,
      fabricComposition: '100% Combed Cotton',
      basePrice: 120,
      active: true,
    },
  });

  // Pricing tiers for Product 1
  await prisma.pricingTier.deleteMany({ where: { productId: product1.id } });
  await prisma.pricingTier.createMany({
    data: [
      { productId: product1.id, minQty: 10, maxQty: 49, pricePerPiece: 120 },
      { productId: product1.id, minQty: 50, maxQty: 99, pricePerPiece: 110 },
      { productId: product1.id, minQty: 100, maxQty: 299, pricePerPiece: 100 },
      { productId: product1.id, minQty: 300, maxQty: 499, pricePerPiece: 90 },
      { productId: product1.id, minQty: 500, maxQty: null, pricePerPiece: 80 },
    ],
  });

  // Variants for Product 1
  const sizes1 = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const colors1 = ['White', 'Black', 'Navy Blue', 'Red'];

  for (const size of sizes1) {
    for (const color of colors1) {
      const sku = `CRNT-${size}-${color.replace(/\s/g, '').toUpperCase()}`;
      await prisma.productVariant.upsert({
        where: { sku },
        update: {},
        create: {
          productId: product1.id,
          size,
          color,
          sku,
          stockQty: Math.floor(Math.random() * 200) + 50,
          active: true,
        },
      });
    }
  }

  // Product 2: Heavy-Weight Hoodie
  const product2 = await prisma.product.upsert({
    where: { slug: 'heavy-weight-hoodie' },
    update: {},
    create: {
      categoryId: hoodies.id,
      name: 'Heavy-Weight Hoodie',
      slug: 'heavy-weight-hoodie',
      description:
        '320 GSM heavy-weight hoodie with kangaroo pocket and ribbed cuffs. Perfect for winter collections and DTG printing.',
      gsm: 320,
      fabricComposition: '80% Cotton, 20% Polyester',
      basePrice: 380,
      active: true,
    },
  });

  await prisma.pricingTier.deleteMany({ where: { productId: product2.id } });
  await prisma.pricingTier.createMany({
    data: [
      { productId: product2.id, minQty: 6, maxQty: 23, pricePerPiece: 380 },
      { productId: product2.id, minQty: 24, maxQty: 59, pricePerPiece: 350 },
      { productId: product2.id, minQty: 60, maxQty: 119, pricePerPiece: 320 },
      { productId: product2.id, minQty: 120, maxQty: null, pricePerPiece: 290 },
    ],
  });

  const sizes2 = ['S', 'M', 'L', 'XL', 'XXL'];
  const colors2 = ['Black', 'Grey Melange', 'Navy Blue'];

  for (const size of sizes2) {
    for (const color of colors2) {
      const sku = `HWH-${size}-${color.replace(/\s/g, '').toUpperCase()}`;
      await prisma.productVariant.upsert({
        where: { sku },
        update: {},
        create: {
          productId: product2.id,
          size,
          color,
          sku,
          stockQty: Math.floor(Math.random() * 100) + 20,
          active: true,
        },
      });
    }
  }

  // Product 3: Classic Polo Shirt
  const product3 = await prisma.product.upsert({
    where: { slug: 'classic-polo-shirt' },
    update: {},
    create: {
      categoryId: polo.id,
      name: 'Classic Polo Shirt',
      slug: 'classic-polo-shirt',
      description:
        '220 GSM pique polo shirt with 3-button placket and ribbed collar. Corporate-ready and ideal for embroidery.',
      gsm: 220,
      fabricComposition: '100% Cotton Pique',
      basePrice: 180,
      active: true,
    },
  });

  await prisma.pricingTier.deleteMany({ where: { productId: product3.id } });
  await prisma.pricingTier.createMany({
    data: [
      { productId: product3.id, minQty: 12, maxQty: 47, pricePerPiece: 180 },
      { productId: product3.id, minQty: 48, maxQty: 119, pricePerPiece: 165 },
      { productId: product3.id, minQty: 120, maxQty: 299, pricePerPiece: 150 },
      { productId: product3.id, minQty: 300, maxQty: null, pricePerPiece: 135 },
    ],
  });

  const sizes3 = ['S', 'M', 'L', 'XL', 'XXL'];
  const colors3 = ['White', 'Black', 'Navy Blue', 'Royal Blue'];

  for (const size of sizes3) {
    for (const color of colors3) {
      const sku = `CPL-${size}-${color.replace(/\s/g, '').toUpperCase()}`;
      await prisma.productVariant.upsert({
        where: { sku },
        update: {},
        create: {
          productId: product3.id,
          size,
          color,
          sku,
          stockQty: Math.floor(Math.random() * 150) + 30,
          active: true,
        },
      });
    }
  }

  // Product 4: Slim-Fit V-Neck T-Shirt
  const product4 = await prisma.product.upsert({
    where: { slug: 'slim-fit-vneck-tshirt' },
    update: {},
    create: {
      categoryId: tshirts.id,
      name: 'Slim-Fit V-Neck T-Shirt',
      slug: 'slim-fit-vneck-tshirt',
      description:
        '160 GSM slim-fit V-neck T-shirt. Lightweight and breathable, ideal for summer collections.',
      gsm: 160,
      fabricComposition: '100% Ringspun Cotton',
      basePrice: 110,
      active: true,
    },
  });

  await prisma.pricingTier.deleteMany({ where: { productId: product4.id } });
  await prisma.pricingTier.createMany({
    data: [
      { productId: product4.id, minQty: 10, maxQty: 49, pricePerPiece: 110 },
      { productId: product4.id, minQty: 50, maxQty: 99, pricePerPiece: 100 },
      { productId: product4.id, minQty: 100, maxQty: null, pricePerPiece: 88 },
    ],
  });

  const sizes4 = ['S', 'M', 'L', 'XL'];
  const colors4 = ['White', 'Black', 'Maroon', 'Teal'];
  for (const size of sizes4) {
    for (const color of colors4) {
      const sku = `SFVN-${size}-${color.replace(/\s/g, '').toUpperCase()}`;
      await prisma.productVariant.upsert({
        where: { sku },
        update: {},
        create: {
          productId: product4.id,
          size,
          color,
          sku,
          stockQty: Math.floor(Math.random() * 120) + 20,
          active: true,
        },
      });
    }
  }

  // Product 5: Zip-Up Sweatshirt
  const product5 = await prisma.product.upsert({
    where: { slug: 'zip-up-sweatshirt' },
    update: {},
    create: {
      categoryId: hoodies.id,
      name: 'Zip-Up Sweatshirt',
      slug: 'zip-up-sweatshirt',
      description:
        '280 GSM zip-up sweatshirt with full-length metal zipper and side pockets. Great for custom printing.',
      gsm: 280,
      fabricComposition: '60% Cotton, 40% Polyester',
      basePrice: 320,
      active: true,
    },
  });

  await prisma.pricingTier.deleteMany({ where: { productId: product5.id } });
  await prisma.pricingTier.createMany({
    data: [
      { productId: product5.id, minQty: 6, maxQty: 23, pricePerPiece: 320 },
      { productId: product5.id, minQty: 24, maxQty: 59, pricePerPiece: 295 },
      { productId: product5.id, minQty: 60, maxQty: null, pricePerPiece: 270 },
    ],
  });

  const sizes5 = ['S', 'M', 'L', 'XL', 'XXL'];
  const colors5 = ['Black', 'Charcoal Grey', 'Olive Green'];
  for (const size of sizes5) {
    for (const color of colors5) {
      const sku = `ZUS-${size}-${color.replace(/\s/g, '').toUpperCase()}`;
      await prisma.productVariant.upsert({
        where: { sku },
        update: {},
        create: {
          productId: product5.id,
          size,
          color,
          sku,
          stockQty: Math.floor(Math.random() * 80) + 10,
          active: true,
        },
      });
    }
  }

  console.log('✅ Products and variants created');

  // ─────────────────────────────────────────
  // USERS
  // ─────────────────────────────────────────

  const superAdminPasswordHash = await bcrypt.hash('Admin@123', 12);
  const staffPasswordHash = await bcrypt.hash('Staff@123', 12);
  const customerPasswordHash = await bcrypt.hash('Customer@123', 12);

  const superAdmin = await prisma.user.upsert({
    where: { phone: '9999999901' },
    update: {},
    create: {
      phone: '9999999901',
      email: 'admin@nayakapda.com',
      passwordHash: superAdminPasswordHash,
      name: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { phone: '9999999902' },
    update: {},
    create: {
      phone: '9999999902',
      email: 'staff@nayakapda.com',
      passwordHash: staffPasswordHash,
      name: 'Staff Member',
      role: UserRole.STAFF,
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { phone: '9876543210' },
    update: {},
    create: {
      phone: '9876543210',
      email: 'customer@example.com',
      passwordHash: customerPasswordHash,
      name: 'Ravi Printers',
      role: UserRole.CUSTOMER,
    },
  });

  console.log('✅ Users created');
  console.log('   Super Admin - Phone: 9999999901, Password: Admin@123');
  console.log('   Staff       - Phone: 9999999902, Password: Staff@123');
  console.log('   Customer    - Phone: 9876543210, Password: Customer@123');

  // ─────────────────────────────────────────
  // CREDIT LINE FOR CUSTOMER
  // ─────────────────────────────────────────

  await prisma.creditLine.upsert({
    where: { userId: customerUser.id },
    update: {},
    create: {
      userId: customerUser.id,
      limitAmount: 50000,
      usedAmount: 0,
    },
  });

  console.log('✅ Credit line created for customer (₹50,000 limit)');

  // ─────────────────────────────────────────
  // SHIPPING METHODS
  // ─────────────────────────────────────────

  await prisma.shippingMethod.upsert({
    where: { id: 'seed-shipping-1' },
    update: {},
    create: {
      id: 'seed-shipping-1',
      name: 'Standard Delivery',
      description: 'Delivered by surface courier',
      etaText: '5-7 business days',
      cost: 0,
      regionLimited: false,
      regionPincodes: [],
      active: true,
      sortOrder: 1,
    },
  });

  await prisma.shippingMethod.upsert({
    where: { id: 'seed-shipping-2' },
    update: {},
    create: {
      id: 'seed-shipping-2',
      name: 'Express Delivery',
      description: 'Air cargo, priority processing',
      etaText: '2-3 business days',
      cost: 250,
      regionLimited: false,
      regionPincodes: [],
      active: true,
      sortOrder: 2,
    },
  });

  await prisma.shippingMethod.upsert({
    where: { id: 'seed-shipping-3' },
    update: {},
    create: {
      id: 'seed-shipping-3',
      name: 'Same Day Delivery (Mumbai)',
      description: 'Mumbai city only — same day delivery',
      etaText: 'Same day (order before 12 PM)',
      cost: 150,
      regionLimited: true,
      regionPincodes: ['400001', '400002', '400003', '400004', '400005', '400006', '400007', '400008', '400009', '400010'],
      active: true,
      sortOrder: 3,
    },
  });

  console.log('✅ Shipping methods created');

  // ─────────────────────────────────────────
  // FAQ ENTRIES
  // ─────────────────────────────────────────

  const faqs = [
    {
      question: 'What is the minimum order quantity?',
      answer:
        'Minimum order quantity depends on the product category: T-Shirts require multiples of 10, Hoodies multiples of 6, and Polo Shirts multiples of 12. You can mix sizes and colors within a single order.',
      sortOrder: 1,
    },
    {
      question: 'Do you offer volume discounts?',
      answer:
        'Yes! We offer tiered pricing — the more you order, the lower the per-piece price. Check the Pricing page for full details on our tier structure.',
      sortOrder: 2,
    },
    {
      question: 'What printing techniques are supported?',
      answer:
        'Our T-shirts support screen printing, DTF (Direct to Film), DTG (Direct to Garment), sublimation, and embroidery. The fabric type determines the best printing method.',
      sortOrder: 3,
    },
    {
      question: 'How long does delivery take?',
      answer:
        'Standard delivery takes 5-7 business days. Express delivery is available in 2-3 business days. Mumbai city customers can opt for same-day delivery.',
      sortOrder: 4,
    },
    {
      question: 'Can I return or exchange products?',
      answer:
        'We accept returns for manufacturing defects within 7 days of delivery. Custom-printed items cannot be returned unless there is a quality issue.',
      sortOrder: 5,
    },
    {
      question: 'Do you offer credit payment?',
      answer:
        'Yes! Trusted wholesale buyers can apply for a credit line (Buy Now, Pay Later). Contact our team to apply for a credit limit.',
      sortOrder: 6,
    },
  ];

  for (const faq of faqs) {
    const existing = await prisma.fAQEntry.findFirst({
      where: { question: faq.question },
    });
    if (!existing) {
      await prisma.fAQEntry.create({ data: faq });
    }
  }

  console.log('✅ FAQ entries created');

  // ─────────────────────────────────────────
  // POLICY PAGES
  // ─────────────────────────────────────────

  const policies = [
    {
      slug: 'privacy',
      title: 'Privacy Policy',
      content:
        '<h1>Privacy Policy</h1><p>NayaKapda is committed to protecting your privacy. We collect only the information necessary to process your orders and improve our services.</p>',
    },
    {
      slug: 'shipping',
      title: 'Shipping Policy',
      content:
        '<h1>Shipping Policy</h1><p>All orders are dispatched within 24-48 hours of confirmation. Standard delivery takes 5-7 business days across India.</p>',
    },
    {
      slug: 'returns',
      title: 'Returns & Exchanges',
      content:
        '<h1>Returns & Exchanges</h1><p>Manufacturing defects can be returned within 7 days. Contact us via WhatsApp with photos of the issue.</p>',
    },
    {
      slug: 'terms',
      title: 'Terms & Conditions',
      content:
        '<h1>Terms & Conditions</h1><p>By placing an order, you agree to our minimum quantity requirements and pricing terms. All prices are exclusive of GST.</p>',
    },
    {
      slug: 'disclaimer',
      title: 'Disclaimer',
      content:
        '<h1>Disclaimer</h1><p>Product colors may vary slightly from screen representations due to fabric dyeing processes.</p>',
    },
  ];

  for (const policy of policies) {
    await prisma.policyPage.upsert({
      where: { slug: policy.slug },
      update: { content: policy.content, title: policy.title },
      create: policy,
    });
  }

  console.log('✅ Policy pages created');

  // ─────────────────────────────────────────
  // BANNER MESSAGES
  // ─────────────────────────────────────────

  await prisma.bannerMessage.upsert({
    where: { id: 'seed-banner-1' },
    update: {},
    create: {
      id: 'seed-banner-1',
      text: '🎉 Free delivery on orders above ₹5,000!',
      active: true,
      sortOrder: 1,
    },
  });

  await prisma.bannerMessage.upsert({
    where: { id: 'seed-banner-2' },
    update: {},
    create: {
      id: 'seed-banner-2',
      text: '📦 Trusted by 500+ printing businesses across India',
      active: true,
      sortOrder: 2,
    },
  });

  console.log('✅ Banner messages created');

  // ─────────────────────────────────────────
  // DISCOUNT CODE (sample)
  // ─────────────────────────────────────────

  await prisma.discountCode.upsert({
    where: { code: 'welcome10' },
    update: {},
    create: {
      code: 'welcome10',
      type: 'PERCENT',
      value: 10,
      minOrderQty: 50,
      maxUses: 100,
      usedCount: 0,
      active: true,
    },
  });

  console.log('✅ Sample discount code created: WELCOME10 (10% off, min 50 pcs)');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('   Admin Panel (email-based):');
  console.log('   → SUPER_ADMIN: admin@nayakapda.com / Admin@123');
  console.log('   → STAFF:       staff@nayakapda.com / Staff@123');
  console.log('   Storefront (phone-based):');
  console.log('   → CUSTOMER:    9876543210 / Customer@123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
