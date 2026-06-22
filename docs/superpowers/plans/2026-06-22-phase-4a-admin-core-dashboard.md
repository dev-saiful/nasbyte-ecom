# Phase 4A: Admin Core & Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the admin panel foundation with sidebar navigation, auth guard, and a dashboard with 4 KPI stat cards.

**Architecture:** Route group `(admin)` with shared sidebar layout. Server Components for all pages. Middleware already handles ADMIN role check. Dashboard fetches stats from a dedicated API route.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui (Card, Skeleton), Prisma 7, lucide-react icons, `@/*` path alias.

## Global Constraints

- Next.js 16 with App Router and Turbopack
- Tailwind CSS 4 with `@import "tailwindcss"`
- shadcn/ui New York style with Lucide icons
- Biome for linting/formatting (not ESLint/Prettier)
- `@/*` path alias → `./src/*`
- Server Components by default; `"use client"` only for interactive elements
- Currency: BDT, use `formatBDT` from `@/lib/utils`
- UUID primary keys, soft deletes on all models
- Run `npm run lint` before committing

---

## File Structure

```
src/app/(admin)/
├── layout.tsx              # Admin layout with sidebar + auth guard
├── admin/
│   ├── page.tsx            # Dashboard page (server component)
│   └── loading.tsx         # Dashboard loading skeleton

src/components/admin/
│   ├── admin-sidebar.tsx   # Sidebar navigation (client component)
│   └── admin-kpi-card.tsx  # Reusable KPI stat card

src/app/api/admin/
│   └── dashboard/
│       └── route.ts        # GET dashboard stats API
```

---

### Task 1: Create Admin KPI Card Component

**Files:**
- Create: `src/components/admin/admin-kpi-card.tsx`

**Interfaces:**
- Consumes: `Card`, `CardContent` from `@/components/ui/card`, `LucideIcon` type from lucide-react
- Produces: `AdminKpiCard` component used by dashboard page

- [ ] **Step 1: Create the KPI card component**

```typescript
// src/components/admin/admin-kpi-card.tsx

import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AdminKpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
}

export function AdminKpiCard({
  title,
  value,
  icon: Icon,
  description,
}: AdminKpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Lint and verify**

Run: `npx biome check src/components/admin/admin-kpi-card.tsx`
Expected: PASS (no errors)

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/admin-kpi-card.tsx
git commit -m "feat(admin): add KPI card component"
```

---

### Task 2: Create Admin Sidebar Component

**Files:**
- Create: `src/components/admin/admin-sidebar.tsx`

**Interfaces:**
- Consumes: `usePathname` from `next/navigation`, `cn` from `@/lib/utils`, lucide-react icons
- Produces: `AdminSidebar` component used by admin layout

- [ ] **Step 1: Create the admin sidebar component**

```typescript
// src/components/admin/admin-sidebar.tsx

"use client";

import {
  BarChart3,
  Flag,
  FolderTree,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tags,
  Truck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, enabled: true },
  { href: "/admin/products", label: "Products", icon: Package, enabled: false },
  {
    href: "/admin/categories",
    label: "Categories",
    icon: FolderTree,
    enabled: false,
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: ShoppingCart,
    enabled: false,
  },
  { href: "/admin/users", label: "Users", icon: Users, enabled: false },
  { href: "/admin/reviews", label: "Reviews", icon: Flag, enabled: false },
  {
    href: "/admin/inventory",
    label: "Inventory",
    icon: Truck,
    enabled: false,
  },
  { href: "/admin/promos", label: "Promos", icon: Tags, enabled: false },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-muted/30">
      <div className="border-b px-4 py-4">
        <Link
          href="/admin"
          className="font-heading text-lg font-bold text-primary"
        >
          Admin Panel
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {sidebarLinks.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/admin" && pathname.startsWith(link.href));

          if (!link.enabled) {
            return (
              <div
                key={link.href}
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground opacity-50"
              >
                <link.icon className="size-4" />
                {link.label}
              </div>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-3 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          ← Back to Store
        </Link>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Lint and verify**

Run: `npx biome check src/components/admin/admin-sidebar.tsx`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/admin-sidebar.tsx
git commit -m "feat(admin): add admin sidebar navigation"
```

---

### Task 3: Create Admin Layout with Auth Guard

**Files:**
- Create: `src/app/(admin)/layout.tsx`

**Interfaces:**
- Consumes: `auth` from `@/lib/auth`, `AdminSidebar` from `@/components/admin/admin-sidebar`
- Produces: Admin layout wrapping all `/admin/*` pages

- [ ] **Step 1: Create the admin layout**

```typescript
// src/app/(admin)/layout.tsx

import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/forbidden");
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Lint and verify**

Run: `npx biome check src/app/\(admin\)/layout.tsx`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add "src/app/(admin)/layout.tsx"
git commit -m "feat(admin): add admin layout with auth guard"
```

---

### Task 4: Create Dashboard API Route

**Files:**
- Create: `src/app/api/admin/dashboard/route.ts`

**Interfaces:**
- Consumes: `auth` from `@/lib/auth`, `prisma` from `@/lib/prisma`, `NextResponse` from `next/server`
- Produces: `GET /api/admin/dashboard` returning `{ revenue, totalOrders, totalProducts, totalUsers }`

- [ ] **Step 1: Create the dashboard API route**

```typescript
// src/app/api/admin/dashboard/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [revenueResult, totalOrders, totalProducts, totalUsers] =
      await Promise.all([
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

    return NextResponse.json({
      revenue,
      totalOrders,
      totalProducts,
      totalUsers,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Lint and verify**

Run: `npx biome check src/app/api/admin/dashboard/route.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/dashboard/route.ts
git commit -m "feat(admin): add dashboard stats API route"
```

---

### Task 5: Create Dashboard Page

**Files:**
- Create: `src/app/(admin)/admin/page.tsx`

**Interfaces:**
- Consumes: `AdminKpiCard` from `@/components/admin/admin-kpi-card`, `formatBDT` from `@/lib/utils`, lucide-react icons
- Produces: Dashboard page at `/admin`

- [ ] **Step 1: Create the dashboard page**

```typescript
// src/app/(admin)/admin/page.tsx

import { DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { AdminKpiCard } from "@/components/admin/admin-kpi-card";
import { formatBDT } from "@/lib/utils";

async function getDashboardStats() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/admin/dashboard`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch dashboard stats");
  }
  return res.json();
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKpiCard
          title="Total Revenue"
          value={formatBDT(stats.revenue)}
          icon={DollarSign}
          description="From completed orders"
        />
        <AdminKpiCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          icon={ShoppingCart}
          description="Non-cancelled orders"
        />
        <AdminKpiCard
          title="Total Products"
          value={stats.totalProducts.toLocaleString()}
          icon={Package}
          description="Active products"
        />
        <AdminKpiCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          description="Registered users"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Lint and verify**

Run: `npx biome check src/app/\(admin\)/admin/page.tsx`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add "src/app/(admin)/admin/page.tsx"
git commit -m "feat(admin): add dashboard page with KPI cards"
```

---

### Task 6: Create Dashboard Loading Skeleton

**Files:**
- Create: `src/app/(admin)/admin/loading.tsx`

**Interfaces:**
- Consumes: `Skeleton` from `@/components/ui/skeleton`, `Card`, `CardContent`, `CardHeader` from `@/components/ui/card`
- Produces: Loading state for dashboard page

- [ ] **Step 1: Create the loading skeleton**

```typescript
// src/app/(admin)/admin/loading.tsx

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-1 h-8 w-20" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Lint and verify**

Run: `npx biome check src/app/\(admin\)/admin/loading.tsx`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add "src/app/(admin)/admin/loading.tsx"
git commit -m "feat(admin): add dashboard loading skeleton"
```

---

### Task 7: Final Build Verification

**Files:**
- No new files. Verify existing work.

- [ ] **Step 1: Run full lint**

Run: `npm run lint`
Expected: Only pre-existing warnings in `auth.ts` and `proxy.ts`

- [ ] **Step 2: Run full build**

Run: `npm run build`
Expected: Build succeeds. All routes compile. Dashboard route shows as `ƒ` (dynamic).

- [ ] **Step 3: Final commit if needed**

```bash
git add .
git commit -m "feat(admin): complete Phase 4A admin core & dashboard"
```
