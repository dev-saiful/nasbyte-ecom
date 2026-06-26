# Unfinished Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete file upload with Cloudinary, storefront promo management, admin dashboard with 4 charts, and expand test coverage.

**Architecture:** Add Cloudinary SDK for image uploads, create promo management API/page, enhance dashboard with recharts charts and additional data tables, and expand unit tests.

**Tech Stack:** Cloudinary SDK, recharts, Vitest, Next.js API routes, Prisma

## Global Constraints

- Currency: BDT (Bangladeshi Taka)
- UI: shadcn/ui (New York style, Lucide icons)
- Styling: Tailwind CSS 4
- Linting: Biome 2.2 (NOT ESLint/Prettier)
- Path alias: `@/*` → `./src/*`
- UUIDs for all PKs except storefront_announcements
- Soft deletes on Users, Categories, Products, Orders, Addresses
- Run `npm run lint` before committing

---

## File Structure

```
New Files:
  src/lib/cloudinary.ts                           # Cloudinary config + upload helper
  src/app/api/upload/route.ts                     # File upload API endpoint
  src/app/api/admin/storefront/promo/route.ts     # Promo CRUD API
  src/app/(admin)/admin/storefront/promo/page.tsx # Promo management page
  src/components/admin/admin-dashboard-charts.tsx # 4 chart components
  src/components/admin/admin-recent-orders.tsx    # Recent orders table
  src/components/admin/admin-low-stock-alerts.tsx # Low stock alerts table
  src/components/admin/admin-promo-form.tsx       # Promo edit form
  src/components/shared/file-upload.tsx           # Reusable file upload component
  src/lib/price.test.ts                          # Price calculation tests
  src/lib/otp.test.ts                            # OTP utility tests

Modified Files:
  src/app/api/admin/dashboard/route.ts           # Add charts + tables data
  src/app/(admin)/admin/page.tsx                 # Render charts + tables
  src/components/admin/admin-kpi-card.tsx        # Add trend percentage prop
  src/components/admin/admin-product-form.tsx    # Use file upload component
  src/components/admin/admin-category-form.tsx   # Use file upload component
  .env.example                                   # Add Cloudinary env vars
```

---

## Task 1: Cloudinary Setup + Upload API

**Files:**
- Create: `src/lib/cloudinary.ts`
- Create: `src/app/api/upload/route.ts`
- Create: `src/components/shared/file-upload.tsx`
- Modify: `.env.example`

**Interfaces:**
- Produces: `uploadToCloudinary(file: File, folder: string): Promise<{ url: string; publicId: string }>`
- Produces: `POST /api/upload` → `{ url, publicId }`

- [ ] **Step 1: Install Cloudinary SDK**

Run: `npm install cloudinary`

- [ ] **Step 2: Add env vars to `.env.example`**

Append to `.env.example`:
```
# ─── CLOUDINARY ────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

- [ ] **Step 3: Create Cloudinary helper**

Create `src/lib/cloudinary.ts`:
```typescript
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface UploadResult {
  url: string;
  publicId: string;
}

export async function uploadToCloudinary(
  file: File,
  folder: string,
): Promise<UploadResult> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await new Promise<UploadResult>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          { quality: "auto", fetch_format: "auto" },
          { width: 1920, crop: "limit" },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error("Upload failed"));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    uploadStream.end(buffer);
  });

  return result;
}

export { cloudinary };
```

- [ ] **Step 4: Create upload API route**

Create `src/app/api/upload/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "nasbyte/uploads";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size: 5MB" },
        { status: 400 },
      );
    }

    const result = await uploadToCloudinary(file, folder);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 5: Create FileUpload component**

Create `src/components/shared/file-upload.tsx`:
```typescript
"use client";

import { useCallback, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  accept?: string;
  label?: string;
}

export function FileUpload({
  value,
  onChange,
  folder = "nasbyte/uploads",
  accept = "image/jpeg,image/png,image/webp",
  label = "Upload file",
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Upload failed");
        }

        const result = await response.json();
        onChange(result.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [folder, onChange],
  );

  const handleRemove = useCallback(() => {
    onChange("");
  }, [onChange]);

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Uploaded"
            className="h-32 w-32 rounded-md border object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed p-4 transition-colors hover:bg-muted">
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          <span className="mt-2 text-sm text-muted-foreground">
            {isUploading ? "Uploading..." : label}
          </span>
          <input
            type="file"
            accept={accept}
            onChange={handleUpload}
            className="hidden"
            disabled={isUploading}
          />
        </label>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 6: Run linter**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add src/lib/cloudinary.ts src/app/api/upload/route.ts src/components/shared/file-upload.tsx .env.example
git commit -m "feat: add Cloudinary file upload API and FileUpload component"
```

---

## Task 2: Integrate File Upload in Admin Forms

**Files:**
- Modify: `src/components/admin/admin-product-form.tsx`
- Modify: `src/components/admin/admin-category-form.tsx`

**Interfaces:**
- Consumes: `FileUpload` component from `@/components/shared/file-upload`

- [ ] **Step 1: Update AdminProductForm to use FileUpload**

Read `src/components/admin/admin-product-form.tsx` and find the image URL input fields. Replace them with the `FileUpload` component.

Import at top:
```typescript
import { FileUpload } from "@/components/shared/file-upload";
```

Replace the product images URL input(s) with:
```tsx
<div className="space-y-2">
  <Label>Product Images</Label>
  <FileUpload
    value={imageUrl}
    onChange={setImageUrl}
    folder="nasbyte/products"
    label="Upload product image"
  />
</div>
```

Do the same for the features/images array if applicable.

- [ ] **Step 2: Update AdminCategoryForm to use FileUpload**

Read `src/components/admin/admin-category-form.tsx` and find the image URL input. Replace with:

```tsx
<div className="space-y-2">
  <Label>Category Image</Label>
  <FileUpload
    value={imageUrl}
    onChange={setImageUrl}
    folder="nasbyte/categories"
    label="Upload category image"
  />
</div>
```

- [ ] **Step 3: Run linter**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/admin-product-form.tsx src/components/admin/admin-category-form.tsx
git commit -m "feat: integrate file upload in admin product and category forms"
```

---

## Task 3: Storefront Promo API

**Files:**
- Create: `src/app/api/admin/storefront/promo/route.ts`

**Interfaces:**
- Produces: `GET /api/admin/storefront/promo` → `{ id, title, isActive }`
- Produces: `PUT /api/admin/storefront/promo` → `{ id, title, isActive }`

- [ ] **Step 1: Create promo API route**

Create `src/app/api/admin/storefront/promo/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const announcement = await prisma.storefrontAnnouncement.findFirst({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Promo GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch promo" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, isActive } = body;

    const existing = await prisma.storefrontAnnouncement.findFirst({
      orderBy: { createdAt: "desc" },
    });

    let announcement;
    if (existing) {
      announcement = await prisma.storefrontAnnouncement.update({
        where: { id: existing.id },
        data: { title, isActive },
      });
    } else {
      announcement = await prisma.storefrontAnnouncement.create({
        data: { title, isActive },
      });
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Promo PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update promo" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Run linter**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/storefront/promo/route.ts
git commit -m "feat: add storefront promo management API"
```

---

## Task 4: Storefront Promo Admin Page

**Files:**
- Create: `src/app/(admin)/admin/storefront/promo/page.tsx`
- Create: `src/components/admin/admin-promo-form.tsx`

**Interfaces:**
- Consumes: `GET/PUT /api/admin/storefront/promo`
- Produces: `/admin/storefront/promo` page

- [ ] **Step 1: Create PromoForm component**

Create `src/components/admin/admin-promo-form.tsx`:
```typescript
"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface Promo {
  id: number;
  title: string | null;
  isActive: boolean;
}

export function AdminPromoForm({ promo }: { promo: Promo | null }) {
  const [title, setTitle] = useState(promo?.title || "");
  const [isActive, setIsActive] = useState(promo?.isActive || false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/storefront/promo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, isActive }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      toast.success("Promo banner updated");
    } catch (error) {
      toast.error("Failed to save promo banner");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Edit Promo Banner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Banner Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter promo banner text"
              maxLength={140}
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/140 characters
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="active">Active</Label>
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {isActive && title ? (
            <div className="rounded-md bg-primary/10 p-4 text-center">
              <p className="text-sm font-medium text-primary">{title}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Banner is inactive or empty. It will not appear on the storefront.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Create promo page**

Create `src/app/(admin)/admin/storefront/promo/page.tsx`:
```typescript
import { AdminPromoForm } from "@/components/admin/admin-promo-form";

async function getPromo() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/admin/storefront/promo`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function AdminPromoPage() {
  const promo = await getPromo();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        Storefront Promo Banner
      </h1>
      <AdminPromoForm promo={promo} />
    </div>
  );
}
```

- [ ] **Step 3: Add promo link to admin sidebar**

Read `src/components/admin/admin-sidebar.tsx` and add a link for Promo Banner in the navigation:
```tsx
<NavLink href="/admin/storefront/promo" icon={Megaphone} label="Promo Banner" />
```

Import `Megaphone` from `lucide-react`.

- [ ] **Step 4: Run linter**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/app/\(admin\)/admin/storefront/promo/page.tsx src/components/admin/admin-promo-form.tsx src/components/admin/admin-sidebar.tsx
git commit -m "feat: add storefront promo management admin page"
```

---

## Task 5: Enhanced Dashboard API

**Files:**
- Modify: `src/app/api/admin/dashboard/route.ts`

**Interfaces:**
- Produces: Enhanced `GET /api/admin/dashboard` with charts, tables, trends

- [ ] **Step 1: Update dashboard API with charts and tables data**

Replace the contents of `src/app/api/admin/dashboard/route.ts`:
```typescript
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

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      revenueResult,
      totalOrders,
      totalProducts,
      totalUsers,
      pendingReviews,
      lowStockProducts,
      thisMonthRevenue,
      lastMonthRevenue,
      thisMonthOrders,
      lastMonthOrders,
      thisMonthUsers,
      lastMonthUsers,
    ] = await Promise.all([
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
      prisma.review.count({
        where: { isApproved: false },
      }),
      prisma.productVariant.findMany({
        where: { stock: { lt: 10 }, isActive: true },
        select: { id: true, name: true, stock: true, sku: true, product: { select: { name: true } } },
        orderBy: { stock: "asc" },
        take: 10,
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: { not: "CANCELLED" },
          deletedAt: null,
          createdAt: { gte: thisMonth },
        },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: { not: "CANCELLED" },
          deletedAt: null,
          createdAt: { gte: lastMonth, lt: thisMonth },
        },
      }),
      prisma.order.count({
        where: {
          status: { not: "CANCELLED" },
          deletedAt: null,
          createdAt: { gte: thisMonth },
        },
      }),
      prisma.order.count({
        where: {
          status: { not: "CANCELLED" },
          deletedAt: null,
          createdAt: { gte: lastMonth, lt: thisMonth },
        },
      }),
      prisma.user.count({
        where: { deletedAt: null, createdAt: { gte: thisMonth } },
      }),
      prisma.user.count({
        where: { deletedAt: null, createdAt: { gte: lastMonth, lt: thisMonth } },
      }),
    ]);

    const revenue = Number(revenueResult._sum.total ?? 0);
    const thisMonthRev = Number(thisMonthRevenue._sum.total ?? 0);
    const lastMonthRev = Number(lastMonthRevenue._sum.total ?? 0);

    const calcTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // Revenue chart - last 6 months
    const revenueChart = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const result = await prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: { not: "CANCELLED" },
          deletedAt: null,
          createdAt: { gte: date, lt: nextDate },
        },
      });
      revenueChart.push({
        month: date.toLocaleString("default", { month: "short" }),
        revenue: Number(result._sum.total ?? 0),
      });
    }

    // Orders by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ["status"],
      _count: true,
      where: { deletedAt: null },
    });

    // Users growth - last 6 months
    const usersGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = await prisma.user.count({
        where: { deletedAt: null, createdAt: { gte: date, lt: nextDate } },
      });
      usersGrowth.push({
        month: date.toLocaleString("default", { month: "short" }),
        users: count,
      });
    }

    // Category distribution
    const categoryDistribution = await prisma.product.groupBy({
      by: ["categoryId"],
      _count: true,
      where: { deletedAt: null, isActive: true },
    });

    const categories = await prisma.category.findMany({
      where: { id: { in: categoryDistribution.map((c) => c.categoryId).filter(Boolean) as string[] } },
      select: { id: true, name: true },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
    const categoryData = categoryDistribution
      .filter((c) => c.categoryId)
      .map((c) => ({
        category: categoryMap.get(c.categoryId!) || "Unknown",
        count: c._count,
      }));

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      where: { deletedAt: null },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({
      revenue,
      totalOrders,
      totalProducts,
      totalUsers,
      pendingReviews,
      lowStockProducts: lowStockProducts.length,
      trends: {
        revenue: calcTrend(thisMonthRev, lastMonthRev),
        orders: calcTrend(thisMonthOrders, lastMonthOrders),
        products: 0,
        users: calcTrend(thisMonthUsers, lastMonthUsers),
      },
      revenueChart,
      ordersByStatus: ordersByStatus.map((o) => ({
        status: o.status,
        count: o._count,
      })),
      usersGrowth,
      categoryDistribution: categoryData,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.user?.name || "Guest",
        total: Number(o.total),
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      })),
      lowStockAlerts: lowStockProducts.map((v) => ({
        id: v.id,
        name: v.product.name,
        variantName: v.name,
        stock: v.stock,
        sku: v.sku,
      })),
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

- [ ] **Step 2: Run linter**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/dashboard/route.ts
git commit -m "feat: enhance dashboard API with charts, tables, and trend data"
```

---

## Task 6: Dashboard Charts Component

**Files:**
- Create: `src/components/admin/admin-dashboard-charts.tsx`

**Interfaces:**
- Consumes: `revenueChart`, `ordersByStatus`, `usersGrowth`, `categoryDistribution` from dashboard API

- [ ] **Step 1: Create dashboard charts component**

Create `src/components/admin/admin-dashboard-charts.tsx`:
```typescript
"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  PROCESSING: "#8b5cf6",
  SHIPPED: "#06b6d4",
  DELIVERED: "#22c55e",
  CANCELLED: "#ef4444",
};

interface ChartData {
  revenueChart: { month: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  usersGrowth: { month: string; users: number }[];
  categoryDistribution: { category: string; count: number }[];
}

export function AdminDashboardCharts({ data }: { data: ChartData }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Revenue (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.revenueChart}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orders by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.ordersByStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ status, percent }) =>
                  `${status} (${(percent * 100).toFixed(0)}%)`
                }
              >
                {data.ordersByStatus.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLORS[entry.status] || "#94a3b8"}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users Growth (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.usersGrowth}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="users"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.categoryDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis dataKey="category" type="category" className="text-xs" width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Run linter**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/admin-dashboard-charts.tsx
git commit -m "feat: add dashboard charts component with recharts"
```

---

## Task 7: Recent Orders + Low Stock Tables

**Files:**
- Create: `src/components/admin/admin-recent-orders.tsx`
- Create: `src/components/admin/admin-low-stock-alerts.tsx`

**Interfaces:**
- Consumes: `recentOrders`, `lowStockAlerts` from dashboard API

- [ ] **Step 1: Create RecentOrders component**

Create `src/components/admin/admin-recent-orders.tsx`:
```typescript
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBDT } from "@/lib/utils";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  CONFIRMED: "default",
  PROCESSING: "secondary",
  SHIPPED: "default",
  DELIVERED: "default",
  CANCELLED: "destructive",
};

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

export function AdminRecentOrders({ orders }: { orders: Order[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Orders</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/orders">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                    {order.orderNumber}
                  </Link>
                </TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{formatBDT(order.total)}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[order.status] || "outline"}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(order.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create LowStockAlerts component**

Create `src/components/admin/admin-low-stock-alerts.tsx`:
```typescript
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface LowStockItem {
  id: string;
  name: string;
  variantName: string | null;
  stock: number;
  sku: string | null;
}

export function AdminLowStockAlerts({ items }: { items: LowStockItem[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Low Stock Alerts
        </CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/inventory">Manage Inventory</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">All products are well stocked.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.variantName || "-"}</TableCell>
                  <TableCell className="font-mono text-xs">{item.sku || "-"}</TableCell>
                  <TableCell>
                    <span className={item.stock === 0 ? "font-bold text-destructive" : "text-warning"}>
                      {item.stock}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Run linter**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/admin-recent-orders.tsx src/components/admin/admin-low-stock-alerts.tsx
git commit -m "feat: add recent orders and low stock alerts tables"
```

---

## Task 8: Update KPI Card with Trend

**Files:**
- Modify: `src/components/admin/admin-kpi-card.tsx`

**Interfaces:**
- Consumes: `trend` prop (percentage number)

- [ ] **Step 1: Add trend prop to AdminKpiCard**

Read `src/components/admin/admin-kpi-card.tsx` and add a `trend` prop.

Update the interface:
```typescript
interface AdminKpiCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  trend?: number;
}
```

Update the component to render the trend:
```tsx
<div className="text-xs text-muted-foreground">
  {description}
  {trend !== undefined && trend !== 0 && (
    <span className={trend > 0 ? "ml-1 text-green-600" : "ml-1 text-red-600"}>
      {trend > 0 ? "+" : ""}{trend}%
    </span>
  )}
</div>
```

- [ ] **Step 2: Update AdminDashboardPage to pass trends**

Read `src/app/(admin)/admin/page.tsx` and pass trend values:
```tsx
<AdminKpiCard
  title="Total Revenue"
  value={formatBDT(stats.revenue)}
  icon={DollarSign}
  description="From completed orders"
  trend={stats.trends?.revenue}
/>
```

Do the same for Orders, Products, and Users cards.

- [ ] **Step 3: Run linter**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/admin-kpi-card.tsx src/app/\(admin\)/admin/page.tsx
git commit -m "feat: add trend percentages to admin dashboard KPI cards"
```

---

## Task 9: Update Dashboard Page with Charts and Tables

**Files:**
- Modify: `src/app/(admin)/admin/page.tsx`

**Interfaces:**
- Consumes: All dashboard API data
- Produces: Full dashboard with charts, tables, KPIs

- [ ] **Step 1: Update dashboard page to render all components**

Replace the contents of `src/app/(admin)/admin/page.tsx`:
```typescript
import { DollarSign, Package, ShoppingCart, Users, Star, AlertTriangle } from "lucide-react";
import { AdminKpiCard } from "@/components/admin/admin-kpi-card";
import { AdminDashboardCharts } from "@/components/admin/admin-dashboard-charts";
import { AdminRecentOrders } from "@/components/admin/admin-recent-orders";
import { AdminLowStockAlerts } from "@/components/admin/admin-low-stock-alerts";
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
          trend={stats.trends?.revenue}
        />
        <AdminKpiCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          icon={ShoppingCart}
          description="Non-cancelled orders"
          trend={stats.trends?.orders}
        />
        <AdminKpiCard
          title="Total Products"
          value={stats.totalProducts.toLocaleString()}
          icon={Package}
          description="Active products"
          trend={stats.trends?.products}
        />
        <AdminKpiCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          description="Registered users"
          trend={stats.trends?.users}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <AdminKpiCard
          title="Pending Reviews"
          value={stats.pendingReviews.toLocaleString()}
          icon={Star}
          description="Awaiting moderation"
        />
        <AdminKpiCard
          title="Low Stock"
          value={stats.lowStockProducts.toLocaleString()}
          icon={AlertTriangle}
          description="Products with stock < 10"
        />
      </div>

      <AdminDashboardCharts
        data={{
          revenueChart: stats.revenueChart,
          ordersByStatus: stats.ordersByStatus,
          usersGrowth: stats.usersGrowth,
          categoryDistribution: stats.categoryDistribution,
        }}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminRecentOrders orders={stats.recentOrders} />
        <AdminLowStockAlerts items={stats.lowStockAlerts} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run linter**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/\(admin\)/admin/page.tsx
git commit -m "feat: complete admin dashboard with charts, tables, and KPI trends"
```

---

## Task 10: Expand Unit Tests

**Files:**
- Create: `src/lib/price.test.ts`
- Create: `src/lib/otp.test.ts`
- Modify: `src/lib/utils.test.ts`

**Interfaces:**
- Consumes: `calculateSubtotal`, `calculateTotal`, `calculateCartTotal` from `@/lib/price`
- Consumes: `generateOtp`, `hashOtp`, `verifyOtp` from `@/lib/otp`

- [ ] **Step 1: Create price tests**

Create `src/lib/price.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import {
  SHIPPING_COST,
  calculateSubtotal,
  calculateTotal,
  calculateCartTotal,
} from "./price";

describe("SHIPPING_COST", () => {
  it("should be 150 BDT", () => {
    expect(SHIPPING_COST).toBe(150);
  });
});

describe("calculateSubtotal", () => {
  it("should calculate subtotal for cart items", () => {
    const items = [
      { price: 500, quantity: 2 },
      { price: 300, quantity: 1 },
    ];
    expect(calculateSubtotal(items)).toBe(1300);
  });

  it("should return 0 for empty cart", () => {
    expect(calculateSubtotal([])).toBe(0);
  });

  it("should handle single item", () => {
    const items = [{ price: 250, quantity: 3 }];
    expect(calculateSubtotal(items)).toBe(750);
  });
});

describe("calculateTotal", () => {
  it("should add shipping to subtotal", () => {
    expect(calculateTotal(1000)).toBe(1150);
  });

  it("should handle zero subtotal", () => {
    expect(calculateTotal(0)).toBe(150);
  });
});

describe("calculateCartTotal", () => {
  it("should calculate total from cart items", () => {
    const items = [
      { price: 500, quantity: 2 },
      { price: 300, quantity: 1 },
    ];
    expect(calculateCartTotal(items)).toBe(1450);
  });
});
```

- [ ] **Step 2: Create OTP tests**

Create `src/lib/otp.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateOtp, hashOtp, verifyOtp } from "./otp";

describe("generateOtp", () => {
  it("should generate a 6-digit string", () => {
    const otp = generateOtp();
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  it("should generate different OTPs on each call", () => {
    const otp1 = generateOtp();
    const otp2 = generateOtp();
    expect(otp1).not.toBe(otp2);
  });
});

describe("hashOtp", () => {
  it("should return a hashed string", async () => {
    const hash = await hashOtp("123456");
    expect(typeof hash).toBe("string");
    expect(hash).not.toBe("123456");
    expect(hash.length).toBeGreaterThan(0);
  });
});

describe("verifyOtp", () => {
  it("should return true for matching OTP", async () => {
    const hash = await hashOtp("123456");
    const result = await verifyOtp("123456", hash);
    expect(result).toBe(true);
  });

  it("should return false for non-matching OTP", async () => {
    const hash = await hashOtp("123456");
    const result = await verifyOtp("654321", hash);
    expect(result).toBe(false);
  });
});
```

- [ ] **Step 3: Add edge case tests to utils.test.ts**

Read `src/lib/utils.test.ts` and add edge cases to the existing `slugify` tests:
```typescript
describe("slugify", () => {
  // ... existing tests ...

  it("should handle unicode characters", () => {
    expect(slugify("সিল্ক স্কার্ফ")).toBe("সিল্ক-স্কার্ফ");
  });

  it("should handle multiple consecutive dashes", () => {
    expect(slugify("hello---world")).toBe("hello-world");
  });

  it("should trim leading and trailing dashes", () => {
    expect(slugify("-hello-")).toBe("hello");
  });

  it("should handle empty string", () => {
    expect(slugify("")).toBe("");
  });
});
```

- [ ] **Step 4: Run tests**

Run: `npm run test`
Expected: All tests pass

- [ ] **Step 5: Run linter**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/lib/price.test.ts src/lib/otp.test.ts src/lib/utils.test.ts
git commit -m "test: add unit tests for price, otp, and utils modules"
```

---

## Task 11: Final Verification

- [ ] **Step 1: Run full linter**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 2: Run all tests**

Run: `npm run test`
Expected: All tests pass

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds (may have warnings but no errors)

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "chore: final fixes and verification"
```

---

*End of implementation plan*
