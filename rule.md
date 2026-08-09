# NayaKapda.com — Project Rules & Conventions

> **Mandatory guidelines for all developers and AI agents working on this project.**
> Last updated: 2026-08-10

---

## 📋 Project Overview

**NayaKapda.com** (Proprietor: Mr. Karan Rajput | Vadodara, Gujarat) is a B2B Wholesale Apparel Ecommerce Platform — a production-grade Next.js application enabling bulk T-shirt and apparel sales to printing businesses and resellers. It includes a customer storefront and a role-gated admin panel.

### Official Brand Assets & Contact
- **Website Name / Brand**: `NayaKapda.com`
- **Official Brand Logo**: `/logo.png` (Horizontal Light Theme Logo — image only, accompanying text logo removed)
- **Mobile Navbar Layout**: Hamburger menu icon MUST be positioned on the LEFT side of mobile view (<768px).
- **WhatsApp Support (Primary)**: `+91 8735045268`
- **Alternative Phone**: `+91 7698752012`
- **Address**: Shop No-09, Wing-E, PM Avas Yojna, Near Ratri Bazar, New Sama Road, Vadodara, Gujarat - 390008, India
- **Security Rule**: Never display `/admin` entry points or Admin Login links on public customer-facing auth pages (`/login`, `/register`).

---

## 🏗️ Architecture Rules

### Project Stack (STRICT — No Substitutions Without Explicit Approval)

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js App Router | 14+ |
| Language | TypeScript | 5+ |
| Styling | TailwindCSS | 3.4+ |
| ORM | Prisma | 5+ |
| Database | PostgreSQL (Local Dev) | 15+ |
| Auth (Customers) | NextAuth.js | 4+ |
| Auth (Admin) | Custom JWT (httpOnly cookie) | — |
| State (Cart/UI) | Zustand | 4+ |
| Data Fetching | TanStack React Query | 5+ |
| Forms | React Hook Form + Zod | — |
| Payments | Razorpay | — |
| File Storage | Cloudinary or AWS S3-compatible | — |
| Notifications | WhatsApp Business API (Twilio or Meta) | — |
| Testing | Vitest + @testing-library/react + fast-check | — |
| PDF | @react-pdf/renderer or pdfkit | — |
| Tables | @tanstack/react-table | — |

> Do NOT swap any dependency without explicit user approval and updating this file.

---

## 🗄️ Database Rules

### Local Development Connection
- **Database**: Local PostgreSQL (NOT Docker)
- **DB Name**: `nayakapda_tshirt`
- **Default User**: `postgres`
- **Password**: `badri@123`
- **Port**: `5432`
- **Connection string**: `postgresql://postgres:badri@123@localhost:5432/nayakapda_tshirt`

### Prisma Schema Rules
- Schema file: `prisma/schema.prisma`
- Every migration must be applied with `prisma migrate dev`
- Never manually edit the database without a Prisma migration
- Seed script: `prisma/seed.ts`

### Required Tables (Authoritative List)
1. `User` — Customers and admin users
2. `Address` — Delivery addresses per user
3. `Category` — Product groupings with qtyMultiple
4. `Product` — Base apparel items
5. `ProductVariant` — SKU (product + size + color)
6. `ProductPhoto` — Product images with sort order
7. `SizeChart` — Per-product size chart data
8. `ProductVideo` — Video records per product
9. `PricingTier` — Quantity-based pricing bands per product
10. `Cart` — Session/user cart
11. `CartItem` — Line items in a Cart
12. `Order` — Confirmed purchase record
13. `OrderItem` — Line items in an Order
14. `DiscountCode` — Coupon codes (PERCENT or FLAT)
15. `CreditLine` — Per-customer buy-now-pay-later facility
16. `CreditTransaction` — Debit/settlement events on a CreditLine
17. `Referral` — Per-user affiliate record
18. `ReferralEarning` — Commission events per referred order
19. `ShippingMethod` — Configurable shipping options
20. `StockAlertSubscription` — User-variant restock notification subscriptions
21. `FAQEntry` — FAQ question-answer pairs
22. `NotificationLog` — WhatsApp delivery failure records
23. `AuditLog` — Admin action audit trail

---

## 📁 Project Structure

```
nayakapda/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── (storefront)/
│   │   ├── admin/
│   │   └── api/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── product/
│   │   ├── cart/
│   │   ├── checkout/
│   │   └── admin/
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── pricing.ts
│   │   ├── audit.ts
│   │   ├── whatsapp.ts
│   │   ├── pdf.ts
│   │   ├── validation.ts
│   │   └── utils.ts
│   ├── hooks/
│   ├── store/
│   └── types/
├── tests/
├── .env.local          (never commit)
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── vitest.config.ts
├── tsconfig.json
├── package.json
├── rule.md
├── design.md
├── requirements.md
└── tasks.md
```

---

## 🔌 API Rules

### Conventions
- All customer API routes: `/api/*`
- All admin API routes: `/api/admin/*`
- Zod schemas for ALL request bodies and query params
- HTTP 422 + field-level errors on validation failure
- Wrap every handler in `withErrorHandler(handler)` HOC
- Never expose internal stack traces

### Standard Response Format
```json
{ "data": { ... }, "message": "Optional context" }
{ "errors": { "fieldErrors": { ... } } }
{ "error": "UNAUTHENTICATED" }
{ "error": "FORBIDDEN" }
{ "error": "INVALID_QTY_MULTIPLE", "message": "..." }
```

### Defined Error Codes
INVALID_QTY_MULTIPLE, TIER_NOT_FOUND, DISCOUNT_INVALID, CREDIT_LIMIT_EXCEEDED,
ORDER_TOTAL_MISMATCH, VARIANT_OUT_OF_STOCK, RAZORPAY_VERIFICATION_FAILED,
UNAUTHENTICATED, FORBIDDEN, CONFLICT

---

## 🎨 Frontend Rules

- Components: PascalCase.tsx
- Hooks: useCamelCase.ts
- Mobile-first TailwindCSS (320px+)
- Monetary values ALWAYS formatted as ₹X,XXX via formatINR()
- Never trust client totals — server re-computes all prices
- Zustand for cart count and UI state
- TanStack React Query for server data
- React Hook Form + Zod for forms

---

## 🔒 Security Rules

### Required .env.local Variables
```
DATABASE_URL=postgresql://postgres:badri@123@localhost:5432/nayakapda_tshirt
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
ADMIN_JWT_SECRET=<openssl rand -base64 32>
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
CLOUDINARY_URL=
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
```

- NEVER commit .env.local
- Customer auth: NextAuth.js session cookie
- Admin auth: httpOnly JWT cookie with role claim
- withAdminAuth HOC: 401 if missing, 403 if role insufficient
- Rate limit: /api/discount/validate and /api/orders — 20 req/min/IP

---

## 🧪 Testing Rules

- Unit/Integration: Vitest + @testing-library/react
- Property-Based: fast-check (min 100 iterations)
- Property test tag: // Feature: b2b-wholesale-apparel-platform, Property N: ...
- Component tests use jsdom env; API tests use node env

---

## 📝 Commit Conventions

Format: `<type>(<scope>): <description>`
Types: feat, fix, docs, style, refactor, test, chore

---

## 🚀 Development Workflow

### First-Time Setup
1. Install Node.js 20+, PostgreSQL 15 locally
2. `createdb -U postgres nayakapda_tshirt`
3. Copy `.env.example` to `.env.local` and fill in secrets
4. `npm install`
5. `npx prisma migrate dev`
6. `npx prisma db seed`
7. `npm run dev` — runs on http://localhost:3000

### Port Assignments
- Next.js: 3000
- PostgreSQL: 5432

---

## ⚠️ Critical Reminders

- Read design.md for API contracts and data models
- Read requirements.md for acceptance criteria
- Read tasks.md for implementation progress
- NEVER skip Zod validation on any API route
- NEVER trust client-computed monetary totals
- ALWAYS re-compute prices server-side before order creation
- NEVER commit .env.local
- Credit line and discount operations require SUPER_ADMIN role
- All pricing/discount/credit changes must be audit logged
- WhatsApp failures must be logged to NotificationLog, never block HTTP response
