# Design Spec: Unfinished Features Implementation

**Date:** June 26, 2026
**Status:** Approved
**Scope:** File upload, promo management, admin dashboard, image optimization, testing

---

## 1. File Upload API with Cloudinary

### 1.1 Dependencies

Install `cloudinary` SDK. Add env vars to `.env.example`:

```
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

### 1.2 API Route: `POST /api/upload`

**Location:** `src/app/api/upload/route.ts`

**Request:** `multipart/form-data` with `file` field

**Validation:**
- File types: JPEG, PNG, WebP only
- Max size: 5MB
- Return 400 with descriptive error on invalid

**Process:**
1. Validate session (must be authenticated)
2. Validate file type and size
3. Upload to Cloudinary via `cloudinary.uploader.upload()` with:
   - `folder`: `nasbyte/products` or `nasbyte/categories` (from form field)
   - `transformation`: `[{ quality: "auto", fetch_format: "auto" }, { width: 1920, crop: "limit" }]`
   - `resource_type`: `image`
4. Return `{ url: string, publicId: string }`

**Response (200):**
```json
{
  "url": "https://res.cloudinary.com/xxx/image/upload/...",
  "publicId": "nasbyte/products/abc123"
}
```

### 1.3 Admin Form Integration

**`AdminProductForm`:**
- Replace URL input fields with file upload component
- Use `react-dropzone` or simple `<input type="file">` with preview
- On file select, upload to `/api/upload` and store returned URL
- For product images (multiple), upload each and collect URLs

**`AdminCategoryForm`:**
- Replace URL input with single file upload
- Same upload flow as products

### 1.4 Image Optimization

Use Cloudinary URL transformations for on-the-fly optimization:
- **Thumbnail:** `{url}?w=300&h=300&c_fill` (for cards)
- **Medium:** `{url}?w=800&c_limit` (for detail pages)
- **Full:** `{url}?w=1920&c_limit` (for lightbox/gallery)

Store only the base Cloudinary URL. Append transformation params in `<Image>` component.

---

## 2. Storefront Promo Management

### 2.1 API Routes

**`GET /api/admin/storefront/promo`** — Returns active announcement
**`PUT /api/admin/storefront/promo`** — Updates announcement

Both require ADMIN role.

### 2.2 Admin Page: `/admin/storefront/promo`

**Location:** `src/app/(admin)/admin/storefront/promo/page.tsx`

**Components:**
- Title input (text, max 140 chars)
- Active toggle (switch)
- Save button
- Preview section showing how banner appears on storefront

**Layout:** Card with form on left, preview on right.

---

## 3. Admin Dashboard Enhancement

### 3.1 API Enhancement: `GET /api/admin/dashboard`

**Current response:**
```json
{ "revenue", "totalOrders", "totalProducts", "totalUsers" }
```

**New response:**
```json
{
  "revenue": 125000,
  "totalOrders": 45,
  "totalProducts": 24,
  "totalUsers": 120,
  "pendingReviews": 3,
  "lowStockProducts": 5,
  "revenueChart": [
    { "month": "Jan", "revenue": 12000 },
    { "month": "Feb", "revenue": 15000 }
  ],
  "ordersByStatus": [
    { "status": "PENDING", "count": 5 },
    { "status": "CONFIRMED", "count": 12 }
  ],
  "usersGrowth": [
    { "month": "Jan", "users": 10 },
    { "month": "Feb", "users": 25 }
  ],
  "categoryDistribution": [
    { "category": "Scarves", "count": 8 },
    { "category": "Bags", "count": 5 }
  ],
  "recentOrders": [
    { "id", "orderNumber", "customerName", "total", "status", "createdAt" }
  ],
  "lowStockAlerts": [
    { "id", "name", "stock", "sku" }
  ]
}
```

### 3.2 Dashboard Page Updates

**KPI Cards (4):**
- Total Revenue: add trend % (compare to previous month)
- Total Orders: add trend %
- Total Products: add trend %
- Total Users: add trend %

**Charts (4, using recharts):**
1. **Revenue Chart** — `<AreaChart>` with gradient fill, last 6 months
2. **Orders by Status** — `<PieChart>` with status colors
3. **Users Growth** — `<LineChart>` with dots
4. **Category Distribution** — `<BarChart>` horizontal bars

**Tables:**
- Recent Orders: last 10 orders with status badge, link to detail
- Low Stock Alerts: products with stock < 10, link to inventory

**Quick Actions:** Links to Add Product, Manage Orders, View Reviews

---

## 4. Testing

### 4.1 Unit Tests

**Expand `src/lib/utils.test.ts`:**
- `slugify`: edge cases (unicode, double dashes, leading/trailing dashes)
- `generateOrderNumber`: format validation, uniqueness
- `formatBDT`: negative values, zero, large numbers

**New test files:**
- `src/lib/price.test.ts`: `calculateSubtotal`, `calculateTotal`, `calculateCartTotal`
- `src/lib/otp.test.ts`: `generateOtp`, `verifyOtp`, expiry logic

### 4.2 API Route Tests

- `POST /api/upload`: valid file, invalid type, oversized file, unauthenticated
- `GET/PUT /api/admin/storefront/promo`: admin access, non-admin rejected

---

## 5. File Structure

```
src/
├── app/api/upload/route.ts                          # NEW
├── app/api/admin/storefront/promo/route.ts          # NEW
├── app/(admin)/admin/storefront/promo/page.tsx      # NEW
├── components/admin/admin-dashboard-charts.tsx      # NEW
├── components/admin/admin-recent-orders.tsx         # NEW
├── components/admin/admin-low-stock-alerts.tsx      # NEW
├── components/admin/admin-promo-form.tsx            # NEW
├── components/shared/file-upload.tsx                # NEW
├── lib/cloudinary.ts                                # NEW
└── lib/
    ├── price.test.ts                                # NEW
    └── otp.test.ts                                  # NEW
```

---

## 6. Environment Variables

Add to `.env.example`:
```
# ─── CLOUDINARY ────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

---

*End of design spec*
