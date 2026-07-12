# NayaKapda — Implementation Task List

## ✅ Phase 1: Foundation (COMPLETE)
- [x] Project setup (Next.js 14+ App Router, TypeScript, Tailwind v4)
- [x] All dependencies installed (@prisma/adapter-pg, pg, zustand, react-query, etc.)
- [x] Prisma schema (23 models, all enums)
- [x] Database migration (nayakapda_tshirt local PostgreSQL)
- [x] Database seed (categories, products, variants, users, pricing tiers, shipping, discounts)
- [x] `prisma.config.ts` (Prisma 7 compatible)
- [x] `prisma/run-seed.js` (ts-node runner with pg adapter)
- [x] `rule.md` created

## ✅ Phase 2: Core Libraries (COMPLETE)
- [x] `src/lib/prisma.ts` — Prisma 7 + @prisma/adapter-pg
- [x] `src/lib/auth.ts` — NextAuth credentials provider (phone+password)
- [x] `src/lib/validation.ts` — Zod schemas
- [x] `src/lib/pricing.ts` — resolvePriceFromTiers, validateMultiple, computeOrderTotal, computeDiscount
- [x] `src/lib/audit.ts` — AuditLog helpers
- [x] `src/lib/whatsapp.ts` — WhatsApp notifications
- [x] `src/lib/middleware.ts` — withErrorHandler, withCustomerAuth, withAdminAuth, checkRateLimit
- [x] `src/lib/utils.ts` — formatINR, generateReferralCode, etc.

## ✅ Phase 3: API Routes (COMPLETE)
- [x] `api/auth/[...nextauth]/route.ts` — NextAuth handler
- [x] `api/auth/register/route.ts` — Phone+password registration
- [x] `api/admin/auth/login/route.ts` — Admin email+password + JWT cookie
- [x] `api/products/route.ts` — Product listing with filters
- [x] `api/products/[slug]/route.ts` — Product detail
- [x] `api/pricing/tier/route.ts` — Live pricing resolver
- [x] `api/cart/route.ts` — Cart GET
- [x] `api/cart/bulk-add/route.ts` — Add multiple variants at once
- [x] `api/cart/item/[id]/route.ts` — PATCH qty, DELETE item
- [x] `api/discount/validate/route.ts` — Discount code validation
- [x] `api/shipping/calculate/route.ts` — Shipping method selector
- [x] `api/orders/route.ts` — Place order (server-side total), list orders
- [x] `api/account/credit-line/route.ts` — Credit line details
- [x] `api/account/referral/route.ts` — Referral code + earnings
- [x] `api/admin/orders/route.ts` — Admin orders list + CSV export
- [x] `api/admin/orders/[id]/route.ts` — Status update + WhatsApp dispatch
- [x] `api/admin/discounts/route.ts` — Discount code CRUD
- [x] `api/admin/analytics/route.ts` — Revenue analytics

## ✅ Phase 4: Frontend Pages (COMPLETE)
- [x] `app/layout.tsx` — Root layout (Inter font, dark mode, Providers)
- [x] `app/globals.css` — Full design system (glass, gradient, buttons, cards, tables, badges)
- [x] `app/providers.tsx` — SessionProvider + React Query
- [x] `app/page.tsx` — Homepage (hero, categories, products, FAQ, CTA)
- [x] `app/products/page.tsx` — Product listing with category filter
- [x] `app/products/[slug]/page.tsx` — Product detail page
- [x] `app/login/page.tsx` — Customer login
- [x] `app/register/page.tsx` — Customer registration
- [x] `app/cart/page.tsx` — Cart with qty controls
- [x] `app/faq/page.tsx` — FAQ accordion
- [x] `app/pricing/page.tsx` — Volume pricing tiers
- [x] `app/admin/login/page.tsx` — Admin login
- [x] `app/admin/layout.tsx` — Admin sidebar layout
- [x] `app/admin/page.tsx` — Admin dashboard (KPIs + recent orders)
- [x] `app/admin/orders/page.tsx` — Admin orders list

## ✅ Phase 5: Components (COMPLETE)
- [x] `components/layout/Navbar.tsx` — Sticky glass navbar with cart badge
- [x] `components/layout/Footer.tsx` — Site footer with links
- [x] `components/products/ProductCard.tsx` — Product card with hover effects
- [x] `components/products/SizeQuantityMatrix.tsx` — Core ordering matrix

## ✅ Phase 6: State Management
- [x] `store/cartStore.ts` — Zustand persistent cart count

## 🔲 Phase 7: Remaining Pages (TODO)
- [ ] `app/checkout/page.tsx` — Checkout flow (address + shipping + payment)
- [ ] `app/account/page.tsx` — Customer account overview
- [ ] `app/account/orders/page.tsx` — Order history
- [ ] `app/account/orders/[id]/page.tsx` — Order detail
- [ ] `app/account/credit/page.tsx` — Credit line view
- [ ] `app/account/referral/page.tsx` — Referral page
- [ ] `app/policy/[slug]/page.tsx` — Policy pages (privacy, terms, shipping, returns)
- [ ] `app/contact/page.tsx` — Contact/WhatsApp page
- [ ] `app/admin/orders/[id]/page.tsx` — Admin order detail + status update
- [ ] `app/admin/products/page.tsx` — Admin product list
- [ ] `app/admin/analytics/page.tsx` — Revenue analytics dashboard

## 🔲 Phase 8: Production Readiness
- [ ] `next.config.ts` image domains configuration
- [ ] NEXTAUTH_SECRET in .env.local
- [ ] Razorpay integration (payment gateway)
- [ ] `middleware.ts` — Route protection for /account, /admin
