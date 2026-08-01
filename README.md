# 👕 NayaKapda — B2B Wholesale Apparel E-Commerce Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.2.10-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8.0-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-Private-red)](#license)

**NayaKapda** is a modern, high-performance **B2B Wholesale Apparel E-Commerce Platform** engineered specifically for screen printers, DTF printers, embroidery businesses, and wholesale resellers across India. 

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Prisma ORM**, NayaKapda simplifies bulk garment procurement through real-time **Size × Quantity Matrices**, volume-based **Slab Pricing**, automated **Razorpay Prepaid Payments**, role-gated **Admin Management**, and **Live Stock Notifications**.

---

## 📑 Table of Contents

- [Overview & Business Model](#-overview--business-model)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Architecture & Folder Structure](#-architecture--folder-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Database Setup & Seeding](#database-setup--seeding)
  - [Running the Application](#running-the-application)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Database Schema Overview](#-database-schema-overview)
- [Deployment Instructions](#-deployment-instructions)
- [Contributing Guidelines](#-contributing-guidelines)
- [License & Acknowledgments](#-license--acknowledgments)

---

## 🎯 Overview & Business Model

Traditional bulk garment procurement involves manual quotes, back-and-forth negotiation, and order delays. NayaKapda solves this by providing:

1. **Direct Slab-Based Pricing**: Transparent volume pricing tiers (e.g., 1–9 pcs @ ₹280/pc, 10+ pcs @ ₹233/pc). Higher quantities automatically unlock lower per-piece pricing.
2. **Size × Quantity Matrix**: A live, multi-variant grid allowing printers to order across multiple colors (Black, White, Navy, Olive, etc.) and sizes (S, M, L, XL, XXL) in a single click.
3. **Quantity Multiples Enforcement**: Server-side validation enforcing category-specific minimum order multiples (e.g., 10 pcs for Oversize 210gsm, 12 pcs for Polos).
4. **Prepaid Checkout**: Streamlined checkout restricted strictly to Online Payment / UPI / Netbanking via Razorpay.

---

## ✨ Key Features

### 🛍️ Customer Storefront & Procurement
- **Modern Light White UI**: Clean slate (`#F8FAFC`) canvas with pure white surfaces (`#FFFFFF`), slate-200 borders, high-contrast slate-900 typography, and NayaKapda warm orange (`#F97316`) brand accents.
- **Size × Quantity Order Matrix**: Interactive grid table with white input cells, diagonal out-of-stock patterns, real-time total piece calculator, and unit price slab updates.
- **Dynamic Category Tabs**: Horizontal tab pills (`All`, `Oversize 210gsm`, `Oversize 240gsm`, `Kids Rneck`, `Premium Polo`, etc.) linking directly to product detail matrix pages.
- **Cart & Guest Accessibility**: Full add-to-cart and shopping cart inspection without requiring login prior to final checkout.
- **Multi-Step Checkout**: 4-step wizard (Address Selection → Courier/Pickup Shipping → Order Review & Discount Code → Razorpay Online Payment).
- **Payment Success Page**: Dedicated confirmational screen displaying green checkmark banner, order breakdown, delivery address details, and 5% Textile GST calculation.

### 👤 Customer Account Dashboard
- **Order History & Tracking**: Detailed order status badges (`PLACED`, `CONFIRMED`, `DISPATCHED`, `DELIVERED`, `CANCELLED`), courier tracking numbers, and PDF invoice downloads (`@react-pdf/renderer`).
- **Credit Line Management**: Limit vs. used credit tracking, transaction history ledger, and payment settlement modal.
- **Referral Program**: Unique customer referral links, earnings tracker, and payout request system.

### 🛡️ Role-Gated Admin Panel (`/admin`)
- **Dashboard Analytics**: 30-day revenue KPIs, total order counts, pending order tracking, top products by revenue table, and daily sales trend reporting.
- **Order Management**: Status update controls (`PLACED` → `CONFIRMED` → `DISPATCHED` → `DELIVERED`), courier tracking input form, cancel reason logging, and CSV export.
- **Product & Variant Catalog**: Create/edit products, manage GSM & fabric composition, upload photo galleries, configure slab pricing tiers, and toggle active/inactive status.
- **Category Control**: Active/inactive toggle switches to hide/show category pills instantly across the platform.
- **Customer Directory**: View customer order counts, total spend, and manage credit line allocations.
- **Discount Codes**: Generate percentage or flat rupee promo codes with expiration dates and usage limits.

### 🚚 Shipping & Inventory Tools
- **Live Stock Availability (`/stock`)**: Real-time SKU-level inventory availability table with single-click "Notify Me" stock alert subscriptions.
- **Shipping Calculator (`/shipping-calculator`)**: Pincode coverage validator with instant rate estimates for Shiprocket Courier and Self Pickup.
- **Product Videos (`/product-videos`)**: Embedded YouTube and direct video demonstrations for fabric quality & print testing.

---

## 🛠️ Technology Stack

### Frontend & App Framework
- **Framework**: [Next.js 16.2.10](https://nextjs.org/) (App Router, Turbopack)
- **UI Library**: [React 19.2.4](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (Vanilla CSS tokens, `@import "tailwindcss"`)
- **State Management**: [Zustand 5.0](https://zustand-demo.pmnd.rs/) (Cart persistence via `persist` middleware)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod 4.x](https://zod.dev/)

### Backend, Database & Utilities
- **Language**: [TypeScript 5.x](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL 15+](https://www.postgresql.org/)
- **ORM**: [Prisma ORM 7.8.0](https://www.prisma.io/) with `@prisma/adapter-pg` driver
- **Authentication**: [NextAuth.js 4.x](https://next-auth.js.org/) (JWT strategy) + `bcryptjs`
- **Payment Gateway**: [Razorpay Node SDK 2.9.6](https://razorpay.com/)
- **PDF Generation**: [@react-pdf/renderer 4.5.1](https://react-pdf.org/)
- **Testing**: [Vitest 4.1.10](https://vitest.dev/) with `@testing-library/react` and `fast-check`

---

## 📁 Architecture & Folder Structure

```
nayakapda/
├── prisma/
│   ├── schema.prisma              # Database models, enums, & relations
│   ├── seed.ts                    # Database seed script (15 categories, 7 active products)
│   └── migrations/                # PostgreSQL schema migrations
├── public/                        # Static assets & PWA manifest
├── src/
│   ├── app/                       # Next.js App Router routes & pages
│   │   ├── (auth)/                # Login & Register pages
│   │   ├── account/               # Customer Dashboard (/account, /orders, /credit-line, /referral)
│   │   ├── admin/                 # Role-Gated Admin Panel (/admin, /orders, /products, /categories)
│   │   ├── api/                   # REST API Endpoints (Auth, Cart, Orders, Admin, Shipping)
│   │   ├── cart/                  # Shopping Cart page
│   │   ├── checkout/              # Multi-step checkout & /checkout/success page
│   │   ├── policy/[slug]/         # Privacy, Terms, Shipping, Returns & Disclaimer policy pages
│   │   ├── pricing/               # Volume Pricing slab matrix page
│   │   ├── product-videos/        # Video demonstrations page
│   │   ├── products/              # Catalog grid & Product Detail Matrix (/products/[slug])
│   │   ├── shipping-calculator/   # Pincode rate checker page
│   │   ├── stock/                 # Live stock availability page
│   │   ├── globals.css            # Global CSS tokens, buttons, cards, tables, & animations
│   │   ├── layout.tsx             # Root layout with suppressHydrationWarning
│   │   └── page.tsx               # Storefront Home Page
│   ├── components/
│   │   ├── layout/                # Navbar (desktop/mobile header) & Footer
│   │   └── products/              # ProductCard & SizeQuantityMatrix components
│   ├── lib/                       # Core utilities & server helpers
│   │   ├── auth.ts                # NextAuth configuration
│   │   ├── middleware.ts          # Auth guards & rate limiters
│   │   ├── pricing.ts             # Server-side pricing & multiple validation
│   │   ├── prisma.ts              # Prisma Client instance with pg adapter
│   │   ├── utils.ts               # formatINR, formatDate, slug generation
│   │   ├── validation.ts          # Zod validation schemas
│   │   └── whatsapp.ts            # WhatsApp API notification helper
│   ├── store/
│   │   └── cartStore.ts           # Zustand persistent client cart store
│   └── middleware.ts              # Route protection middleware
├── package.json                   # Dependencies & build scripts
├── tsconfig.json                  # TypeScript configuration
└── vite.config.ts                 # Vitest test runner configuration
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your environment:
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **PostgreSQL**: `v15` or higher running locally on port `5432`

---

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Badrinath960/NayaKapda.git
   cd NayaKapda/nayakapda
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment file and configure your database and API credentials:
   ```bash
   cp .env.example .env
   ```

---

### Database Setup & Seeding

1. **Create local PostgreSQL Database**:
   ```sql
   CREATE DATABASE nayakapda_tshirt;
   ```

2. **Run Migrations**:
   ```bash
   npm run db:migrate
   ```

3. **Seed Database**:
   Populates categories (Oversize 210gsm, 240gsm, Kids, Polos, Hoodies), products, variants, pricing tiers, and default user accounts:
   ```bash
   npm run db:seed
   ```

> **Default Seed User Credentials**:
> - **Super Admin**: Phone `9999999900` | Password `admin123`
> - **Customer**: Phone `9999999901` | Password `customer123`

---

### Running the Application

Start the local Next.js development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🔑 Environment Variables

The following variables must be configured in your `.env` file:

```env
# Database Connection
DATABASE_URL="postgresql://postgres:password@localhost:5432/nayakapda_tshirt"

# Authentication Secrets
NEXTAUTH_SECRET="your-nextauth-secret-32-chars-minimum"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_JWT_SECRET="your-admin-jwt-secret-key"

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxx"
RAZORPAY_KEY_SECRET="your_razorpay_secret"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxxxxxxx"

# Cloud Storage (Cloudinary - Optional)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Notifications (WhatsApp Cloud API - Optional)
WHATSAPP_API_TOKEN="your-whatsapp-bearer-token"
WHATSAPP_PHONE_NUMBER_ID="your-whatsapp-phone-id"

# App Public URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 📜 Available Scripts

In the `nayakapda` project directory, you can run:

| Command | Action |
|---------|--------|
| `npm run dev` | Starts Next.js development server on port 3000 |
| `npm run build` | Builds optimized production bundle and runs TypeScript checks |
| `npm run start` | Starts Next.js production server |
| `npm run lint` | Runs ESLint code analysis |
| `npm run test` | Runs unit & component tests using Vitest |
| `npm run db:migrate` | Applies Prisma migrations to local PostgreSQL database |
| `npm run db:seed` | Seeds database with initial categories, products & users |
| `npm run db:studio` | Opens interactive Prisma Studio GUI at `http://localhost:5555` |

---

## 🔌 API Endpoints Reference

### Public Routes (`/api/...`)
- `GET /api/products` — List active products with categories and starting prices
- `GET /api/products/[slug]` — Fetch product details, variants, photos & pricing tiers
- `GET /api/pricing/tier` — Resolve per-piece unit price based on cumulative quantity
- `POST /api/shipping/calculate` — Calculate shipping rates by pincode & piece count
- `GET /api/stock` — Fetch live variant stock availability
- `GET /api/products/stats/units-sold` — Public rotating banner stats

### Customer Authenticated Routes
- `POST /api/auth/register` — Customer account creation
- `GET/POST /api/cart` — View / sync customer cart items
- `POST /api/cart/bulk-add` — Add size x quantity matrix rows to cart with multiple validation
- `POST /api/orders` — Create new order & clear cart (Re-computes totals server-side)
- `GET /api/account/orders` — Customer order history list
- `GET /api/account/orders/[id]/invoice` — Generate & download PDF invoice
- `GET /api/account/credit-line` — Customer credit limit & transaction ledger
- `GET /api/account/referral` — Customer referral code & earnings summary
- `POST /api/stock/alert-subscribe` — Subscribe to back-in-stock notifications

### Admin Routes (`/api/admin/...`)
- `POST /api/admin/auth/login` — Staff & Super Admin authentication
- `GET /api/admin/analytics` — 30-day revenue, order counts, and top product stats
- `GET/POST/PATCH /api/admin/orders` — Order list filtering, status updates, tracking numbers, CSV export
- `GET/POST/PATCH /api/admin/products` — Product catalog management
- `GET/POST/PATCH/DELETE /api/admin/categories` — Category active/inactive toggles & creation
- `GET /api/admin/customers` — Customer directory with order values & credit lines
- `GET/POST/PATCH /api/admin/discounts` — Create & manage discount codes

---

## 🗄️ Database Schema Overview

The database uses PostgreSQL managed via Prisma ORM:

```mermaid
erDiagram
    User ||--o{ Order : places
    User ||--o{ Address : owns
    User ||--o| Cart : maintains
    User ||--o| CreditLine : holds
    User ||--o| Referral : owns
    
    Category ||--o{ Product : contains
    Product ||--o{ ProductVariant : has
    Product ||--o{ ProductPhoto : has
    Product ||--o{ PricingTier : has
    
    Order ||--o{ OrderItem : includes
    Order }|--|| Address : delivers_to
    Order }|--|| ShippingMethod : uses
    Order }|--o| DiscountCode : applies
    
    ProductVariant ||--o{ OrderItem : fulfilled_by
    ProductVariant ||--o{ CartItem : added_in
```

---

## 📦 Deployment Instructions

### Vercel + Managed PostgreSQL (Recommended)

1. **Database Setup**:
   Provision a managed PostgreSQL database (e.g., Neon PostgreSQL, Supabase, or AWS RDS). Update `DATABASE_URL` in environment variables.

2. **Deploy to Vercel**:
   - Push codebase to GitHub repository.
   - Import project into Vercel Dashboard.
   - Set Root Directory to `nayakapda`.
   - Add all `.env` environment variables in Vercel settings.

3. **Run Production Migrations & Build**:
   Build Command:
   ```bash
   npx prisma migrate deploy && npx prisma generate && next build
   ```

---

## 🤝 Contributing Guidelines

Contributions are welcome! Please follow these rules:

1. **Branch Naming**:
   - `feat/feature-name` for new features
   - `fix/bug-name` for bug fixes
   - `docs/documentation-update` for documentation

2. **Commit Message Format**:
   Follow Conventional Commits:
   ```
   <type>(<scope>): <short summary>
   ```
   *Examples*: `feat(cart): add bulk matrix add-to-cart`, `fix(nav): resolve desktop hamburger visibility`

3. **Code Style**:
   - Enforce strict TypeScript types (no implicit `any`).
   - Use Tailwind utility classes or custom classes defined in `globals.css`.

---

## 📄 License & Acknowledgments

- **License**: Private & Proprietary — All rights reserved by **NayaKapda**.
- **Design System**: Inspired by modern B2B wholesale platforms, tailored specifically for Indian apparel resellers and printers.

---

<p center>
  Made with ❤️ in India 🇮🇳 for Printing Professionals
</p>
