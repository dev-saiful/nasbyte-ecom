# Phase 4D: Admin Order Management

**Goal:** Build admin order management with order list (filter, search, pagination), order detail view, and status update capabilities.

## Scope

- Enable Orders link in admin sidebar
- Order list API with filters (status, payment status, date range), search (order number, customer), pagination
- Order detail API with status/payment status update
- Order table component with filter controls
- Order detail page with inline status management
- Order list page

**Out of scope:** Email notifications, bulk operations, invoice PDF generation.

## Architecture

### Data Flow
```
Admin Order List → GET /api/admin/orders → Prisma Query (with filters) → Response
Admin Order Detail → GET /api/admin/orders/[id] → Prisma Query → Response
Status Update → PATCH /api/admin/orders/[id] → Prisma Update → Response
Payment Update → PATCH /api/admin/orders/[id]/payment → Prisma Update → Response
```

### Order Status Flow
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED → CANCELLED

### Payment Status Flow
PENDING → PAID → FAILED → REFUNDED

---

## Task Breakdown

### Task 1: Enable Orders Link in Sidebar
**Files:** `src/components/admin/admin-sidebar.tsx`
**Change:** `enabled: false` → `enabled: true` for Orders link
**Verify:** `npm run lint`
**Commit:** `feat(admin): enable orders link in sidebar`

---

### Task 2: Admin Orders API — List with Filters
**File:** `src/app/api/admin/orders/route.ts`
**Pattern:** Follow `src/app/api/admin/categories/route.ts`
**Auth:** `auth()` from `@/lib/auth`, role check `(session.user as any).role !== "ADMIN"`

**GET /api/admin/orders:**
- Query params: `status`, `paymentStatus`, `search`, `startDate`, `endDate`, `page` (default 1), `limit` (default 20)
- Filters (all optional, applied only when provided):
  - `status` → filter by `OrderStatus` enum
  - `paymentStatus` → filter by `PaymentStatus` enum
  - `search` → search by `orderNumber` (contains) or customer `name`/`email` (via `user` relation, use `OR` with `user` relation)
  - `startDate` → filter by `createdAt >= startDate` (ISO date string)
  - `endDate` → filter by `createdAt <= endDate` (ISO date string)
- Always include `deletedAt: null` filter
- Include: `user` (name, email), `_count.items`
- Order by: `createdAt desc`
- Pagination: skip/take with total count
- Response: `{ orders, total, page, totalPages }`

**No POST for orders** — orders are created via checkout API, not admin.

**Verify:** `npm run lint`
**Commit:** `feat(api): add admin orders list endpoint with filters`

---

### Task 3: Admin Orders API — Detail, Status Update, Payment Update
**File:** `src/app/api/admin/orders/[id]/route.ts`
**Pattern:** Follow `src/app/api/admin/categories/[id]/route.ts`
**Validators:** Add `orderStatusUpdateSchema` to `src/lib/validators.ts`: `z.object({ status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]) })`

**GET /api/admin/orders/[id]:**
- Always include `deletedAt: null` filter
- Include: `user` (name, email, phone), `items` (with product, variant)
- Response: `{ order }`

**PATCH /api/admin/orders/[id]:**
- Body: `{ status: OrderStatus }`
- Validate with `orderStatusUpdateSchema`
- Update order status
- Response: `{ order }`

**Verify:** `npm run lint`
**Commit:** `feat(api): add admin order detail and status update endpoints`

---

### Task 4: Order Status Update API (Payment)
**File:** `src/app/api/admin/orders/[id]/payment/route.ts`
**Validators:** Add `paymentStatusUpdateSchema` to `src/lib/validators.ts`: `z.object({ paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]) })`

**PATCH /api/admin/orders/[id]/payment:**
- Body: `{ paymentStatus: PaymentStatus }`
- Validate with `paymentStatusUpdateSchema`
- Update payment status
- Response: `{ order }`

**Verify:** `npm run lint`
**Commit:** `feat(api): add admin order payment status update endpoint`

---

### Task 5: Admin Order Table Component
**File:** `src/components/admin/admin-order-table.tsx`
**Pattern:** Follow `src/components/admin/admin-category-table.tsx`
**Dependencies:** shadcn/ui Table, Badge, Select, Input, Button

**Features:**
- Self-fetching client component with `useEffect`
- Filter bar: Status dropdown, Payment Status dropdown, Search input, Start Date input, End Date input
- Table columns: Order #, Customer, Date, Status, Payment, Total, Actions
- Status shown as Badge (color-coded)
- Action: View detail button (navigates to `/admin/orders/[id]`)
- Loading and empty states
- Pagination controls (prev/next page)
- Debounced search (300ms delay) to avoid excessive API calls

**Verify:** `npm run lint`
**Commit:** `feat(admin): add AdminOrderTable component`

---

### Task 6: Admin Order Detail Component
**File:** `src/components/admin/admin-order-detail.tsx`
**Pattern:** Follow `src/app/(admin)/admin/products/[id]/page.tsx` pattern (client component with fetch-on-mount, loading states, error handling)

**Layout:**
- Back button + Order number heading
- Grid: Main content (2/3) + Sidebar (1/3)

**Main content:**
- Order Info Card: Order #, Date, Status (badge)
- Customer Card: Name, Email, Phone
- Shipping Card: Address, City, Postal Code
- Items Table: Product image, name, variant, price, qty, total

**Sidebar:**
- Payment Card: Method, Status (badge), Subtotal, Shipping, Total
- Status Management Card:
  - Order Status dropdown (Select) with Update button
  - Payment Status dropdown (Select) with Update button
- Notes Card (if notes exist)

**Verify:** `npm run lint`
**Commit:** `feat(admin): add AdminOrderDetail component`

---

### Task 7: Admin Order Detail Page
**File:** `src/app/(admin)/admin/orders/[id]/page.tsx`
**Pattern:** Follow `src/app/(admin)/admin/products/[id]/page.tsx` (client component, fetch on mount)

**Metadata:** `Admin - Order Details`

**Verify:** `npm run lint`
**Commit:** `feat(admin): add admin order detail page`

---

### Task 8: Admin Order List Page
**File:** `src/app/(admin)/admin/orders/page.tsx`
**Pattern:** Follow `src/app/(admin)/admin/categories/page.tsx` (server component, renders client component)

**Metadata:** `Admin - Orders`

**Verify:** `npm run lint`
**Commit:** `feat(admin): add admin orders list page`

---

### Task 9: Final Build Verification
- Run `npm run lint` — verify no new errors
- Run `npm run build` — verify no type errors
- Fix any issues found
- Commit fixes

---

## Key Decisions

1. **Orders created via checkout, not admin** — Admin can only list/view/update status, not create orders
2. **Status updates via separate endpoints** — PATCH for order status, separate PATCH for payment status (cleaner separation)
3. **Search by order number or customer** — Uses Prisma `contains` for order number, relation-based search for customer name/email
4. **Soft delete filtering** — All order queries include `deletedAt: null` filter, even though orders are not typically deleted by admin. This is consistent with the data model.

## Dependencies

- `src/lib/auth.ts` — session/role check
- `src/lib/prisma.ts` — Prisma client
- `src/lib/utils.ts` — `formatBDT`, `cn`
- shadcn/ui: Table, Badge, Select, Input, Button, Card, Skeleton, Separator
- `lucide-react`: icons

## Verification

1. After each task: `npm run lint`
2. After Task 9: `npm run build`
3. All lint errors must be pre-existing `noExplicitAny` only
4. Build must pass with zero type errors
