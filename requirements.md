# Requirements Document

## Introduction

A production-grade B2B wholesale apparel ecommerce platform for a plain t-shirt, hoodie, and apparel manufacturer selling in bulk to printing businesses and resellers. The platform consists of a customer-facing storefront and a role-gated admin panel. It is built on Next.js 14+ (App Router), TypeScript, TailwindCSS, PostgreSQL + Prisma ORM, NextAuth.js, Razorpay, and S3-compatible file storage.

---

## Glossary

- **System**: The B2B Wholesale Apparel Ecommerce Platform as a whole
- **Storefront**: The customer-facing Next.js application
- **Admin Panel**: The role-gated management interface at `/admin`
- **User**: A registered or guest customer on the Storefront
- **Admin**: A platform operator with role STAFF or SUPER_ADMIN
- **Product**: A base apparel item (e.g., T-shirt, Hoodie) with variants
- **ProductVariant**: A specific SKU defined by product + size + color combination
- **Category**: A grouping of products with a minimum quantity multiple rule (e.g., T-shirts require multiples of 10)
- **PricingTier**: A quantity range with an associated per-piece price for a product
- **Cart**: A session-scoped or user-scoped collection of CartItem records
- **CartItem**: A single line in the Cart referencing a ProductVariant with a quantity
- **Order**: A confirmed purchase record derived from the Cart
- **OrderItem**: A line item within an Order
- **Matrix**: The Size × Quantity ordering widget on the product detail page
- **DiscountCode**: A coupon code with percent or flat discount, usage limits, and expiry
- **CreditLine**: A buy-now-pay-later credit facility assigned per customer
- **CreditTransaction**: A debit or settlement event against a CreditLine
- **Referral**: A customer's affiliate program record with a unique code and earnings ledger
- **ReferralEarning**: A credit event for the referrer when a referred order is placed
- **ShippingMethod**: A configurable shipping option with name, cost, ETA, and optional region restriction
- **StockAlertSubscription**: A record linking a User to a ProductVariant for restock notifications
- **FAQEntry**: A question-answer pair displayed on the FAQ page
- **WhatsApp_Notifier**: The component responsible for sending WhatsApp Business API messages
- **Razorpay_Gateway**: The payment processing integration for prepaid orders
- **Validator**: The server-side Zod-based input validation layer
- **Pricing_Engine**: The server-side service that resolves per-piece price from PricingTier records
- **Audit_Logger**: The component that records admin actions on pricing, discounts, and credit lines
- **PDF_Generator**: The component that produces invoice PDFs for orders

---

## Requirements

### Requirement 1: User Registration and Authentication

**User Story:** As a wholesale buyer, I want to register and log in with my phone number and password, so that I can place orders and manage my account.

#### Acceptance Criteria

1. WHEN a user submits a registration form, THE Validator SHALL verify that the phone number is exactly 10 digits and starts with 6, 7, 8, or 9.
2. IF a user submits a phone number that fails validation, THEN THE System SHALL return a descriptive error message without creating an account.
3. WHEN a user registers successfully, THE System SHALL create a User record with role CUSTOMER and send a WhatsApp welcome message.
4. WHEN a registered user submits valid credentials, THE System SHALL create an authenticated session via NextAuth.js.
5. IF a user submits incorrect credentials, THEN THE System SHALL return an authentication error without revealing which field is incorrect.
6. WHEN a user logs out, THE System SHALL invalidate the session and redirect to the home page.
7. THE System SHALL support optional email address on the User record, with uniqueness enforced only when provided.

---

### Requirement 2: Admin Authentication and Role-Based Access

**User Story:** As a platform operator, I want to log in to the admin panel with role-gated access, so that I can manage the platform securely.

#### Acceptance Criteria

1. WHEN an admin submits valid credentials at `/admin/login`, THE System SHALL issue a JWT session with the admin's role (STAFF or SUPER_ADMIN).
2. WHILE a request targets any `/admin/*` route, THE System SHALL verify the JWT session and reject unauthenticated requests with HTTP 401.
3. WHILE a STAFF role admin attempts to access credit line configuration or discount code creation endpoints, THE System SHALL reject the request with HTTP 403.
4. THE System SHALL restrict credit line limit adjustment and discount code CRUD to SUPER_ADMIN role only.
5. WHEN an admin session expires, THE System SHALL redirect the admin to the admin login page.

---

### Requirement 3: Product Catalog — Browsing and Filtering

**User Story:** As a wholesale buyer, I want to browse and filter the product catalog, so that I can find the apparel items I need.

#### Acceptance Criteria

1. THE Storefront SHALL display a product grid at `/catalog` showing all active products.
2. WHEN a user applies a category filter, THE Storefront SHALL display only products belonging to that category.
3. WHEN a user views the catalog, THE Storefront SHALL display each product card with: photo, name, price-from (lowest PricingTier price), GSM, and a "View & Add to Cart" link.
4. WHEN a product has no active ProductVariants, THE Storefront SHALL not display that product in the catalog grid.
5. THE Storefront SHALL render the catalog page with skeleton loaders while product data is loading.

---

### Requirement 4: Product Detail Page

**User Story:** As a wholesale buyer, I want to view full product details including photos, specs, and size charts, so that I can make an informed purchasing decision.

#### Acceptance Criteria

1. WHEN a user navigates to `/product/[slug]`, THE Storefront SHALL display product name, description, GSM, fabric composition, all product photos, and the size chart.
2. THE Storefront SHALL display the Size × Quantity Matrix widget on the product detail page.
3. WHEN a product has associated videos, THE Storefront SHALL render a product video section on the detail page.
4. IF a product slug does not exist, THEN THE Storefront SHALL return a 404 page.
5. WHEN a user views a product detail page, THE Storefront SHALL display all active ProductVariants grouped by size with colour selectors.

---

### Requirement 5: Size × Quantity Matrix (Core Ordering UX)

**User Story:** As a wholesale buyer, I want to enter quantities per size and colour directly in a matrix table, so that I can build a bulk order efficiently.

#### Acceptance Criteria

1. THE Matrix SHALL render one row per active size for the product, each with: size label, colour selector, quantity input, live unit price, and line subtotal.
2. WHEN a user changes a quantity input, THE Matrix SHALL update the running total of pieces and the estimated order value within 150ms.
3. WHEN a user enters a quantity that is not a valid multiple of the Category's `qtyMultiple`, THE Matrix SHALL visually flag the row as invalid and prevent adding to cart.
4. WHEN the cumulative quantity across all rows changes, THE Pricing_Engine SHALL resolve the applicable PricingTier and update each row's unit price live.
5. WHEN a user clicks "Add to Cart", THE System SHALL batch all rows with qty > 0 into a single POST request to `/api/cart/bulk-add`.
6. WHEN the bulk-add request succeeds, THE Storefront SHALL update the cart badge count optimistically and display an inline success toast without a page reload.
7. IF the bulk-add request fails server-side validation, THEN THE Storefront SHALL display an error message and revert any optimistic UI changes.
8. THE Pricing_Engine SHALL re-validate all quantities and prices server-side on every bulk-add request, ignoring client-computed totals.
9. WHEN a user selects a different colour in a Matrix row, THE Matrix SHALL update the variantId for that row to the correct ProductVariant for that size-colour combination.

---

### Requirement 6: Shopping Cart

**User Story:** As a wholesale buyer, I want to review and edit my cart before checkout, so that I can confirm my order composition and apply discounts.

#### Acceptance Criteria

1. THE Storefront SHALL display the current Cart at `/cart` with all CartItems grouped by product.
2. WHEN a user edits a quantity in the cart, THE System SHALL re-validate the quantity against `qtyMultiple` and re-apply PricingTier logic.
3. WHEN a user removes a CartItem, THE System SHALL delete that CartItem and recalculate the cart total.
4. WHEN a user enters a discount code, THE System SHALL validate it via POST `/api/discount/validate` and apply the discount if valid.
5. IF a discount code is expired, exhausted, or does not meet minimum order quantity, THEN THE System SHALL display a descriptive error and not apply the discount.
6. THE Cart page SHALL display a live running total that reflects quantity-based tier pricing, applied discount codes, and shipping estimates.
7. WHEN a user clicks "Copy Order", THE System SHALL generate a plain-text summary of all cart items and copy it to the clipboard or open a share sheet on mobile.
8. THE System SHALL rate-limit discount code validation requests to prevent brute-force abuse.

---

### Requirement 7: Checkout — Address and Shipping

**User Story:** As a wholesale buyer, I want to enter a delivery address and choose a shipping method, so that I can complete my order.

#### Acceptance Criteria

1. THE Checkout page SHALL present an address form with: country selector (India / Other Country), line 1, city, state, and pincode fields.
2. WHEN a user selects "India" as country, THE Validator SHALL require a 6-digit pincode and an Indian state selection.
3. THE Checkout page SHALL display all active ShippingMethods with name, ETA text, and cost.
4. WHEN a ShippingMethod has `regionLimited = true`, THE System SHALL display it only if the user's pincode falls within the allowed region.
5. WHEN a user submits the checkout form with invalid address data, THE Validator SHALL return field-level error messages without submitting the order.
6. THE Checkout page SHALL display an order review section summarising all OrderItems, discount applied, shipping cost, and grand total before the user confirms.

---

### Requirement 8: Payment — Razorpay and Cash on Delivery

**User Story:** As a wholesale buyer, I want to pay via UPI, card, netbanking, or cash on delivery, so that I can choose the payment method that suits me.

#### Acceptance Criteria

1. THE Checkout page SHALL offer a COD toggle alongside the Razorpay prepaid option.
2. WHEN a user selects prepaid, THE System SHALL initiate a Razorpay payment session and redirect to the Razorpay checkout widget.
3. WHEN Razorpay confirms payment success, THE System SHALL create an Order with status PLACED and paymentMode PREPAID.
4. WHEN a user selects COD, THE System SHALL create an Order with status PLACED and paymentMode COD without initiating a payment session.
5. IF the Razorpay payment fails or is cancelled, THEN THE System SHALL not create an Order and SHALL display a failure message with a retry option.
6. WHEN an Order is created, THE WhatsApp_Notifier SHALL send an order confirmation message to the user's phone number.
7. THE System SHALL server-side re-validate the total amount against current PricingTier data before creating an Order, rejecting requests where the client-submitted total does not match the server-computed total.

---

### Requirement 9: Order Management — Customer

**User Story:** As a wholesale buyer, I want to view my order history and track shipments, so that I can stay informed about my purchases.

#### Acceptance Criteria

1. THE Account page SHALL display all Orders for the authenticated user at `/account`, sorted by most recent first.
2. WHEN a user views an order, THE System SHALL display order ID, date, status, items, total amount, and tracking number if available.
3. WHEN an Order has status DISPATCHED, THE System SHALL display the tracking number and courier link on the order detail view.
4. THE PDF_Generator SHALL produce a downloadable invoice PDF for any Order on request.
5. WHEN an Order status changes, THE WhatsApp_Notifier SHALL send a status update message to the user.

---

### Requirement 10: Credit Line

**User Story:** As a trusted wholesale buyer, I want to use a buy-now-pay-later credit facility, so that I can place orders without immediate payment.

#### Acceptance Criteria

1. THE System SHALL display the credit line widget in the navigation slide-out menu showing: limit amount, used amount, and available amount for authenticated users with a CreditLine.
2. WHEN a user with available credit chooses "Use Credit" at checkout, THE System SHALL create an Order and a CreditTransaction of type CHARGE for the order total.
3. WHEN the CreditTransaction is created, THE System SHALL update `CreditLine.usedAmount` by adding the transaction amount.
4. WHEN a user clicks "Pay to Settle" in the account credit line tab, THE System SHALL initiate a Razorpay payment for the outstanding balance.
5. WHEN the settlement payment succeeds, THE System SHALL create a CreditTransaction of type SETTLEMENT and reduce `CreditLine.usedAmount` accordingly.
6. IF a user's available credit (limitAmount − usedAmount) is less than the order total, THEN THE System SHALL reject the credit payment and display an insufficient credit message.
7. THE System SHALL restrict CreditLine.limitAmount updates to SUPER_ADMIN users only.

---

### Requirement 11: Referral Program

**User Story:** As a wholesale buyer, I want to refer other businesses to the platform and earn commissions, so that I can reduce my purchasing costs.

#### Acceptance Criteria

1. THE System SHALL create a Referral record with a unique code for each User upon first access of the referral tab.
2. WHEN a new user registers using a referral code, THE System SHALL associate the new user's first order with the referrer's Referral record.
3. WHEN a referred order reaches status CONFIRMED, THE System SHALL create a ReferralEarning record and update `Referral.earningsTotal`.
4. THE Account referral tab SHALL display the user's unique referral link, total earnings, and a per-order earnings ledger.
5. WHEN a user requests a payout from the referral tab, THE System SHALL record the request for admin review.
6. THE System SHALL allow SUPER_ADMIN to approve and process referral payouts and to adjust the commission rate.

---

### Requirement 12: Live Stock Page

**User Story:** As a wholesale buyer, I want to see live inventory levels before ordering, so that I can plan my purchases around available stock.

#### Acceptance Criteria

1. THE Storefront SHALL display a live stock table at `/stock` showing all active ProductVariants with SKU, size, colour, and current `stockQty`.
2. WHEN a ProductVariant has `stockQty = 0`, THE System SHALL display it as "Out of Stock" with a "Notify Me" button.
3. WHEN a user clicks "Notify Me" on an out-of-stock variant, THE System SHALL create a StockAlertSubscription record for that user and variant.
4. IF the user already has a StockAlertSubscription for that variant, THEN THE System SHALL display a "Notified" state on the button instead of allowing duplicate subscriptions.
5. WHEN admin updates a ProductVariant's `stockQty` above 0 for a variant with active subscriptions, THE WhatsApp_Notifier SHALL send restock notifications to all subscribed users.

---

### Requirement 13: Shipping Calculator

**User Story:** As a wholesale buyer, I want to estimate shipping costs before checkout, so that I can budget my order accurately.

#### Acceptance Criteria

1. THE Storefront SHALL provide a shipping calculator at `/shipping-calculator` accepting pincode and total piece count as inputs.
2. WHEN a user submits the calculator form, THE System SHALL return all applicable ShippingMethods with estimated cost and ETA for the given inputs.
3. IF the pincode does not match any region for a region-limited ShippingMethod, THEN THE System SHALL exclude that method from the results.
4. THE Validator SHALL reject shipping calculator requests where piece count is less than 1 or pincode is not a valid format.

---

### Requirement 14: Pricing Page

**User Story:** As a wholesale buyer, I want to see the complete pricing tiers for all products, so that I can understand volume discounts before ordering.

#### Acceptance Criteria

1. THE Storefront SHALL display a pricing page at `/pricing` showing PricingTier data for all active products, grouped by Category.
2. WHEN the admin updates a PricingTier, THE pricing page SHALL reflect the updated price on next load.
3. THE pricing page SHALL display minimum quantity, maximum quantity (or "and above"), and price per piece for each tier.

---

### Requirement 15: Admin Dashboard

**User Story:** As an admin, I want to view key business metrics at a glance, so that I can monitor platform health and act on operational priorities.

#### Acceptance Criteria

1. THE Admin Panel SHALL display a dashboard at `/admin` showing: today's units sold, 30-day units sold, today's revenue, 30-day revenue, and the top 5 products by revenue.
2. THE Admin Panel SHALL display a pending orders queue showing Orders with status PLACED or CONFIRMED.
3. WHEN a ProductVariant's `stockQty` falls below a configurable threshold, THE Admin Panel SHALL display a low-stock alert on the dashboard.
4. THE Admin Panel SHALL compute the rotating banner statistic (units sold in last 30 days) from the sum of OrderItem quantities for Orders created in that window.

---

### Requirement 16: Admin Product Management

**User Story:** As an admin, I want to create and manage products with photos, variants, and pricing tiers, so that the catalog stays accurate.

#### Acceptance Criteria

1. WHEN a SUPER_ADMIN or STAFF admin creates a product, THE System SHALL require: name, category, description, GSM, fabric composition, and base price.
2. THE Admin Panel SHALL support drag-and-drop photo upload and reordering for ProductPhoto records, persisting `sortOrder` values.
3. THE Admin Panel SHALL allow upload or update of a SizeChart image and structured measurement data per product.
4. THE Admin Panel SHALL support CRUD operations for ProductVariants with fields: size, colour, SKU, stockQty, and active toggle.
5. THE Admin Panel SHALL support a table editor for PricingTiers per product: min qty, max qty, and price per piece.
6. WHEN an admin saves PricingTier changes, THE Audit_Logger SHALL record the change with the admin's ID, timestamp, previous values, and new values.
7. WHEN an admin sets a product's `active` flag to false, THE Storefront SHALL no longer display that product in the catalog or allow new cart additions of its variants.

---

### Requirement 17: Admin Order Management

**User Story:** As an admin, I want to manage orders through their lifecycle and export order data, so that I can fulfil orders efficiently.

#### Acceptance Criteria

1. THE Admin Panel SHALL display a searchable, filterable order table supporting filters by: status, date range, customer name/phone, and payment mode.
2. WHEN an admin updates an Order's status, THE System SHALL persist the new status and trigger a WhatsApp notification to the customer.
3. WHEN an admin enters a tracking number for an Order with status DISPATCHED, THE System SHALL store the tracking number and make it visible to the customer.
4. THE Admin Panel SHALL support manual order cancellation with a reason field.
5. WHEN an admin cancels a COD order, THE System SHALL update the status to CANCELLED without triggering a refund.
6. WHEN an admin cancels a PREPAID order, THE System SHALL flag it for manual refund processing.
7. THE Admin Panel SHALL support CSV export of Orders filtered by the current active filters.

---

### Requirement 18: Admin Customer and Credit Line Management

**User Story:** As a SUPER_ADMIN, I want to manage customer credit lines and view customer order history, so that I can extend and manage credit responsibly.

#### Acceptance Criteria

1. THE Admin Panel SHALL display a customer list with: name, phone, email, total order count, and total order value.
2. WHEN a SUPER_ADMIN selects a customer, THE Admin Panel SHALL display that customer's full order history and CreditLine details.
3. WHEN a SUPER_ADMIN updates a customer's `CreditLine.limitAmount`, THE Audit_Logger SHALL record the change with admin ID, timestamp, and before/after values.
4. THE Admin Panel SHALL display all CreditTransaction records for a customer's CreditLine with: type, amount, and timestamp.
5. WHEN a SUPER_ADMIN records a manual settlement, THE System SHALL create a CreditTransaction of type SETTLEMENT and reduce `usedAmount`.

---

### Requirement 19: Admin Content Management

**User Story:** As an admin, I want to manage FAQs, policy pages, banners, and shipping methods through the admin panel, so that the storefront content stays current.

#### Acceptance Criteria

1. THE Admin Panel SHALL provide CRUD operations for FAQEntry records with fields: question, answer, and sortOrder.
2. THE Admin Panel SHALL provide a rich-text editor for each policy page (privacy, shipping, returns, terms, disclaimer).
3. THE Admin Panel SHALL provide an editor for the homepage rotating banner text and promo messages.
4. THE Admin Panel SHALL provide CRUD operations for ShippingMethod records with fields: name, description, ETA text, cost, regionLimited flag, and active toggle.
5. THE Admin Panel SHALL provide CRUD operations for ProductVideo records with fields: product, URL, and title.
6. WHEN an admin updates a ShippingMethod cost or ETA, THE Storefront SHALL reflect the changes on next load without a deployment.

---

### Requirement 20: Admin Discount Code Management

**User Story:** As a SUPER_ADMIN, I want to create and manage discount codes, so that I can run promotions for wholesale buyers.

#### Acceptance Criteria

1. WHEN a SUPER_ADMIN creates a DiscountCode, THE System SHALL require: code, type (PERCENT or FLAT), value, and optional min order qty, max uses, and expiry date.
2. THE System SHALL enforce uniqueness of discount code strings, case-insensitively.
3. WHEN a DiscountCode's `usedCount` reaches `maxUses`, THE System SHALL automatically mark the code as inactive.
4. WHEN a DiscountCode's `expiresAt` timestamp is in the past, THE System SHALL reject validation attempts for that code.
5. WHEN a SUPER_ADMIN creates or modifies a DiscountCode, THE Audit_Logger SHALL record the action with admin ID and timestamp.

---

### Requirement 21: WhatsApp Notifications

**User Story:** As a platform operator, I want transactional WhatsApp messages sent automatically for key events, so that customers stay informed without manual effort.

#### Acceptance Criteria

1. WHEN an Order is created, THE WhatsApp_Notifier SHALL send an order confirmation message containing: order ID, item summary, total amount, and payment mode.
2. WHEN an Order status changes to DISPATCHED, THE WhatsApp_Notifier SHALL send a dispatch alert containing: order ID, tracking number, and courier name.
3. WHEN a ProductVariant is restocked and has active StockAlertSubscriptions, THE WhatsApp_Notifier SHALL send a restock notification to each subscribed user.
4. THE Admin Panel SHALL provide a message template editor for each notification type (order confirmation, dispatch alert, stock alert).
5. WHEN an admin uses the "broadcast stock alert" feature, THE WhatsApp_Notifier SHALL send notifications to all active StockAlertSubscriptions for the selected variant.
6. IF a WhatsApp message delivery fails, THEN THE System SHALL log the failure with order/variant ID, user phone, error code, and timestamp without blocking the primary operation.

---

### Requirement 22: Analytics

**User Story:** As a SUPER_ADMIN, I want to view sales trends and discount usage, so that I can make data-driven business decisions.

#### Acceptance Criteria

1. THE Admin Panel analytics section SHALL display sales trend charts by product, category, and configurable time period.
2. THE Admin Panel SHALL display a discount code usage report showing: code, uses, total discount given, and revenue generated from orders using that code.
3. WHEN an admin selects a time period filter, THE System SHALL update all analytics charts and tables to reflect data within that period.

---

### Requirement 23: Non-Functional — Validation, Security, and Performance

**User Story:** As a platform operator, I want the platform to be secure, well-validated, and performant on mobile, so that the platform is production-ready.

#### Acceptance Criteria

1. THE Validator SHALL apply Zod schemas to every API route's request body and query parameters, rejecting malformed requests with HTTP 422 and field-level error details.
2. THE System SHALL rate-limit discount code validation and order placement endpoints to a maximum of 20 requests per minute per IP.
3. THE Storefront SHALL be mobile-first, rendering correctly on viewport widths from 320px.
4. THE System SHALL format all monetary values in INR using the ₹X,XXX format throughout the Storefront.
5. THE Storefront SHALL display skeleton loaders on all data-fetching pages (catalog, cart, matrix) until data is available.
6. THE System SHALL never trust client-computed monetary totals; THE Pricing_Engine SHALL re-compute all prices server-side before order creation.
7. THE Audit_Logger SHALL record all admin actions on pricing, discount codes, and credit lines with: admin ID, action type, timestamp, and before/after values.
8. THE System SHALL provide a database seed script populating: at least 3 Categories, 5 Products with Variants, PricingTiers, and one admin user for local development.

---

### Requirement 24: PWA Support

**User Story:** As a mobile wholesale buyer, I want to install the storefront as a PWA on my phone, so that I can access it quickly without a browser.

#### Acceptance Criteria

1. THE Storefront SHALL include a valid Web App Manifest file enabling installability on mobile browsers.
2. THE Storefront SHALL display an "Install App" prompt component when the `beforeinstallprompt` event is detected.
3. WHEN the PWA is installed, THE System SHALL serve the storefront icon and splash screen defined in the manifest.

---

### Requirement 25: Static and Content Pages

**User Story:** As a wholesale buyer, I want to access policy, contact, and about pages, so that I can make informed decisions about working with the company.

#### Acceptance Criteria

1. THE Storefront SHALL serve the following pages: `/contact`, `/about`, `/faq`, `/policy/privacy`, `/policy/shipping`, `/policy/returns`, `/policy/terms`, `/policy/disclaimer`, and `/sitemap`.
2. THE FAQ page SHALL render all FAQEntry records as an accordion component, ordered by `sortOrder`.
3. THE Storefront SHALL display a homepage with: a hero section with value proposition cards, a trust stats bar, a featured categories carousel, and a FAQ accordion.
4. THE Storefront's global header SHALL display: logo, tagline, live rotating banner (units sold in last 30 days and active promos), and navigation links with a live cart item count badge.
5. THE Storefront's global header slide-out menu SHALL include: credit line widget, referral program link, WhatsApp quick-connect button, billing details, invoices and tracking, shipping calculator link, pricing page link, product videos link, contact, about, and FAQ links.
