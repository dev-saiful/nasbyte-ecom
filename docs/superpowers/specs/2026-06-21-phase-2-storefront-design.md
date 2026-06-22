# Phase 2: Storefront Design Spec

**Date:** 2026-06-21  
**Status:** Approved  
**Scope:** Public-facing storefront pages and features

---

## 1. Architecture Overview

### 1.1 Phase 2 Scope

| Feature | Route | Type | Priority |
|---------|-------|------|----------|
| Product Listing | `/products` | Server Component | High |
| Product Detail | `/products/[slug]` | Server Component | High |
| Shopping Cart | `/cart` | Client Component | High |
| Checkout | `/checkout` | Server Component | High |
| Order Confirmation | `/orders/[id]/confirmation` | Server Component | Medium |
| Order Tracking | `/track-order` | Server Component | Medium |
| Policy | `/policy` | Static Page | Low |

### 1.2 Data Flow

```
Server Components (initial load)
    ↓
Client Components (interactivity)
    ↓
API Routes (cart sync, checkout)
    ↓
Database (Prisma)
```

### 1.3 Key Patterns

- **Server Components** for pages with data fetching (SEO + performance)
- **Client Components** for interactive elements (cart, filters, forms)
- **API Routes** for cart operations and checkout
- **Zustand** for client-side cart state with localStorage persistence

---

## 2. Product Listing Page (`/products`)

### 2.1 Layout

Sidebar filters with category tabs, search, and sort.

### 2.2 Components

```
src/app/(storefront)/products/
├── page.tsx                    # Server Component - main listing
├── loading.tsx                 # Loading skeleton
└── [slug]/
    └── page.tsx                # Product detail page

src/components/products/
├── product-card.tsx            # ✅ Exists
├── product-list.tsx            # Client Component - grid display
├── product-filters.tsx         # Client Component - sidebar filters
├── product-sort.tsx            # Client Component - sort dropdown
├── product-search.tsx          # Client Component - search input
└── product-pagination.tsx      # Client Component - numbered pagination
```

### 2.3 Data Fetching

- Server Component fetches products with filters from URL params
- Uses `nuqs` for URL search params (category, search, sort, page)
- Prisma query with dynamic filters and pagination

### 2.4 Filters

- **Category:** Tabs at top (All, Scarves, Bags, Jewelry, Shoes, Accessories)
- **Search:** Text input with debounce
- **Sort:** Dropdown (Newest, Price Low-High, Price High-Low, Popularity)
- **Pagination:** 12 products per page, numbered pages

### 2.5 Responsive

- **Mobile:** Filters collapse to dropdown, 2-column grid
- **Tablet:** 3-column grid
- **Desktop:** Sidebar + 4-column grid

---

## 3. Product Detail Page (`/products/[slug]`)

### 3.1 Layout

Two-column layout: Image gallery left, Product info right.

### 3.2 Components

```
src/components/products/
├── product-gallery.tsx         # Client Component - image gallery with thumbnails
├── product-info.tsx            # Server Component - name, price, description
├── product-variants.tsx        # Client Component - variant selector (color/size)
├── product-stock.tsx           # Server Component - stock indicator
├── product-quantity.tsx        # Client Component - quantity selector
├── product-actions.tsx         # Client Component - Add to Cart + Buy Now buttons
├── product-features.tsx        # Server Component - features list
├── product-reviews.tsx         # Server Component - reviews section
└── product-related.tsx         # Server Component - related products grid
```

### 3.3 Features

- **Image Gallery:** Main image + thumbnails, click to zoom, keyboard navigation
- **Variant Selector:** Dynamic price/stock/image update on selection
- **Stock Indicator:** "In Stock" / "Low Stock (X left)" / "Out of Stock"
- **Quantity Selector:** Min 1, max available stock
- **Add to Cart:** Adds to Zustand store + syncs to DB if logged in
- **Buy Now:** Adds to cart + redirects to checkout
- **Reviews Section:** Average rating + individual reviews with verified purchase badge
- **Related Products:** 4 products from same category

### 3.4 Data Fetching

- Server Component fetches product with all relations (category, variants, images, reviews)
- Client Components handle interactive state (variant selection, quantity, gallery)

---

## 4. Shopping Cart (`/cart`)

### 4.1 Layout

Cart items list with summary sidebar.

### 4.2 Components

```
src/app/(storefront)/cart/
├── page.tsx                    # Client Component - cart page
└── loading.tsx                 # Loading skeleton

src/components/cart/
├── cart-item.tsx               # Client Component - single cart item
├── cart-summary.tsx            # Server Component - subtotal, shipping, total
├── cart-empty.tsx              # Server Component - empty cart state
└── cart-actions.tsx            # Client Component - quantity controls, remove
```

### 4.3 Cart Store (Zustand)

```typescript
// src/stores/cart.ts
interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  syncToDB: () => Promise<void>;
  loadFromDB: () => Promise<void>;
}
```

### 4.4 Features

- **Cart Items:** Product image, name, variant details, unit price, quantity controls, line total, remove button
- **Quantity Controls:** +/- buttons, direct input, max = stock
- **Cart Summary:** Subtotal, shipping (150 BDT flat), total
- **Empty Cart:** Illustration with "Continue Shopping" button
- **Responsive:** Single column on mobile, two columns on desktop

### 4.5 Sync Strategy

- **Guest:** localStorage persistence
- **Logged in:** API sync on every operation
- **Login:** Merge guest cart to DB

---

## 5. Checkout Flow (`/checkout`)

### 5.1 Layout

Single-page checkout.

### 5.2 Components

```
src/app/(storefront)/checkout/
├── page.tsx                    # Server Component - checkout page
└── loading.tsx                 # Loading skeleton

src/components/checkout/
├── shipping-form.tsx           # Client Component - shipping info form
├── saved-addresses.tsx         # Client Component - select from saved addresses
├── payment-method.tsx          # Client Component - payment method selection
├── order-summary.tsx           # Server Component - items, subtotal, shipping, total
├── order-notes.tsx             # Client Component - optional textarea
└── place-order-button.tsx      # Client Component - submit button with loading state
```

### 5.3 Features

- **Shipping Form:** Recipient name, phone, address, city, postal code, country (default: Bangladesh)
- **Saved Addresses:** If logged in, show saved addresses to select from
- **Payment Method:** Radio buttons (Cash on Delivery, Card, Mobile Banking)
- **Order Summary:** Items list, subtotal, shipping (150 BDT), total
- **Order Notes:** Optional textarea
- **Validation:** Zod schema (checkoutSchema already exists)
- **Submit:** Creates order, decrements stock, clears cart, redirects to confirmation

### 5.4 API Route

```
POST /api/checkout
- Validates request with Zod
- Creates order + order items
- Decrements stock (with SELECT FOR UPDATE)
- Clears user's cart
- Returns order ID
```

### 5.5 Responsive

Single column on mobile, two columns on desktop.

---

## 6. Order Confirmation, Tracking & Policy

### 6.1 Order Confirmation (`/orders/[id]/confirmation`)

- Server Component
- Displays: Order number, items, totals, shipping address, payment method
- "Continue Shopping" button
- Simple, clean layout

### 6.2 Order Tracking (`/track-order`)

- Server Component with Client Component for form
- Order number input field
- Displays: Order status, items, timeline
- Simple lookup (no email/phone verification)

### 6.3 Policy Page (`/policy`)

- Static page with multiple sections
- Sections: Privacy Policy, Terms of Service, Shipping Policy, Return Policy
- Single page with anchor links for navigation

### 6.4 Components

```
src/app/(storefront)/
├── orders/[id]/confirmation/page.tsx
├── track-order/page.tsx
└── policy/page.tsx

src/components/
├── order/
│   ├── order-details.tsx       # Server Component
│   └── order-timeline.tsx      # Server Component
└── policy/
    └── policy-sections.tsx     # Server Component
```

---

## 7. API Routes

### 7.1 New API Routes for Phase 2

```
src/app/api/
├── cart/
│   ├── route.ts                # GET (user cart)
│   └── items/
│       ├── route.ts            # POST (add item)
│       └── [itemId]/
│           ├── route.ts        # PATCH (update qty), DELETE
│           └── sync/route.ts   # POST (sync guest cart to DB)
├── checkout/
│   └── route.ts                # POST (place order)
├── products/
│   └── route.ts                # GET (list with filters)
└── track-order/
    └── route.ts                # GET (by order number)
```

### 7.2 Cart API

- `GET /api/cart` - Fetch user's cart items
- `POST /api/cart/items` - Add item to cart
- `PATCH /api/cart/items/[itemId]` - Update item quantity
- `DELETE /api/cart/items/[itemId]` - Remove item
- `POST /api/cart/items/sync` - Sync guest cart to DB

### 7.3 Checkout API

- `POST /api/checkout` - Create order from cart

### 7.4 Products API

- `GET /api/products` - List products with filters (category, search, sort, page)

### 7.5 Track Order API

- `GET /api/track-order?orderNumber=XXX` - Get order details by number

### 7.6 Authentication

- All cart/checkout routes require authentication
- Products and track-order are public

---

## 8. File Structure & Implementation Order

### 8.1 New Files to Create

```
src/
├── app/(storefront)/
│   ├── products/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── [slug]/
│   │       ├── page.tsx
│   │       └── loading.tsx
│   ├── cart/
│   │   ├── page.tsx
│   │   └── loading.tsx
│   ├── checkout/
│   │   ├── page.tsx
│   │   └── loading.tsx
│   ├── orders/[id]/
│   │   └── confirmation/
│   │       └── page.tsx
│   ├── track-order/
│   │   └── page.tsx
│   └── policy/
│       └── page.tsx
├── components/products/
│   ├── product-list.tsx
│   ├── product-filters.tsx
│   ├── product-sort.tsx
│   ├── product-search.tsx
│   ├── product-pagination.tsx
│   ├── product-gallery.tsx
│   ├── product-info.tsx
│   ├── product-variants.tsx
│   ├── product-stock.tsx
│   ├── product-quantity.tsx
│   ├── product-actions.tsx
│   ├── product-features.tsx
│   ├── product-reviews.tsx
│   └── product-related.tsx
├── components/cart/
│   ├── cart-item.tsx
│   ├── cart-summary.tsx
│   ├── cart-empty.tsx
│   └── cart-actions.tsx
├── components/checkout/
│   ├── shipping-form.tsx
│   ├── saved-addresses.tsx
│   ├── payment-method.tsx
│   ├── order-summary.tsx
│   ├── order-notes.tsx
│   └── place-order-button.tsx
├── components/order/
│   ├── order-details.tsx
│   └── order-timeline.tsx
├── components/policy/
│   └── policy-sections.tsx
├── stores/cart.ts
├── hooks/
│   ├── use-cart.ts
│   └── use-debounce.ts
└── app/api/
    ├── cart/
    │   ├── route.ts
    │   └── items/
    │       ├── route.ts
    │       └── [itemId]/
    │           ├── route.ts
    │           └── sync/route.ts
    ├── checkout/
    │   └── route.ts
    ├── products/
    │   └── route.ts
    └── track-order/
        └── route.ts
```

### 8.2 Implementation Order

1. **Foundation** - Zustand cart store, API routes, product listing
2. **Product Pages** - Listing page, detail page, components
3. **Cart** - Cart page, sync logic, components
4. **Checkout** - Checkout page, order creation, confirmation
5. **Tracking & Policy** - Order tracking, policy page
6. **Polish** - Loading states, error handling, responsive tweaks

---

## 9. Key Algorithms

### 9.1 Cart Merge (Guest → Authenticated)

```
On login:
1. Get guest cart items from localStorage
2. Get authenticated user's cart items from DB
3. For each guest cart item:
   a. If same product+variant exists in DB cart → update quantity (min of stock)
   b. Else → insert new cart item
4. Clear guest localStorage cart
5. Return merged cart
```

### 9.2 Stock Decrement (Checkout)

```
Within DB transaction (SELECT FOR UPDATE):
1. Lock product/variant rows
2. Validate all items have sufficient stock
3. Create order + order items (with product name/image snapshots)
4. Decrement stock for each product/variant
5. Create inventory stock logs (old_stock, new_stock, delta)
6. Clear user's cart
7. Commit transaction
8. Return order ID
```

### 9.3 Slug Generation

```
From name: "Silk Scarf Collection" → "silk-scarf-collection"
Append suffix on collision: "silk-scarf-collection-2"
```

---

## 10. Validation Schemas

### 10.1 Existing Schemas (in `src/lib/validators.ts`)

- `checkoutSchema` - Checkout form validation
- `addressSchema` - Address form validation
- `productSchema` - Product form validation

### 10.2 New Schemas Needed

```typescript
// Cart item validation
export const cartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1),
});

// Product listing filters
export const productFiltersSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(["newest", "price-asc", "price-desc", "popularity"]).optional(),
  page: z.number().int().min(1).optional(),
});
```

---

## 11. Error Handling

### 11.1 Page-Level Errors

- Use `error.tsx` boundaries for each route group
- Show user-friendly error messages
- Provide retry buttons where appropriate

### 11.2 API Error Responses

```typescript
// Standard error response format
{
  error: string;
  details?: Record<string, string[]>;
}
```

### 11.3 Loading States

- Skeleton loaders for all pages
- Optimistic updates for cart operations
- Loading spinners for form submissions

---

## 12. Performance Considerations

### 12.1 Image Optimization

- Use Next.js `Image` component with `sizes` prop
- Lazy load below-the-fold images
- Use `priority` for above-the-fold images

### 12.2 Data Fetching

- Server Components for initial data
- SWR/React Query for client-side data (if needed)
- Debounced search input

### 12.3 Caching

- Use `revalidate` for product listing pages
- Cache category list (rarely changes)
- Cache product details (short TTL)

---

## 13. Testing Strategy

### 13.1 Unit Tests

- Cart store operations
- Price calculation utilities
- Validation schemas

### 13.2 Integration Tests

- API route handlers
- Checkout flow
- Cart sync logic

### 13.3 E2E Tests (Future)

- Product browsing flow
- Cart operations
- Checkout completion

---

## 14. Success Criteria

- [ ] Product listing page loads with filters, search, and pagination
- [ ] Product detail page shows all product info with variant selection
- [ ] Shopping cart persists across sessions (localStorage for guests, DB for logged-in users)
- [ ] Checkout creates order and decrements stock atomically
- [ ] Order confirmation displays correct order details
- [ ] Order tracking shows order status by order number
- [ ] Policy page displays all required sections
- [ ] All pages are responsive (mobile, tablet, desktop)
- [ ] No TypeScript errors
- [ ] All API routes return proper error responses

---

*End of Phase 2 Design Spec*
