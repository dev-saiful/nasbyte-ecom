# Phase 2: Storefront Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public-facing storefront including product listing, product detail, shopping cart, checkout, order confirmation, order tracking, and policy pages.

**Architecture:** Server-first hybrid approach with Server Components for data fetching and SEO, Client Components for interactivity. Zustand for client-side cart state with localStorage persistence and DB sync for logged-in users. API routes for cart operations and checkout.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Prisma 7, PostgreSQL, Zustand, nuqs, react-hook-form, Zod 4

## Global Constraints

- Next.js 16 with App Router and Turbopack
- Tailwind CSS 4 with `@import "tailwindcss"` (not `@tailwind` directives)
- shadcn/ui New York style with Lucide icons
- Prisma 7 with PostgreSQL
- Zod 4 for validation
- Biome for linting/formatting (not ESLint/Prettier)
- UUID primary keys for all models except `storefront_announcements`
- Currency: BDT (Bangladeshi Taka)
- Shipping: flat 150 BDT
- All imports use `@/*` path alias → `./src/*`

---

## File Structure

### New Files to Create

```
src/
├── app/(storefront)/
│   ├── products/
│   │   ├── page.tsx                    # Product listing page
│   │   ├── loading.tsx                 # Loading skeleton
│   │   └── [slug]/
│   │       ├── page.tsx                # Product detail page
│   │       └── loading.tsx             # Loading skeleton
│   ├── cart/
│   │   ├── page.tsx                    # Shopping cart page
│   │   └── loading.tsx                 # Loading skeleton
│   ├── checkout/
│   │   ├── page.tsx                    # Checkout page
│   │   └── loading.tsx                 # Loading skeleton
│   ├── orders/[id]/
│   │   └── confirmation/
│   │       └── page.tsx                # Order confirmation page
│   ├── track-order/
│   │   └── page.tsx                    # Order tracking page
│   └── policy/
│       └── page.tsx                    # Policy page
├── components/products/
│   ├── product-list.tsx                # Product grid display
│   ├── product-filters.tsx             # Sidebar filters
│   ├── product-sort.tsx                # Sort dropdown
│   ├── product-search.tsx              # Search input
│   ├── product-pagination.tsx          # Numbered pagination
│   ├── product-gallery.tsx             # Image gallery
│   ├── product-info.tsx                # Product info display
│   ├── product-variants.tsx            # Variant selector
│   ├── product-stock.tsx               # Stock indicator
│   ├── product-quantity.tsx            # Quantity selector
│   ├── product-actions.tsx             # Add to Cart + Buy Now
│   ├── product-features.tsx            # Features list
│   ├── product-reviews.tsx             # Reviews section
│   └── product-related.tsx             # Related products
├── components/cart/
│   ├── cart-item.tsx                   # Single cart item
│   ├── cart-summary.tsx                # Cart summary
│   ├── cart-empty.tsx                  # Empty cart state
│   └── cart-actions.tsx                # Quantity controls
├── components/checkout/
│   ├── shipping-form.tsx               # Shipping info form
│   ├── saved-addresses.tsx             # Saved addresses selector
│   ├── payment-method.tsx              # Payment method selection
│   ├── order-summary.tsx               # Order summary
│   ├── order-notes.tsx                 # Order notes textarea
│   └── place-order-button.tsx          # Submit button
├── components/order/
│   ├── order-details.tsx               # Order details display
│   └── order-timeline.tsx              # Order status timeline
├── components/policy/
│   └── policy-sections.tsx             # Policy content sections
├── stores/cart.ts                      # Zustand cart store
├── hooks/
│   ├── use-cart.ts                     # Cart hook
│   └── use-debounce.ts                 # Debounce hook
└── app/api/
    ├── cart/
    │   ├── route.ts                    # GET user cart
    │   └── items/
    │       ├── route.ts                # POST add item
    │       └── [itemId]/
    │           ├── route.ts            # PATCH/DELETE item
    │           └── sync/route.ts       # POST sync guest cart
    ├── checkout/
    │   └── route.ts                    # POST create order
    ├── products/
    │   └── route.ts                    # GET list products
    └── track-order/
        └── route.ts                    # GET track order
```

### Existing Files to Modify

- `src/lib/validators.ts` - Add cart item and product filters schemas
- `src/lib/price.ts` - Add cart total calculation
- `src/components/layout/storefront-header.tsx` - Add cart badge count

---

## Tasks

### Task 1: Foundation - Cart Store & Validation Schemas

**Files:**
- Create: `src/stores/cart.ts`
- Create: `src/hooks/use-cart.ts`
- Create: `src/hooks/use-debounce.ts`
- Modify: `src/lib/validators.ts`
- Modify: `src/lib/price.ts`

**Interfaces:**
- Consumes: Existing `formatBDT` from `src/lib/utils.ts`, `SHIPPING_COST` from `src/lib/price.ts`
- Produces: `CartStore` interface, `useCart` hook, `useDebounce` hook, `cartItemSchema`, `productFiltersSchema`

- [ ] **Step 1: Add validation schemas**

```typescript
// Add to src/lib/validators.ts at the end

export const cartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1),
});

export const productFiltersSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(["newest", "price-asc", "price-desc", "popularity"]).optional(),
  page: z.number().int().min(1).optional(),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;
export type ProductFiltersInput = z.infer<typeof productFiltersSchema>;
```

- [ ] **Step 2: Add cart price calculation**

```typescript
// Add to src/lib/price.ts

export function calculateCartTotal(
  items: { price: { toString(): string }; quantity: number }[],
): { subtotal: number; shipping: number; total: number } {
  const subtotal = calculateSubtotal(items);
  const total = calculateTotal(subtotal);
  return { subtotal, shipping: SHIPPING_COST, total };
}
```

- [ ] **Step 3: Create debounce hook**

```typescript
// Create src/hooks/use-debounce.ts

import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

- [ ] **Step 4: Create Zustand cart store**

```typescript
// Create src/stores/cart.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string | null;
  name: string;
  slug: string;
  price: number;
  image?: string | null;
  quantity: number;
  stock: number;
  variantDetails?: Record<string, string> | null;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    variantId?: string | null,
  ) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartItem[]>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) =>
              i.productId === item.productId &&
              i.variantId === item.variantId,
          );
          if (existingIndex > -1) {
            const newItems = [...state.items];
            newItems[existingIndex].quantity += item.quantity;
            return { items: newItems };
          }
          return {
            items: [...state.items, { ...item, id: crypto.randomUUID() }],
          };
        }),
      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (i) =>
              !(i.productId === productId && i.variantId === variantId),
          ),
        })),
      updateQuantity: (productId, quantity, variantId) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && i.variantId === variantId
              ? { ...i, quantity }
              : i,
          ),
        })),
      clearCart: () => set({ items: [] }),
      getTotalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
      getTotalPrice: () =>
        get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        ),
    }),
    {
      name: "cart-storage",
    },
  ),
);
```

- [ ] **Step 5: Create cart hook**

```typescript
// Create src/hooks/use-cart.ts

import { useCartStore, type CartItem } from "@/stores/cart";

export function useCart() {
  const store = useCartStore();

  const addItem = (item: Omit<CartItem, "id">) => {
    store.addItem(item);
  };

  const removeItem = (productId: string, variantId?: string | null) => {
    store.removeItem(productId, variantId);
  };

  const updateQuantity = (
    productId: string,
    quantity: number,
    variantId?: string | null,
  ) => {
    if (quantity < 1) {
      removeItem(productId, variantId);
      return;
    }
    store.updateQuantity(productId, quantity, variantId);
  };

  const clearCart = () => {
    store.clearCart();
  };

  const totalItems = store.getTotalItems();
  const totalPrice = store.getTotalPrice();

  return {
    items: store.items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };
}
```

- [ ] **Step 6: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/stores/cart.ts src/hooks/use-cart.ts src/hooks/use-debounce.ts src/lib/validators.ts src/lib/price.ts
git commit -m "feat(storefront): add cart store, hooks, and validation schemas"
```

---

### Task 2: Products API Route

**Files:**
- Create: `src/app/api/products/route.ts`

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma`, `productFiltersSchema` from `@/lib/validators`
- Produces: `GET /api/products` endpoint returning paginated products

- [ ] **Step 1: Create products API route**

```typescript
// Create src/app/api/products/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productFiltersSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const filters = productFiltersSchema.parse({
      category: params.category || undefined,
      search: params.search || undefined,
      sort: params.sort || "newest",
      page: params.page ? Number.parseInt(params.page) : 1,
    });

    const page = filters.page || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    const where = {
      isActive: true,
      deletedAt: null,
      ...(filters.category && {
        category: { slug: filters.category },
      }),
      ...(filters.search && {
        name: { contains: filters.search, mode: "insensitive" as const },
      }),
    };

    const orderBy = (() => {
      switch (filters.sort) {
        case "price-asc":
          return { price: "asc" as const };
        case "price-desc":
          return { price: "desc" as const };
        case "popularity":
          return { reviewCount: "desc" as const };
        case "newest":
        default:
          return { createdAt: "desc" as const };
      }
    })();

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { name: true, slug: true } },
          productImages: {
            select: { path: true, sortOrder: true },
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        price: Number(p.price),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        averageRating: Number(p.averageRating),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Test API route manually**

Run: `npm run dev`
Test: `curl http://localhost:3000/api/products`
Expected: JSON response with products array and pagination

- [ ] **Step 3: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/api/products/route.ts
git commit -m "feat(api): add products listing API route with filters and pagination"
```

---

### Task 3: Product Listing Components

**Files:**
- Create: `src/components/products/product-filters.tsx`
- Create: `src/components/products/product-sort.tsx`
- Create: `src/components/products/product-search.tsx`
- Create: `src/components/products/product-pagination.tsx`
- Create: `src/components/products/product-list.tsx`

**Interfaces:**
- Consumes: `useRouter` from `next/navigation`, `nuqs` for URL params
- Produces: Filter, sort, search, pagination, and list components

- [ ] **Step 1: Create product filters component**

```typescript
// Create src/components/products/product-filters.tsx

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const categories = [
  { name: "All", slug: "" },
  { name: "Scarves", slug: "scarves" },
  { name: "Bags", slug: "bags" },
  { name: "Jewelry", slug: "jewelry" },
  { name: "Shoes", slug: "shoes" },
  { name: "Accessories", slug: "accessories" },
];

export function ProductFilters() {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "";

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Categories</h3>
      <nav className="flex flex-col gap-1">
        {categories.map((category) => {
          const href = category.slug
            ? `/products?category=${category.slug}`
            : "/products";
          return (
            <Link
              key={category.slug}
              href={href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                currentCategory === category.slug
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {category.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
```

- [ ] **Step 2: Create product sort component**

```typescript
// Create src/components/products/product-sort.tsx

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "popularity", label: "Popularity" },
];

export function ProductSort() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "newest";

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <Select value={currentSort} onValueChange={handleSort}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

- [ ] **Step 3: Create product search component**

```typescript
// Create src/components/products/product-search.tsx

"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

export function ProductSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(search, 300);

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onBlur={() => handleSearch(debouncedSearch)}
        className="pl-9"
      />
    </div>
  );
}
```

- [ ] **Step 4: Create product pagination component**

```typescript
// Create src/components/products/product-pagination.tsx

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
}

export function ProductPagination({
  currentPage,
  totalPages,
}: ProductPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const createPageURL = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    return `/products?${params.toString()}`;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(
      (page) =>
        page === 1 ||
        page === totalPages ||
        (page >= currentPage - 1 && page <= currentPage + 1),
    )
    .reduce<(number | "ellipsis")[]>((acc, page, i, arr) => {
      if (i > 0 && page - (arr[i - 1] as number) > 1) {
        acc.push("ellipsis");
      }
      acc.push(page);
      return acc;
    }, []);

  return (
    <nav className="flex items-center justify-center gap-1">
      <Button
        variant="outline"
        size="icon"
        asChild
        disabled={currentPage === 1}
      >
        <Link href={createPageURL(currentPage - 1)}>
          <ChevronLeft className="size-4" />
        </Link>
      </Button>

      {pages.map((page, i) =>
        page === "ellipsis" ? (
          <span key={`ellipsis-${i}`} className="px-2">
            ...
          </span>
        ) : (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="icon"
            asChild
          >
            <Link href={createPageURL(page)}>{page}</Link>
          </Button>
        ),
      )}

      <Button
        variant="outline"
        size="icon"
        asChild
        disabled={currentPage === totalPages}
      >
        <Link href={createPageURL(currentPage + 1)}>
          <ChevronRight className="size-4" />
        </Link>
      </Button>
    </nav>
  );
}
```

- [ ] **Step 5: Create product list component**

```typescript
// Create src/components/products/product-list.tsx

"use client";

import { ProductCard } from "./product-card";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  averageRating: number;
  reviewCount: number;
  isFeatured: boolean;
  category?: { name: string; slug: string } | null;
  productImages?: { path: string; sortOrder: number }[];
}

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          No products found
        </p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or search terms
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/products/
git commit -m "feat(storefront): add product listing components (filters, sort, search, pagination)"
```

---

### Task 4: Product Listing Page

**Files:**
- Create: `src/app/(storefront)/products/page.tsx`
- Create: `src/app/(storefront)/products/loading.tsx`

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma`, Product listing components
- Produces: Product listing page with server-side data fetching

- [ ] **Step 1: Create loading skeleton**

```typescript
// Create src/app/(storefront)/products/loading.tsx

import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="w-64 shrink-0">
          <Skeleton className="h-8 w-32" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </aside>
        <main className="flex-1">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-[180px]" />
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create product listing page**

```typescript
// Create src/app/(storefront)/products/page.tsx

import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ProductList } from "@/components/products/product-list";
import { ProductFilters } from "@/components/products/product-filters";
import { ProductSort } from "@/components/products/product-sort";
import { ProductSearch } from "@/components/products/product-search";
import { ProductPagination } from "@/components/products/product-pagination";

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = 12;
  const skip = (page - 1) * limit;

  const where = {
    isActive: true,
    deletedAt: null,
    ...(params.category && {
      category: { slug: params.category },
    }),
    ...(params.search && {
      name: { contains: params.search, mode: "insensitive" as const },
    }),
  };

  const orderBy = (() => {
    switch (params.sort) {
      case "price-asc":
        return { price: "asc" as const };
      case "price-desc":
        return { price: "desc" as const };
      case "popularity":
        return { reviewCount: "desc" as const };
      case "newest":
      default:
        return { createdAt: "desc" as const };
    }
  })();

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true, slug: true } },
        productImages: {
          select: { path: true, sortOrder: true },
          orderBy: { sortOrder: "asc" },
          take: 1,
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="w-64 shrink-0">
          <Suspense fallback={<div>Loading filters...</div>}>
            <ProductFilters />
          </Suspense>
        </aside>
        <main className="flex-1">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-heading font-bold">
              {params.category
                ? `${params.category.charAt(0).toUpperCase() + params.category.slice(1)} Products`
                : "All Products"}
            </h1>
            <ProductSort />
          </div>
          <div className="mt-2">
            <ProductSearch />
          </div>
          <div className="mt-6">
            <ProductList
              products={products.map((p) => ({
                ...p,
                price: Number(p.price),
                compareAtPrice: p.compareAtPrice
                  ? Number(p.compareAtPrice)
                  : null,
                averageRating: Number(p.averageRating),
              }))}
            />
          </div>
          <div className="mt-8">
            <ProductPagination currentPage={page} totalPages={totalPages} />
          </div>
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Test page loads**

Run: `npm run dev`
Test: Visit `http://localhost:3000/products`
Expected: Product listing page with filters, sort, search, and pagination

- [ ] **Step 4: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/\(storefront\)/products/
git commit -m "feat(storefront): add product listing page with filters and pagination"
```

---

### Task 5: Product Detail Components

**Files:**
- Create: `src/components/products/product-gallery.tsx`
- Create: `src/components/products/product-info.tsx`
- Create: `src/components/products/product-variants.tsx`
- Create: `src/components/products/product-stock.tsx`
- Create: `src/components/products/product-quantity.tsx`
- Create: `src/components/products/product-actions.tsx`
- Create: `src/components/products/product-features.tsx`
- Create: `src/components/products/product-reviews.tsx`
- Create: `src/components/products/product-related.tsx`

**Interfaces:**
- Consumes: Product data from Prisma, `useCart` hook
- Produces: Product detail page components

- [ ] **Step 1: Create product gallery component**

```typescript
// Create src/components/products/product-gallery.tsx

"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: { path: string; sortOrder: number }[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-muted text-muted-foreground">
        No Image
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-lg">
        <Image
          src={images[selectedIndex].path}
          alt={`${productName} - Image ${selectedIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((image, index) => (
            <button
              key={image.sortOrder}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative size-16 overflow-hidden rounded-md border-2 transition-colors",
                selectedIndex === index
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground",
              )}
            >
              <Image
                src={image.path}
                alt={`${productName} - Thumbnail ${index + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create product info component**

```typescript
// Create src/components/products/product-info.tsx

import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatBDT } from "@/lib/utils";

interface ProductInfoProps {
  name: string;
  category?: { name: string; slug: string } | null;
  price: number;
  compareAtPrice?: number | null;
  averageRating: number;
  reviewCount: number;
  description?: string | null;
}

export function ProductInfo({
  name,
  category,
  price,
  compareAtPrice,
  averageRating,
  reviewCount,
  description,
}: ProductInfoProps) {
  const hasDiscount = compareAtPrice && compareAtPrice > price;

  return (
    <div className="space-y-4">
      {category && (
        <p className="text-sm text-muted-foreground">{category.name}</p>
      )}
      <h1 className="text-3xl font-heading font-bold">{name}</h1>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`size-4 ${
                star <= Math.round(averageRating)
                  ? "fill-primary text-primary"
                  : "fill-muted text-muted"
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          ({reviewCount} reviews)
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold">{formatBDT(price)}</span>
        {hasDiscount && (
          <span className="text-lg text-muted-foreground line-through">
            {formatBDT(compareAtPrice)}
          </span>
        )}
      </div>

      {description && (
        <div className="prose prose-sm max-w-none text-muted-foreground">
          {description}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create product variants component**

```typescript
// Create src/components/products/product-variants.tsx

"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ProductVariant {
  id: string;
  name: string | null;
  price: number;
  stock: number;
  isActive: boolean;
  variantOptions: {
    optionValue: {
      value: string;
      option: { name: string };
    };
  }[];
}

interface ProductVariantsProps {
  variants: ProductVariant[];
  selectedVariantId: string | null;
  onSelectVariant: (variantId: string) => void;
}

export function ProductVariants({
  variants,
  selectedVariantId,
  onSelectVariant,
}: ProductVariantsProps) {
  if (variants.length === 0) return null;

  const activeVariants = variants.filter((v) => v.isActive);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Options</h3>
      <div className="flex flex-wrap gap-2">
        {activeVariants.map((variant) => (
          <Button
            key={variant.id}
            variant={selectedVariantId === variant.id ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectVariant(variant.id)}
            disabled={variant.stock === 0}
            className={cn(
              selectedVariantId === variant.id && "ring-2 ring-primary",
            )}
          >
            {variant.name ||
              variant.variantOptions
                .map((vo) => vo.optionValue.value)
                .join(" / ")}
          </Button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create product stock component**

```typescript
// Create src/components/products/product-stock.tsx

import { Badge } from "@/components/ui/badge";

interface ProductStockProps {
  stock: number;
}

export function ProductStock({ stock }: ProductStockProps) {
  if (stock === 0) {
    return <Badge variant="destructive">Out of Stock</Badge>;
  }

  if (stock <= 10) {
    return (
      <Badge variant="secondary" className="text-orange-600">
        Low Stock ({stock} left)
      </Badge>
    );
  }

  return <Badge variant="secondary">In Stock</Badge>;
}
```

- [ ] **Step 5: Create product quantity component**

```typescript
// Create src/components/products/product-quantity.tsx

"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProductQuantityProps {
  quantity: number;
  maxStock: number;
  onChange: (quantity: number) => void;
}

export function ProductQuantity({
  quantity,
  maxStock,
  onChange,
}: ProductQuantityProps) {
  const handleDecrease = () => {
    if (quantity > 1) {
      onChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < maxStock) {
      onChange(quantity + 1);
    }
  };

  const handleInputChange = (value: string) => {
    const num = Number.parseInt(value);
    if (!Number.isNaN(num) && num >= 1 && num <= maxStock) {
      onChange(num);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handleDecrease}
        disabled={quantity <= 1}
      >
        <Minus className="size-4" />
      </Button>
      <Input
        type="number"
        value={quantity}
        onChange={(e) => handleInputChange(e.target.value)}
        className="w-16 text-center"
        min={1}
        max={maxStock}
      />
      <Button
        variant="outline"
        size="icon"
        onClick={handleIncrease}
        disabled={quantity >= maxStock}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
```

- [ ] **Step 6: Create product actions component**

```typescript
// Create src/components/products/product-actions.tsx

"use client";

import { ShoppingCart, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";

interface ProductActionsProps {
  productId: string;
  variantId?: string | null;
  name: string;
  slug: string;
  price: number;
  image?: string | null;
  stock: number;
  quantity: number;
  variantDetails?: Record<string, string> | null;
}

export function ProductActions({
  productId,
  variantId,
  name,
  slug,
  price,
  image,
  stock,
  quantity,
  variantDetails,
}: ProductActionsProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = () => {
    if (stock === 0) {
      toast.error("Product is out of stock");
      return;
    }

    addItem({
      productId,
      variantId,
      name,
      slug,
      price,
      image,
      quantity,
      stock,
      variantDetails,
    });

    toast.success("Added to cart", {
      description: `${name} has been added to your cart`,
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  return (
    <div className="flex gap-3">
      <Button
        size="lg"
        className="flex-1"
        onClick={handleAddToCart}
        disabled={stock === 0}
      >
        <ShoppingCart className="mr-2 size-4" />
        Add to Cart
      </Button>
      <Button
        size="lg"
        variant="secondary"
        className="flex-1"
        onClick={handleBuyNow}
        disabled={stock === 0}
      >
        <Zap className="mr-2 size-4" />
        Buy Now
      </Button>
    </div>
  );
}
```

- [ ] **Step 7: Create product features component**

```typescript
// Create src/components/products/product-features.tsx

import { Check } from "lucide-react";

interface ProductFeaturesProps {
  features: string[];
}

export function ProductFeatures({ features }: ProductFeaturesProps) {
  if (!features || features.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Features</h3>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 8: Create product reviews component**

```typescript
// Create src/components/products/product-reviews.tsx

import { Star, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  user: { name: string };
}

interface ProductReviewsProps {
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
}

export function ProductReviews({
  reviews,
  averageRating,
  reviewCount,
}: ProductReviewsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Star className="size-6 fill-primary text-primary" />
          <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
        </div>
        <span className="text-muted-foreground">
          ({reviewCount} reviews)
        </span>
      </div>

      <Separator />

      {reviews.length === 0 ? (
        <p className="text-center text-muted-foreground">No reviews yet</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {review.user.name}
                  </CardTitle>
                  {review.isVerifiedPurchase && (
                    <span className="flex items-center gap-1 text-xs text-primary">
                      <CheckCircle className="size-3" />
                      Verified Purchase
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`size-3 ${
                        star <= review.rating
                          ? "fill-primary text-primary"
                          : "fill-muted text-muted"
                      }`}
                    />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {review.title && (
                  <h4 className="mb-1 font-medium">{review.title}</h4>
                )}
                {review.comment && (
                  <p className="text-sm text-muted-foreground">
                    {review.comment}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 9: Create product related component**

```typescript
// Create src/components/products/product-related.tsx

import { ProductCard } from "../product-card";

interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  averageRating: number;
  reviewCount: number;
  isFeatured: boolean;
  category?: { name: string; slug: string } | null;
  productImages?: { path: string; sortOrder: number }[];
}

interface ProductRelatedProps {
  products: RelatedProduct[];
}

export function ProductRelated({ products }: ProductRelatedProps) {
  if (products.length === 0) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-heading font-bold">Related Products</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 10: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add src/components/products/
git commit -m "feat(storefront): add product detail components (gallery, info, variants, actions)"
```

---

### Task 6: Product Detail Page

**Files:**
- Create: `src/app/(storefront)/products/[slug]/page.tsx`
- Create: `src/app/(storefront)/products/[slug]/loading.tsx`

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma`, Product detail components
- Produces: Product detail page with server-side data fetching

- [ ] **Step 1: Create loading skeleton**

```typescript
// Create src/app/(storefront)/products/[slug]/loading.tsx

import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="aspect-square w-full" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="size-16" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create product detail page**

```typescript
// Create src/app/(storefront)/products/[slug]/page.tsx

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductInfo } from "@/components/products/product-info";
import { ProductVariants } from "@/components/products/product-variants";
import { ProductStock } from "@/components/products/product-stock";
import { ProductQuantity } from "@/components/products/product-quantity";
import { ProductActions } from "@/components/products/product-actions";
import { ProductFeatures } from "@/components/products/product-features";
import { ProductReviews } from "@/components/products/product-reviews";
import { ProductRelated } from "@/components/products/product-related";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug, deletedAt: null },
    include: {
      category: { select: { name: true, slug: true } },
      productImages: {
        select: { path: true, sortOrder: true },
        orderBy: { sortOrder: "asc" },
      },
      variants: {
        where: { isActive: true, deletedAt: null },
        include: {
          variantOptions: {
            include: {
              optionValue: {
                include: { option: true },
              },
            },
          },
        },
      },
      reviews: {
        where: { isApproved: true },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!product) {
    notFound();
  }

  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      isActive: true,
      deletedAt: null,
    },
    include: {
      category: { select: { name: true, slug: true } },
      productImages: {
        select: { path: true, sortOrder: true },
        orderBy: { sortOrder: "asc" },
        take: 1,
      },
    },
    take: 4,
  });

  const stock = product.hasVariants
    ? product.variants.reduce((sum, v) => sum + v.stock, 0)
    : product.stock;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery
          images={product.productImages}
          productName={product.name}
        />

        <div className="space-y-6">
          <ProductInfo
            name={product.name}
            category={product.category}
            price={Number(product.price)}
            compareAtPrice={
              product.compareAtPrice
                ? Number(product.compareAtPrice)
                : null
            }
            averageRating={Number(product.averageRating)}
            reviewCount={product.reviewCount}
            description={product.description}
          />

          <ProductStock stock={stock} />

          {product.hasVariants && (
            <ProductVariants
              variants={product.variants}
              selectedVariantId={null}
              onSelectVariant={() => {}}
            />
          )}

          <ProductQuantity
            quantity={1}
            maxStock={stock}
            onChange={() => {}}
          />

          <ProductActions
            productId={product.id}
            name={product.name}
            slug={product.slug}
            price={Number(product.price)}
            image={product.productImages[0]?.path}
            stock={stock}
            quantity={1}
          />

          {product.features && (
            <ProductFeatures
              features={product.features as string[]}
            />
          )}
        </div>
      </div>

      <div className="mt-16">
        <ProductReviews
          reviews={product.reviews.map((r) => ({
            ...r,
            createdAt: r.createdAt,
          }))}
          averageRating={Number(product.averageRating)}
          reviewCount={product.reviewCount}
        />
      </div>

      <div className="mt-16">
        <ProductRelated
          products={relatedProducts.map((p) => ({
            ...p,
            price: Number(p.price),
            compareAtPrice: p.compareAtPrice
              ? Number(p.compareAtPrice)
              : null,
            averageRating: Number(p.averageRating),
          }))}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Test page loads**

Run: `npm run dev`
Test: Visit `http://localhost:3000/products/[any-product-slug]`
Expected: Product detail page with gallery, info, variants, reviews, related products

- [ ] **Step 4: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/\(storefront\)/products/\[slug\]/
git commit -m "feat(storefront): add product detail page with gallery, variants, and reviews"
```

---

### Task 7: Cart API Routes

**Files:**
- Create: `src/app/api/cart/route.ts`
- Create: `src/app/api/cart/items/route.ts`
- Create: `src/app/api/cart/items/[itemId]/route.ts`
- Create: `src/app/api/cart/items/[itemId]/sync/route.ts`

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma`, `getServerSession` from `next-auth`
- Produces: Cart CRUD API endpoints

- [ ] **Step 1: Create GET cart route**

```typescript
// Create src/app/api/cart/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ items: [] });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            stock: true,
            productImages: {
              select: { path: true },
              take: 1,
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        variant: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            variantOptions: {
              include: {
                optionValue: {
                  include: { option: true },
                },
              },
            },
          },
        },
      },
    });

    const items = cartItems.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      name: item.product.name,
      slug: item.product.slug,
      price: Number(item.variant?.price ?? item.price),
      image: item.product.productImages[0]?.path ?? null,
      quantity: item.quantity,
      stock: item.variant?.stock ?? item.product.stock,
      variantDetails: item.variant
        ? Object.fromEntries(
            item.variant.variantOptions.map((vo) => [
              vo.optionValue.option.name,
              vo.optionValue.value,
            ]),
          )
        : null,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Cart GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Create POST add item route**

```typescript
// Create src/app/api/cart/items/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { cartItemSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const data = cartItemSchema.parse(body);

    const product = await prisma.product.findUnique({
      where: { id: data.productId, deletedAt: null },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 },
      );
    }

    if (product.stock < data.quantity) {
      return NextResponse.json(
        { error: "Insufficient stock" },
        { status: 400 },
      );
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId: session.user.id,
        productId: data.productId,
        variantId: data.variantId ?? null,
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + data.quantity;
      if (newQuantity > product.stock) {
        return NextResponse.json(
          { error: "Insufficient stock" },
          { status: 400 },
        );
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          userId: session.user.id,
          productId: data.productId,
          variantId: data.variantId ?? null,
          quantity: data.quantity,
          price: product.price,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart POST error:", error);
    return NextResponse.json(
      { error: "Failed to add item to cart" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 3: Create PATCH/DELETE item route**

```typescript
// Create src/app/api/cart/items/[itemId]/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ itemId: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { itemId } = await params;
    const body = await request.json();
    const { quantity } = body;

    if (typeof quantity !== "number" || quantity < 1) {
      return NextResponse.json(
        { error: "Invalid quantity" },
        { status: 400 },
      );
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, userId: session.user.id },
      include: { product: true },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: "Cart item not found" },
        { status: 404 },
      );
    }

    if (quantity > cartItem.product.stock) {
      return NextResponse.json(
        { error: "Insufficient stock" },
        { status: 400 },
      );
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update cart item" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { itemId } = await params;

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, userId: session.user.id },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: "Cart item not found" },
        { status: 404 },
      );
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete cart item" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 4: Create sync route**

```typescript
// Create src/app/api/cart/items/sync/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

interface SyncItem {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { items } = body as { items: SyncItem[] };

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Invalid items format" },
        { status: 400 },
      );
    }

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId, deletedAt: null },
      });

      if (!product) continue;

      const existingItem = await prisma.cartItem.findFirst({
        where: {
          userId: session.user.id,
          productId: item.productId,
          variantId: item.variantId ?? null,
        },
      });

      if (existingItem) {
        const newQuantity = Math.min(
          existingItem.quantity + item.quantity,
          product.stock,
        );
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
        });
      } else {
        const quantity = Math.min(item.quantity, product.stock);
        if (quantity > 0) {
          await prisma.cartItem.create({
            data: {
              userId: session.user.id,
              productId: item.productId,
              variantId: item.variantId ?? null,
              quantity,
              price: product.price,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync cart" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 5: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/api/cart/
git commit -m "feat(api): add cart API routes (GET, POST, PATCH, DELETE, sync)"
```

---

### Task 8: Cart Page

**Files:**
- Create: `src/app/(storefront)/cart/page.tsx`
- Create: `src/app/(storefront)/cart/loading.tsx`
- Create: `src/components/cart/cart-item.tsx`
- Create: `src/components/cart/cart-summary.tsx`
- Create: `src/components/cart/cart-empty.tsx`
- Create: `src/components/cart/cart-actions.tsx`

**Interfaces:**
- Consumes: `useCart` hook, `formatBDT` from `@/lib/utils`
- Produces: Shopping cart page with items, summary, and actions

- [ ] **Step 1: Create loading skeleton**

```typescript
// Create src/app/(storefront)/cart/loading.tsx

import { Skeleton } from "@/components/ui/skeleton";

export default function CartLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-10 w-48" />
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create cart item component**

```typescript
// Create src/components/cart/cart-item.tsx

"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { formatBDT } from "@/lib/utils";

interface CartItemProps {
  id: string;
  productId: string;
  variantId?: string | null;
  name: string;
  slug: string;
  price: number;
  image?: string | null;
  quantity: number;
  stock: number;
  variantDetails?: Record<string, string> | null;
}

export function CartItem({
  id,
  productId,
  variantId,
  name,
  slug,
  price,
  image,
  quantity,
  stock,
  variantDetails,
}: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex gap-4">
      <Link href={`/products/${slug}`} className="shrink-0">
        <div className="relative size-20 overflow-hidden rounded-md bg-muted">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              No Image
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col">
        <Link
          href={`/products/${slug}`}
          className="text-sm font-medium hover:text-primary"
        >
          {name}
        </Link>

        {variantDetails && (
          <p className="text-xs text-muted-foreground">
            {Object.entries(variantDetails)
              .map(([key, value]) => `${key}: ${value}`)
              .join(" | ")}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => updateQuantity(productId, quantity - 1, variantId)}
              disabled={quantity <= 1}
            >
              <Minus className="size-3" />
            </Button>
            <span className="w-8 text-center text-sm">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => updateQuantity(productId, quantity + 1, variantId)}
              disabled={quantity >= stock}
            >
              <Plus className="size-3" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-medium">{formatBDT(price * quantity)}</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive"
              onClick={() => removeItem(productId, variantId)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create cart summary component**

```typescript
// Create src/components/cart/cart-summary.tsx

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatBDT } from "@/lib/utils";
import { SHIPPING_COST } from "@/lib/price";
import Link from "next/link";

interface CartSummaryProps {
  subtotal: number;
  itemCount: number;
}

export function CartSummary({ subtotal, itemCount }: CartSummaryProps) {
  const total = subtotal + SHIPPING_COST;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span>Subtotal ({itemCount} items)</span>
          <span>{formatBDT(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Shipping</span>
          <span>{formatBDT(SHIPPING_COST)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>{formatBDT(total)}</span>
        </div>
        <Button asChild className="w-full" size="lg">
          <Link href="/checkout">Proceed to Checkout</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Create cart empty component**

```typescript
// Create src/components/cart/cart-empty.tsx

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CartEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <ShoppingBag className="mb-4 size-16 text-muted-foreground" />
      <h2 className="text-xl font-heading font-bold">Your cart is empty</h2>
      <p className="mt-2 text-muted-foreground">
        Add some items to your cart to get started
      </p>
      <Button asChild className="mt-6">
        <Link href="/products">Start Shopping</Link>
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: Create cart actions component**

```typescript
// Create src/components/cart/cart-actions.tsx

"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";

interface CartActionsProps {
  productId: string;
  variantId?: string | null;
  quantity: number;
  stock: number;
}

export function CartActions({
  productId,
  variantId,
  quantity,
  stock,
}: CartActionsProps) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        onClick={() => updateQuantity(productId, quantity - 1, variantId)}
        disabled={quantity <= 1}
      >
        <Minus className="size-3" />
      </Button>
      <span className="w-8 text-center text-sm">{quantity}</span>
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        onClick={() => updateQuantity(productId, quantity + 1, variantId)}
        disabled={quantity >= stock}
      >
        <Plus className="size-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="ml-2 size-8 text-destructive"
        onClick={() => removeItem(productId, variantId)}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
```

- [ ] **Step 6: Create cart page**

```typescript
// Create src/app/(storefront)/cart/page.tsx

"use client";

import { useCart } from "@/hooks/use-cart";
import { CartItem } from "@/components/cart/cart-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { CartEmpty } from "@/components/cart/cart-empty";

export default function CartPage() {
  const { items, totalItems, totalPrice } = useCart();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-heading font-bold">Shopping Cart</h1>

      {items.length === 0 ? (
        <CartEmpty />
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <CartItem key={item.id} {...item} />
            ))}
          </div>
          <div>
            <CartSummary subtotal={totalPrice} itemCount={totalItems} />
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Test cart page**

Run: `npm run dev`
Test: Visit `http://localhost:3000/cart`
Expected: Cart page with items (if any) or empty state

- [ ] **Step 8: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/app/\(storefront\)/cart/ src/components/cart/
git commit -m "feat(storefront): add shopping cart page with items, summary, and actions"
```

---

### Task 9: Checkout API Route

**Files:**
- Create: `src/app/api/checkout/route.ts`

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma`, `getServerSession` from `next-auth`, `checkoutSchema` from `@/lib/validators`
- Produces: `POST /api/checkout` endpoint creating order

- [ ] **Step 1: Create checkout API route**

```typescript
// Create src/app/api/checkout/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validators";
import { generateOrderNumber } from "@/lib/utils";
import { SHIPPING_COST } from "@/lib/price";

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const data = checkoutSchema.parse(body);

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: true,
        variant: true,
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 },
      );
    }

    const order = await prisma.$transaction(async (tx) => {
      // Lock and validate stock
      for (const item of cartItems) {
        const stock = item.variant?.stock ?? item.product.stock;
        if (item.quantity > stock) {
          throw new Error(
            `Insufficient stock for ${item.product.name}`,
          );
        }
      }

      // Generate order number
      let orderNumber = generateOrderNumber();
      let attempts = 0;
      while (attempts < 3) {
        const existing = await tx.order.findUnique({
          where: { orderNumber },
        });
        if (!existing) break;
        orderNumber = generateOrderNumber();
        attempts++;
      }

      // Create order
      const subtotal = cartItems.reduce(
        (sum, item) =>
          sum + Number(item.variant?.price ?? item.price) * item.quantity,
        0,
      );
      const total = subtotal + SHIPPING_COST;

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          subtotal,
          shippingCost: SHIPPING_COST,
          total,
          shippingAddress: data.shippingAddress,
          shippingCity: data.shippingCity,
          shippingPostalCode: data.shippingPostalCode,
          shippingPhone: data.shippingPhone,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          userId: session.user.id,
          items: {
            create: cartItems.map((item) => ({
              productName: item.product.name,
              productImage: item.product.productImages[0]?.path ?? null,
              variantDetails: item.variant
                ? Object.fromEntries(
                    item.variant.variantOptions?.map((vo) => [
                      vo.optionValue.option.name,
                      vo.optionValue.value,
                    ]) ?? [],
                  )
                : null,
              price: item.variant?.price ?? item.price,
              quantity: item.quantity,
              total: Number(item.variant?.price ?? item.price) * item.quantity,
              productId: item.productId,
              variantId: item.variantId,
            })),
          },
        },
      });

      // Decrement stock
      for (const item of cartItems) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }

        // Log inventory change
        const oldStock = item.variant?.stock ?? item.product.stock;
        await tx.inventoryStockLog.create({
          data: {
            productId: item.productId,
            userId: session.user.id,
            oldStock,
            newStock: oldStock - item.quantity,
            delta: -item.quantity,
          },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { userId: session.user.id },
      });

      return newOrder;
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to process checkout" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/api/checkout/route.ts
git commit -m "feat(api): add checkout API route with stock decrement and order creation"
```

---

### Task 10: Checkout Page

**Files:**
- Create: `src/app/(storefront)/checkout/page.tsx`
- Create: `src/app/(storefront)/checkout/loading.tsx`
- Create: `src/components/checkout/shipping-form.tsx`
- Create: `src/components/checkout/saved-addresses.tsx`
- Create: `src/components/checkout/payment-method.tsx`
- Create: `src/components/checkout/order-summary.tsx`
- Create: `src/components/checkout/order-notes.tsx`
- Create: `src/components/checkout/place-order-button.tsx`

**Interfaces:**
- Consumes: `useCart` hook, `checkoutSchema` from `@/lib/validators`, `react-hook-form`
- Produces: Checkout page with form and order placement

- [ ] **Step 1: Create loading skeleton**

```typescript
// Create src/app/(storefront)/checkout/loading.tsx

import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-10 w-48" />
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create shipping form component**

```typescript
// Create src/components/checkout/shipping-form.tsx

"use client";

import { UseFormReturn } from "react-hook-form";
import { CheckoutInput } from "@/lib/validators";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ShippingFormProps {
  form: UseFormReturn<CheckoutInput>;
}

export function ShippingForm({ form }: ShippingFormProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-heading font-semibold">Shipping Information</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="shippingPhone">Phone Number *</Label>
          <Input
            id="shippingPhone"
            {...register("shippingPhone")}
            placeholder="01XXXXXXXXX"
          />
          {errors.shippingPhone && (
            <p className="text-sm text-destructive">
              {errors.shippingPhone.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="shippingAddress">Address *</Label>
        <Textarea
          id="shippingAddress"
          {...register("shippingAddress")}
          placeholder="Street address, apartment, suite, etc."
          rows={3}
        />
        {errors.shippingAddress && (
          <p className="text-sm text-destructive">
            {errors.shippingAddress.message}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="shippingCity">City *</Label>
          <Input
            id="shippingCity"
            {...register("shippingCity")}
            placeholder="Dhaka"
          />
          {errors.shippingCity && (
            <p className="text-sm text-destructive">
              {errors.shippingCity.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="shippingPostalCode">Postal Code</Label>
          <Input
            id="shippingPostalCode"
            {...register("shippingPostalCode")}
            placeholder="1000"
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create payment method component**

```typescript
// Create src/components/checkout/payment-method.tsx

"use client";

import { UseFormReturn } from "react-hook-form";
import { CheckoutInput } from "@/lib/validators";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface PaymentMethodProps {
  form: UseFormReturn<CheckoutInput>;
}

export function PaymentMethod({ form }: PaymentMethodProps) {
  const { watch, setValue } = form;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-heading font-semibold">Payment Method</h2>

      <RadioGroup
        value={watch("paymentMethod")}
        onValueChange={(value) =>
          setValue("paymentMethod", value as CheckoutInput["paymentMethod"])
        }
      >
        <div className="flex items-center space-x-2 rounded-lg border p-4">
          <RadioGroupItem value="CASH_ON_DELIVERY" id="cod" />
          <Label htmlFor="cod" className="flex-1 cursor-pointer">
            <div className="font-medium">Cash on Delivery</div>
            <div className="text-sm text-muted-foreground">
              Pay when you receive your order
            </div>
          </Label>
        </div>

        <div className="flex items-center space-x-2 rounded-lg border p-4 opacity-50">
          <RadioGroupItem value="CARD" id="card" disabled />
          <Label htmlFor="card" className="flex-1 cursor-not-allowed">
            <div className="font-medium">Card Payment</div>
            <div className="text-sm text-muted-foreground">Coming soon</div>
          </Label>
        </div>

        <div className="flex items-center space-x-2 rounded-lg border p-4 opacity-50">
          <RadioGroupItem value="MOBILE_BANKING" id="mobile" disabled />
          <Label htmlFor="mobile" className="flex-1 cursor-not-allowed">
            <div className="font-medium">Mobile Banking</div>
            <div className="text-sm text-muted-foreground">Coming soon</div>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
```

- [ ] **Step 4: Create order summary component**

```typescript
// Create src/components/checkout/order-summary.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatBDT } from "@/lib/utils";
import { SHIPPING_COST } from "@/lib/price";
import { useCart } from "@/hooks/use-cart";
import Image from "next/image";

export function OrderSummary() {
  const { items, totalPrice } = useCart();
  const total = totalPrice + SHIPPING_COST;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-64 space-y-3 overflow-auto">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                    No Img
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  Qty: {item.quantity}
                </p>
              </div>
              <span className="text-sm font-medium">
                {formatBDT(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatBDT(totalPrice)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Shipping</span>
          <span>{formatBDT(SHIPPING_COST)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>{formatBDT(total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Create order notes component**

```typescript
// Create src/components/checkout/order-notes.tsx

"use client";

import { UseFormReturn } from "react-hook-form";
import { CheckoutInput } from "@/lib/validators";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface OrderNotesProps {
  form: UseFormReturn<CheckoutInput>;
}

export function OrderNotes({ form }: OrderNotesProps) {
  const { register } = form;

  return (
    <div className="space-y-2">
      <Label htmlFor="notes">Order Notes (Optional)</Label>
      <Textarea
        id="notes"
        {...register("notes")}
        placeholder="Special instructions for delivery..."
        rows={3}
      />
    </div>
  );
}
```

- [ ] **Step 6: Create place order button component**

```typescript
// Create src/components/checkout/place-order-button.tsx

"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlaceOrderButtonProps {
  isLoading: boolean;
  disabled: boolean;
}

export function PlaceOrderButton({
  isLoading,
  disabled,
}: PlaceOrderButtonProps) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={disabled || isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          Processing...
        </>
      ) : (
        "Place Order"
      )}
    </Button>
  );
}
```

- [ ] **Step 7: Create checkout page**

```typescript
// Create src/app/(storefront)/checkout/page.tsx

"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { checkoutSchema, type CheckoutInput } from "@/lib/validators";
import { useCart } from "@/hooks/use-cart";
import { ShippingForm } from "@/components/checkout/shipping-form";
import { PaymentMethod } from "@/components/checkout/payment-method";
import { OrderSummary } from "@/components/checkout/order-summary";
import { OrderNotes } from "@/components/checkout/order-notes";
import { PlaceOrderButton } from "@/components/checkout/place-order-button";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingAddress: "",
      shippingCity: "",
      shippingPostalCode: "",
      shippingPhone: "",
      paymentMethod: "CASH_ON_DELIVERY",
      notes: "",
    },
  });

  const onSubmit = async (data: CheckoutInput) => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to process checkout");
      }

      clearCart();
      toast.success("Order placed successfully!");
      router.push(`/orders/${result.orderId}/confirmation`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to process checkout",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-heading font-bold">Checkout</h1>
        <p className="mt-4 text-muted-foreground">
          Your cart is empty.{" "}
          <a href="/products" className="text-primary hover:underline">
            Continue shopping
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-heading font-bold">Checkout</h1>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <ShippingForm form={form} />
            <PaymentMethod form={form} />
            <OrderNotes form={form} />
          </div>
          <div className="space-y-6">
            <OrderSummary />
            <PlaceOrderButton isLoading={isLoading} disabled={false} />
          </div>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 8: Test checkout page**

Run: `npm run dev`
Test: Visit `http://localhost:3000/checkout`
Expected: Checkout page with shipping form, payment method, order summary

- [ ] **Step 9: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add src/app/\(storefront\)/checkout/ src/components/checkout/
git commit -m "feat(storefront): add checkout page with shipping form, payment, and order summary"
```

---

### Task 11: Order Confirmation Page

**Files:**
- Create: `src/app/(storefront)/orders/[id]/confirmation/page.tsx`
- Create: `src/components/order/order-details.tsx`
- Create: `src/components/order/order-timeline.tsx`

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma`, `formatBDT` from `@/lib/utils`
- Produces: Order confirmation page with details and timeline

- [ ] **Step 1: Create order details component**

```typescript
// Create src/components/order/order-details.tsx

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatBDT } from "@/lib/utils";

interface OrderDetailsProps {
  orderNumber: string;
  items: {
    id: string;
    productName: string;
    productImage: string | null;
    price: number;
    quantity: number;
    total: number;
  }[];
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string | null;
  paymentMethod: string;
}

export function OrderDetails({
  orderNumber,
  items,
  subtotal,
  shippingCost,
  total,
  shippingAddress,
  shippingCity,
  shippingPostalCode,
  paymentMethod,
}: OrderDetailsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No Img
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.productName}</p>
                <p className="text-sm text-muted-foreground">
                  Qty: {item.quantity} x {formatBDT(item.price)}
                </p>
              </div>
              <span className="font-medium">{formatBDT(item.total)}</span>
            </div>
          ))}

          <Separator />

          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatBDT(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>{formatBDT(shippingCost)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>{formatBDT(total)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipping & Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Shipping Address</p>
            <p className="text-sm text-muted-foreground">
              {shippingAddress}
              <br />
              {shippingCity}
              {shippingPostalCode && `, ${shippingPostalCode}`}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Payment Method</p>
            <p className="text-sm text-muted-foreground">
              {paymentMethod.replace(/_/g, " ")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Create order timeline component**

```typescript
// Create src/components/order/order-timeline.tsx

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineStep {
  status: string;
  label: string;
  completed: boolean;
  current: boolean;
}

interface OrderTimelineProps {
  currentStatus: string;
}

const statusSteps = [
  { status: "PENDING", label: "Order Placed" },
  { status: "CONFIRMED", label: "Confirmed" },
  { status: "PROCESSING", label: "Processing" },
  { status: "SHIPPED", label: "Shipped" },
  { status: "DELIVERED", label: "Delivered" },
];

export function OrderTimeline({ currentStatus }: OrderTimelineProps) {
  const currentIndex = statusSteps.findIndex(
    (step) => step.status === currentStatus,
  );

  const steps: TimelineStep[] = statusSteps.map((step, index) => ({
    ...step,
    completed: index < currentIndex,
    current: index === currentIndex,
  }));

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={step.status} className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full",
              step.completed && "bg-primary text-primary-foreground",
              step.current && "border-2 border-primary bg-background",
              !step.completed && !step.current && "border-2 border-muted",
            )}
          >
            {step.completed ? (
              <Check className="size-4" />
            ) : (
              <span className="text-xs font-medium">{index + 1}</span>
            )}
          </div>
          <div>
            <p
              className={cn(
                "text-sm font-medium",
                step.current && "text-primary",
                !step.completed && !step.current && "text-muted-foreground",
              )}
            >
              {step.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create order confirmation page**

```typescript
// Create src/app/(storefront)/orders/[id]/confirmation/page.tsx

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderDetails } from "@/components/order/order-details";
import { OrderTimeline } from "@/components/order/order-timeline";

interface OrderConfirmationPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderConfirmationPage({
  params,
}: OrderConfirmationPageProps) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-heading font-bold">Order Confirmed!</h1>
        <p className="mt-2 text-muted-foreground">
          Thank you for your order. Your order number is{" "}
          <span className="font-medium text-foreground">
            {order.orderNumber}
          </span>
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OrderDetails
            orderNumber={order.orderNumber}
            items={order.items.map((item) => ({
              ...item,
              price: Number(item.price),
              total: Number(item.total),
            }))}
            subtotal={Number(order.subtotal)}
            shippingCost={Number(order.shippingCost)}
            total={Number(order.total)}
            shippingAddress={order.shippingAddress}
            shippingCity={order.shippingCity}
            shippingPostalCode={order.shippingPostalCode}
            paymentMethod={order.paymentMethod}
          />
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline currentStatus={order.status} />
            </CardContent>
          </Card>

          <div className="mt-6 flex flex-col gap-3">
            <Button asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/account/orders">View All Orders</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Test confirmation page**

Run: `npm run dev`
Test: Complete a checkout and visit the confirmation page
Expected: Order confirmation with items, shipping, payment, and timeline

- [ ] **Step 5: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/\(storefront\)/orders/ src/components/order/
git commit -m "feat(storefront): add order confirmation page with details and timeline"
```

---

### Task 12: Track Order & Policy Pages

**Files:**
- Create: `src/app/(storefront)/track-order/page.tsx`
- Create: `src/app/(storefront)/policy/page.tsx`
- Create: `src/app/api/track-order/route.ts`
- Create: `src/components/policy/policy-sections.tsx`

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma`, `formatBDT` from `@/lib/utils`
- Produces: Order tracking page and policy page

- [ ] **Step 1: Create track order API route**

```typescript
// Create src/app/api/track-order/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("orderNumber");

    if (!orderNumber) {
      return NextResponse.json(
        { error: "Order number is required" },
        { status: 400 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber, deletedAt: null },
      include: {
        items: {
          select: {
            id: true,
            productName: true,
            productImage: true,
            price: true,
            quantity: true,
            total: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      total: Number(order.total),
      shippingAddress: order.shippingAddress,
      shippingCity: order.shippingCity,
      shippingPostalCode: order.shippingPostalCode,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
        total: Number(item.total),
      })),
    });
  } catch (error) {
    console.error("Track order error:", error);
    return NextResponse.json(
      { error: "Failed to track order" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Create track order page**

```typescript
// Create src/app/(storefront)/track-order/page.tsx

"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderTimeline } from "@/components/order/order-details";
import { formatBDT } from "@/lib/utils";
import { toast } from "sonner";

interface OrderData {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string | null;
  createdAt: string;
  items: {
    id: string;
    productName: string;
    productImage: string | null;
    price: number;
    quantity: number;
    total: number;
  }[];
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!orderNumber.trim()) {
      toast.error("Please enter an order number");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/track-order?orderNumber=${encodeURIComponent(orderNumber)}`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Order not found");
      }

      setOrder(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to track order",
      );
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-heading font-bold">Track Order</h1>
      <p className="mt-2 text-muted-foreground">
        Enter your order number to track your order status
      </p>

      <div className="mt-6 flex gap-2">
        <Input
          placeholder="Order number (e.g., ORD-XXXXXXXXXX)"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={isLoading}>
          <Search className="mr-2 size-4" />
          Track
        </Button>
      </div>

      {order && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Order {order.orderNumber}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <OrderTimeline currentStatus={order.status} />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm text-muted-foreground">
                  {order.status.replace(/_/g, " ")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Payment</p>
                <p className="text-sm text-muted-foreground">
                  {order.paymentMethod.replace(/_/g, " ")} (
                  {order.paymentStatus})
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium">Items</p>
              <div className="mt-2 space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.productName} x {item.quantity}
                    </span>
                    <span>{formatBDT(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between border-t pt-4 font-medium">
              <span>Total</span>
              <span>{formatBDT(order.total)}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create policy sections component**

```typescript
// Create src/components/policy/policy-sections.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const sections = [
  {
    id: "privacy",
    title: "Privacy Policy",
    content: `We collect personal information to process your orders and improve our services. Your data is stored securely and is only shared with third parties necessary for order fulfillment (shipping partners, payment processors). We do not sell your personal information to third parties.`,
  },
  {
    id: "terms",
    title: "Terms of Service",
    content: `By using our website, you agree to our terms and conditions. All products are subject to availability. We reserve the right to modify or discontinue products at any time. Prices are subject to change without notice.`,
  },
  {
    id: "shipping",
    title: "Shipping Policy",
    content: `We offer flat-rate shipping of 150 BDT for all orders within Bangladesh. Orders are typically processed within 1-2 business days. Delivery usually takes 3-5 business days depending on your location. You will receive a tracking number once your order is shipped.`,
  },
  {
    id: "returns",
    title: "Return Policy",
    content: `We accept returns within 7 days of delivery for most items. Items must be unused and in original packaging. To initiate a return, please contact our support team with your order number. Refunds will be processed within 5-7 business days after we receive the returned item.`,
  },
];

export function PolicySections() {
  return (
    <div className="space-y-8">
      {sections.map((section, index) => (
        <div key={section.id}>
          {index > 0 && <Separator className="mb-8" />}
          <Card>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{section.content}</p>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create policy page**

```typescript
// Create src/app/(storefront)/policy/page.tsx

import { PolicySections } from "@/components/policy/policy-sections";

export default function PolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-heading font-bold">Policies</h1>
      <p className="mt-2 text-muted-foreground">
        Please review our policies below
      </p>
      <div className="mt-8">
        <PolicySections />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Test pages**

Run: `npm run dev`
Test: Visit `http://localhost:3000/track-order` and `http://localhost:3000/policy`
Expected: Track order page with search input, policy page with sections

- [ ] **Step 6: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/app/\(storefront\)/track-order/ src/app/\(storefront\)/policy/ src/app/api/track-order/ src/components/policy/
git commit -m "feat(storefront): add order tracking and policy pages"
```

---

### Task 13: Update Header Cart Badge

**Files:**
- Modify: `src/components/layout/storefront-header.tsx`

**Interfaces:**
- Consumes: `useCart` hook
- Produces: Updated header with cart item count badge

- [ ] **Step 1: Update header with cart badge**

```typescript
// Update src/components/layout/storefront-header.tsx

"use client";

import { Menu, Search, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "@/hooks/use-cart";

const navLinks = [
  { href: "/products", label: "Shop All" },
  { href: "/products?featured=true", label: "Featured" },
  { href: "/policy", label: "Policy" },
];

export function StorefrontHeader() {
  const [open, setOpen] = useState(false);
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-xl font-heading font-bold text-primary"
          >
            NasByte SteCom
          </Link>

          <nav className="hidden items-center gap-4 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Search">
            <Search className="size-4" />
          </Button>

          <Link href="/cart">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Cart"
              className="relative"
            >
              <ShoppingBag className="size-4" />
              {totalItems > 0 && (
                <Badge
                  variant="secondary"
                  className="absolute -right-1 -top-1 size-4 justify-center rounded-full p-0 text-[10px]"
                >
                  {totalItems > 99 ? "99+" : totalItems}
                </Badge>
              )}
            </Button>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/login"
              className="inline-flex h-7 items-center justify-center gap-1 rounded-md bg-transparent px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex h-7 items-center justify-center gap-1 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              Sign up
            </Link>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="size-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              }
            />
            <SheetContent side="left" className="w-72">
              <SheetTitle className="text-lg font-heading font-bold">
                NasByte SteCom
              </SheetTitle>
              <nav className="mt-6 flex flex-col gap-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="my-2 border-t" />
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Sign up
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Test header cart badge**

Run: `npm run dev`
Test: Add items to cart and check header badge
Expected: Cart badge shows correct item count

- [ ] **Step 3: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/storefront-header.tsx
git commit -m "feat(storefront): update header with dynamic cart badge count"
```

---

### Task 14: Final Integration & Testing

**Files:**
- Verify all pages load correctly
- Test complete user flow

**Interfaces:**
- Consumes: All previous tasks
- Produces: Working storefront with complete flow

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Expected: Server starts without errors

- [ ] **Step 2: Test product listing**

Test: Visit `http://localhost:3000/products`
Expected: Products load with filters, search, and pagination

- [ ] **Step 3: Test product detail**

Test: Click on a product
Expected: Product detail page loads with gallery, info, variants, reviews

- [ ] **Step 4: Test add to cart**

Test: Click "Add to Cart" button
Expected: Item added to cart, badge updates in header

- [ ] **Step 5: Test cart page**

Test: Visit `http://localhost:3000/cart`
Expected: Cart page shows added items with correct totals

- [ ] **Step 6: Test checkout flow**

Test: Complete checkout process
Expected: Order created, confirmation page displays

- [ ] **Step 7: Test order tracking**

Test: Visit `http://localhost:3000/track-order` and enter order number
Expected: Order details and timeline displayed

- [ ] **Step 8: Test policy page**

Test: Visit `http://localhost:3000/policy`
Expected: Policy page displays all sections

- [ ] **Step 9: Run final lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 10: Final commit**

```bash
git add .
git commit -m "feat(storefront): complete Phase 2 implementation"
```

---

*End of Phase 2 Implementation Plan*
