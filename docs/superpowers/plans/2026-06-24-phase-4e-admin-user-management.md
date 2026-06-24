# Phase 4E: Admin User Management

**Goal:** Build admin user management with user list (search, filter, pagination), create/edit forms, user detail view, role/verification toggles, and soft delete.

## Scope

- Enable Users link in admin sidebar
- User list API with search (name, email, phone), filters (role, verification), pagination
- User detail API with order history
- User create API (with password hashing)
- User update API (profile fields)
- User toggle verification API
- User update role API
- User soft delete API (protect self-deletion)
- User table component with filter controls
- User form component (create/edit)
- User detail page with order history
- User list page

**Out of scope:** Bulk operations, password reset for other users, session management.

## Architecture

### Data Flow
```
Admin User List → GET /api/admin/users → Prisma Query → Response
Admin User Detail → GET /api/admin/users/[id] → Prisma Query → Response
Create User → POST /api/admin/users → Prisma Create → Response
Update User → PUT /api/admin/users/[id] → Prisma Update → Response
Toggle Verify → PATCH /api/admin/users/[id]/verify → Prisma Update → Response
Update Role → PATCH /api/admin/users/[id]/role → Prisma Update → Response
Delete User → DELETE /api/admin/users/[id] → Soft Delete → Response
```

### User Roles
USER ↔ ADMIN (toggle via PATCH)

---

## Task Breakdown

### Task 1: Enable Users Link in Sidebar
**Files:** `src/components/admin/admin-sidebar.tsx`
**Change:** `enabled: false` → `enabled: true` for Users link
**Verify:** `npm run lint`
**Commit:** `feat(admin): enable users link in sidebar`

---

### Task 2: Admin Users API — List with Filters
**File:** `src/app/api/admin/users/route.ts`
**Pattern:** Follow `src/app/api/admin/orders/route.ts`
**Auth:** `auth()` from `@/lib/auth`, role check `(session.user as any).role !== "ADMIN"`

**GET /api/admin/users:**
- Query params: `search`, `role`, `isVerified`, `page` (default 1), `limit` (default 20)
- Filters (all optional):
  - `role` → filter by `UserRole` enum
  - `isVerified` → filter by boolean
  - `search` → search by `name` (contains), `email` (contains), or `phone` (contains)
- Always include `deletedAt: null`
- Include: `_count.orders`
- Order by: `createdAt desc`
- Pagination: skip/take with total count
- Exclude `password` field from response
- Response: `{ users, total, page, totalPages }`

**No POST here** — user creation handled in Task 3.

**Verify:** `npm run lint`
**Commit:** `feat(api): add admin users list endpoint with filters`

---

### Task 3: Admin Users API — Create User
**File:** `src/app/api/admin/users/route.ts` (append POST handler)
**Validators:** Add `adminUserCreateSchema` to `src/lib/validators.ts`:
```typescript
export const adminUserCreateSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  password: z.string().min(8),
  role: z.enum(["USER", "ADMIN"]).optional(),
});
```

**POST /api/admin/users:**
- Validate with `adminUserCreateSchema`
- Hash password with `bcrypt` (10 rounds)
- Check email uniqueness
- Create user with Prisma
- Response: `{ user }` (without password)

**Verify:** `npm run lint`
**Commit:** `feat(api): add admin create user endpoint`

---

### Task 4: Admin Users API — Detail, Update, Delete
**File:** `src/app/api/admin/users/[id]/route.ts`
**Pattern:** Follow `src/app/api/admin/orders/[id]/route.ts`
**Validators:** Add `adminUserUpdateSchema` to `src/lib/validators.ts`:
```typescript
export const adminUserUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  password: z.string().min(8).optional(),
});
```

**GET /api/admin/users/[id]:**
- Include: `_count.orders`, `addresses` (recent 5)
- Exclude: `password`, `twoFactorSecret`, `twoFactorRecoveryCodes`
- Response: `{ user }`

**PUT /api/admin/users/[id]:**
- Validate with `adminUserUpdateSchema`
- If password provided, hash with bcrypt
- Check email uniqueness if changed
- Prevent admin from changing own role here (use role endpoint)
- Response: `{ user }`

**DELETE /api/admin/users/[id]:**
- Prevent self-deletion: if `id === session.user.id`, return 400
- Soft delete: set `deletedAt = new Date()`
- Response: `{ success: true }`

**Verify:** `npm run lint`
**Commit:** `feat(api): add admin user detail, update, and delete endpoints`

---

### Task 5: Admin Users API — Toggle Verification & Role
**File:** `src/app/api/admin/users/[id]/verify/route.ts`
**File:** `src/app/api/admin/users/[id]/role/route.ts`

**PATCH /api/admin/users/[id]/verify:**
- Toggle `isVerified` field
- If verifying, set `emailVerifiedAt = new Date()`
- If unverifying, set `emailVerifiedAt = null`
- Response: `{ user }`

**PATCH /api/admin/users/[id]/role:**
- Body: `{ role: "USER" | "ADMIN" }`
- Prevent admin from demoting themselves
- Response: `{ user }`

**Verify:** `npm run lint`
**Commit:** `feat(api): add admin user verification and role toggle endpoints`

---

### Task 6: Admin User Table Component
**File:** `src/components/admin/admin-user-table.tsx`
**Pattern:** Follow `src/components/admin/admin-order-table.tsx`

**Features:**
- Self-fetching client component with `useEffect`
- Filter bar: Search input, Role dropdown, Verified dropdown
- Table columns: Name, Email, Phone, Role, Verified, Orders, Joined, Actions
- Actions: View detail, Toggle verify, Delete (with confirmation)
- Loading and empty states
- Pagination controls

**Verify:** `npm run lint`
**Commit:** `feat(admin): add AdminUserTable component`

---

### Task 7: Admin User Form Component
**File:** `src/components/admin/admin-user-form.tsx`
**Pattern:** Follow `src/components/admin/admin-category-form.tsx`

**Features:**
- Reusable create/edit form
- Fields: Name, Email, Phone, Password (required for create, optional for edit), Role select
- Uses `react-hook-form` with `zodResolver`
- Props: `initialData?` for edit mode

**Verify:** `npm run lint`
**Commit:** `feat(admin): add AdminUserForm component`

---

### Task 8: Admin User Detail Component
**File:** `src/components/admin/admin-user-detail.tsx`
**Pattern:** Follow `src/components/admin/admin-order-detail.tsx`

**Layout:**
- Back button + User name heading
- Grid: Main content (2/3) + Sidebar (1/3)

**Main content:**
- Profile Card: Name, Email, Phone, Role, Verified, Joined
- Orders Card: Recent orders table (last 5)

**Sidebar:**
- Actions Card:
  - Edit button
  - Toggle verification button
  - Toggle role button
  - Delete button (with confirmation dialog)
- Addresses Card: List of addresses

**Verify:** `npm run lint`
**Commit:** `feat(admin): add AdminUserDetail component`

---

### Task 9: Admin User Pages
**Files:**
- `src/app/(admin)/admin/users/page.tsx` — List page
- `src/app/(admin)/admin/users/[id]/page.tsx` — Detail page
- `src/app/(admin)/admin/users/create/page.tsx` — Create page
- `src/app/(admin)/admin/users/[id]/edit/page.tsx` — Edit page

**Verify:** `npm run lint`
**Commit:** `feat(admin): add user management pages`

---

### Task 10: Final Build Verification
- Run `npm run lint` — verify no new errors
- Run `npm run build` — verify no type errors
- Fix any issues found
- Commit fixes

---

## Key Decisions

1. **Password hashing** — Use bcrypt with 10 rounds (same as registration)
2. **Self-deletion protection** — Admin cannot delete themselves
3. **Self-demotion protection** — Admin cannot change their own role via role endpoint
4. **Password optional on edit** — Only hash if password field is provided
5. **Soft delete** — Set `deletedAt = new Date()`, not hard delete
6. **Email uniqueness** — Check before create/update, return 409 on conflict

## Dependencies

- `src/lib/auth.ts` — session/role check
- `src/lib/prisma.ts` — Prisma client
- `src/lib/utils.ts` — `formatBDT`, `cn`
- `bcrypt` — password hashing (already used in registration)
- shadcn/ui: Table, Badge, Select, Input, Button, Card, Skeleton, Separator, AlertDialog
- `lucide-react`: icons
- `sonner`: toast notifications

## Verification

1. After each task: `npm run lint`
2. After Task 10: `npm run build`
3. All lint errors must be pre-existing `noExplicitAny` only
4. Build must pass with zero type errors
