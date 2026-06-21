<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Commands

```bash
npm run dev       # Start dev server (Turbopack is default bundler)
npm run build     # Production build
npm run lint      # Biome check (lint + import sorting)
npm run format    # Biome format --write
```

Run `npm run lint` before committing. `next build` does NOT run the linter automatically in Next.js 16.

## Tooling

- **Linter/formatter:** Biome 2.2 — NOT ESLint/Prettier. Config: `biome.json`. This project has NO ESLint or Prettier — Biome handles both.
- **CSS:** Tailwind CSS 4 via `@tailwindcss/postcss`. Uses `@import "tailwindcss"` (not `@tailwind` directives). Custom tokens go in `@theme inline` block in `globals.css`
- **TypeScript:** Strict mode, bundler module resolution, `@/*` path alias → `./src/*`
- **Fonts:** Geist (current scaffold). PRD specifies Playfair Display (headings) + DM Sans (body) via `next/font/google`

## Testing

- **Framework:** Vitest (per PRD). Not yet installed — run `npm i -D vitest` when ready
- No test command in `package.json` yet

## Path alias

All imports use `@/*` mapping to `./src/*`. Example: `import { prisma } from "@/lib/prisma"`

## PRD is source of truth

Full spec lives in `PRD-NEXTJS.md`. It contains:
- Complete Prisma schema (all models, enums, relations)
- API route structure
- Business rules (BDT currency, 150 BDT flat shipping, order/payment statuses)
- Validation schemas (Zod)
- Implementation phases (Phase 1 → 6)
- Key algorithms (cart merge, stock decrement, slug generation)

Refer to the PRD for any feature question before guessing.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, shadcn/ui (New York style, Lucide icons) |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL 16+ |
| ORM | Prisma 7 |
| Auth | NextAuth.js v5 (Auth.js) |
| Validation | Zod 4 |
| State | Zustand (client), nuqs (URL params) |
| Forms | react-hook-form + @hookform/resolvers |

## shadcn/ui

Not yet initialized. Before adding components, run: `npx shadcn@latest init`
Components go in `src/components/ui/`. PRD specifies New York style + Lucide icons.

## Environment Variables

Key vars from PRD Section 14 (all in `.env.local`, never committed):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Auth session secret |
| `NEXTAUTH_URL` | App URL (http://localhost:3000) |
| `RESEND_API_KEY` | Email service |
| `TELEGRAM_BOT_TOKEN` | Order notifications |
| `TELEGRAM_CHAT_ID` | Target chat for notifications |
| `S3_BUCKET` + keys | File storage (production) |

## Business Rules

Currency: BDT. Shipping: flat 150 BDT. Order statuses: PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED → CANCELLED. Payment methods: CASH_ON_DELIVERY, CARD, MOBILE_BANKING. UUIDs for all PKs except storefront_announcements. Soft deletes on Users, Categories, Products, Orders, Addresses.

## Project stage

Greenfield. Only the default `src/app/` scaffold exists (layout, page, globals.css). No components, lib, middleware, or database setup yet. Follow PRD phases for implementation order.

## Next.js 16 gotchas

- **Turbopack** is the default bundler. Use `--webpack` flag to opt out
- **`next build`** no longer runs the linter — run `npm run lint` separately
- **Env files** are loaded from project root only, not from `src/`
- **Tailwind 4** uses `@import "tailwindcss"` in CSS, not `@tailwind base/components/utilities`
- Docs for v16-specific changes: `node_modules/next/dist/docs/`

## Biome config highlights

- 2-space indentation (spaces, not tabs)
- `recommended` rules enabled
- `next` and `react` domain rules enabled
- `organizeImports` assist action enabled
- `noUnknownAtRules` disabled (needed for Tailwind `@import`)

## Phase 1 Priority

Foundation before features: Prisma schema + migration → NextAuth v5 setup → middleware (requireAuth, requireAdmin, requireVerified) → Zod validation schemas. Everything else builds on these.
