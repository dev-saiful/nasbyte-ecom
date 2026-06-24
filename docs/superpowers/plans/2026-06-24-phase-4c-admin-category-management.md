# Phase 4C: Admin Category Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build admin category management with list, create, edit pages, full CRUD API, and toggle status.

**Architecture:** Admin route group `(admin)` with `/admin/categories` pages. API routes under `/api/admin/categories` with ADMIN auth check. Server Components for list/view, Client Components for forms. Image upload to local `public/images/uploads/` with optimization.

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
- Button component uses `render` prop (not `asChild`)

---

## File Structure

### New Files to Create

```
src/
├── app/(admin)/admin/
│   ├── categories/
│   │   ├── page.tsx                        # Category list page
│   │   ├── loading.tsx                     # Loading skeleton
│   │   └── [id]/
│   │       └── edit/
│   │           └── page.tsx                # Edit category page
│   └── categories/
│       └── new/
│           └── page.tsx                    # Create category page
├── components/admin/
│   ├── admin-category-table.tsx            # Category list table
│   ├── admin-category-form.tsx             # Create/edit category form
│   └── admin-delete-dialog.tsx             # Reusable (already exists)
├── app/api/admin/
│   ├── categories/
│   │   ├── route.ts                        # GET (list), POST (create)
│   │   └── [id]/
│   │       ├── route.ts                    # GET (single), PUT (update), DELETE
│   │       └── toggle-status/route.ts      # PATCH toggle isActive
│   └── upload/
│       └── route.ts                        # POST file upload (if not exists)
└── lib/
    └── validators.ts                       # Category schema (already exists)
```

### Existing Files to Modify

- `src/components/admin/admin-sidebar.tsx` — Enable Categories link

---

## Tasks

### Task 1: Enable Categories Link in Sidebar

**Files:**
- Modify: `src/components/admin/admin-sidebar.tsx`

**Interfaces:**
- Consumes: None
- Produces: Enabled Categories link in sidebar

- [ ] **Step 1: Enable Categories link**

In `src/components/admin/admin-sidebar.tsx`, change the Categories link from `enabled: false` to `enabled: true`:

```typescript
{
  href: "/admin/categories",
  label: "Categories",
  icon: FolderTree,
  enabled: true,
},
```

- [ ] **Step 2: Run lint check**

Run: `npm run lint`
Expected: PASS (only pre-existing warnings)

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/admin-sidebar.tsx
git commit -m "feat(admin): enable categories link in sidebar"
```

---

### Task 2: Admin Category API — List & Create

**Files:**
- Create: `src/app/api/admin/categories/route.ts`

**Interfaces:**
- Consumes: `auth` from `@/lib/auth`, `prisma` from `@/lib/prisma`, `categorySchema` from `@/lib/validators`
- Produces: `GET /api/admin/categories` (list), `POST /api/admin/categories` (create)

- [ ] **Step 1: Create admin categories API route**

```typescript
// src/app/api/admin/categories/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validators";

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

    const categories = await prisma.category.findMany({
      where: { deletedAt: null },
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      categories: categories.map((c) => ({
        ...c,
        productCount: c._count.products,
      })),
    });
  } catch (error) {
    console.error("Admin categories GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
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
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Generate slug if not provided, handle collision
    let slug = data.slug || slugify(data.name);
    let slugAttempts = 0;
    while (slugAttempts < 5) {
      const existing = await prisma.category.findUnique({ where: { slug } });
      if (!existing) break;
      slug = `${slugify(data.name)}-${slugAttempts + 2}`;
      slugAttempts++;
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        imagePath: data.imagePath,
        isActive: data.isActive,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Admin categories POST error:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
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
mkdir -p src/app/api/admin/categories
git add src/app/api/admin/categories/route.ts
git commit -m "feat(api): add admin categories list and create routes"
```

---

### Task 3: Admin Category API — Get, Update, Delete, Toggle Status

**Files:**
- Create: `src/app/api/admin/categories/[id]/route.ts`
- Create: `src/app/api/admin/categories/[id]/toggle-status/route.ts`

**Interfaces:**
- Consumes: `auth` from `@/lib/auth`, `prisma` from `@/lib/prisma`, `categorySchema` from `@/lib/validators`
- Produces: `GET/PUT/DELETE /api/admin/categories/[id]`, `PATCH /api/admin/categories/[id]/toggle-status`

- [ ] **Step 1: Create single category API route**

```typescript
// src/app/api/admin/categories/[id]/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validators";

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

    const category = await prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      category: {
        ...category,
        productCount: category._count.products,
      },
    });
  } catch (error) {
    console.error("Admin category GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
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
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const existing = await prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        imagePath: data.imagePath,
        isActive: data.isActive,
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Admin category PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
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

    const existing = await prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (existing._count.products > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with linked products" },
        { status: 400 },
      );
    }

    await prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin category DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Create toggle-status route**

```typescript
// src/app/api/admin/categories/[id]/toggle-status/route.ts

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

    const category = await prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!category) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { isActive: !category.isActive },
    });

    return NextResponse.json({ category: updated });
  } catch (error) {
    console.error("Admin category toggle error:", error);
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
mkdir -p src/app/api/admin/categories/\[id\]/toggle-status
git add src/app/api/admin/categories/
git commit -m "feat(api): add admin category detail, update, delete, and toggle-status routes"
```

---

### Task 4: Admin Category Table Component

**Files:**
- Create: `src/components/admin/admin-category-table.tsx`

**Interfaces:**
- Consumes: Category data from API
- Produces: `AdminCategoryTable` component used by category list page

- [ ] **Step 1: Create category table component**

```typescript
// src/components/admin/admin-category-table.tsx

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
import { Eye, EyeOff, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imagePath: string | null;
  isActive: boolean;
  productCount: number;
}

interface AdminCategoryTableProps {
  categories: Category[];
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}

export function AdminCategoryTable({
  categories,
  onToggleStatus,
  onDelete,
}: AdminCategoryTableProps) {
  if (categories.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No categories found
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
            <TableHead>Slug</TableHead>
            <TableHead className="text-right">Products</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell>
                <div className="relative size-10 overflow-hidden rounded-md bg-muted">
                  {category.imagePath ? (
                    <Image
                      src={category.imagePath}
                      alt={category.name}
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
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {category.slug}
              </TableCell>
              <TableCell className="text-right">{category.productCount}</TableCell>
              <TableCell>
                <Badge variant={category.isActive ? "default" : "secondary"}>
                  {category.isActive ? "Active" : "Inactive"}
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
                        <Link href={`/admin/categories/${category.id}/edit`}>
                          <Pencil className="mr-2 size-4" />
                          Edit
                        </Link>
                      }
                    />
                    <DropdownMenuItem
                      onClick={() => onToggleStatus(category.id)}
                    >
                      {category.isActive ? (
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
                      onClick={() => onDelete(category.id)}
                      disabled={category.productCount > 0}
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
git add src/components/admin/admin-category-table.tsx
git commit -m "feat(admin): add category table component"
```

---

### Task 5: Admin Category Form Component

**Files:**
- Create: `src/components/admin/admin-category-form.tsx`

**Interfaces:**
- Consumes: `categorySchema` from `@/lib/validators`, `react-hook-form`, `@hookform/resolvers`
- Produces: `AdminCategoryForm` component used by create/edit pages

- [ ] **Step 1: Create category form component**

```typescript
// src/components/admin/admin-category-form.tsx

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { categorySchema } from "@/lib/validators";
import type { CategoryInput } from "@/lib/validators";

interface AdminCategoryFormProps {
  onSubmit: (data: CategoryInput) => Promise<void>;
  isLoading: boolean;
  initialData?: {
    name: string;
    slug: string;
    description: string | null;
    imagePath: string | null;
    isActive: boolean;
  };
}

export function AdminCategoryForm({
  onSubmit,
  isLoading,
  initialData,
}: AdminCategoryFormProps) {
  const router = useRouter();

  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initialData?.name ?? "",
      slug: initialData?.slug ?? "",
      description: initialData?.description ?? "",
      imagePath: initialData?.imagePath ?? "",
      isActive: initialData?.isActive ?? true,
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Category Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              {...register("name", {
                onChange: (e) => {
                  if (!initialData) {
                    setValue("slug", generateSlug(e.target.value));
                  }
                },
              })}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input id="slug" {...register("slug")} />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imagePath">Image URL</Label>
            <Input
              id="imagePath"
              {...register("imagePath")}
              placeholder="/images/categories/example.jpg"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Active</Label>
              <p className="text-sm text-muted-foreground">
                Category is visible on the storefront
              </p>
            </div>
            <Switch
              checked={watch("isActive")}
              onCheckedChange={(checked) => setValue("isActive", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/categories")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Saving..."
            : initialData
              ? "Update Category"
              : "Create Category"}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/admin-category-form.tsx
git commit -m "feat(admin): add category form component"
```

---

### Task 6: Admin Category List Page

**Files:**
- Create: `src/app/(admin)/admin/categories/page.tsx`
- Create: `src/app/(admin)/admin/categories/loading.tsx`

**Interfaces:**
- Consumes: `AdminCategoryTable`, `AdminDeleteDialog`
- Produces: Category list page at `/admin/categories`

- [ ] **Step 1: Create loading skeleton**

```typescript
// src/app/(admin)/admin/categories/loading.tsx

import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCategoriesLoading() {
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

- [ ] **Step 2: Create category list page**

```typescript
// src/app/(admin)/admin/categories/page.tsx

"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminDeleteDialog } from "@/components/admin/admin-delete-dialog";
import { AdminCategoryTable } from "@/components/admin/admin-category-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imagePath: string | null;
  isActive: boolean;
  productCount: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/categories");
      const data = await response.json();
      setCategories(data.categories);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleToggleStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/categories/${id}/toggle-status`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Failed");
      toast.success("Status updated");
      fetchCategories();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const response = await fetch(`/api/admin/categories/${deleteId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed");
      }
      toast.success("Category deleted");
      setDeleteId(null);
      fetchCategories();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete category",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Categories</h1>
        <Button render={<Link href="/admin/categories/new" />}>
          <Plus className="mr-2 size-4" />
          Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">
          Loading...
        </div>
      ) : (
        <AdminCategoryTable
          categories={categories}
          onToggleStatus={handleToggleStatus}
          onDelete={setDeleteId}
        />
      )}

      <AdminDeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Category"
        description="This action cannot be undone. The category will be permanently deleted."
        onConfirm={handleDelete}
      />
    </div>
  );
}
```

- [ ] **Step 3: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
mkdir -p src/app/\(admin\)/admin/categories
git add src/app/\(admin\)/admin/categories/
git commit -m "feat(admin): add category list page with table, toggle status, delete"
```

---

### Task 7: Admin Create Category Page

**Files:**
- Create: `src/app/(admin)/admin/categories/new/page.tsx`

**Interfaces:**
- Consumes: `AdminCategoryForm`
- Produces: Create category page at `/admin/categories/new`

- [ ] **Step 1: Create category page**

```typescript
// src/app/(admin)/admin/categories/new/page.tsx

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AdminCategoryForm } from "@/components/admin/admin-category-form";
import type { CategoryInput } from "@/lib/validators";

export default function NewCategoryPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: CategoryInput) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to create category");
      }

      toast.success("Category created");
      router.push("/admin/categories");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create category",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Create Category</h1>
      <AdminCategoryForm onSubmit={onSubmit} isLoading={isLoading} />
    </div>
  );
}
```

- [ ] **Step 2: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
mkdir -p src/app/\(admin\)/admin/categories/new
git add src/app/\(admin\)/admin/categories/new/page.tsx
git commit -m "feat(admin): add create category page"
```

---

### Task 8: Admin Edit Category Page

**Files:**
- Create: `src/app/(admin)/admin/categories/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: `AdminCategoryForm`, category data from API
- Produces: Edit category page at `/admin/categories/[id]/edit`

- [ ] **Step 1: Create edit category page**

```typescript
// src/app/(admin)/admin/categories/[id]/edit/page.tsx

"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminCategoryForm } from "@/components/admin/admin-category-form";
import type { CategoryInput } from "@/lib/validators";

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);
  const [isLoadingCategory, setIsLoadingCategory] = useState(true);

  useEffect(() => {
    async function loadCategory() {
      try {
        const response = await fetch(`/api/admin/categories/${params.id}`);
        const data = await response.json();
        setInitialData(data.category);
      } catch {
        toast.error("Failed to load category");
        router.push("/admin/categories");
      } finally {
        setIsLoadingCategory(false);
      }
    }
    loadCategory();
  }, [params.id, router]);

  const onSubmit = async (data: CategoryInput) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/categories/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to update category");
      }

      toast.success("Category updated");
      router.push("/admin/categories");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update category",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingCategory) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Edit Category</h1>
      <AdminCategoryForm
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
mkdir -p src/app/\(admin\)/admin/categories/\[id\]/edit
git add src/app/\(admin\)/admin/categories/\[id\]/edit/page.tsx
git commit -m "feat(admin): add edit category page"
```

---

### Task 9: Final Build Verification

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
git commit -m "feat(admin): complete Phase 4C admin category management"
```
