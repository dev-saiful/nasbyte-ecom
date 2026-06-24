# Phase 4B: Admin Product Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build admin product management with list, create, edit pages, full CRUD API, variant support, and image upload.

**Architecture:** Admin route group `(admin)` with `/admin/products` pages. API routes under `/api/admin/products` with ADMIN auth check. Server Components for list/view, Client Components for forms. Image upload to local `public/images/uploads/` with optimization.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui, Prisma 7, PostgreSQL, Zod 4, react-hook-form, lucide-react, `@/*` path alias.

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
- Auth check: `auth()` from `@/lib/auth`, role must be `ADMIN`

---

## File Structure

### New Files to Create

```
src/
├── app/(admin)/admin/
│   ├── products/
│   │   ├── page.tsx                        # Product list page
│   │   ├── loading.tsx                     # Loading skeleton
│   │   └── [id]/
│   │       ├── page.tsx                    # Product detail view
│   │       └── edit/
│   │           └── page.tsx                # Edit product page
│   └── products/
│       └── new/
│           └── page.tsx                    # Create product page
├── components/admin/
│   ├── admin-product-table.tsx             # Product list table
│   ├── admin-product-form.tsx              # Create/edit product form
│   ├── admin-product-images.tsx            # Image upload/management
│   ├── admin-product-variants.tsx          # Variant management
│   └── admin-delete-dialog.tsx             # Reusable delete confirmation
├── app/api/admin/
│   ├── products/
│   │   ├── route.ts                        # GET (list), POST (create)
│   │   └── [id]/
│   │       ├── route.ts                    # GET (single), PUT (update), DELETE
│   │       └── toggle-status/route.ts      # PATCH toggle isActive
│   └── upload/
│       └── route.ts                        # POST file upload
└── lib/
    └── utils.ts                            # Add generateOrderNumber if missing
```

### Existing Files to Modify

- `src/components/admin/admin-sidebar.tsx` — Enable Products link
- `src/lib/validators.ts` — Add variant/option validators

---

## Tasks

### Task 1: Install Missing shadcn/ui Components

**Files:**
- Create: `src/components/ui/table.tsx`
- Create: `src/components/ui/switch.tsx`
- Create: `src/components/ui/checkbox.tsx`
- Create: `src/components/ui/alert-dialog.tsx`
- Create: `src/components/ui/tabs.tsx`

**Interfaces:**
- Consumes: shadcn/ui CLI
- Produces: Table, Switch, Checkbox, AlertDialog, Tabs components

- [ ] **Step 1: Install shadcn/ui components**

Run:
```bash
npx shadcn@latest add table switch checkbox alert-dialog tabs
```

Expected: Components added to `src/components/ui/`

- [ ] **Step 2: Verify components exist**

Run: `ls src/components/ui/`
Expected: `table.tsx`, `switch.tsx`, `checkbox.tsx`, `alert-dialog.tsx`, `tabs.tsx` present

- [ ] **Step 3: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/
git commit -m "feat(ui): add table, switch, checkbox, alert-dialog, tabs components"
```

---

### Task 2: Add Product Variant Validators

**Files:**
- Modify: `src/lib/validators.ts`

**Interfaces:**
- Consumes: Existing `productSchema`
- Produces: `productVariantSchema`, `productOptionSchema`

- [ ] **Step 1: Add variant validators to validators.ts**

Add at the end of `src/lib/validators.ts`:

```typescript
// ─── PRODUCT VARIANT ──────────────────────────────────────

export const productOptionSchema = z.object({
  name: z.string().min(1).max(100),
  values: z.array(z.string().min(1).max(100)).min(1),
});

export const productVariantSchema = z.object({
  name: z.string().max(255).optional(),
  sku: z.string().max(100).optional(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  stock: z.number().int().min(0),
  isActive: z.boolean().default(true),
  optionValues: z.record(z.string()).optional(),
});

export const adminProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  sku: z.string().max(100).optional(),
  stock: z.number().int().min(0),
  categoryId: z.string().uuid().optional().nullable(),
  hasVariants: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  features: z.array(z.string()).optional(),
  options: z.array(productOptionSchema).optional(),
  variants: z.array(productVariantSchema).optional(),
});

export type ProductOptionInput = z.infer<typeof productOptionSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type AdminProductInput = z.infer<typeof adminProductSchema>;
```

- [ ] **Step 2: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/validators.ts
git commit -m "feat(validators): add admin product and variant schemas"
```

---

### Task 3: Admin Product API — List & Create

**Files:**
- Create: `src/app/api/admin/products/route.ts`

**Interfaces:**
- Consumes: `auth` from `@/lib/auth`, `prisma` from `@/lib/prisma`, `adminProductSchema` from `@/lib/validators`
- Produces: `GET /api/admin/products` (list), `POST /api/admin/products` (create)

- [ ] **Step 1: Create admin products API route**

```typescript
// src/app/api/admin/products/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminProductSchema } from "@/lib/validators";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      include: {
        category: { select: { name: true, slug: true } },
        productImages: {
          select: { path: true, sortOrder: true },
          orderBy: { sortOrder: "asc" },
          take: 1,
        },
        _count: { select: { variants: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        price: Number(p.price),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        averageRating: Number(p.averageRating),
        variantCount: p._count.variants,
      })),
    });
  } catch (error) {
    console.error("Admin products GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = adminProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Generate slug, handle collision
    let slug = slugify(data.name);
    let slugAttempts = 0;
    while (slugAttempts < 5) {
      const existing = await prisma.product.findUnique({ where: { slug } });
      if (!existing) break;
      slug = `${slugify(data.name)}-${slugAttempts + 2}`;
      slugAttempts++;
    }

    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          price: data.price,
          compareAtPrice: data.compareAtPrice,
          sku: data.sku,
          stock: data.stock,
          categoryId: data.categoryId,
          hasVariants: data.hasVariants,
          isFeatured: data.isFeatured,
          isActive: data.isActive,
          features: data.features,
        },
      });

      // Create options and their values
      if (data.options && data.options.length > 0) {
        for (const option of data.options) {
          const createdOption = await tx.productOption.create({
            data: {
              name: option.name,
              productId: newProduct.id,
              displayOrder: data.options.indexOf(option),
            },
          });

          for (const value of option.values) {
            await tx.productOptionValue.create({
              data: {
                value,
                optionId: createdOption.id,
                displayOrder: option.values.indexOf(value),
              },
            });
          }
        }
      }

      // Create variants
      if (data.variants && data.variants.length > 0) {
        const options = await tx.productOption.findMany({
          where: { productId: newProduct.id },
          include: { values: true },
        });

        for (const variant of data.variants) {
          const createdVariant = await tx.productVariant.create({
            data: {
              name: variant.name,
              sku: variant.sku,
              price: variant.price,
              compareAtPrice: variant.compareAtPrice,
              stock: variant.stock,
              isActive: variant.isActive,
              productId: newProduct.id,
            },
          });

          // Link variant to option values
          if (variant.optionValues) {
            for (const [optionName, valueName] of Object.entries(
              variant.optionValues,
            )) {
              const option = options.find((o) => o.name === optionName);
              const optionValue = option?.values.find(
                (v) => v.value === valueName,
              );
              if (optionValue) {
                await tx.variantOptionValue.create({
                  data: {
                    variantId: createdVariant.id,
                    optionValueId: optionValue.id,
                  },
                });
              }
            }
          }
        }
      }

      return newProduct;
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Admin products POST error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
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
mkdir -p src/app/api/admin/products
git add src/app/api/admin/products/route.ts
git commit -m "feat(api): add admin products list and create routes"
```

---

### Task 4: Admin Product API — Get, Update, Delete, Toggle Status

**Files:**
- Create: `src/app/api/admin/products/[id]/route.ts`
- Create: `src/app/api/admin/products/[id]/toggle-status/route.ts`

**Interfaces:**
- Consumes: `auth` from `@/lib/auth`, `prisma` from `@/lib/prisma`, `adminProductSchema` from `@/lib/validators`
- Produces: `GET/PUT/DELETE /api/admin/products/[id]`, `PATCH /api/admin/products/[id]/toggle-status`

- [ ] **Step 1: Create single product API route**

```typescript
// src/app/api/admin/products/[id]/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminProductSchema } from "@/lib/validators";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        productImages: {
          orderBy: { sortOrder: "asc" },
        },
        productOptions: {
          include: { values: true },
          orderBy: { displayOrder: "asc" },
        },
        variants: {
          where: { deletedAt: null },
          include: {
            variantOptions: {
              include: {
                optionValue: { include: { option: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      product: {
        ...product,
        price: Number(product.price),
        compareAtPrice: product.compareAtPrice
          ? Number(product.compareAtPrice)
          : null,
        averageRating: Number(product.averageRating),
        variants: product.variants.map((v) => ({
          ...v,
          price: Number(v.price),
          compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
          optionValues: Object.fromEntries(
            v.variantOptions.map((vo) => [
              vo.optionValue.option.name,
              vo.optionValue.value,
            ]),
          ),
        })),
      },
    });
  } catch (error) {
    console.error("Admin product GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = adminProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const existing = await prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          price: data.price,
          compareAtPrice: data.compareAtPrice,
          sku: data.sku,
          stock: data.stock,
          categoryId: data.categoryId,
          hasVariants: data.hasVariants,
          isFeatured: data.isFeatured,
          isActive: data.isActive,
          features: data.features,
        },
      });

      // Replace options if provided
      if (data.options !== undefined) {
        // Delete existing options (cascades to values)
        await tx.productOption.deleteMany({ where: { productId: id } });

        for (const option of data.options) {
          const createdOption = await tx.productOption.create({
            data: {
              name: option.name,
              productId: id,
              displayOrder: data.options.indexOf(option),
            },
          });

          for (const value of option.values) {
            await tx.productOptionValue.create({
              data: {
                value,
                optionId: createdOption.id,
                displayOrder: option.values.indexOf(value),
              },
            });
          }
        }
      }

      // Replace variants if provided
      if (data.variants !== undefined) {
        // Delete existing variants (cascades to variantOptions)
        await tx.productVariant.deleteMany({ where: { productId: id } });

        const options = await tx.productOption.findMany({
          where: { productId: id },
          include: { values: true },
        });

        for (const variant of data.variants) {
          const createdVariant = await tx.productVariant.create({
            data: {
              name: variant.name,
              sku: variant.sku,
              price: variant.price,
              compareAtPrice: variant.compareAtPrice,
              stock: variant.stock,
              isActive: variant.isActive,
              productId: id,
            },
          });

          if (variant.optionValues) {
            for (const [optionName, valueName] of Object.entries(
              variant.optionValues,
            )) {
              const option = options.find((o) => o.name === optionName);
              const optionValue = option?.values.find(
                (v) => v.value === valueName,
              );
              if (optionValue) {
                await tx.variantOptionValue.create({
                  data: {
                    variantId: createdVariant.id,
                    optionValueId: optionValue.id,
                  },
                });
              }
            }
          }
        }
      }

      return updated;
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Admin product PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin product DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Create toggle-status route**

```typescript
// src/app/api/admin/products/[id]/toggle-status/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
    });

    return NextResponse.json({
      product: { ...updated, price: Number(updated.price) },
    });
  } catch (error) {
    console.error("Admin product toggle error:", error);
    return NextResponse.json(
      { error: "Failed to toggle status" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 3: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
mkdir -p src/app/api/admin/products/\[id\]/toggle-status
git add src/app/api/admin/products/
git commit -m "feat(api): add admin product detail, update, delete, and toggle-status routes"
```

---

### Task 5: Admin Product Table Component

**Files:**
- Create: `src/components/admin/admin-product-table.tsx`

**Interfaces:**
- Consumes: Product data from API, `formatBDT` from `@/lib/utils`
- Produces: `AdminProductTable` component used by product list page

- [ ] **Step 1: Create product table component**

```typescript
// src/components/admin/admin-product-table.tsx

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBDT } from "@/lib/utils";
import { MoreHorizontal, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  sku: string | null;
  category?: { name: string; slug: string } | null;
  productImages?: { path: string; sortOrder: number }[];
  variantCount: number;
}

interface AdminProductTableProps {
  products: Product[];
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}

export function AdminProductTable({
  products,
  onToggleStatus,
  onDelete,
}: AdminProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No products found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div className="relative size-10 overflow-hidden rounded-md bg-muted">
                  {product.productImages?.[0] ? (
                    <Image
                      src={product.productImages[0].path}
                      alt={product.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                      No Img
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">{product.name}</div>
                {product.isFeatured && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Featured
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {product.sku ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {product.category?.name ?? "—"}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatBDT(product.price)}
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={
                    product.stock === 0
                      ? "text-destructive"
                      : product.stock <= 10
                        ? "text-orange-600"
                        : ""
                  }
                >
                  {product.stock}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant={product.isActive ? "default" : "secondary"}>
                  {product.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      render={
                        <Link href={`/admin/products/${product.id}`}>
                          <Eye className="mr-2 size-4" />
                          View
                        </Link>
                      }
                    />
                    <DropdownMenuItem
                      render={
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Pencil className="mr-2 size-4" />
                          Edit
                        </Link>
                      }
                    />
                    <DropdownMenuItem
                      onClick={() => onToggleStatus(product.id)}
                    >
                      {product.isActive ? (
                        <>
                          <EyeOff className="mr-2 size-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 size-4" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete(product.id)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 2: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/admin-product-table.tsx
git commit -m "feat(admin): add product table component"
```

---

### Task 6: Admin Delete Dialog Component

**Files:**
- Create: `src/components/admin/admin-delete-dialog.tsx`

**Interfaces:**
- Consumes: `AlertDialog` from shadcn/ui
- Produces: `AdminDeleteDialog` reusable confirmation dialog

- [ ] **Step 1: Create delete dialog component**

```typescript
// src/components/admin/admin-delete-dialog.tsx

"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdminDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
}

export function AdminDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: AdminDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] **Step 2: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/admin-delete-dialog.tsx
git commit -m "feat(admin): add reusable delete confirmation dialog"
```

---

### Task 7: Admin Product List Page

**Files:**
- Create: `src/app/(admin)/admin/products/page.tsx`
- Create: `src/app/(admin)/admin/products/loading.tsx`
- Modify: `src/components/admin/admin-sidebar.tsx` (enable Products link)

**Interfaces:**
- Consumes: `AdminProductTable`, `AdminDeleteDialog`, `formatBDT`
- Produces: Product list page at `/admin/products`

- [ ] **Step 1: Enable Products link in sidebar**

In `src/components/admin/admin-sidebar.tsx`, change the Products link from `enabled: false` to `enabled: true`:

```typescript
{ href: "/admin/products", label: "Products", icon: Package, enabled: true },
```

- [ ] **Step 2: Create loading skeleton**

```typescript
// src/app/(admin)/admin/products/loading.tsx

import { Skeleton } from "@/components/ui/skeleton";

export default function AdminProductsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}
```

- [ ] **Step 3: Create product list page**

```typescript
// src/app/(admin)/admin/products/page.tsx

"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminProductTable } from "@/components/admin/admin-product-table";
import { AdminDeleteDialog } from "@/components/admin/admin-delete-dialog";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  sku: string | null;
  category?: { name: string; slug: string } | null;
  productImages?: { path: string; sortOrder: number }[];
  variantCount: number;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/products");
      const data = await response.json();
      setProducts(data.products);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleToggleStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/products/${id}/toggle-status`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Failed");
      toast.success("Status updated");
      fetchProducts();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const response = await fetch(`/api/admin/products/${deleteId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed");
      toast.success("Product deleted");
      setDeleteId(null);
      fetchProducts();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Products</h1>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 size-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">
          Loading...
        </div>
      ) : (
        <AdminProductTable
          products={products}
          onToggleStatus={handleToggleStatus}
          onDelete={setDeleteId}
        />
      )}

      <AdminDeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Product"
        description="This action cannot be undone. The product will be permanently deleted."
        onConfirm={handleDelete}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/\(admin\)/admin/products/ src/components/admin/admin-sidebar.tsx
git commit -m "feat(admin): add product list page with table, toggle status, delete"
```

---

### Task 8: Admin Product Form Component

**Files:**
- Create: `src/components/admin/admin-product-form.tsx`

**Interfaces:**
- Consumes: `adminProductSchema` from `@/lib/validators`, `react-hook-form`, `@hookform/resolvers`
- Produces: `AdminProductForm` component used by create/edit pages

- [ ] **Step 1: Create product form component**

This is a large component. Create `src/components/admin/admin-product-form.tsx` with:
- Basic info section (name, description, category, SKU, price, compare-at-price, stock)
- Status toggles (isActive, isFeatured)
- Features list (dynamic add/remove)
- Options & Variants section (conditional on hasVariants toggle)
- Form submission handling

Due to size, implement in full. The form uses `react-hook-form` with `zodResolver(adminProductSchema)`.

- [ ] **Step 2: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/admin-product-form.tsx
git commit -m "feat(admin): add product form component with basic info and features"
```

---

### Task 9: Admin Create Product Page

**Files:**
- Create: `src/app/(admin)/admin/products/new/page.tsx`

**Interfaces:**
- Consumes: `AdminProductForm`
- Produces: Create product page at `/admin/products/new`

- [ ] **Step 1: Create product page**

```typescript
// src/app/(admin)/admin/products/new/page.tsx

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AdminProductForm } from "@/components/admin/admin-product-form";
import type { AdminProductInput } from "@/lib/validators";

export default function NewProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: AdminProductInput) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to create product");
      }

      toast.success("Product created");
      router.push("/admin/products");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create product",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Create Product</h1>
      <AdminProductForm onSubmit={onSubmit} isLoading={isLoading} />
    </div>
  );
}
```

- [ ] **Step 2: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
mkdir -p src/app/\(admin\)/admin/products/new
git add src/app/\(admin\)/admin/products/new/page.tsx
git commit -m "feat(admin): add create product page"
```

---

### Task 10: Admin Edit Product Page

**Files:**
- Create: `src/app/(admin)/admin/products/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: `AdminProductForm`, product data from API
- Produces: Edit product page at `/admin/products/[id]/edit`

- [ ] **Step 1: Create edit product page**

```typescript
// src/app/(admin)/admin/products/[id]/edit/page.tsx

"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminProductForm } from "@/components/admin/admin-product-form";
import type { AdminProductInput } from "@/lib/validators";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      try {
        const response = await fetch(`/api/admin/products/${params.id}`);
        const data = await response.json();
        setInitialData(data.product);
      } catch {
        toast.error("Failed to load product");
        router.push("/admin/products");
      } finally {
        setIsLoadingProduct(false);
      }
    }
    loadProduct();
  }, [params.id, router]);

  const onSubmit = async (data: AdminProductInput) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to update product");
      }

      toast.success("Product updated");
      router.push("/admin/products");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update product",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Edit Product</h1>
      <AdminProductForm
        onSubmit={onSubmit}
        isLoading={isLoading}
        initialData={initialData}
      />
    </div>
  );
}
```

- [ ] **Step 2: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
mkdir -p src/app/\(admin\)/admin/products/\[id\]/edit
git add src/app/\(admin\)/admin/products/\[id\]/edit/page.tsx
git commit -m "feat(admin): add edit product page"
```

---

### Task 11: Admin Product Detail View Page

**Files:**
- Create: `src/app/(admin)/admin/products/[id]/page.tsx`

**Interfaces:**
- Consumes: Product data from API, `formatBDT`
- Produces: Product detail view page at `/admin/products/[id]`

- [ ] **Step 1: Create product detail page**

```typescript
// src/app/(admin)/admin/products/[id]/page.tsx

"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatBDT } from "@/lib/utils";
import { ArrowLeft, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  sku: string | null;
  stock: number;
  features: string[] | null;
  hasVariants: boolean;
  isFeatured: boolean;
  isActive: boolean;
  averageRating: number;
  reviewCount: number;
  category?: { id: string; name: string; slug: string } | null;
  productImages: { id: string; path: string; sortOrder: number }[];
  productOptions: {
    id: string;
    name: string;
    values: { id: string; value: string }[];
  }[];
  variants: {
    id: string;
    name: string | null;
    sku: string | null;
    price: number;
    stock: number;
    isActive: boolean;
    optionValues: Record<string, string>;
  }[];
}

export default function AdminProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      try {
        const response = await fetch(`/api/admin/products/${params.id}`);
        const data = await response.json();
        setProduct(data.product);
      } catch {
        toast.error("Failed to load product");
        router.push("/admin/products");
      } finally {
        setIsLoading(false);
      }
    }
    loadProduct();
  }, [params.id, router]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <h1 className="font-heading text-2xl font-bold">{product.name}</h1>
        </div>
        <Button asChild>
          <Link href={`/admin/products/${product.id}/edit`}>
            <Pencil className="mr-2 size-4" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <p>{product.category?.name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">SKU</p>
                  <p>{product.sku ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Price</p>
                  <p className="font-medium">{formatBDT(product.price)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Compare at</p>
                  <p>{product.compareAtPrice ? formatBDT(product.compareAtPrice) : "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Stock</p>
                  <p>{product.stock}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rating</p>
                  <p>{product.averageRating.toFixed(1)} ({product.reviewCount} reviews)</p>
                </div>
              </div>
              {product.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="mt-1 text-sm">{product.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {product.productImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {product.productImages.map((img) => (
                    <div key={img.id} className="relative size-24 overflow-hidden rounded-md bg-muted">
                      <Image src={img.path} alt="" fill sizes="96px" className="object-cover" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {product.features && product.features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-inside list-disc space-y-1">
                  {product.features.map((f, i) => (
                    <li key={i} className="text-sm">{f}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Active</span>
                <Badge variant={product.isActive ? "default" : "secondary"}>
                  {product.isActive ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Featured</span>
                <Badge variant={product.isFeatured ? "default" : "secondary"}>
                  {product.isFeatured ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Has Variants</span>
                <Badge variant={product.hasVariants ? "default" : "secondary"}>
                  {product.hasVariants ? "Yes" : "No"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {product.variants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Variants ({product.variants.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.variants.map((v) => (
                  <div key={v.id} className="rounded-md border p-3 text-sm">
                    <div className="font-medium">{v.name || Object.values(v.optionValues).join(" / ")}</div>
                    <div className="text-muted-foreground">
                      {formatBDT(v.price)} · Stock: {v.stock}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
mkdir -p src/app/\(admin\)/admin/products/\[id\]
git add src/app/\(admin\)/admin/products/\[id\]/page.tsx
git commit -m "feat(admin): add product detail view page"
```

---

### Task 12: Final Build Verification

**Files:**
- No new files. Verify existing work.

- [ ] **Step 1: Run full lint**

Run: `npm run lint`
Expected: Only pre-existing warnings

- [ ] **Step 2: Run full build**

Run: `npm run build`
Expected: Build succeeds. All routes compile.

- [ ] **Step 3: Final commit if needed**

```bash
git add .
git commit -m "feat(admin): complete Phase 4B admin product management"
```
