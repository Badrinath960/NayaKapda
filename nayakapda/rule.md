# NayaKapda Project Rules

## 🔒 Protected Files — READ ONLY

The following three files are the **source of truth** for this project and must **NEVER be modified without explicit user approval**:

1. `c:\Projects\NayaKapda Bulk T-shirt\design.md` — Technical architecture and API design
2. `c:\Projects\NayaKapda Bulk T-shirt\requirements.md` — Feature requirements (25 requirements)
3. `c:\Projects\NayaKapda Bulk T-shirt\tasks.md` — Implementation task list (32 tasks)

### Rule: Before modifying any of these files, the agent MUST:
1. Inform the user of the proposed change and why it's needed
2. Get explicit user approval
3. Only then make the modification

This rule supersedes any other instruction about file editing.

---

## 🏗️ Architecture Rules

### Tech Stack (STRICT — No Substitutions)
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ App Router |
| Language | TypeScript (strict) |
| Styling | TailwindCSS v4 |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Auth | NextAuth.js (customers), JWT cookie (admins) |
| Payment | Razorpay |
| Notifications | WhatsApp Business API |
| State | Zustand (cart), React Query (server state) |
| Testing | Vitest + @testing-library/react + fast-check |
| Database | PostgreSQL (local: `nayakapda_tshirt`) |

### Directory Structure
```
nayakapda/
├── prisma/             → Schema, migrations, seed
├── src/
│   ├── app/            → Next.js App Router pages and API routes
│   │   ├── (storefront)/ → Public pages
│   │   ├── admin/       → Admin panel (role-gated)
│   │   └── api/         → API routes
│   ├── components/     → Reusable UI components
│   ├── lib/            → Shared utilities (prisma, auth, pricing, validation, etc.)
│   ├── store/          → Zustand stores
│   └── tests/          → Test setup and shared fixtures
```

### Naming Conventions
- Pages: `PascalCase` components in `page.tsx`
- API routes: `route.ts` files with named exports (`GET`, `POST`, `PATCH`, `DELETE`)
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Tests: `*.test.ts` / `*.component.test.tsx`

---

## 🗄️ Database Rules

- **Local DB name**: `nayakapda_tshirt`
- **User**: `postgres` / **Password**: `badri@123`
- **Prisma 7**: Must use `@prisma/adapter-pg` with `pg.Pool` — no legacy binary engine
- **Schema changes**: Must update `prisma/schema.prisma` → run `prisma migrate dev` → update seed if needed
- **Never expose** DB credentials in client-side code

---

## 🔌 API Rules

- **Base path**: `/api/`
- **Admin path**: `/api/admin/`
- All routes must be wrapped with `withErrorHandler`
- All request bodies/params must be validated with Zod schemas
- HTTP 422 for validation errors (field-level details)
- HTTP 401 for missing auth, HTTP 403 for insufficient role
- **NEVER trust client-computed monetary totals** — always re-compute server-side

---

## 🎨 UI/CSS Rules

- Use plain CSS classes defined in `globals.css` (no `@apply` — Tailwind v4 incompatible)
- Custom classes: `.card`, `.btn-primary`, `.btn-secondary`, `.glass`, `.gradient-text`, `.badge-*`, `.input`, `.label`, `.table`, `.qty-cell`
- Dark mode by default (bg: `#030712`)
- Mobile-first — renders correctly at 320px viewport

---

## 💰 Monetary Formatting

- All amounts formatted with `formatINR()` from `@/lib/utils`
- Format: `₹X,XXX` (no decimals for whole rupees)
- Never display raw floating point amounts

---

## 🔐 Security Rules

- Never commit `.env.local` to git
- `NEXTAUTH_SECRET` must be set in `.env.local`
- Admin routes: require `admin-session` JWT cookie with role claim
- Customer routes: require NextAuth session cookie
- Rate limit: 20 req/min/IP on `/api/discount/validate` and `/api/orders`

---

## ✅ Testing Rules

- Framework: Vitest
- Property tests: fast-check with `numRuns: 100` minimum
- Tag format: `// Feature: b2b-wholesale-apparel-platform, Property N: <text>`
- All 12 correctness properties from design.md must have corresponding property tests (optional `*` tasks)

---

## 📋 Development Workflow

1. Start DB: Ensure PostgreSQL is running locally
2. Start dev server: `npm run dev` (from `nayakapda/`)
3. Port assignments: Frontend → 3000
4. Seeded admin: `admin@nayakapda.com` / `Admin@123`
5. Seeded customer: phone `9876543210` / `Customer@123`

---

## 🚫 What Must NEVER Happen

- ❌ Modify `design.md`, `requirements.md`, or `tasks.md` without user approval
- ❌ Use `@apply` in CSS (breaks Tailwind v4)
- ❌ Import `Decimal` from `@prisma/client/runtime/library` (non-existent in Prisma 7)
- ❌ Trust client-submitted price totals in order placement
- ❌ Create duplicate StockAlertSubscriptions per user-variant
- ❌ Let credit line `usedAmount` exceed `limitAmount`
- ❌ Expose internal stack traces in API error responses
