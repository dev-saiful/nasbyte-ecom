# Phase 4G: Admin Inventory Management

**Goal:** Build admin inventory management with overview stats, product stock list (search, filter), inline stock adjustment with automatic logging, and stock change history.

## Scope

- Enable Inventory link in admin sidebar
- Inventory overview API (stats: total products, low stock, out of stock)
- Inventory list API with search (name/SKU), filter (stock status), pagination
- Stock adjustment API (inline update with automatic log)
- Stock log history API (per-product)
- Inventory table component with inline editing
- Stock log dialog component
- Inventory page with stats cards

**Out of scope:** Variant-level stock management, bulk stock import, stock alerts/notifications.

## Architecture

### Data Flow
```
Inventory Overview → GET /api/admin/inventory → Aggregate Stats → Response
Inventory List → GET /api/admin/inventory/products → Prisma Query → Response
Adjust Stock → PATCH /api/admin/inventory/products/[id] → Update Stock + Create Log → Response
Stock Logs → GET /api/admin/inventory/products/[id]/logs → Prisma Query → Response
```

### Stock Status Thresholds
- **Out of stock**: `stock === 0`
- **Low stock**: `stock > 0 && stock <= 10`
- **In stock**: `stock > 10`

### Stock Logging
Every stock change creates an `InventoryStockLog` entry with:
- `oldStock`, `newStock`, `delta` (newStock - oldStock)
- `productId`, `userId` (who made the change)

---

## Task Breakdown

### Task 1: Enable Inventory Link in Sidebar
**Files:** `src/components/admin/admin-sidebar.tsx`
**Change:** `enabled: false` → `enabled: true` for Inventory link
**Verify:** `npm run lint`
**Commit:** `feat(admin): enable inventory link in sidebar`

---

### Task 2: Admin Inventory API — Overview Stats
**File:** `src/app/api/admin/inventory/route.ts`
**Pattern:** Follow `src/app/api/admin/orders/route.ts`

**GET /api/admin/inventory:**
- Aggregate stats:
  - `totalProducts`: count of active products (`isActive: true, deletedAt: null`)
  - `lowStock`: count where `stock > 0 AND stock <= 10`
  - `outOfStock`: count where `stock === 0`
  - `totalStock`: sum of all stock
- Response: `{ stats }`

**Verify:** `npm run lint`
**Commit:** `feat(api): add admin inventory stats endpoint`

---

### Task 3: Admin Inventory API — Product List with Filters
**File:** `src/app/api/admin/inventory/products/route.ts`

**GET /api/admin/inventory/products:**
- Query params: `search`, `stockStatus`, `page`, `limit`
- Filters:
  - `search` → search by `name` (contains) or `sku` (contains)
  - `stockStatus` → `out_of_stock` (stock=0), `low` (stock 1-10), `in_stock` (stock>10)
- Always: `isActive: true, deletedAt: null`
- Select: `id, name, sku, stock, hasVariants`
- Order by: `stock asc` (lowest first)
- Pagination

**Verify:** `npm run lint`
**Commit:** `feat(api): add admin inventory products list endpoint`

---

### Task 4: Admin Inventory API — Stock Adjustment
**File:** `src/app/api/admin/inventory/products/[id]/route.ts`

**PATCH /api/admin/inventory/products/[id]:**
- Body: `{ stock: number }` (new stock value)
- Validate stock >= 0
- Get current stock value
- Calculate delta
- Update product stock
- Create `InventoryStockLog` entry
- Response: `{ product, log }`

**Verify:** `npm run lint`
**Commit:** `feat(api): add admin inventory stock adjustment endpoint`

---

### Task 5: Admin Inventory API — Stock Log History
**File:** `src/app/api/admin/inventory/products/[id]/logs/route.ts`

**GET /api/admin/inventory/products/[id]/logs:**
- Query params: `page`, `limit`
- Include: `user` (name)
- Order by: `createdAt desc`
- Response: `{ logs, total, page, totalPages }`

**Verify:** `npm run lint`
**Commit:** `feat(api): add admin inventory stock log history endpoint`

---

### Task 6: Admin Inventory Table Component
**File:** `src/components/admin/admin-inventory-table.tsx`
**Pattern:** Follow `src/components/admin/admin-review-table.tsx`

**Features:**
- Self-fetching client component
- Filter bar: Search input, Stock Status dropdown
- Table columns: Product, SKU, Stock, Status (badge), Actions
- Inline stock edit: click to edit, save/cancel buttons
- Stock status badge: Out of Stock (red), Low Stock (yellow), In Stock (green)
- View Logs button (opens dialog)
- Loading, empty, pagination states

**Verify:** `npm run lint`
**Commit:** `feat(admin): add AdminInventoryTable component`

---

### Task 7: Stock Log Dialog Component
**File:** `src/components/admin/admin-stock-log-dialog.tsx`

**Features:**
- Dialog/modal component
- Fetches stock logs for a product
- Table: Date, User, Old Stock, New Stock, Delta
- Loading state
- Pagination (if many logs)

**Verify:** `npm run lint`
**Commit:** `feat(admin): add AdminStockLogDialog component`

---

### Task 8: Admin Inventory Page
**File:** `src/app/(admin)/admin/inventory/page.tsx`

**Features:**
- Fetches overview stats
- Displays 3 stat cards (Total Products, Low Stock, Out of Stock)
- Renders AdminInventoryTable

**Verify:** `npm run lint`
**Commit:** `feat(admin): add admin inventory page`

---

### Task 9: Final Build Verification
- Run `npm run lint` — verify no new errors
- Run `npm run build` — verify no type errors
- Fix any issues found
- Commit fixes

---

## Key Decisions

1. **Stock threshold** — Low stock = stock <= 10 (configurable constant)
2. **Product-level only** — Focus on product stock, not variant stock (PRD scope)
3. **Automatic logging** — Every stock adjustment creates a log entry automatically
4. **Hard delete for logs** — Stock logs are never deleted
5. **Inline editing** — Click-to-edit pattern for stock adjustment (no separate form)

## Dependencies

- `src/lib/auth.ts` — session/role check
- `src/lib/prisma.ts` — Prisma client
- shadcn/ui: Table, Badge, Button, Input, Select, Dialog, Skeleton
- `lucide-react`: icons
- `sonner`: toast notifications

## Verification

1. After each task: `npm run lint`
2. After Task 9: `npm run build`
3. All lint errors must be pre-existing `noExplicitAny` only
4. Build must pass with zero type errors
