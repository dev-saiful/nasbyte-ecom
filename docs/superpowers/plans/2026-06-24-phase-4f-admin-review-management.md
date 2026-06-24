# Phase 4F: Admin Review Management

**Goal:** Build admin review management with review list (filter, search, pagination), approve/reject actions, bulk operations, and automatic rating stats recalculation.

## Scope

- Enable Reviews link in admin sidebar
- Review list API with filters (approved/pending, product), search, pagination
- Review approve/reject API (with product rating recalculation)
- Review bulk approve/bulk delete API
- Review delete API
- Review table component with filter controls and bulk selection
- Review list page

**Out of scope:** Review detail page (reviews are simple enough to manage from list view).

## Architecture

### Data Flow
```
Admin Review List → GET /api/admin/reviews → Prisma Query → Response
Approve Review → PATCH /api/admin/reviews/[id]/approve → Prisma Update + Recalculate Stats → Response
Reject Review → PATCH /api/admin/reviews/[id]/reject → Prisma Update + Recalculate Stats → Response
Delete Review → DELETE /api/admin/reviews/[id] → Prisma Delete + Recalculate Stats → Response
Bulk Approve → POST /api/admin/reviews/bulk-approve → Prisma Update Many + Recalculate → Response
Bulk Delete → POST /api/admin/reviews/bulk-delete → Prisma Delete Many + Recalculate → Response
```

### Rating Stats Recalculation
When a review is approved/rejected/deleted, recalculate the product's `averageRating` and `reviewCount`:
```typescript
const stats = await prisma.review.aggregate({
  where: { productId, isApproved: true },
  _avg: { rating: true },
  _count: { rating: true },
});
await prisma.product.update({
  where: { id: productId },
  data: {
    averageRating: stats._avg.rating || 0,
    reviewCount: stats._count.rating || 0,
  },
});
```

---

## Task Breakdown

### Task 1: Enable Reviews Link in Sidebar
**Files:** `src/components/admin/admin-sidebar.tsx`
**Change:** `enabled: false` → `enabled: true` for Reviews link
**Verify:** `npm run lint`
**Commit:** `feat(admin): enable reviews link in sidebar`

---

### Task 2: Admin Reviews API — List with Filters
**File:** `src/app/api/admin/reviews/route.ts`
**Pattern:** Follow `src/app/api/admin/users/route.ts`

**GET /api/admin/reviews:**
- Query params: `isApproved`, `productId`, `search`, `page`, `limit`
- Filters:
  - `isApproved` → boolean filter
  - `productId` → exact match
  - `search` → search by `user.name` (contains) or `product.name` (contains)
- Include: `user` (name, email), `product` (name, slug, productImages)
- Order by: `createdAt desc`
- Pagination

**Verify:** `npm run lint`
**Commit:** `feat(api): add admin reviews list endpoint`

---

### Task 3: Admin Reviews API — Approve/Reject
**Files:**
- `src/app/api/admin/reviews/[id]/approve/route.ts`
- `src/app/api/admin/reviews/[id]/reject/route.ts`

**PATCH /api/admin/reviews/[id]/approve:**
- Set `isApproved = true`
- Recalculate product rating stats
- Response: `{ review }`

**PATCH /api/admin/reviews/[id]/reject:**
- Set `isApproved = false`
- Recalculate product rating stats
- Response: `{ review }`

**Helper:** Create `recalculateProductStats(productId)` in a shared utility or inline.

**Verify:** `npm run lint`
**Commit:** `feat(api): add admin review approve and reject endpoints`

---

### Task 4: Admin Reviews API — Delete & Bulk Operations
**Files:**
- `src/app/api/admin/reviews/[id]/route.ts` — DELETE single
- `src/app/api/admin/reviews/bulk/route.ts` — POST bulk approve/delete

**DELETE /api/admin/reviews/[id]:**
- Hard delete review (no soft delete on reviews)
- Recalculate product rating stats
- Response: `{ success: true }`

**POST /api/admin/reviews/bulk:**
- Body: `{ action: "approve" | "delete", reviewIds: string[] }`
- For approve: set `isApproved = true` on all
- For delete: delete all
- Recalculate stats for all affected products
- Response: `{ success: true, affected Products }`

**Verify:** `npm run lint`
**Commit:** `feat(api): add admin review delete and bulk operation endpoints`

---

### Task 5: Admin Review Table Component
**File:** `src/components/admin/admin-review-table.tsx`
**Pattern:** Follow `src/components/admin/admin-user-table.tsx`

**Features:**
- Self-fetching client component
- Filter bar: Approved/Pending dropdown, Product search, Reviewer search
- Table columns: checkbox, Product, Reviewer, Rating (stars), Status, Date, Actions
- Row selection with checkboxes for bulk operations
- Bulk action bar (appears when items selected): Bulk Approve, Bulk Delete
- Single row actions: Approve/Reject toggle, Delete
- Rating displayed as star characters (★/☆)
- Loading, empty, pagination states

**Verify:** `npm run lint`
**Commit:** `feat(admin): add AdminReviewTable component`

---

### Task 6: Admin Review List Page
**File:** `src/app/(admin)/admin/reviews/page.tsx`

**Metadata:** `Admin - Reviews`

**Verify:** `npm run lint`
**Commit:** `feat(admin): add admin reviews list page`

---

### Task 7: Final Build Verification
- Run `npm run lint` — verify no new errors
- Run `npm run build` — verify no type errors
- Fix any issues found
- Commit fixes

---

## Key Decisions

1. **Hard delete for reviews** — Reviews don't have `deletedAt`, so use hard delete
2. **Rating recalculation** — Must recalculate after every approve/reject/delete operation
3. **Bulk operations** — Single API endpoint for bulk approve/delete, processes all IDs in one transaction
4. **No review detail page** — Reviews are simple (rating, title, comment); list view with inline actions is sufficient
5. **One review per user per product** — Enforced by `@@unique([userId, productId])` in schema

## Dependencies

- `src/lib/auth.ts` — session/role check
- `src/lib/prisma.ts` — Prisma client
- shadcn/ui: Table, Badge, Button, Checkbox, Select, Input, Skeleton
- `lucide-react`: icons
- `sonner`: toast notifications

## Verification

1. After each task: `npm run lint`
2. After Task 7: `npm run build`
3. All lint errors must be pre-existing `noExplicitAny` only
4. Build must pass with zero type errors
