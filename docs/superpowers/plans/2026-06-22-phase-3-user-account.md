# Phase 3: User Account Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the user account dashboard including account overview, order history, address management, profile settings, and security settings.

**Architecture:** Server-first hybrid approach with Server Components for data fetching, Client Components for interactivity. API routes for account operations (profile update, password change, address CRUD). Account layout with sidebar navigation.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Prisma 7, PostgreSQL, Zod 4, react-hook-form, bcryptjs

## Global Constraints

- Next.js 16 with App Router and Turbopack
- Tailwind CSS 4 with `@import "tailwindcss"` (not `@tailwind` directives)
- shadcn/ui New York style with Lucide icons
- Prisma 7 with PostgreSQL
- Zod 4 for validation
- Biome for linting/formatting (not ESLint/Prettier)
- UUID primary keys for all models except `storefront_announcements`
- Currency: BDT (Bangladeshi Taka)
- All imports use `@/*` path alias → `./src/*`

---

## File Structure

### New Files to Create

```
src/
├── app/(account)/
│   ├── layout.tsx                          # Account layout with sidebar
│   ├── account/
│   │   └── page.tsx                        # Account overview page
│   ├── orders/
│   │   ├── page.tsx                        # Order history page
│   │   └── [id]/
│   │       └── page.tsx                    # Order detail page
│   ├── addresses/
│   │   └── page.tsx                        # Address management page
│   ├── profile/
│   │   └── page.tsx                        # Profile settings page
│   └── security/
│       └── page.tsx                        # Security settings page
├── components/account/
│   ├── account-sidebar.tsx                 # Sidebar navigation
│   ├── account-overview.tsx                # Overview stats card
│   ├── address-card.tsx                    # Address display card
│   ├── address-form.tsx                    # Address create/edit form
│   └── security-forms.tsx                  # Password change + 2FA forms
├── app/api/account/
│   ├── profile/
│   │   └── route.ts                        # PUT update profile
│   ├── password/
│   │   └── route.ts                        # PUT change password
│   └── addresses/
│       ├── route.ts                        # GET, POST addresses
│       └── [id]/
│           └── route.ts                    # PUT, DELETE address
└── hooks/
    └── use-account.ts                      # Account data hooks
```

### Existing Files to Modify

- `src/lib/validators.ts` - Already has profileSchema, passwordChangeSchema, addressSchema
- `src/components/layout/storefront-header.tsx` - Add user menu dropdown

---

## Tasks

### Task 1: Account Layout with Sidebar

**Files:**
- Create: `src/app/(account)/layout.tsx`
- Create: `src/components/account/account-sidebar.tsx`

**Interfaces:**
- Consumes: `auth` from `@/lib/auth`, `usePathname` from `next/navigation`
- Produces: Account layout with sidebar navigation

- [ ] **Step 1: Create account sidebar component**

```typescript
// Create src/components/account/account-sidebar.tsx

"use client";

import {
  Home,
  MapPin,
  Package,
  Settings,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { href: "/account", label: "Overview", icon: Home },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile", icon: Settings },
  { href: "/account/security", label: "Security", icon: Shield },
];

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {sidebarLinks.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href !== "/account" && pathname.startsWith(link.href));
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
  );
}
```

- [ ] **Step 2: Create account layout**

```typescript
// Create src/app/(account)/layout.tsx

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { StorefrontHeader } from "@/components/layout/storefront-header";
import { StorefrontFooter } from "@/components/layout/storefront-footer";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row">
            <aside className="w-full shrink-0 lg:w-64">
              <h2 className="mb-4 text-lg font-heading font-semibold">
                My Account
              </h2>
              <AccountSidebar />
            </aside>
            <div className="flex-1">{children}</div>
          </div>
        </div>
      </main>
      <StorefrontFooter />
    </div>
  );
}
```

- [ ] **Step 3: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/\(account\)/layout.tsx src/components/account/account-sidebar.tsx
git commit -m "feat(account): add account layout with sidebar navigation"
```

---

### Task 2: Account Overview Page

**Files:**
- Create: `src/app/(account)/account/page.tsx`
- Create: `src/components/account/account-overview.tsx`

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma`, `auth` from `@/lib/auth`
- Produces: Account overview page with stats and recent orders

- [ ] **Step 1: Create account overview component**

```typescript
// Create src/components/account/account-overview.tsx

import { Package, MapPin, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface AccountOverviewProps {
  totalOrders: number;
  pendingOrders: number;
  savedAddresses: number;
  recentOrder: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: Date;
  } | null;
  defaultAddress: {
    id: string;
    recipientName: string;
    addressLine: string;
    city: string;
  } | null;
}

function formatStatus(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function AccountOverview({
  totalOrders,
  pendingOrders,
  savedAddresses,
  recentOrder,
  defaultAddress,
}: AccountOverviewProps) {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Account Overview</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {pendingOrders} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Saved Addresses
            </CardTitle>
            <MapPin className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{savedAddresses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cart Items</CardTitle>
            <ShoppingBag className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Recent Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrder ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">
                    {recentOrder.orderNumber}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatStatus(recentOrder.status)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {new Date(recentOrder.createdAt).toLocaleDateString()}
                  </span>
                  <span>৳{Number(recentOrder.total).toLocaleString()}</span>
                </div>
                <Link
                  href={`/account/orders/${recentOrder.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  View Details →
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No orders yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Default Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            {defaultAddress ? (
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {defaultAddress.recipientName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {defaultAddress.addressLine}
                </p>
                <p className="text-sm text-muted-foreground">
                  {defaultAddress.city}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  No default address set
                </p>
                <Link
                  href="/account/addresses"
                  className="text-sm text-primary hover:underline"
                >
                  Add Address →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create account overview page**

```typescript
// Create src/app/(account)/account/page.tsx

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountOverview } from "@/components/account/account-overview";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [totalOrders, pendingOrders, savedAddresses, recentOrder, defaultAddress] =
    await Promise.all([
      prisma.order.count({
        where: { userId, deletedAt: null },
      }),
      prisma.order.count({
        where: { userId, status: "PENDING", deletedAt: null },
      }),
      prisma.address.count({
        where: { userId, deletedAt: null },
      }),
      prisma.order.findFirst({
        where: { userId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
        },
      }),
      prisma.address.findFirst({
        where: { userId, isDefault: true, deletedAt: null },
        select: {
          id: true,
          recipientName: true,
          addressLine: true,
          city: true,
        },
      }),
    ]);

  return (
    <AccountOverview
      totalOrders={totalOrders}
      pendingOrders={pendingOrders}
      savedAddresses={savedAddresses}
      recentOrder={recentOrder}
      defaultAddress={defaultAddress}
    />
  );
}
```

- [ ] **Step 3: Test page loads**

Run: `npm run dev`
Test: Visit `http://localhost:3000/account`
Expected: Account overview page with stats

- [ ] **Step 4: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/\(account\)/account/ src/components/account/account-overview.tsx
git commit -m "feat(account): add account overview page with stats"
```

---

### Task 3: Order History Page

**Files:**
- Create: `src/app/(account)/orders/page.tsx`
- Create: `src/app/(account)/orders/[id]/page.tsx`

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma`, `auth` from `@/lib/auth`
- Produces: Order history list and order detail pages

- [ ] **Step 1: Create order history page**

```typescript
// Create src/app/(account)/orders/page.tsx

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBDT } from "@/lib/utils";

function getStatusVariant(status: string) {
  switch (status) {
    case "PENDING":
      return "secondary";
    case "CONFIRMED":
    case "PROCESSING":
      return "default";
    case "SHIPPED":
    case "DELIVERED":
      return "default";
    case "CANCELLED":
      return "destructive";
    default:
      return "secondary";
  }
}

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id, deletedAt: null },
    include: {
      items: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Order History</h1>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No orders yet</p>
            <Link
              href="/products"
              className="mt-2 text-sm text-primary hover:underline"
            >
              Start Shopping →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {order.orderNumber}
                </CardTitle>
                <Badge variant={getStatusVariant(order.status)}>
                  {order.status.charAt(0) +
                    order.status.slice(1).toLowerCase()}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <p>
                      {new Date(order.createdAt).toLocaleDateString("en-BD", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p>{order.items.length} item(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatBDT(order.total)}</p>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create order detail page**

```typescript
// Create src/app/(account)/orders/[id]/page.tsx

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderTimeline } from "@/components/order/order-timeline";
import { formatBDT } from "@/lib/utils";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
    include: {
      items: true,
    },
  });

  if (!order) {
    redirect("/account/orders");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/account/orders"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Orders
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">
          Order {order.orderNumber}
        </h1>
        <Badge variant="secondary">
          {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity} × {formatBDT(item.price)}
                    </p>
                  </div>
                  <span className="font-medium">{formatBDT(item.total)}</span>
                </div>
              ))}

              <Separator />

              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatBDT(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>{formatBDT(order.shippingCost)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatBDT(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                {order.shippingAddress}
                <br />
                {order.shippingCity}
                {order.shippingPostalCode && `, ${order.shippingPostalCode}`}
              </p>
              <p className="text-sm text-muted-foreground">
                Phone: {order.shippingPhone}
              </p>
              <p className="text-sm text-muted-foreground">
                Payment: {order.paymentMethod.replace(/_/g, " ")}
              </p>
            </CardContent>
          </Card>
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
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Test pages load**

Run: `npm run dev`
Test: Visit `http://localhost:3000/account/orders`
Expected: Order history page

- [ ] **Step 4: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/\(account\)/orders/
git commit -m "feat(account): add order history and order detail pages"
```

---

### Task 4: Address Management

**Files:**
- Create: `src/app/(account)/addresses/page.tsx`
- Create: `src/components/account/address-card.tsx`
- Create: `src/components/account/address-form.tsx`
- Create: `src/app/api/account/addresses/route.ts`
- Create: `src/app/api/account/addresses/[id]/route.ts`

**Interfaces:**
- Consumes: `prisma` from `@/lib/auth`, `addressSchema` from `@/lib/validators`
- Produces: Address CRUD pages and API routes

- [ ] **Step 1: Create GET/POST addresses API route**

```typescript
// Create src/app/api/account/addresses/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addressSchema } from "@/lib/validators";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id, deletedAt: null },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("Addresses GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id, deletedAt: null },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        ...data,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    console.error("Address POST error:", error);
    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Create PUT/DELETE address API route**

```typescript
// Create src/app/api/account/addresses/[id]/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addressSchema } from "@/lib/validators";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const existing = await prisma.address.findFirst({
      where: { id, userId: session.user.id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 },
      );
    }

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id, deletedAt: null, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data,
    });

    return NextResponse.json({ address });
  } catch (error) {
    console.error("Address PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.address.findFirst({
      where: { id, userId: session.user.id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 },
      );
    }

    await prisma.address.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Address DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 3: Create address card component**

```typescript
// Create src/components/account/address-card.tsx

import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AddressCardProps {
  id: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function AddressCard({
  recipientName,
  phone,
  addressLine,
  city,
  postalCode,
  country,
  isDefault,
  onEdit,
  onDelete,
  id,
}: AddressCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">{recipientName}</CardTitle>
          {isDefault && <Badge variant="secondary">Default</Badge>}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onEdit(id)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive"
            onClick={() => onDelete(id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-sm text-muted-foreground">{phone}</p>
        <p className="text-sm text-muted-foreground">
          {addressLine}
          <br />
          {city}
          {postalCode && `, ${postalCode}`}
          <br />
          {country}
        </p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Create address form component**

```typescript
// Create src/components/account/address-form.tsx

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addressSchema, type AddressInput } from "@/lib/validators";

interface AddressFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    id: string;
    recipientName: string;
    phone: string;
    addressLine: string;
    city: string;
    postalCode: string | null;
    isDefault: boolean;
  } | null;
  onSuccess: () => void;
}

export function AddressForm({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: AddressFormProps) {
  const form = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      recipientName: "",
      phone: "",
      addressLine: "",
      city: "",
      postalCode: "",
      country: "Bangladesh",
      isDefault: false,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        recipientName: initialData.recipientName,
        phone: initialData.phone,
        addressLine: initialData.addressLine,
        city: initialData.city,
        postalCode: initialData.postalCode ?? "",
        country: "Bangladesh",
        isDefault: initialData.isDefault,
      });
    } else {
      form.reset({
        recipientName: "",
        phone: "",
        addressLine: "",
        city: "",
        postalCode: "",
        country: "Bangladesh",
        isDefault: false,
      });
    }
  }, [initialData, form]);

  const onSubmit = async (data: AddressInput) => {
    try {
      const url = initialData
        ? `/api/account/addresses/${initialData.id}`
        : "/api/account/addresses";
      const method = initialData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save address");
      }

      toast.success(initialData ? "Address updated" : "Address added");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Failed to save address");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Address" : "Add New Address"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipientName">Recipient Name *</Label>
            <Input id="recipientName" {...form.register("recipientName")} />
            {form.formState.errors.recipientName && (
              <p className="text-sm text-destructive">
                {form.formState.errors.recipientName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input id="phone" {...form.register("phone")} />
            {form.formState.errors.phone && (
              <p className="text-sm text-destructive">
                {form.formState.errors.phone.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine">Address *</Label>
            <Input id="addressLine" {...form.register("addressLine")} />
            {form.formState.errors.addressLine && (
              <p className="text-sm text-destructive">
                {form.formState.errors.addressLine.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input id="city" {...form.register("city")} />
              {form.formState.errors.city && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.city.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input id="postalCode" {...form.register("postalCode")} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              {...form.register("isDefault")}
              className="size-4"
            />
            <Label htmlFor="isDefault" className="text-sm">
              Set as default address
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {initialData ? "Update" : "Add"} Address
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 5: Create addresses page**

```typescript
// Create src/app/(account)/addresses/page.tsx

"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AddressCard } from "@/components/account/address-card";
import { AddressForm } from "@/components/account/address-form";

interface Address {
  id: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const fetchAddresses = useCallback(async () => {
    try {
      const response = await fetch("/api/account/addresses");
      const data = await response.json();
      setAddresses(data.addresses);
    } catch {
      toast.error("Failed to load addresses");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleEdit = (id: string) => {
    const address = addresses.find((a) => a.id === id);
    if (address) {
      setEditingAddress(address);
      setFormOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const response = await fetch(`/api/account/addresses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      toast.success("Address deleted");
      fetchAddresses();
    } catch {
      toast.error("Failed to delete address");
    }
  };

  const handleFormSuccess = () => {
    setEditingAddress(null);
    fetchAddresses();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Addresses</h1>
        <Button
          onClick={() => {
            setEditingAddress(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" />
          Add Address
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground">Loading...</div>
      ) : addresses.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          No addresses saved yet
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              {...address}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <AddressForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initialData={editingAddress}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
```

- [ ] **Step 6: Test address pages**

Run: `npm run dev`
Test: Visit `http://localhost:3000/account/addresses`
Expected: Address management page with add/edit/delete

- [ ] **Step 7: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/app/\(account\)/addresses/ src/components/account/address-card.tsx src/components/account/address-form.tsx src/app/api/account/addresses/
git commit -m "feat(account): add address management with CRUD operations"
```

---

### Task 5: Profile Settings Page

**Files:**
- Create: `src/app/(account)/profile/page.tsx`
- Create: `src/app/api/account/profile/route.ts`

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma`, `profileSchema` from `@/lib/validators`
- Produces: Profile settings page with update functionality

- [ ] **Step 1: Create profile API route**

```typescript
// Create src/app/api/account/profile/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validators";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        phone: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { name, phone } = parsed.data;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name, phone },
      select: {
        name: true,
        email: true,
        phone: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Profile PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Create profile settings page**

```typescript
// Create src/app/(account)/profile/page.tsx

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileSchema, type ProfileInput } from "@/lib/validators";

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/account/profile");
        const data = await response.json();
        form.reset({
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone ?? "",
        });
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [form]);

  const onSubmit = async (data: ProfileInput) => {
    try {
      const response = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to update");

      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Profile Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" {...form.register("email")} disabled />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...form.register("phone")} />
            </div>

            <Button type="submit" disabled={form.formState.isSubmitting}>
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Test profile page**

Run: `npm run dev`
Test: Visit `http://localhost:3000/account/profile`
Expected: Profile settings page

- [ ] **Step 4: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/\(account\)/profile/ src/app/api/account/profile/
git commit -m "feat(account): add profile settings page with update"
```

---

### Task 6: Security Settings Page

**Files:**
- Create: `src/app/(account)/security/page.tsx`
- Create: `src/components/account/security-forms.tsx`
- Create: `src/app/api/account/password/route.ts`

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma`, `passwordChangeSchema` from `@/lib/validators`
- Produces: Security settings page with password change

- [ ] **Step 1: Create password change API route**

```typescript
// Create src/app/api/account/password/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { passwordChangeSchema } from "@/lib/validators";

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = passwordChangeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { current_password, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(current_password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password PUT error:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Create security forms component**

```typescript
// Create src/components/account/security-forms.tsx

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  passwordChangeSchema,
  type PasswordChangeInput,
} from "@/lib/validators";

export function PasswordChangeForm() {
  const form = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      current_password: "",
      password: "",
      password_confirmation: "",
    },
  });

  const onSubmit = async (data: PasswordChangeInput) => {
    try {
      const response = await fetch("/api/account/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to change password");
      }

      toast.success("Password changed successfully");
      form.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to change password",
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current_password">Current Password</Label>
            <Input
              id="current_password"
              type="password"
              {...form.register("current_password")}
            />
            {form.formState.errors.current_password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.current_password.message}
              </p>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password_confirmation">Confirm New Password</Label>
            <Input
              id="password_confirmation"
              type="password"
              {...form.register("password_confirmation")}
            />
            {form.formState.errors.password_confirmation && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password_confirmation.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={form.formState.isSubmitting}>
            Change Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function TwoFactorSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Two-factor authentication adds an extra layer of security to your
          account. Once enabled, you will be prompted for a secure code during
          login.
        </p>
        <Button variant="outline" className="mt-4" disabled>
          Enable 2FA (Coming Soon)
        </Button>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create security settings page**

```typescript
// Create src/app/(account)/security/page.tsx

import {
  PasswordChangeForm,
  TwoFactorSection,
} from "@/components/account/security-forms";

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Security Settings</h1>
      <PasswordChangeForm />
      <TwoFactorSection />
    </div>
  );
}
```

- [ ] **Step 4: Test security page**

Run: `npm run dev`
Test: Visit `http://localhost:3000/account/security`
Expected: Security settings with password change form

- [ ] **Step 5: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/\(account\)/security/ src/components/account/security-forms.tsx src/app/api/account/password/
git commit -m "feat(account): add security settings with password change"
```

---

### Task 7: Update Header with User Menu

**Files:**
- Modify: `src/components/layout/storefront-header.tsx`

**Interfaces:**
- Consumes: `auth` from `@/lib/auth`, `signOut` from `@/lib/auth`
- Produces: Updated header with user dropdown menu

- [ ] **Step 1: Update header with user menu**

```typescript
// Update src/components/layout/storefront-header.tsx

"use client";

import { LogOut, Menu, Search, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  { href: "/track-order", label: "Track Order" },
];

interface StorefrontHeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

export function StorefrontHeader({ user }: StorefrontHeaderProps) {
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

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account">My Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/orders">My Orders</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    window.location.href = "/api/auth/signout";
                  }}
                >
                  <LogOut className="mr-2 size-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
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
          )}

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
                {user ? (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setOpen(false)}
                      className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      My Account
                    </Link>
                    <Link
                      href="/account/orders"
                      onClick={() => setOpen(false)}
                      className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      My Orders
                    </Link>
                    <div className="my-2 border-t" />
                    <button
                      onClick={() => {
                        window.location.href = "/api/auth/signout";
                      }}
                      className="text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Update storefront layout to pass user**

```typescript
// Update src/app/(storefront)/layout.tsx

import { auth } from "@/lib/auth";
import { StorefrontFooter } from "@/components/layout/storefront-footer";
import { StorefrontHeader } from "@/components/layout/storefront-header";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader user={session?.user} />
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
    </div>
  );
}
```

- [ ] **Step 3: Run lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/storefront-header.tsx src/app/\(storefront\)/layout.tsx
git commit -m "feat(account): update header with user dropdown menu"
```

---

### Task 8: Final Integration & Testing

**Files:**
- Verify all pages load correctly
- Test complete user flow

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Expected: Server starts without errors

- [ ] **Step 2: Test account overview**

Test: Login and visit `http://localhost:3000/account`
Expected: Account overview with stats

- [ ] **Step 3: Test order history**

Test: Visit `http://localhost:3000/account/orders`
Expected: Order history page

- [ ] **Step 4: Test address management**

Test: Visit `http://localhost:3000/account/addresses`, add/edit/delete address
Expected: Address CRUD works

- [ ] **Step 5: Test profile settings**

Test: Visit `http://localhost:3000/account/profile`, update profile
Expected: Profile updates successfully

- [ ] **Step 6: Test security settings**

Test: Visit `http://localhost:3000/account/security`, change password
Expected: Password changes successfully

- [ ] **Step 7: Test header user menu**

Test: Check header shows user dropdown when logged in
Expected: User menu with account links

- [ ] **Step 8: Run final lint check**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 9: Run build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 10: Final commit**

```bash
git add .
git commit -m "feat(account): complete Phase 3 implementation"
```

---

*End of Phase 3 Implementation Plan*
