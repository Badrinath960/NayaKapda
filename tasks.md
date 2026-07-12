# Implementation Plan: B2B Wholesale Apparel Platform

## Overview

Implement the full-stack Next.js 14+ (App Router) B2B wholesale apparel ecommerce platform in layered build order: database schema and seed → authentication → product catalog → matrix ordering UX → cart → checkout and payment → customer account → stock management → admin panel → WhatsApp notifications → analytics → PWA → static and content pages.

All code is TypeScript. Testing uses Vitest + @testing-library/react + fast-check. Property-based test subtasks are optional (marked `*`) and map directly to the 12 correctness properties in the design document.

---

## Tasks

- [ ] 1. Project setup and database schema
  - Initialise Next.js 14+ App Router project with TypeScript and TailwindCSS
  - Install and configure Prisma with PostgreSQL connection string
  - Define the full Prisma schema: User, Address, Category, Product, ProductVariant, ProductPhoto, SizeChart, ProductVideo, PricingTier, Cart, CartItem, Order, OrderItem, DiscountCode, CreditLine, CreditTransaction, Referral, ReferralEarning, ShippingMethod, StockAlertSubscription, FAQEntry, NotificationLog, AuditLog
  - Run `prisma migrate dev` to apply initial migration
  - Configure S3-compatible storage client (Cloudinary or AWS SDK)
  - Set up Vitest and fast-check; create `vitest.config.ts` with `jsdom`/`node` environment split
  - _Requirements: 23.8_

- [ ] 2. Database seed script
  - Write `prisma/seed.ts` populating: 3 Categories (T-Shirts/qtyMultiple=10, Hoodies/qtyMultiple=6, Polo Shirts/qtyMultiple=12), 5 Products each with at least 3 ProductVariants and a full PricingTier ladder, one SUPER_ADMIN user, one STAFF user, and one CUSTOMER user with a CreditLine
  - _Requirements: 23.8_

- [ ] 3. Authentication — customer registration and login
  - Install and configure NextAuth.js with a Credentials provider
  - Implement `POST /api/auth/signin` handler: look up User by phone, compare bcrypt password hash, return session
  - Implement `POST /api/auth/register`: accept phone + password (+ optional email), run Zod validation, create User with role CUSTOMER, hash password with bcrypt
  - Implement session invalidation on logout and redirect to home
  - Enforce email uniqueness only when email is provided (partial unique index)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 3.1 Write property test for phone number validation (Property 1)
    - **Property 1: Phone number validation rejects invalid formats**
    - Generate arbitrary strings with `fc.string()` and valid Indian phones with a custom `fcValidPhone()` generator; assert `validatePhone` accepts exactly 10-digit strings starting with 6–9
    - `// Feature: b2b-wholesale-apparel-platform, Property 1: phone validation rejects invalid formats`
    - **Validates: Requirements 1.1, 1.2**

  - [ ]* 3.2 Write property test for Zod schema validation (Property 12)
    - **Property 12: Zod schema validation rejects all malformed API inputs**
    - For registration and signin schemas, generate payloads with `fc.record(...)` that violate each field constraint; assert HTTP 422 with field-level errors and no DB mutation
    - `// Feature: b2b-wholesale-apparel-platform, Property 12: Zod schema rejects all malformed inputs`
    - **Validates: Requirements 23.1**

- [ ] 4. Authentication — admin JWT session
  - Implement `POST /api/admin/auth/login`: look up User by email where role is STAFF or SUPER_ADMIN, verify password, issue signed JWT (httpOnly cookie, role claim, 8 h expiry)
  - Write `withAdminAuth(handler, requiredRole?)` middleware HOC: verify JWT cookie, return 401 if missing, 403 if role insufficient
  - Apply middleware to all `/api/admin/*` routes
  - Implement session expiry redirect to `/admin/login`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 4.1 Write property test for admin role enforcement (Property 10)
    - **Property 10: Admin role enforcement is exhaustive**
    - Generate all SUPER_ADMIN-only route + STAFF token combinations; assert every combination returns HTTP 403
    - `// Feature: b2b-wholesale-apparel-platform, Property 10: admin role enforcement is exhaustive`
    - **Validates: Requirements 2.3, 2.4, 10.7, 18.3**

- [ ] 5. Checkpoint — auth layer complete
  - Ensure all auth unit and property tests pass. Confirm NextAuth session round-trip works end-to-end and admin JWT is verified on protected routes. Ask the user if questions arise.

- [ ] 6. Product catalog — API and data layer
  - Implement `GET /api/products`: query active products with category filter, pagination (`page`, `limit`), join lowest PricingTier price, return `ProductCard[]`
  - Implement `GET /api/products/[slug]`: return product detail with variants, tiers, photos, sizeChart, videos
  - Implement `Pricing_Engine.resolvePrice(productId, cumulativeQty)`: query PricingTiers, find matching tier, return `TierPriceResult`; fall back to base price if no tier matches
  - Implement `GET /api/pricing/tier?productId=&cumulativeQty=`: Zod-validate inputs, delegate to Pricing_Engine
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 14.1, 14.2, 14.3_

  - [ ]* 6.1 Write property test for pricing tier resolution (Property 3)
    - **Property 3: Pricing tier resolution is monotonically correct**
    - Use `fcPricingTiers()` to generate non-overlapping tier arrays and arbitrary cumulative quantities; assert resolved price falls in correct tier and price never increases with higher quantity
    - `// Feature: b2b-wholesale-apparel-platform, Property 3: pricing tier resolution monotonically correct`
    - **Validates: Requirements 5.4**

- [ ] 7. Product catalog — storefront pages
  - Build `/catalog` RSC page: product grid with `<ProductCard />` components (photo, name, price-from, GSM, link), skeleton loaders while loading
  - Build `/product/[slug]` RSC page: display name, description, GSM, fabric, photos, size chart, video section, active variants grouped by size with colour selectors; return 404 for unknown slug
  - Build `/pricing` page: PricingTier data grouped by Category with min qty, max qty (or "and above"), and price per piece
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 14.1, 14.2, 14.3_

- [ ] 8. Size × Quantity Matrix component
  - Implement `<ProductMatrix />` client component with `MatrixRow[]` state
  - Render one row per active size: size label, colour selector (updates `variantId`), quantity input, live unit price, line subtotal
  - Implement pure function `validateMultiple(qty, multiple): boolean` — `qty > 0 && qty % multiple === 0`
  - On qty or colour change: debounce 150ms, call `GET /api/pricing/tier` with cumulative qty, update all row unit prices; update running total and estimated order value
  - Visually flag rows where `isValidMultiple = false`; disable "Add to Cart" if any active row is invalid
  - On "Add to Cart": filter rows `qty > 0 && isValidMultiple`, POST `/api/cart/bulk-add`; on success update Zustand cart badge and show inline toast; on failure revert optimistic update and show error
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.9_

  - [ ]* 8.1 Write property test for quantity multiple validation (Property 2)
    - **Property 2: Quantity multiple validation is symmetric**
    - Use `fc.integer({ min: 1 })` for M and `fc.integer({ min: 0 })` for Q; assert `validateMultiple(Q, M)` iff `Q > 0 && Q % M === 0`
    - `// Feature: b2b-wholesale-apparel-platform, Property 2: quantity multiple validation symmetric`
    - **Validates: Requirements 5.3, 6.2**

  - [ ]* 8.2 Write property test for bulk-add validation (Property 5)
    - **Property 5: Bulk-add cart operation respects quantity multiples**
    - Generate bulk-add payloads where all rows are valid multiples → assert HTTP 200; generate payloads with at least one invalid multiple → assert HTTP 422 / rejection
    - `// Feature: b2b-wholesale-apparel-platform, Property 5: bulk-add idempotent w.r.t. quantity multiples`
    - **Validates: Requirements 5.3, 5.8**

- [ ] 9. Implement `POST /api/cart/bulk-add`
  - Zod-validate `BulkAddPayload`; for each row verify variantId active, qty > 0, qty is valid multiple for category
  - Re-compute unit prices via Pricing_Engine (ignore client-submitted prices)
  - Upsert CartItems for authenticated user session; return `{ cartItemCount, addedItems }`
  - _Requirements: 5.5, 5.8, 23.1, 23.6_

- [ ] 10. Shopping cart — API and page
  - Implement `GET /api/cart`, `PATCH /api/cart/item/[id]`, `DELETE /api/cart/item/[id]` with Zod validation, multiple re-validation, tier re-pricing
  - Implement `POST /api/discount/validate`: look up DiscountCode, enforce all six constraints (active, not expired, usedCount < maxUses, minOrderQty); rate-limit 20 req/min/IP; return structured error on any failure
  - Build `/cart` page with React Query: CartItems grouped by product, inline qty edit, remove button, discount code input, live running total (tiers + discount + shipping estimate), "Copy Order" clipboard/share button
  - Set up Zustand store for cart item count and slide-out menu open state
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 23.2, 23.5_

  - [ ]* 10.1 Write property test for discount code validation (Property 6)
    - **Property 6: Discount code validation enforces all constraints simultaneously**
    - Generate discount codes with arbitrary combinations of active/expired/exhausted/minQty constraints; assert code valid iff ALL constraints pass
    - `// Feature: b2b-wholesale-apparel-platform, Property 6: discount code validation enforces all constraints`
    - **Validates: Requirements 6.4, 6.5, 20.3, 20.4**

- [ ] 11. Checkpoint — catalog, matrix, and cart complete
  - Ensure all tests pass through task 10. Confirm pricing tier resolution, matrix live updates, bulk-add, cart edits, and discount validation work correctly. Ask the user if questions arise.

- [ ] 12. Checkout — address, shipping, and order review
  - Build `/checkout` multi-step page (Address → Shipping → Review → Payment)
  - Address form: country selector (India / Other), line 1, city, state, pincode; validate 6-digit pincode and Indian state when country = India
  - Implement `POST /api/shipping/calculate`: Zod-validate pincode format and `totalPieces >= 1`; return applicable ShippingMethods filtering region-limited methods by pincode
  - Display active ShippingMethods with name, ETA, cost; hide region-limited methods whose pincode does not qualify
  - Display order review section: all OrderItems, discount applied, shipping cost, grand total
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 13.1, 13.2, 13.3, 13.4_

- [ ] 13. Payment — Razorpay and COD
  - Implement COD path in `POST /api/orders`: Zod-validate `PlaceOrderRequest`, re-compute total via Pricing_Engine, create Order + OrderItems in a DB transaction, clear cart
  - Implement Razorpay path: load `razorpay.js` on client checkout step, open modal on submit; on `payment.success` POST `/api/orders` with `razorpayPaymentId`; server verifies Razorpay signature, asserts computed total matches verified amount, creates Order
  - On Razorpay failure/cancellation: do not create Order, display failure message with retry option
  - Trigger WhatsApp order confirmation after Order is committed (non-blocking, log failures to `NotificationLog`)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 23.6_

  - [ ]* 13.1 Write property test for server-side total re-computation (Property 4)
    - **Property 4: Server-side total re-computation matches client-expected total**
    - Use `fcCartItems(tiers)` generator; assert server-computed total equals sum of `qty * resolvedUnitPrice` minus discount plus shipping for any valid cart
    - `// Feature: b2b-wholesale-apparel-platform, Property 4: server-side total recomputation`
    - **Validates: Requirements 8.7, 23.6**

  - [ ]* 13.2 Write property test for order total round-trip (Property 9)
    - **Property 9: Order total computation round-trip**
    - Generate OrderItem sets, persist to DB in test transaction, read back; assert each item `subtotal = qty * unitPrice` and `Order.totalAmount = sum(subtotals) - discount + shipping`
    - `// Feature: b2b-wholesale-apparel-platform, Property 9: order total round-trip`
    - **Validates: Requirements 8.3, 8.7**

- [ ] 14. Customer account pages
  - Build `/account` page (auth-gated): display Orders sorted by most recent, showing order ID, date, status, items, total, tracking number when available
  - Display tracking number and courier link on orders with status DISPATCHED
  - Implement `PDF_Generator`: on-demand invoice PDF generation per Order (use `@react-pdf/renderer` or `pdfkit`), served via `GET /api/account/orders/[id]/invoice`
  - Build `/account/credit-line` page: credit line widget (limit, used, available), CreditTransaction ledger, "Pay to Settle" button triggering Razorpay for outstanding balance
  - Implement `GET /api/account/credit-line` and `POST /api/account/credit-line/settle`
  - Build `/account/referral` page: unique referral link display, earnings total, per-order earnings ledger, payout request button
  - Implement `GET /api/account/referral`; auto-create Referral record on first access
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.4, 10.5, 11.1, 11.4, 11.5_

  - [ ]* 14.1 Write property test for credit line invariant (Property 7)
    - **Property 7: Credit line invariant — used amount never exceeds limit**
    - Generate arbitrary sequences of CHARGE and SETTLEMENT transactions against `fcCreditLine()` instances; assert `0 <= usedAmount <= limitAmount` after every operation and CHARGE is rejected when it would exceed limit
    - `// Feature: b2b-wholesale-apparel-platform, Property 7: credit line invariant`
    - **Validates: Requirements 10.2, 10.3, 10.6**

- [ ] 15. Stock page and stock alert subscriptions
  - Implement `GET /api/stock`: return all active ProductVariants with SKU, size, colour, stockQty, and `isSubscribed` flag for authenticated user
  - Build `/stock` page: live stock table with "Out of Stock" + "Notify Me" button for zero-stock variants; "Notified" state if subscription exists
  - Implement `POST /api/stock/alert-subscribe`: Zod-validate variantId; upsert StockAlertSubscription (no duplicates per user-variant)
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [ ]* 15.1 Write property test for stock alert deduplication (Property 8)
    - **Property 8: Stock alert subscriptions are deduplicated per user-variant pair**
    - Generate arbitrary numbers of subscribe calls for the same user-variant pair; assert DB contains at most one active subscription
    - `// Feature: b2b-wholesale-apparel-platform, Property 8: stock alert subscriptions deduplicated`
    - **Validates: Requirements 12.3, 12.4**

- [ ] 16. Shipping calculator page
  - Build `/shipping-calculator` page: form accepting pincode and total piece count; on submit call `POST /api/shipping/calculate`; display applicable methods with cost and ETA; show inline errors on invalid inputs
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 17. Checkpoint — storefront feature-complete
  - Ensure all tests pass through task 16. Verify checkout flow, payment paths, account pages, stock alerts, and shipping calculator. Ask the user if questions arise.

- [ ] 18. Admin dashboard
  - Build `/admin` dashboard RSC page (admin auth guard on layout): today's units sold, 30-day units sold, today's revenue, 30-day revenue, top 5 products by revenue
  - Display pending orders queue (status PLACED or CONFIRMED)
  - Display low-stock alerts when `stockQty` falls below configurable threshold
  - Compute rotating banner stat: sum of OrderItem quantities for Orders in last 30 days
  - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [ ] 19. Admin product management
  - Build `/admin/products` with product list table and create/edit forms (React Hook Form + Zod): name, category, description, GSM, fabric, base price, active toggle
  - Implement photo upload with `react-dropzone`: drag-and-drop, `POST /api/admin/products/[id]/photos`, persist `sortOrder`; support reordering
  - Implement size chart upload and structured measurement data editor per product
  - Implement ProductVariant CRUD sub-table: size, colour, SKU, stockQty, active toggle
  - Implement PricingTier table editor: min qty, max qty, price per piece; on save call audit logger
  - Implement `Audit_Logger.record(adminId, action, entity, before, after)` writing to `AuditLog` table
  - When product `active = false`, ensure catalog API filters it out and bulk-add rejects its variants
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 23.7_

  - [ ]* 19.1 Write property test for audit log completeness (Property 11)
    - **Property 11: Audit log completeness for sensitive operations**
    - Generate arbitrary admin actions on PricingTier, DiscountCode, and CreditLine; assert exactly one AuditLog record per action containing adminId, actionType, timestamp, before, after values
    - `// Feature: b2b-wholesale-apparel-platform, Property 11: audit log completeness`
    - **Validates: Requirements 16.6, 18.3, 20.5, 23.7**

- [ ] 20. Admin order management
  - Build `/admin/orders` with TanStack Table: server-side filter by status, date range, customer name/phone, payment mode; pagination
  - Inline status dropdown: `PATCH /api/admin/orders/[id]` — persist status, enqueue WhatsApp notification
  - Tracking number input field for DISPATCHED orders; store and surface to customer
  - Manual cancellation: reason field, update status to CANCELLED; flag PREPAID cancellations for manual refund
  - CSV export: `GET /api/admin/orders?format=csv` with active filters
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7_

- [ ] 21. Admin customer and credit line management
  - Build `/admin/customers`: customer list (name, phone, email, order count, total order value); click-through to customer detail
  - Customer detail: full order history, CreditLine details (limit, used, available), CreditTransaction ledger
  - SUPER_ADMIN: edit `CreditLine.limitAmount` (audit logged), record manual SETTLEMENT (creates CreditTransaction, reduces usedAmount)
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 22. Admin discount code management
  - Build `/admin/discounts` (SUPER_ADMIN only): list and create/edit DiscountCode records
  - Create form: code, type (PERCENT/FLAT), value, optional minOrderQty, maxUses, expiresAt; enforce case-insensitive uniqueness
  - Auto-deactivate code when `usedCount >= maxUses`; reject validation when `expiresAt` is past
  - Audit log all create and modify actions
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ] 23. Admin content management
  - Build `/admin/content`: CRUD for FAQEntry (question, answer, sortOrder), rich-text editor for 5 policy pages, homepage rotating banner editor, ProductVideo CRUD (product, URL, title)
  - Build `/admin/shipping-methods`: CRUD for ShippingMethod (name, description, ETA, cost, regionLimited, active); changes reflected on Storefront on next load without deployment
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6_

- [ ] 24. Admin analytics
  - Build `/admin/analytics` (SUPER_ADMIN only): sales trend charts by product and category with configurable time period filter (recharts or Chart.js)
  - Discount code usage report table: code, uses, total discount given, revenue from orders using that code
  - Implement `GET /api/admin/analytics?from=&to=&groupBy=`: aggregate OrderItems, apply date range filter, return `{ salesTrend, topProducts, discountReport }`
  - _Requirements: 22.1, 22.2, 22.3_

- [ ] 25. Checkpoint — admin panel complete
  - Ensure all tests pass through task 24. Verify role gating, audit logging, order lifecycle management, discount enforcement, and analytics queries. Ask the user if questions arise.

- [ ] 26. WhatsApp notifications
  - Implement `WhatsApp_Notifier.send(templateName, phone, params)` using WhatsApp Business API (Twilio or Meta Cloud API); async, non-blocking
  - Wire notifier to: order creation (confirmation), order status change (dispatch alert with tracking), stock restock (alert subscribers), user registration (welcome)
  - On delivery failure: write to `NotificationLog` (event, userId, payload, errorCode, createdAt); never propagate to HTTP response
  - Build admin message template editor (Req 21.4): per-type template stored in DB, loaded at send time
  - Implement admin "broadcast stock alert" endpoint: send to all active StockAlertSubscriptions for selected variant, mark subscriptions notified
  - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6_

- [ ] 27. Referral program — order association and earnings
  - On new user registration with a referral code: associate user with referrer's Referral record
  - When referred order status changes to CONFIRMED: create ReferralEarning, update `Referral.earningsTotal`
  - SUPER_ADMIN: approve/process payout requests, adjust commission rate
  - _Requirements: 11.2, 11.3, 11.6_

- [ ] 28. Global header and slide-out menu
  - Build `<Header />` with logo, tagline, live rotating banner (polling `GET /api/products/stats/units-sold`), navigation links, live cart badge (Zustand)
  - Build slide-out menu: credit line widget (`GET /api/account/credit-line`), referral link, WhatsApp quick-connect button, billing details, invoices & tracking link, shipping calculator link, pricing page link, product videos page link, contact/about/FAQ links
  - _Requirements: 25.4, 25.5_

- [ ] 29. PWA support
  - Create `public/manifest.json` with name, short_name, icons, start_url, display, theme_color, background_color
  - Add `<link rel="manifest">` in root layout; configure service worker via `next-pwa` or custom registration
  - Implement `<PWAInstallPrompt />` component: listen for `beforeinstallprompt`, defer prompt, show install button, call `prompt()` on click
  - Define icons and splash screens in manifest matching installed icon
  - _Requirements: 24.1, 24.2, 24.3_

- [ ] 30. Static and content pages
  - Build `/contact`, `/about`, `/sitemap` pages with static content
  - Build `/faq` page: fetch FAQEntry records ordered by `sortOrder`, render as accordion component
  - Build `/policy/privacy`, `/policy/shipping`, `/policy/returns`, `/policy/terms`, `/policy/disclaimer` pages: render rich-text content from DB
  - Build `/product-videos` page listing all ProductVideo records
  - Build homepage (`/`): hero section with value proposition cards, trust stats bar, featured categories carousel, FAQ accordion
  - _Requirements: 25.1, 25.2, 25.3_

- [ ] 31. Non-functional hardening
  - Audit every API route: confirm Zod schema applied to all request bodies and query params; return HTTP 422 with field-level errors on failure
  - Confirm rate-limiting middleware (20 req/min/IP) applied to `/api/discount/validate` and `/api/orders`
  - Verify all monetary values formatted as `₹X,XXX` throughout the Storefront
  - Add skeleton loader components to all data-fetching pages (catalog, product detail, cart, matrix)
  - Confirm `withErrorHandler` HOC wraps all API route handlers to prevent stack trace leakage
  - Verify mobile-first layout renders correctly at 320px viewport
  - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6, 23.7_

  - [ ]* 31.1 Write property test for Zod schema exhaustive rejection (Property 12 — extended coverage)
    - **Property 12: Zod schema validation rejects all malformed API inputs**
    - For every defined Zod schema, generate payloads violating each constraint in isolation; assert HTTP 422 and zero DB mutations
    - `// Feature: b2b-wholesale-apparel-platform, Property 12: Zod schema rejects all malformed inputs`
    - **Validates: Requirements 23.1**

- [ ] 32. Final checkpoint — full platform
  - Run full test suite (`vitest --run`). Ensure all unit tests and property-based tests pass. Verify seed script runs cleanly. Confirm auth, catalog, matrix, cart, checkout, account, admin, notifications, analytics, PWA, and static pages are wired end-to-end. Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional property-based testing subtasks and can be skipped for a faster MVP; all other subtasks are required
- Property tests use `fast-check` with `numRuns: 100` minimum and the tag comment `// Feature: b2b-wholesale-apparel-platform, Property N: ...`
- All 12 correctness properties from the design document are covered: Properties 1–12 mapped to tasks 3.1, 8.1, 6.1, 13.1, 8.2, 10.1, 14.1, 15.1, 13.2, 4.1, 19.1, 31.1 respectively
- Every task references specific requirement numbers for traceability
- Checkpoints at tasks 5, 11, 17, 25, and 32 ensure incremental validation throughout the build
