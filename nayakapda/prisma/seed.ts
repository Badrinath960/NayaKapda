import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Set DATABASE_URL before creating anything
process.env.DATABASE_URL = 'postgresql://postgres:badri@123@localhost:5432/nayakapda_tshirt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

// ─────────────────────────────────────────
// HELPER: Color abbreviation map
// ─────────────────────────────────────────

const COLOR_ABBREV: Record<string, string> = {
  'Black': 'BLK',
  'White': 'WHT',
  'Navy': 'NVY',
  'Maroon': 'MRN',
  'Red': 'RED',
  'Army Green': 'AGR',
  'Grey Melange': 'GML',
  'Charcoal': 'CHR',
  'Olive': 'OLV',
  'Mustard': 'MST',
  'Lavender': 'LAV',
  'Beige': 'BGE',
  'Peach': 'PCH',
  'Baby Pink': 'BPK',
  'Sky Blue': 'SKB',
  'Rust': 'RST',
  'Brown': 'BRN',
  'Mustard Yellow': 'MYL',
  'Bottle Green': 'BTG',
  'Royal Blue': 'RYB',
  'Sky': 'SKY',
  'Grey': 'GRY',
  'Bhagwa': 'BGW',
};

// ─────────────────────────────────────────
// HELPER: Create variants for a product
// ─────────────────────────────────────────

async function createVariants(
  productId: string,
  sizes: string[],
  colors: string[],
  skuPrefix: string,
  stockRange: { min: number; max: number },
  outOfStockColors: string[] = [],
) {
  let count = 0;
  for (const size of sizes) {
    for (const color of colors) {
      const abbrev = COLOR_ABBREV[color] || color.replace(/\s/g, '').toUpperCase().slice(0, 3);
      const sku = `${skuPrefix}-${abbrev}-${size}`;
      const isOutOfStock = outOfStockColors.includes(color);
      const stockQty = isOutOfStock
        ? 0
        : Math.floor(Math.random() * (stockRange.max - stockRange.min + 1)) + stockRange.min;

      await prisma.productVariant.upsert({
        where: { sku },
        update: {
          productId,
          size,
          color,
          stockQty,
          active: true,
        },
        create: {
          productId,
          size,
          color,
          sku,
          stockQty,
          active: true,
        },
      });
      count++;
    }
  }
  return count;
}

// ─────────────────────────────────────────
// HELPER: Create pricing tiers for a product
// ─────────────────────────────────────────

async function createPricingTiers(
  productId: string,
  tiers: { minQty: number; maxQty: number | null; price: number }[],
) {
  await prisma.pricingTier.deleteMany({ where: { productId } });
  await prisma.pricingTier.createMany({
    data: tiers.map((t) => ({
      productId,
      minQty: t.minQty,
      maxQty: t.maxQty,
      pricePerPiece: t.price,
    })),
  });
}

async function main() {
  console.log('🌱 Starting seed...');

  // ═══════════════════════════════════════════
  // CATEGORIES
  // ═══════════════════════════════════════════

  // Step 1: Deactivate old categories from previous seed
  await prisma.category.updateMany({
    where: { slug: { in: ['tshirts', 'hoodies', 'polo-shirts'] } },
    data: { active: false },
  });
  console.log('🔕 Deactivated old categories (tshirts, hoodies, polo-shirts)');

  // Step 2: Upsert 15 new categories

  // --- ACTIVE categories (7) ---
  const catOversize210 = await prisma.category.upsert({
    where: { slug: 'oversize-210gsm' },
    update: { name: 'Oversize 210gsm', qtyMultiple: 10, sortOrder: 1, active: true },
    create: {
      name: 'Oversize 210gsm',
      slug: 'oversize-210gsm',
      description: 'Oversized drop-shoulder T-shirts in 210gsm heavy-gauge cotton',
      qtyMultiple: 10,
      sortOrder: 1,
      active: true,
    },
  });

  const catOversize240 = await prisma.category.upsert({
    where: { slug: 'oversize-240gsm' },
    update: { name: 'Oversize 240gsm', qtyMultiple: 10, sortOrder: 2, active: true },
    create: {
      name: 'Oversize 240gsm',
      slug: 'oversize-240gsm',
      description: 'Oversized drop-shoulder T-shirts in 240gsm premium heavy-weight fabric',
      qtyMultiple: 10,
      sortOrder: 2,
      active: true,
    },
  });

  const catKidsRneck = await prisma.category.upsert({
    where: { slug: 'kids-rneck' },
    update: { name: 'Kids Rneck', qtyMultiple: 10, sortOrder: 3, active: true },
    create: {
      name: 'Kids Rneck',
      slug: 'kids-rneck',
      description: 'Kids round-neck T-shirts in premium biowash cotton',
      qtyMultiple: 10,
      sortOrder: 3,
      active: true,
    },
  });

  const catTrueBioRneck = await prisma.category.upsert({
    where: { slug: 'true-bio-rneck' },
    update: { name: 'True Bio Rneck', qtyMultiple: 10, sortOrder: 4, active: true },
    create: {
      name: 'True Bio Rneck',
      slug: 'true-bio-rneck',
      description: 'True biowash round-neck T-shirts in 180gsm supercombed cotton',
      qtyMultiple: 10,
      sortOrder: 4,
      active: true,
    },
  });

  const catPremiumPolo = await prisma.category.upsert({
    where: { slug: 'premium-polo' },
    update: { name: 'Premium Polo', qtyMultiple: 12, sortOrder: 5, active: true },
    create: {
      name: 'Premium Polo',
      slug: 'premium-polo',
      description: 'Premium honeycomb polo shirts in 220gsm supercombed cotton',
      qtyMultiple: 12,
      sortOrder: 5,
      active: true,
    },
  });

  const catDropshoHoodie = await prisma.category.upsert({
    where: { slug: 'dropsho-hoodie-430gsm' },
    update: { name: 'Dropsho Hoodie 430gsm', qtyMultiple: 6, sortOrder: 6, active: true },
    create: {
      name: 'Dropsho Hoodie 430gsm',
      slug: 'dropsho-hoodie-430gsm',
      description: 'Premium heavy-weight 430gsm drop-shoulder hoodies',
      qtyMultiple: 6,
      sortOrder: 6,
      active: true,
    },
  });

  const catAcidWash = await prisma.category.upsert({
    where: { slug: 'acidwash-os' },
    update: { name: 'AcidWash OS', qtyMultiple: 10, sortOrder: 7, active: true },
    create: {
      name: 'AcidWash OS',
      slug: 'acidwash-os',
      description: 'Acid-washed oversized T-shirts in 240gsm biowash french terry',
      qtyMultiple: 10,
      sortOrder: 7,
      active: true,
    },
  });

  // --- DISABLED categories (8) ---
  await prisma.category.upsert({
    where: { slug: 'oversize-180gsm' },
    update: { name: 'Oversize 180gsm', qtyMultiple: 10, sortOrder: 8, active: false },
    create: {
      name: 'Oversize 180gsm',
      slug: 'oversize-180gsm',
      description: 'Oversized T-shirts in 180gsm fabric',
      qtyMultiple: 10,
      sortOrder: 8,
      active: false,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'bio-rneck' },
    update: { name: 'Bio Rneck', qtyMultiple: 10, sortOrder: 9, active: false },
    create: {
      name: 'Bio Rneck',
      slug: 'bio-rneck',
      description: 'Biowash round-neck T-shirts',
      qtyMultiple: 10,
      sortOrder: 9,
      active: false,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'non-bio-rneck' },
    update: { name: 'Non Bio Rneck', qtyMultiple: 10, sortOrder: 10, active: false },
    create: {
      name: 'Non Bio Rneck',
      slug: 'non-bio-rneck',
      description: 'Non-biowash round-neck T-shirts',
      qtyMultiple: 10,
      sortOrder: 10,
      active: false,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'sublimation-tshirt' },
    update: { name: 'Sublimation T-shirt', qtyMultiple: 10, sortOrder: 11, active: false },
    create: {
      name: 'Sublimation T-shirt',
      slug: 'sublimation-tshirt',
      description: 'Sublimation-ready polyester T-shirts',
      qtyMultiple: 10,
      sortOrder: 11,
      active: false,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'cotton-polo' },
    update: { name: 'Cotton Polo', qtyMultiple: 12, sortOrder: 12, active: false },
    create: {
      name: 'Cotton Polo',
      slug: 'cotton-polo',
      description: 'Cotton polo shirts',
      qtyMultiple: 12,
      sortOrder: 12,
      active: false,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'hoodie-320gsm' },
    update: { name: 'Hoodie 320gsm', qtyMultiple: 6, sortOrder: 13, active: false },
    create: {
      name: 'Hoodie 320gsm',
      slug: 'hoodie-320gsm',
      description: 'Hoodies in 320gsm fabric',
      qtyMultiple: 6,
      sortOrder: 13,
      active: false,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'sweatshirt' },
    update: { name: 'Sweatshirt', qtyMultiple: 6, sortOrder: 14, active: false },
    create: {
      name: 'Sweatshirt',
      slug: 'sweatshirt',
      description: 'Crew-neck sweatshirts',
      qtyMultiple: 6,
      sortOrder: 14,
      active: false,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'shorts' },
    update: { name: 'Shorts', qtyMultiple: 10, sortOrder: 15, active: false },
    create: {
      name: 'Shorts',
      slug: 'shorts',
      description: 'Casual shorts',
      qtyMultiple: 10,
      sortOrder: 15,
      active: false,
    },
  });

  console.log('✅ 15 categories upserted (7 active, 8 disabled)');

  // ═══════════════════════════════════════════
  // PRODUCTS — one per ACTIVE category
  // ═══════════════════════════════════════════

  // ─── Product 1: Oversize 210gsm ───

  const prod210 = await prisma.product.upsert({
    where: { slug: 'oversized-drop-shoulder-210gsm' },
    update: {
      categoryId: catOversize210.id,
      name: 'Oversized Drop Shoulder 210gsm',
      description: 'Terry Cotton Loopknit Heavy Gauge, 100% Cotton Supercombed Red Label Premium Fabric',
      gsm: 210,
      fabricComposition: '100% Cotton Supercombed',
      basePrice: 280,
      active: true,
    },
    create: {
      categoryId: catOversize210.id,
      name: 'Oversized Drop Shoulder 210gsm',
      slug: 'oversized-drop-shoulder-210gsm',
      description: 'Terry Cotton Loopknit Heavy Gauge, 100% Cotton Supercombed Red Label Premium Fabric',
      gsm: 210,
      fabricComposition: '100% Cotton Supercombed',
      basePrice: 280,
      active: true,
    },
  });

  await createPricingTiers(prod210.id, [
    { minQty: 1, maxQty: 9, price: 280 },
    { minQty: 10, maxQty: null, price: 233 },
  ]);

  const os210Colors = [
    'Black', 'White', 'Navy', 'Maroon', 'Red', 'Army Green',
    'Grey Melange', 'Charcoal', 'Olive', 'Mustard', 'Lavender',
    'Beige', 'Peach', 'Baby Pink', 'Sky Blue', 'Rust',
  ];
  const os210OutOfStock = ['Rust', 'Peach']; // a few out-of-stock for testing
  const os210Count = await createVariants(
    prod210.id,
    ['S', 'M', 'L', 'XL', 'XXL'],
    os210Colors,
    'OS210',
    { min: 50, max: 200 },
    os210OutOfStock,
  );
  console.log(`   ✅ Oversize 210gsm: ${os210Count} variants`);

  // ─── Product 2: Oversize 240gsm ───

  const prod240 = await prisma.product.upsert({
    where: { slug: 'oversized-drop-shoulder-240gsm' },
    update: {
      categoryId: catOversize240.id,
      name: 'Oversized Drop Shoulder 240gsm',
      description: '100% Cotton Biowash French Terry Loopknit, Premium Heavy-weight Fabric',
      gsm: 240,
      fabricComposition: '100% Cotton Biowash French Terry',
      basePrice: 320,
      active: true,
    },
    create: {
      categoryId: catOversize240.id,
      name: 'Oversized Drop Shoulder 240gsm',
      slug: 'oversized-drop-shoulder-240gsm',
      description: '100% Cotton Biowash French Terry Loopknit, Premium Heavy-weight Fabric',
      gsm: 240,
      fabricComposition: '100% Cotton Biowash French Terry',
      basePrice: 320,
      active: true,
    },
  });

  await createPricingTiers(prod240.id, [
    { minQty: 1, maxQty: 9, price: 320 },
    { minQty: 10, maxQty: null, price: 265 },
  ]);

  const os240Colors = ['Black', 'White', 'Navy', 'Maroon', 'Red', 'Brown', 'Army Green'];
  const os240Count = await createVariants(
    prod240.id,
    ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    os240Colors,
    'OS240',
    { min: 50, max: 200 },
  );
  console.log(`   ✅ Oversize 240gsm: ${os240Count} variants`);

  // ─── Product 3: Kids Rneck ───

  const prodKids = await prisma.product.upsert({
    where: { slug: 'true-biowash-kids-rneck-180gsm' },
    update: {
      categoryId: catKidsRneck.id,
      name: 'True Biowash Kids Round Neck 180gsm',
      description: '100% Cotton Supercombed Premium Quality Red Label Fabric',
      gsm: 180,
      fabricComposition: '100% Cotton Supercombed',
      basePrice: 144,
      active: true,
    },
    create: {
      categoryId: catKidsRneck.id,
      name: 'True Biowash Kids Round Neck 180gsm',
      slug: 'true-biowash-kids-rneck-180gsm',
      description: '100% Cotton Supercombed Premium Quality Red Label Fabric',
      gsm: 180,
      fabricComposition: '100% Cotton Supercombed',
      basePrice: 144,
      active: true,
    },
  });

  await createPricingTiers(prodKids.id, [
    { minQty: 1, maxQty: 9, price: 144 },
    { minQty: 10, maxQty: null, price: 114 },
  ]);

  const kidsColors = ['Black', 'White', 'Red', 'Baby Pink', 'Mustard Yellow'];
  const kidsCount = await createVariants(
    prodKids.id,
    ['20', '22', '24', '26', '28', '30', '32', '34'],
    kidsColors,
    'KIDS',
    { min: 50, max: 200 },
  );
  console.log(`   ✅ Kids Rneck: ${kidsCount} variants`);

  // ─── Product 4: True Bio Rneck ───

  const prodTrueBio = await prisma.product.upsert({
    where: { slug: 'true-biowash-rneck-180gsm' },
    update: {
      categoryId: catTrueBioRneck.id,
      name: 'True Biowash Round Neck 180gsm',
      description: 'Regular Fit, True Biowash Round neck, 180gsm, 100% Cotton Supercombed Premium Quality Red Label Fabric',
      gsm: 180,
      fabricComposition: '100% Cotton Supercombed',
      basePrice: 181,
      active: true,
    },
    create: {
      categoryId: catTrueBioRneck.id,
      name: 'True Biowash Round Neck 180gsm',
      slug: 'true-biowash-rneck-180gsm',
      description: 'Regular Fit, True Biowash Round neck, 180gsm, 100% Cotton Supercombed Premium Quality Red Label Fabric',
      gsm: 180,
      fabricComposition: '100% Cotton Supercombed',
      basePrice: 181,
      active: true,
    },
  });

  await createPricingTiers(prodTrueBio.id, [
    { minQty: 1, maxQty: 9, price: 181 },
    { minQty: 10, maxQty: null, price: 146 },
  ]);

  const trueBioColors = [
    'Black', 'White', 'Maroon', 'Navy', 'Mustard Yellow', 'Red',
    'Bottle Green', 'Beige', 'Royal Blue', 'Lavender', 'Sky',
    'Grey', 'Bhagwa', 'Army Green',
  ];
  const trueBioOutOfStock = ['Bhagwa', 'Sky']; // a few out-of-stock for testing
  const trueBioCount = await createVariants(
    prodTrueBio.id,
    ['36', '38', '40', '42', '44', '46'],
    trueBioColors,
    'TBIO',
    { min: 50, max: 200 },
    trueBioOutOfStock,
  );
  console.log(`   ✅ True Bio Rneck: ${trueBioCount} variants`);

  // ─── Product 5: Premium Polo ───

  const prodPolo = await prisma.product.upsert({
    where: { slug: 'premium-honeycomb-polo-220gsm' },
    update: {
      categoryId: catPremiumPolo.id,
      name: 'Premium Honeycomb Polo 220gsm',
      description: 'Most Premium Honeycomb Polo, 220gsm, 100% Cotton Supercombed Red Label Fabric',
      gsm: 220,
      fabricComposition: '100% Cotton Honeycomb',
      basePrice: 285,
      active: true,
    },
    create: {
      categoryId: catPremiumPolo.id,
      name: 'Premium Honeycomb Polo 220gsm',
      slug: 'premium-honeycomb-polo-220gsm',
      description: 'Most Premium Honeycomb Polo, 220gsm, 100% Cotton Supercombed Red Label Fabric',
      gsm: 220,
      fabricComposition: '100% Cotton Honeycomb',
      basePrice: 285,
      active: true,
    },
  });

  await createPricingTiers(prodPolo.id, [
    { minQty: 1, maxQty: 9, price: 285 },
    { minQty: 10, maxQty: null, price: 232 },
  ]);

  const poloColors = ['Black', 'White', 'Navy', 'Maroon'];
  const poloCount = await createVariants(
    prodPolo.id,
    ['36', '38', '40', '42', '44', '46'],
    poloColors,
    'PPOLO',
    { min: 50, max: 200 },
  );
  console.log(`   ✅ Premium Polo: ${poloCount} variants`);

  // ─── Product 6: Dropsho Hoodie 430gsm ───

  const prodHoodie = await prisma.product.upsert({
    where: { slug: 'drop-shoulder-hoodie-430gsm' },
    update: {
      categoryId: catDropshoHoodie.id,
      name: 'Drop Shoulder Hoodie 430gsm',
      description: 'Premium Heavy-weight 430gsm Drop Shoulder Hoodie, 100% Cotton Fleece',
      gsm: 430,
      fabricComposition: '100% Cotton Fleece',
      basePrice: 850,
      active: true,
    },
    create: {
      categoryId: catDropshoHoodie.id,
      name: 'Drop Shoulder Hoodie 430gsm',
      slug: 'drop-shoulder-hoodie-430gsm',
      description: 'Premium Heavy-weight 430gsm Drop Shoulder Hoodie, 100% Cotton Fleece',
      gsm: 430,
      fabricComposition: '100% Cotton Fleece',
      basePrice: 850,
      active: true,
    },
  });

  await createPricingTiers(prodHoodie.id, [
    { minQty: 1, maxQty: 5, price: 850 },
    { minQty: 6, maxQty: null, price: 720 },
  ]);

  const hoodieColors = ['Black', 'White', 'Navy', 'Charcoal', 'Olive'];
  const hoodieCount = await createVariants(
    prodHoodie.id,
    ['S', 'M', 'L', 'XL', 'XXL'],
    hoodieColors,
    'DHOOD',
    { min: 50, max: 200 },
  );
  console.log(`   ✅ Dropsho Hoodie: ${hoodieCount} variants`);

  // ─── Product 7: AcidWash OS ───

  const prodAcid = await prisma.product.upsert({
    where: { slug: 'acidwash-oversized-240gsm' },
    update: {
      categoryId: catAcidWash.id,
      name: 'AcidWash Oversized 240gsm',
      description: 'Oversize Fit, 240gsm, 100% Cotton Biowash French Terry Loopknit',
      gsm: 240,
      fabricComposition: '100% Cotton Biowash French Terry',
      basePrice: 450,
      active: true,
    },
    create: {
      categoryId: catAcidWash.id,
      name: 'AcidWash Oversized 240gsm',
      slug: 'acidwash-oversized-240gsm',
      description: 'Oversize Fit, 240gsm, 100% Cotton Biowash French Terry Loopknit',
      gsm: 240,
      fabricComposition: '100% Cotton Biowash French Terry',
      basePrice: 450,
      active: true,
    },
  });

  await createPricingTiers(prodAcid.id, [
    { minQty: 1, maxQty: 9, price: 450 },
    { minQty: 10, maxQty: null, price: 380 },
  ]);

  const acidColors = ['Black', 'Brown', 'Navy', 'Maroon', 'Red', 'Army Green'];
  const acidOutOfStock = ['Brown']; // one out-of-stock for testing
  const acidCount = await createVariants(
    prodAcid.id,
    ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    acidColors,
    'ACID',
    { min: 50, max: 200 },
    acidOutOfStock,
  );
  console.log(`   ✅ AcidWash OS: ${acidCount} variants`);

  console.log('✅ Products and variants created');

  // ═══════════════════════════════════════════
  // USERS
  // ═══════════════════════════════════════════

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

  // ═══════════════════════════════════════════
  // CREDIT LINE FOR CUSTOMER
  // ═══════════════════════════════════════════

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

  // ═══════════════════════════════════════════
  // SHIPPING METHODS
  // ═══════════════════════════════════════════

  // Keep existing shipping methods
  await prisma.shippingMethod.upsert({
    where: { id: 'seed-shipping-1' },
    update: {
      name: 'Courier (All India through ship rocket)',
      description: 'Delivered by surface/air courier through ShipRocket',
      etaText: '3-7 business days',
      cost: 150,
      active: true,
    },
    create: {
      id: 'seed-shipping-1',
      name: 'Courier (All India through ship rocket)',
      description: 'Delivered by surface/air courier through ShipRocket',
      etaText: '3-7 business days',
      cost: 150,
      regionLimited: false,
      regionPincodes: [],
      active: true,
      sortOrder: 1,
    },
  });

  await prisma.shippingMethod.upsert({
    where: { id: 'seed-shipping-2' },
    update: { active: false },
    create: {
      id: 'seed-shipping-2',
      name: 'Express Delivery',
      description: 'Air cargo, priority processing',
      etaText: '2-3 business days',
      cost: 250,
      regionLimited: false,
      regionPincodes: [],
      active: false,
      sortOrder: 2,
    },
  });

  await prisma.shippingMethod.upsert({
    where: { id: 'seed-shipping-3' },
    update: { active: false },
    create: {
      id: 'seed-shipping-3',
      name: 'Same Day Delivery (Mumbai)',
      description: 'Mumbai city only — same day delivery',
      etaText: 'Same day (order before 12 PM)',
      cost: 150,
      regionLimited: true,
      regionPincodes: ['400001', '400002', '400003', '400004', '400005', '400006', '400007', '400008', '400009', '400010'],
      active: false,
      sortOrder: 3,
    },
  });

  // New shipping methods
  await prisma.shippingMethod.upsert({
    where: { id: 'seed-shipping-4' },
    update: { active: false },
    create: {
      id: 'seed-shipping-4',
      name: 'Train (Superfast Delivery)',
      description: 'Goods sent via superfast train — cost-effective for heavy bulk orders',
      etaText: '3-5 days',
      cost: 200,
      regionLimited: false,
      regionPincodes: [],
      active: false,
      sortOrder: 4,
    },
  });

  await prisma.shippingMethod.upsert({
    where: { id: 'seed-shipping-5' },
    update: { active: false },
    create: {
      id: 'seed-shipping-5',
      name: 'Transport or Direct Bus (from Delhi)',
      description: 'Direct bus or transport service from Delhi — great for nearby states',
      etaText: '2-4 days',
      cost: 150,
      regionLimited: false,
      regionPincodes: [],
      active: false,
      sortOrder: 5,
    },
  });

  await prisma.shippingMethod.upsert({
    where: { id: 'seed-shipping-6' },
    update: { active: false },
    create: {
      id: 'seed-shipping-6',
      name: 'Delhi Bike Delivery (2hrs)',
      description: 'Hyper-local Delhi delivery by bike — 2 hour delivery within Delhi NCR',
      etaText: '2 hours',
      cost: 100,
      regionLimited: true,
      regionPincodes: ['110'],
      active: false,
      sortOrder: 6,
    },
  });

  await prisma.shippingMethod.upsert({
    where: { id: 'seed-shipping-7' },
    update: {
      name: 'Self pickup',
      description: 'Pick up your order from our Delhi warehouse — zero shipping cost',
      etaText: 'Same day',
      cost: 0,
      active: true,
    },
    create: {
      id: 'seed-shipping-7',
      name: 'Self pickup',
      description: 'Pick up your order from our Delhi warehouse — zero shipping cost',
      etaText: 'Same day',
      cost: 0,
      regionLimited: false,
      regionPincodes: [],
      active: true,
      sortOrder: 7,
    },
  });

  await prisma.shippingMethod.upsert({
    where: { id: 'seed-shipping-8' },
    update: { active: false },
    create: {
      id: 'seed-shipping-8',
      name: 'Zero Contact Drop-shipping',
      description: 'We ship directly to your customer — no branding, plain packaging',
      etaText: '3-7 days',
      cost: 0,
      regionLimited: false,
      regionPincodes: [],
      active: false,
      sortOrder: 8,
    },
  });

  console.log('✅ Shipping methods created (3 existing + 5 new)');

  // ═══════════════════════════════════════════
  // FAQ ENTRIES
  // ═══════════════════════════════════════════

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

  // ═══════════════════════════════════════════
  // POLICY PAGES
  // ═══════════════════════════════════════════

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

  // ═══════════════════════════════════════════
  // BANNER MESSAGES
  // ═══════════════════════════════════════════

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

  // ═══════════════════════════════════════════
  // DISCOUNT CODE (sample)
  // ═══════════════════════════════════════════

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

  // ═══════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('   Admin Panel (email-based):');
  console.log('   → SUPER_ADMIN: admin@nayakapda.com / Admin@123');
  console.log('   → STAFF:       staff@nayakapda.com / Staff@123');
  console.log('   Storefront (phone-based):');
  console.log('   → CUSTOMER:    9876543210 / Customer@123');
  console.log('\n📦 Product catalog:');
  console.log('   → Oversized Drop Shoulder 210gsm (16 colors × 5 sizes = 80 variants)');
  console.log('   → Oversized Drop Shoulder 240gsm (7 colors × 6 sizes = 42 variants)');
  console.log('   → True Biowash Kids Round Neck 180gsm (5 colors × 8 sizes = 40 variants)');
  console.log('   → True Biowash Round Neck 180gsm (14 colors × 6 sizes = 84 variants)');
  console.log('   → Premium Honeycomb Polo 220gsm (4 colors × 6 sizes = 24 variants)');
  console.log('   → Drop Shoulder Hoodie 430gsm (5 colors × 5 sizes = 25 variants)');
  console.log('   → AcidWash Oversized 240gsm (6 colors × 6 sizes = 36 variants)');
  console.log('   ─────────────────────────────────────');
  console.log('   Total: 7 products, 331 variants');
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
