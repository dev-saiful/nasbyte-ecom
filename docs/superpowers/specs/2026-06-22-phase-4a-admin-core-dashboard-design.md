# Phase 4A: Admin Core & Dashboard — Design Spec

## Overview

Build the admin panel foundation: layout with sidebar navigation, auth guard, and a dashboard with basic KPIs. This is the first sub-phase of Phase 4 (Admin Panel). All subsequent admin features (products, orders, users, etc.) build on this foundation.

## Goals

- Admin layout with persistent sidebar navigation
- Role-based access control (ADMIN only)
- Dashboard page with 4 KPI stat cards
- API route for dashboard data aggregation

## Non-Goals (deferred to later sub-phases)

- Product/category management (4B)
- Order/user management (4C)
- Review/inventory/promo management (4D)
- Charts or time-series data
- Real-time updates

---

## Architecture

### Route Structure

```
src/app/(admin)/
├── layout.tsx              # Admin layout with sidebar
├── admin/
│   ├── page.tsx            # Dashboard page
│   └── loading.tsx         # Dashboard loading skeleton

src/components/admin/
│   ├── admin-sidebar.tsx   # Sidebar navigation
│   └── admin-kpi-card.tsx  # Reusable KPI stat card

src/app/api/admin/
│   └── dashboard/
│       └── route.ts        # GET dashboard stats
```

- Route group `(admin)` shares the sidebar layout
- All admin pages are server-rendered (dynamic, never statically cached)
- URL prefix: `/admin/*`

### File Conventions

- Follow existing patterns from `(account)` route group
- Use `@/*` path alias for all imports
- Server Components by default; `"use client"` only for interactive elements
- Biome for linting/formatting (no ESLint/Prettier)

---

## Components

### Admin Layout (`src/app/(admin)/layout.tsx`)

Server Component. Responsibilities:
1. Call `auth()` to get session
2. Redirect to `/login` if not authenticated
3. Check `session.user.role === "ADMIN"`, redirect to `/forbidden` if not
4. Render `<AdminSidebar />` + children in a flex container

```tsx
// Pseudo-structure
<div className="flex min-h-screen">
  <AdminSidebar />
  <main className="flex-1 p-6">{children}</main>
</div>
```

### Admin Sidebar (`src/components/admin/admin-sidebar.tsx`)

Server Component. Renders vertical navigation with:

| Link | Route | Status in 4A |
|------|-------|--------------|
| Dashboard | `/admin` | Active |
| Products | `/admin/products` | Disabled (muted, no href) |
| Categories | `/admin/categories` | Disabled |
| Orders | `/admin/orders` | Disabled |
| Users | `/admin/users` | Disabled |
| Reviews | `/admin/reviews` | Disabled |
| Inventory | `/admin/inventory` | Disabled |
| Promos | `/admin/promos` | Disabled |

- Active link highlighted with `bg-muted` and `font-medium`
- Disabled links use `text-muted-foreground opacity-50 cursor-not-allowed`
- Uses `usePathname()` to determine active link
- Includes "Back to Store" link at bottom pointing to `/`
- Sidebar is fixed-width (w-64), full height

### KPI Card (`src/components/admin/admin-kpi-card.tsx`)

Reusable card component for dashboard stats.

Props:
```typescript
interface AdminKpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
}
```

Renders a `<Card>` with:
- Icon in top-right (muted color)
- Title (text-sm font-medium text-muted-foreground)
- Value (text-2xl font-bold)
- Optional description (text-xs text-muted-foreground)

---

## Dashboard Page (`src/app/(admin)/admin/page.tsx`)

Server Component. Fetches data from the API route and renders 4 KPI cards.

### KPI Cards

1. **Total Revenue**
   - Icon: `DollarSign` from lucide-react
   - Value: `formatBDT(revenue)` — formatted BDT currency
   - Description: "From completed orders"

2. **Total Orders**
   - Icon: `ShoppingCart` from lucide-react
   - Value: `totalOrders.toLocaleString()`
   - Description: "Non-cancelled orders"

3. **Total Products**
   - Icon: `Package` from lucide-react
   - Value: `totalProducts.toLocaleString()`
   - Description: "Active products"

4. **Total Users**
   - Icon: `Users` from lucide-react
   - Value: `totalUsers.toLocaleString()`
   - Description: "Registered users"

### Layout

```
┌──────────────────────────────────────────────────┐
│  Total Revenue    │  Total Orders  │  Total Products  │  Total Users  │
│  ৳125,000         │  45             │  120             │  89           │
│  From completed   │  Non-cancelled  │  Active products │  Registered   │
└──────────────────────────────────────────────────┘
```

- Grid: `grid gap-4 sm:grid-cols-2 lg:grid-cols-4`
- Each cell: `<AdminKpiCard />`

### Loading State (`src/app/(admin)/admin/loading.tsx`)

Skeleton loader matching the dashboard layout — 4 card skeletons in a grid.

---

## API Route

### `GET /api/admin/dashboard`

**Auth:** Requires authenticated session with `role === "ADMIN"`. Returns 401/403 otherwise.

**Response:**
```json
{
  "revenue": 125000,
  "totalOrders": 45,
  "totalProducts": 120,
  "totalUsers": 89
}
```

**Queries (parallel via `Promise.all`):**

```typescript
const [revenueResult, totalOrders, totalProducts, totalUsers] = await Promise.all([
  prisma.order.aggregate({
    _sum: { total: true },
    where: { status: { not: "CANCELLED" }, deletedAt: null },
  }),
  prisma.order.count({
    where: { status: { not: "CANCELLED" }, deletedAt: null },
  }),
  prisma.product.count({
    where: { isActive: true, deletedAt: null },
  }),
  prisma.user.count({
    where: { deletedAt: null },
  }),
]);

const revenue = Number(revenueResult._sum.total ?? 0);
```

**Error handling:** Try/catch with 500 response on failure.

---

## Auth & Middleware

### Existing Middleware (`src/proxy.ts`)

Already handles `/admin` routes:
- Requires authenticated session
- Checks `session.user.role === "ADMIN"`
- Redirects to `/forbidden` if not admin

No changes needed to middleware.

### Admin Layout Auth

Double-check in layout (defense in depth):
```typescript
const session = await auth();
if (!session?.user) redirect("/login");
if (session.user.role !== "ADMIN") redirect("/forbidden");
```

---

## Data Flow

```
Browser → GET /admin
  → Middleware: check session + ADMIN role
  → Admin Layout: auth() + render sidebar
  → Dashboard Page: fetch /api/admin/dashboard
    → API: prisma queries (parallel)
    → Response: { revenue, totalOrders, totalProducts, totalUsers }
  → Render: 4 × AdminKpiCard
```

---

## Testing Strategy

- Manual: Login as admin, verify dashboard loads with correct stats
- Manual: Login as regular user, verify redirect to `/forbidden`
- Manual: Unauthenticated access, verify redirect to `/login`
- Verify sidebar navigation links (active state, disabled state)

---

## Implementation Order

1. Create admin sidebar component
2. Create KPI card component
3. Create admin layout with auth guard
4. Create dashboard API route
5. Create dashboard page
6. Create loading skeleton
7. Test and verify
