# Product Requirements Document (PRD)
## NasByte SteCom — Next.js Rewrite

**Version:** 1.0 | **Date:** June 17, 2026 | **Original:** Laravel 12 + Inertia.js 3 + React 19 + MySQL | **Target:** Next.js 16 + Tailwind CSS 4 + shadcn/ui + PostgreSQL + Prisma ORM + Zod

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Database Schema (Prisma)](#3-database-schema-prisma)
4. [Authentication System](#4-authentication-system)
5. [Storefront (Public) Features](#5-storefront-public-features)
6. [User Account Features](#6-user-account-features)
7. [Admin Panel Features](#7-admin-panel-features)
8. [API Routes](#8-api-routes)
9. [File & Image Storage](#9-file--image-storage)
10. [Email & Notifications](#10-email--notifications)
11. [Design System & Theming](#11-design-system--theming)
12. [Project Structure](#12-project-structure)
13. [Implementation Phases](#13-implementation-phases)
14. [Environment Variables](#14-environment-variables)
15. [Appendix: Validation Schemas (Zod)](#15-appendix-validation-schemas-zod)
16. [Appendix: Key Algorithms](#16-appendix-key-algorithms)

---

## 1. Project Overview

**NasByte SteCom** is a B2C eCommerce web application for selling ladies' accessories (scarves, bags, jewelry, shoes, etc.) in Dhaka, Bangladesh. Currency is Bangladeshi Taka (BDT).

### Key Features
- Public storefront with product catalog, cart, checkout, order tracking
- User registration with OTP email verification, 2FA support
- Full user account dashboard (orders, addresses, profile, security settings)
- Admin panel with dashboard KPIs, product/category/order/user/review/inventory management
- Promo banner management
- Telegram bot notifications for new orders
- Order confirmation emails
- Light/dark/system theme support

### Business Rules
- **Currency:** BDT (Bangladeshi Taka)
- **Shipping:** Fixed 150 BDT flat rate
- **Guest Cart:** Session-stored, merged on login
- **Registration Flow:** OTP-based email verification (6-digit code, 10min TTL, 5 max attempts)
- **Order Statuses:** PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED → CANCELLED
- **Payment Statuses:** PENDING → PAID → FAILED → REFUNDED
- **Payment Methods:** CASH_ON_DELIVERY, CARD, MOBILE_BANKING
- **UUID Primary Keys:** All tables except `storefront_announcements`
- **Soft Deletes:** Users, Categories, Products, Orders, Addresses

---

## 2. Tech Stack & Dependencies

### Core
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.x (App Router) | React framework with SSR/SSG, API routes |
| React | 19.x | UI library |
| TypeScript | 5.7+ | Type safety |
| Tailwind CSS | 4.x | Utility-first CSS |
| shadcn/ui | latest | Component library (New York style, Lucide icons) |
| Prisma | 7.x | ORM for PostgreSQL |
| PostgreSQL | 16+ | Primary database |
| Zod | 4.x | Schema validation (forms + API) |

### Authentication
| Package | Purpose |
|---------|---------|
| `next-auth` (Auth.js v5) | Session management, OAuth ready |
| `@prisma/client` | User/session storage |
| `bcryptjs` | Password hashing |


### UI & UX
| Package | Purpose |
|---------|---------|
| `lucide-react` | Icon library |
| `sonner` | Toast notifications |
| `class-variance-authority` | Component variants |
| `tailwind-merge` | Tailwind class merging |
| `clsx` | Conditional classes |
| `cmdk` | Command palette |
| `react-hook-form` | Form management |
| `@hookform/resolvers` | Zod integration for forms |
| `date-fns` | Date formatting |
| `recharts` | Dashboard charts |
| `embla-carousel-react` | Image carousels |

### State Management
| Package | Purpose |
|---------|---------|
| `zustand` | Client-side state (cart, theme) |
| `nuqs` | URL search params state |

### File Upload
| Package | Purpose |
|---------|---------|
| `@uploadthing/react` | File uploads (or `react-dropzone` + custom API) |
| Sharp | Image optimization (Next.js built-in) |

### Email
| Package | Purpose |
|---------|---------|
| `nodemailer` | Transactional emails |

### Notifications
| Package | Purpose |
|---------|---------|
| Native `fetch` | Telegram Bot API calls |

### Dev Tools
| Package | Purpose |
|---------|---------|
| ESLint | Linting |
| Prettier | Code formatting |
| Prisma Studio | Database browser |
| Vitest | Unit testing 

---

## 3. Database Schema (Prisma)

### prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

generator zod {
  provider = "zod-prisma"
  output   = "../lib/generated/zod"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── USERS ────────────────────────────────────────────────

model User {
  id                     String    @id @default(uuid()) @db.Uuid
  name                   String    @db.VarChar(255)
  email                  String    @unique @db.VarChar(255)
  phone                  String?   @unique @db.VarChar(20)
  password               String    @db.Text
  role                   UserRole  @default(USER)
  isVerified             Boolean   @default(false) @map("is_verified")
  emailVerifiedAt        DateTime? @map("email_verified_at")
  twoFactorSecret        String?   @map("two_factor_secret")
  twoFactorRecoveryCodes String?   @map("two_factor_recovery_codes")
  twoFactorConfirmedAt   DateTime? @map("two_factor_confirmed_at")

  // OTP fields
  emailVerificationOtpHash       String?   @map("email_verification_otp_hash")
  emailVerificationOtpSentAt     DateTime? @map("email_verification_otp_sent_at")
  emailVerificationOtpExpiresAt  DateTime? @map("email_verification_otp_expires_at")
  emailVerificationOtpAttempts   Int       @default(0) @map("email_verification_otp_attempts")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  cartItems               CartItem[]
  orders                  Order[]
  reviews                 Review[]
  addresses               Address[]
  inventoryStockLogs      InventoryStockLog[]
  sessions                Session[]
  accounts                Account[]

  @@map("users")
}

enum UserRole {
  USER
  ADMIN
}

// ─── CATEGORIES ───────────────────────────────────────────

model Category {
  id          String    @id @default(uuid()) @db.Uuid
  name        String    @db.VarChar(255)
  slug        String    @unique @db.VarChar(255)
  description String?   @db.Text
  imagePath   String?   @map("image_path") @db.VarChar(500)
  imageDisk   String?   @default("public") @map("image_disk") @db.VarChar(50)
  isActive    Boolean   @default(true) @map("is_active")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  products Product[]

  @@map("categories")
}

// ─── PRODUCTS ─────────────────────────────────────────────

model Product {
  id              String   @id @default(uuid()) @db.Uuid
  name            String   @db.VarChar(255)
  slug            String   @unique @db.VarChar(255)
  description     String?  @db.Text
  price           Decimal  @db.Decimal(10, 2)
  compareAtPrice  Decimal? @map("compare_at_price") @db.Decimal(10, 2)
  sku             String?  @unique @db.VarChar(100)
  stock           Int      @default(0)
  features        Json?
  averageRating   Decimal  @default(0) @map("average_rating") @db.Decimal(2, 1)
  reviewCount     Int      @default(0) @map("review_count")
  hasVariants     Boolean  @default(false) @map("has_variants")
  isFeatured      Boolean  @default(false) @map("is_featured")
  isActive        Boolean  @default(true) @map("is_active")

  categoryId String? @map("category_id") @db.Uuid
  category   Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  variants           ProductVariant[]
  productOptions     ProductOption[]
  productImages      ProductImage[]
  reviews            Review[]
  cartItems          CartItem[]
  orderItems         OrderItem[]
  inventoryStockLogs InventoryStockLog[]

  @@index([categoryId])
  @@index([isActive, isFeatured])
  @@map("products")
}

// ─── PRODUCT OPTIONS ──────────────────────────────────────

model ProductOption {
  id           String  @id @default(uuid()) @db.Uuid
  name         String  @db.VarChar(100)
  displayOrder Int     @default(0) @map("display_order")

  productId String  @map("product_id") @db.Uuid
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  values ProductOptionValue[]

  @@map("product_options")
}

model ProductOptionValue {
  id           String @id @default(uuid()) @db.Uuid
  value        String @db.VarChar(100)
  displayOrder Int    @default(0) @map("display_order")

  optionId String        @map("option_id") @db.Uuid
  option   ProductOption @relation(fields: [optionId], references: [id], onDelete: Cascade)

  variantOptions VariantOptionValue[]

  @@map("product_option_values")
}

// ─── PRODUCT VARIANTS ─────────────────────────────────────

model ProductVariant {
  id             String   @id @default(uuid()) @db.Uuid
  name           String?  @db.VarChar(255)
  sku            String?  @unique @db.VarChar(100)
  barcode        String?  @db.VarChar(100)
  price          Decimal  @db.Decimal(10, 2)
  compareAtPrice Decimal? @map("compare_at_price") @db.Decimal(10, 2)
  stock          Int      @default(0)
  isActive       Boolean  @default(true) @map("is_active")

  productId String  @map("product_id") @db.Uuid
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  variantOptions VariantOptionValue[]
  cartItems      CartItem[]
  orderItems     OrderItem[]

  @@map("product_variants")
}

model VariantOptionValue {
  id String @id @default(uuid()) @db.Uuid

  variantId     String           @map("variant_id") @db.Uuid
  variant       ProductVariant   @relation(fields: [variantId], references: [id], onDelete: Cascade)
  optionValueId String           @map("option_value_id") @db.Uuid
  optionValue   ProductOptionValue @relation(fields: [optionValueId], references: [id], onDelete: Cascade)

  @@unique([variantId, optionValueId])
  @@map("variant_option_values")
}

// ─── PRODUCT IMAGES ───────────────────────────────────────

model ProductImage {
  id        String  @id @default(uuid()) @db.Uuid
  path      String  @db.VarChar(500)
  disk      String  @default("public") @db.VarChar(50)
  sortOrder Int     @default(0) @map("sort_order")

  productId String  @map("product_id") @db.Uuid
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("product_images")
}

// ─── CART ─────────────────────────────────────────────────

model CartItem {
  id        String  @id @default(uuid()) @db.Uuid
  quantity  Int     @default(1)
  price     Decimal @db.Decimal(10, 2)

  userId    String          @map("user_id") @db.Uuid
  user      User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  productId String          @map("product_id") @db.Uuid
  product   Product         @relation(fields: [productId], references: [id], onDelete: Cascade)
  variantId String?         @map("variant_id") @db.Uuid
  variant   ProductVariant? @relation(fields: [variantId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@unique([userId, productId, variantId])
  @@map("cart_items")
}

// ─── ORDERS ───────────────────────────────────────────────

model Order {
  id                 String        @id @default(uuid()) @db.Uuid
  orderNumber        String        @unique @db.VarChar(50) @map("order_number")
  status             OrderStatus   @default(PENDING)
  subtotal           Decimal       @db.Decimal(10, 2)
  shippingCost       Decimal       @default(0) @map("shipping_cost") @db.Decimal(10, 2)
  total              Decimal       @db.Decimal(10, 2)
  shippingAddress    String        @map("shipping_address") @db.Text
  shippingCity       String        @map("shipping_city") @db.VarChar(100)
  shippingPostalCode String?       @map("shipping_postal_code") @db.VarChar(20)
  shippingPhone      String        @map("shipping_phone") @db.VarChar(20)
  paymentMethod      PaymentMethod @map("payment_method")
  paymentStatus      PaymentStatus @default(PENDING) @map("payment_status")
  notes              String?       @db.Text

  userId String? @map("user_id") @db.Uuid
  user   User?   @relation(fields: [userId], references: [id], onDelete: SetNull)

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  items OrderItem[]

  @@index([userId])
  @@index([orderNumber])
  @@map("orders")
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

enum PaymentMethod {
  CASH_ON_DELIVERY
  CARD
  MOBILE_BANKING
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

model OrderItem {
  id             String  @id @default(uuid()) @db.Uuid
  productName    String  @map("product_name") @db.VarChar(255)
  productImage   String? @map("product_image") @db.VarChar(500)
  variantDetails Json?   @map("variant_details")
  price          Decimal @db.Decimal(10, 2)
  quantity       Int
  total          Decimal @db.Decimal(10, 2)

  orderId   String          @map("order_id") @db.Uuid
  order     Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String          @map("product_id") @db.Uuid
  product   Product         @relation(fields: [productId], references: [id], onDelete: Restrict)
  variantId String?         @map("variant_id") @db.Uuid
  variant   ProductVariant? @relation(fields: [variantId], references: [id], onDelete: Restrict)

  @@map("order_items")
}

// ─── REVIEWS ──────────────────────────────────────────────

model Review {
  id                 String  @id @default(uuid()) @db.Uuid
  rating             Int     @db.SmallInt
  title              String? @db.VarChar(255)
  comment            String? @db.Text
  isVerifiedPurchase Boolean @default(false) @map("is_verified_purchase")
  isApproved         Boolean @default(true) @map("is_approved")
  helpfulCount       Int     @default(0) @map("helpful_count")

  productId String  @map("product_id") @db.Uuid
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  userId    String  @map("user_id") @db.Uuid
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@unique([userId, productId])
  @@map("reviews")
}

// ─── ADDRESSES ────────────────────────────────────────────

model Address {
  id            String  @id @default(uuid()) @db.Uuid
  recipientName String  @map("recipient_name") @db.VarChar(150)
  phone         String  @db.VarChar(20)
  addressLine   String  @map("address_line") @db.Text
  city          String  @db.VarChar(100)
  postalCode    String? @map("postal_code") @db.VarChar(20)
  country       String  @default("Bangladesh") @db.VarChar(100)
  isDefault     Boolean @default(false) @map("is_default")

  userId String @map("user_id") @db.Uuid
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  @@map("addresses")
}

// ─── INVENTORY STOCK LOGS ─────────────────────────────────

model InventoryStockLog {
  id       String @id @default(uuid()) @db.Uuid
  oldStock Int    @map("old_stock")
  newStock Int    @map("new_stock")
  delta    Int

  productId String  @map("product_id") @db.Uuid
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  userId    String? @map("user_id") @db.Uuid
  user      User?   @relation(fields: [userId], references: [id], onDelete: SetNull)

  createdAt DateTime @default(now()) @map("created_at")

  @@map("inventory_stock_logs")
}

// ─── STOREFRONT ANNOUNCEMENTS ─────────────────────────────

model StorefrontAnnouncement {
  id       Int     @id @default(autoincrement())
  title    String? @db.VarChar(140)
  isActive Boolean @default(false) @map("is_active")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("storefront_announcements")
}

// ─── NEXT-AUTH SESSIONS / ACCOUNTS ────────────────────────

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id") @db.Uuid
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expires      DateTime

  @@map("sessions")
}

model Account {
  id                String  @id @default(uuid())
  userId            String  @map("user_id") @db.Uuid
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}
```

### Seed Data Strategy

Create `prisma/seed.ts` with:
1. **Admin user:** `admin@example.com` / `password` (bcrypt hashed)
2. **12 sample products** across categories: scarves, bags, jewelry, shoes
3. **Sample categories:** Scarves, Bags, Jewelry, Shoes, Accessories
4. **Storefront announcement:** Default promo banner

---

## 4. Authentication System

### Overview
- **NextAuth.js v5 (Auth.js)** for session management
- Credentials provider (email + password)
- OTP-based email verification during registration
- Two-factor authentication (TOTP)
- Role-based access control (USER, ADMIN)

### Routes
| Route | Purpose | Middleware |
|-------|---------|-----------|
| `/auth/login` | Login page | Guest only |
| `/auth/register` | Registration page | Guest only |
| `/auth/verify-email` | Email OTP verification | Guest only |
| `/auth/forgot-password` | Password reset request | Guest only |
| `/auth/reset-password` | Password reset form | Guest only |
| `/auth/2fa-challenge` | 2FA code entry | Auth required |
| `/auth/confirm-password` | Password confirmation | Auth required |

### Registration Flow
1. User submits name, email, phone, password
2. System generates 6-digit OTP, stores hash in DB with TTL (10 min)
3. OTP sent via email (Resend/Nodemailer)
4. User enters OTP → account created, email verified
5. Max 5 OTP attempts, 60s resend cooldown

### 2FA Flow
1. User enables 2FA in settings → TOTP secret generated
2. QR code displayed for authenticator app
3. User confirms with 6-digit code → 2FA enabled
4. On login, after password → 2FA challenge page
5. Recovery codes provided for backup

### Authorization Middleware
```typescript
// src/middleware.ts
// - requireAuth: redirects to /auth/login if not authenticated
// - requireAdmin: redirects to /forbidden if not ADMIN role
// - requireVerified: redirects to /auth/verify-email if not verified
```

### API Authentication
- NextAuth session-based for web routes
- JWT tokens for API routes (if mobile app needed later)

---

## 5. Storefront (Public) Features

### 5.1 Home Page (`/`)
- **Promo banner** at top (from `storefront_announcements` table, admin-managed)
- **Category grid** with images and names
- **Featured products** grid (products where `isFeatured = true`)
- **Product cards** with:
  - Product image (with hover second image)
  - Product name
  - Category badge
  - Price (with compare-at-price strikethrough if applicable)
  - Average rating (star display)
  - "Add to Cart" button
  - "Buy Now" button (add to cart + redirect to checkout)

### 5.2 Product Listing (`/products`)
- **Category filter** sidebar/tabs (filter by category slug)
- **Search** by product name
- **Sort** by: newest, price low-high, price high-low, popularity
- **Pagination** (12 products per page)
- **Product grid** with same card design as home page

### 5.3 Product Detail (`/products/[slug]`)
- **Image gallery** (main image + thumbnails, click to zoom)
- **Product info:** name, category, description, features
- **Price display:** current price + compare-at-price if applicable
- **Variant selector:** color/size options (if `hasVariants = true`)
  - Dynamic variant selection updates price, stock, image
- **Stock indicator:** "In Stock" / "Low Stock (X left)" / "Out of Stock"
- **Quantity selector** (min 1, max available stock)
- **Add to Cart** button
- **Buy Now** button
- **Product features** list
- **Reviews section:**
  - Average rating + review count
  - Individual reviews with user name, rating, date, comment
  - Verified purchase badge
- **Related products** grid (same category, 4 items)

### 5.4 Shopping Cart (`/cart`)
- **Cart items list:**
  - Product image
  - Product name + variant details
  - Unit price
  - Quantity controls (+/- buttons, direct input)
  - Line total
  - Remove button
- **Cart summary:**
  - Subtotal
  - Shipping cost (fixed 150 BDT)
  - Total
- **Proceed to Checkout** button
- **Continue Shopping** link
- **Empty cart** state with illustration

### 5.5 Checkout (`/checkout`)
- **Shipping information form:**
  - Recipient name
  - Phone number
  - Address line
  - City
  - Postal code (optional)
  - Country (default: Bangladesh)
- **Saved addresses** (if user logged in, select from saved addresses)
- **Order summary** (items, subtotal, shipping, total)
- **Payment method selection:**
  - Cash on Delivery (default)
  - Card (placeholder)
  - Mobile Banking (placeholder)
- **Order notes** (optional textarea)
- **Place Order** button
- **Validation:** All fields required via Zod schema

### 5.6 Order Confirmation (`/orders/[id]/confirmation`)
- Order number
- Order details (items, totals)
- Shipping address
- Payment method
- Estimated delivery info
- "Continue Shopping" button

### 5.7 Order Tracking (`/track-order`)
- Input field for order number
- Displays order status, items, and timeline

### 5.8 Policy Page (`/policy`)
- Static privacy policy / terms content

### 5.9 Error Pages
- 403 Forbidden
- 404 Not Found
- Generic error page

---

## 6. User Account Features

### 6.1 Account Overview (`/account`)
- Welcome message with user name
- **Quick stats:** total orders, pending orders, saved addresses
- **Recent order** summary card
- **Default address** display

### 6.2 Order History (`/account/orders`)
- **Orders table** with:
  - Order number
  - Date
  - Status badge (color-coded)
  - Total
  - Items count
  - View details link
- **Pagination**
- **Order detail** expandable/modal view

### 6.3 Address Management (`/account/addresses`)
- **Address cards** with:
  - Recipient name
  - Phone
  - Full address
  - Default badge
  - Edit / Delete / Set as Default buttons
- **Add new address** form (dialog/sheet)
- **Edit address** form
- **Delete confirmation** dialog
- Maximum practical limit: display warning at 10+ addresses

### 6.4 Profile Settings (`/account/profile`)
- **Profile form:**
  - Name (text input)
  - Email (read-only, with verification status)
  - Phone (text input)
- **Save changes** button
- **Delete account** section (danger zone, password confirmation required)

### 6.5 Security Settings (`/account/security`)
- **Change password:**
  - Current password
  - New password
  - Confirm new password
- **Two-factor authentication:**
  - Enable/disable toggle
  - QR code display for setup
  - Recovery codes display
  - Current 2FA status

---

## 7. Admin Panel Features

### 7.1 Admin Dashboard (`/admin/dashboard`)
- **KPI Cards:**
  - Total Revenue (with month-over-month trend %)
  - Total Orders (with trend %)
  - Total Products
  - Total Users (with trend %)
  - Pending Reviews count
  - Low Stock Products count
- **Recent Orders table** (last 10)
- **Low Stock Alert** list (products with stock < 10)
- **Quick Actions:** Add Product, Manage Orders, View Reviews

### 7.2 Product Management (`/admin/products`)
- **Product list:**
  - Search by name/SKU
  - Filter by category, status (active/inactive), stock level
  - Columns: Image, Name, SKU, Category, Price, Stock, Status, Actions
  - Pagination
- **Create product form:**
  - Basic info: name, description, category (select), SKU, price, compare-at-price
  - Images: multiple image upload with drag-to-reorder
  - Features: dynamic list (add/remove feature items)
  - Variants toggle:
    - Add options (e.g., Color, Size)
    - Add option values (e.g., Red, Blue, S, M, L)
    - Variant matrix generation
    - Per-variant: SKU, price, stock, images
  - Status toggles: is_active, is_featured
- **Edit product form:** Same as create, pre-filled
- **Product detail view:** Read-only view with all info
- **Toggle status:** Quick activate/deactivate
- **Delete:** Soft delete with confirmation

### 7.3 Category Management (`/admin/categories`)
- **Category list:**
  - Columns: Image, Name, Slug, Product Count, Status, Actions
  - Search by name
- **Create category form:**
  - Name, slug (auto-generated from name), description, image upload
- **Edit category form**
- **Toggle status:** Quick activate/deactivate
- **Delete:** Only if no products linked (show product count warning)

### 7.4 Order Management (`/admin/orders`)
- **Order list:**
  - Filter by status, payment status, date range
  - Search by order number, customer name/email
  - Columns: Order #, Customer, Date, Status, Payment, Total, Actions
  - Pagination
- **Order detail page:**
  - Order info (number, date, status)
  - Customer info (name, email, phone)
  - Shipping address
  - Order items (image, name, variant, price, qty, total)
  - Payment info (method, status)
  - Subtotal, shipping, total
  - **Status management:**
    - Update order status (dropdown)
    - Update payment status (dropdown)
  - Order notes

### 7.5 User Management (`/admin/users`)
- **User list:**
  - Search by name, email, phone
  - Filter by role, verification status
  - Columns: Name, Email, Phone, Role, Verified, Orders, Joined, Actions
  - Pagination
- **Create user form:**
  - Name, email, phone, password, role selection
- **Edit user form**
- **User detail view:**
  - Profile info
  - Order history
  - Addresses
- **Toggle verification:** Quick verify/unverify
- **Update role:** Change USER ↔ ADMIN
- **Delete:** Soft delete (protect self-deletion)

### 7.6 Review Management (`/admin/reviews`)
- **Review list:**
  - Filter by status (approved/pending), product
  - Search by reviewer name, product name
  - Columns: Product, Reviewer, Rating, Status, Date, Actions
  - Pagination
- **Review detail view**
- **Actions:**
  - Approve / Reject single review
  - Bulk approve selected
  - Bulk delete selected
  - Delete single review
- **Rating stats update** on approve/reject (recalculate product average_rating, review_count)

### 7.7 Inventory Management (`/admin/inventory`)
- **Inventory overview:**
  - Summary stats: total products, low stock count, out of stock count
  - Product list with current stock levels
  - Search by name/SKU
  - Filter by stock status (low, out of stock, in stock)
- **Stock adjustment:**
  - Inline stock update per product
  - New stock value input
  - Auto-logs delta to `inventory_stock_logs`
- **Stock log history:**
  - Per-product stock change history
  - Columns: Date, User, Old Stock, New Stock, Delta

### 7.8 Storefront Promo Management (`/admin/storefront/promo`)
- **Single record edit form:**
  - Banner title text
  - Active/inactive toggle
- **Preview** of how banner looks on storefront

---

## 8. API Routes

### Next.js API Routes Structure

```
app/api/
├── auth/
│   └── [...nextauth]/route.ts       # NextAuth.js handlers
├── products/
│   ├── route.ts                      # GET (list), POST (create - admin)
│   └── [id]/
│       ├── route.ts                  # GET (single), PUT (update), DELETE
│       └── toggle-status/route.ts    # PATCH
├── categories/
│   ├── route.ts                      # GET, POST
│   └── [id]/
│       ├── route.ts                  # GET, PUT, DELETE
│       └── toggle-status/route.ts    # PATCH
├── orders/
│   ├── route.ts                      # GET (list - admin), POST (checkout)
│   └── [id]/
│       ├── route.ts                  # GET (detail)
│       ├── status/route.ts           # PATCH (admin)
│       └── payment-status/route.ts   # PATCH (admin)
├── cart/
│   ├── route.ts                      # GET (user cart)
│   └── items/
│       ├── route.ts                  # POST (add item)
│       └── [itemId]/route.ts         # PATCH (update qty), DELETE
├── checkout/
│   └── route.ts                      # POST (place order)
├── users/
│   ├── route.ts                      # GET (admin), POST (admin create)
│   └── [id]/
│       ├── route.ts                  # GET, PUT, DELETE
│       ├── toggle-verification/route.ts
│       └── update-role/route.ts
├── reviews/
│   ├── route.ts                      # GET (admin), POST (user create)
│   └── [id]/
│       ├── route.ts                  # GET, DELETE
│       ├── approve/route.ts          # PATCH
│       └── reject/route.ts           # PATCH
├── reviews/bulk/
│   ├── approve/route.ts              # POST
│   └── destroy/route.ts              # POST
├── addresses/
│   ├── route.ts                      # GET, POST
│   └── [id]/
│       ├── route.ts                  # PUT, DELETE
│       └── default/route.ts          # PATCH
├── inventory/
│   ├── route.ts                      # GET
│   └── [productId]/
│       └── stock/route.ts            # PATCH
├── admin/
│   ├── dashboard/route.ts            # GET
│   └── storefront/
│       └── promo/route.ts            # GET, PUT
├── upload/
│   └── route.ts                      # POST (file upload)
└── track-order/
    └── route.ts                      # GET (by order number)
```

---

## 9. File & Image Storage

### Strategy
- **Local storage** for development (Next.js public + local filesystem)
- **S3-compatible storage** (AWS S3, Cloudflare R2, or MinIO) for production
- **Image optimization** via Next.js `Image` component + Sharp

### Upload Flow
1. Client sends file to `/api/upload`
2. API validates file type (JPEG, PNG, WebP) and size (max 5MB)
3. File saved to storage with unique filename
4. Multiple sizes generated (thumbnail 300px, medium 800px, full 1920px)
5. URL returned and stored in DB

### Image Fields
- **Products:** `productImages` table (multiple images with sort order) + legacy `imagePath` column
- **Categories:** `imagePath` column (single image)
- **Variants:** Images stored in variant's `images` JSON field or separate table

---

## 10. Email & Notifications

### Emails
| Email | Trigger | Template |
|-------|---------|----------|
| OTP Verification | Registration / resend | 6-digit code, branded template |
| Order Confirmation | After successful checkout | Order details, items, totals |
| Password Reset | Forgot password request | Reset link |

### Implementation
- **Resend** (recommended) or Nodemailer for SMTP
- HTML email templates with inline styles (no Tailwind in emails)
- Development: Log emails to console / Ethereal for testing

### Telegram Notifications
- Sent on new order placement
- Formatted message with:
  - Order number
  - Customer name + phone
  - Items list with quantities
  - Total amount
  - Shipping address
- Queued via background job (Inngest, Trigger.dev, or simple setTimeout)

---

## 11. Design System & Theming

### Design Tokens (CSS Variables)
Map from current `--sura-*` tokens to shadcn/ui CSS variables:

```css
/* globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 270 50% 75%;        /* Purple accent (#c9a6f5) */
    --primary-foreground: 0 0% 100%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 270 50% 75%;
    --radius: 0.5rem;
    --success: 142 76% 36%;
    --warning: 38 92% 50%;
    --info: 221 83% 53%;
  }
  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 270 50% 75%;
    --primary-foreground: 0 0% 100%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 270 50% 75%;
  }
}
```

### Typography
- **Display font:** Playfair Display (headings, hero text)
- **Body font:** DM Sans (body, UI elements)
- Load via `next/font/google`

### Layout Patterns
- **Storefront:** Full-width, centered content (max-w-7xl)
- **Admin:** Sidebar + content layout (collapsible sidebar)
- **Auth:** Centered card layout
- **Account:** Sidebar navigation + content

### Responsive Breakpoints
- Mobile: < 768px (single column, hamburger nav)
- Tablet: 768px - 1024px (2-column grids)
- Desktop: > 1024px (full layout, sidebar)

---

## 12. Project Structure

```
nasbyte-stecom-nextjs/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/
│   ├── images/
│   │   ├── logo.svg
│   │   ├── placeholder.png
│   │   └── uploads/
│   └── fonts/
├── src/
│   ├── app/
│   │   ├── (storefront)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx
│   │   │   ├── cart/
│   │   │   │   └── page.tsx
│   │   │   ├── checkout/
│   │   │   │   └── page.tsx
│   │   │   ├── orders/
│   │   │   │   └── [id]/
│   │   │   │       └── confirmation/
│   │   │   │           └── page.tsx
│   │   │   ├── track-order/
│   │   │   │   └── page.tsx
│   │   │   └── policy/
│   │   │       └── page.tsx
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── verify-email/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   └── reset-password/
│   │   │       └── page.tsx
│   │   ├── (account)/
│   │   │   ├── layout.tsx
│   │   │   ├── account/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── orders/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── addresses/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── profile/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── security/
│   │   │   │       └── page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   ├── categories/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── users/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   ├── reviews/
│   │   │   │   └── page.tsx
│   │   │   ├── inventory/
│   │   │   │   └── page.tsx
│   │   │   └── storefront/
│   │   │       └── promo/
│   │   │           └── page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── products/
│   │   │   ├── categories/
│   │   │   ├── orders/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── users/
│   │   │   ├── reviews/
│   │   │   ├── addresses/
│   │   │   ├── inventory/
│   │   │   ├── upload/
│   │   │   └── admin/
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   ├── forbidden.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   │   ├── storefront/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   └── account/
│   │   ├── products/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── dashboard/
│   │   ├── forms/
│   │   └── shared/
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── utils.ts
│   │   ├── price.ts
│   │   ├── date.ts
│   │   ├── status.ts
│   │   ├── sku.ts
│   │   ├── email.ts
│   │   ├── telegram.ts
│   │   ├── otp.ts
│   │   └── validators.ts
│   ├── hooks/
│   │   ├── use-cart.ts
│   │   ├── use-appearance.ts
│   │   └── use-debounce.ts
│   ├── stores/
│   │   └── cart.ts
│   ├── types/
│   │   ├── product.ts
│   │   ├── user.ts
│   │   ├── order.ts
│   │   └── index.ts
│   └── middleware.ts
├── .env.example
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── components.json
├── tsconfig.json
├── package.json
└── README.md
```

---

## 13. Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal:** Project setup, database, authentication

- [ ] Initialize Next.js 15 project with TypeScript
- [ ] Configure Tailwind CSS 4 + shadcn/ui
- [ ] Set up Prisma with PostgreSQL
- [ ] Create full database schema from PRD Section 3
- [ ] Run initial migration
- [ ] Create seed script with admin user + sample data
- [ ] Set up NextAuth.js v5 with credentials provider
- [ ] Implement registration with OTP flow
- [ ] Implement login/logout
- [ ] Implement email verification
- [ ] Implement 2FA (TOTP)
- [ ] Create auth middleware (requireAuth, requireAdmin, requireVerified)
- [ ] Create root layout with theme provider
- [ ] Set up Zod validation schemas

### Phase 2: Storefront (Week 3-4)
**Goal:** Public-facing storefront

- [ ] Build home page (promo banner, categories, featured products)
- [ ] Build product listing page with filters, search, pagination
- [ ] Build product detail page with variants, images, reviews
- [ ] Build shopping cart (Zustand store + DB sync)
- [ ] Build checkout flow with form validation
- [ ] Build order confirmation page
- [ ] Build order tracking page
- [ ] Build policy page
- [ ] Create storefront layout (header, footer, promo banner)
- [ ] Implement responsive design (mobile, tablet, desktop)

### Phase 3: User Account (Week 5)
**Goal:** User dashboard

- [ ] Build account overview page
- [ ] Build order history page with detail view
- [ ] Build address management (CRUD + default)
- [ ] Build profile settings page
- [ ] Build security settings (password change, 2FA management)
- [ ] Create account layout with sidebar navigation

### Phase 4: Admin Panel (Week 6-7)
**Goal:** Admin management interface

- [ ] Build admin layout with sidebar navigation
- [ ] Build dashboard with KPIs and charts
- [ ] Build product management (CRUD, variants, images)
- [ ] Build category management (CRUD)
- [ ] Build order management (list, detail, status updates)
- [ ] Build user management (CRUD, role changes)
- [ ] Build review management (moderation, bulk actions)
- [ ] Build inventory management (stock levels, adjustments, logs)
- [ ] Build storefront promo management

### Phase 5: Services & Integrations (Week 8)
**Goal:** Backend services

- [ ] Implement file upload service (local + S3)
- [ ] Implement image optimization pipeline
- [ ] Implement email service (Resend/Nodemailer)
- [ ] Implement Telegram notification service
- [ ] Implement background job queue (Inngest/Trigger.dev)
- [ ] Implement order confirmation email
- [ ] Implement OTP email

### Phase 6: Polish & Testing (Week 9-10)
**Goal:** Quality assurance

- [ ] Write unit tests (Vitest)
- [ ] Write E2E tests (Playwright)
- [ ] Performance optimization (Lighthouse audit)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Security audit (OWASP Top 10)
- [ ] Error handling and loading states
- [ ] SEO optimization (meta tags, structured data)
- [ ] Deployment setup (Vercel + Railway/Neon for PostgreSQL)

---

## 14. Environment Variables

```env
# ─── DATABASE ──────────────────────────────────────────────
DATABASE_URL="postgresql://user:password@localhost:5432/nasbyte_stecom"

# ─── NEXTAUTH ──────────────────────────────────────────────
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# ─── EMAIL (Resend) ───────────────────────────────────────
RESEND_API_KEY="re_xxxxxxxxxxxxxxxx"
EMAIL_FROM="NasByte <noreply@nasbyte.com>"

# ─── TELEGRAM ──────────────────────────────────────────────
TELEGRAM_BOT_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TELEGRAM_CHAT_ID="xxxxxxxxxxxx"

# ─── FILE STORAGE (S3-compatible) ─────────────────────────
S3_BUCKET="nasbyte-stecom"
S3_REGION="ap-south-1"
S3_ACCESS_KEY="xxxxxxxxxxxxxxxxxxxx"
S3_SECRET_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
S3_ENDPOINT="https://s3.ap-south-1.amazonaws.com"

# ─── APP ───────────────────────────────────────────────────
NEXT_PUBLIC_APP_NAME="NasByte SteCom"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SUPPORT_EMAIL="support@nasbyte.com"
```

---

## 15. Appendix: Validation Schemas (Zod)

### Product Schema
```typescript
import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  sku: z.string().max(100).optional(),
  stock: z.number().int().min(0),
  categoryId: z.string().uuid().optional(),
  hasVariants: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  features: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
});
```

### Checkout Schema
```typescript
export const checkoutSchema = z.object({
  shippingAddress: z.string().min(1, "Address is required"),
  shippingCity: z.string().min(1, "City is required"),
  shippingPostalCode: z.string().optional(),
  shippingPhone: z.string().min(1, "Phone is required"),
  paymentMethod: z.enum(["CASH_ON_DELIVERY", "CARD", "MOBILE_BANKING"]),
  notes: z.string().optional(),
});
```

### Registration Schema
```typescript
export const registerSchema = z
  .object({
    name: z.string().min(2).max(255),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(8).max(128),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });
```

### Login Schema
```typescript
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
```

### Address Schema
```typescript
export const addressSchema = z.object({
  recipientName: z.string().min(1).max(150),
  phone: z.string().min(1).max(20),
  addressLine: z.string().min(1),
  city: z.string().min(1).max(100),
  postalCode: z.string().max(20).optional(),
  country: z.string().default("Bangladesh"),
  isDefault: z.boolean().default(false),
});
```

### Category Schema
```typescript
export const categorySchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),
  imagePath: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});
```

### Profile Schema
```typescript
export const profileSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
});
```

### Password Change Schema
```typescript
export const passwordChangeSchema = z
  .object({
    current_password: z.string().min(1),
    password: z.string().min(8).max(128),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });
```

### OTP Schema
```typescript
export const otpSchema = z.object({
  code: z.string().length(6).regex(/^\d+$/, "Must be 6 digits"),
});
```

---

## 16. Appendix: Key Algorithms

### Cart Merge (Guest → Authenticated)
```
On login:
1. Get guest cart items from session/cookie
2. Get authenticated user's cart items from DB
3. For each guest cart item:
   a. If same product+variant exists in DB cart → update quantity (min of stock)
   b. Else → insert new cart item
4. Clear guest session cart
5. Return merged cart
```

### Order Number Generation
```
Format: ORD-XXXXXXXXXX (10 random alphanumeric chars)
Generate on Order creation
Retry on collision (max 3 attempts)
```

### Stock Decrement (Checkout)
```
Within DB transaction (SELECT FOR UPDATE):
1. Lock product/variant rows
2. Validate all items have sufficient stock
3. Create order + order items (with product name/image snapshots)
4. Decrement stock for each product/variant
5. Create inventory stock logs (old_stock, new_stock, delta)
6. Clear user's cart
7. Commit transaction
8. Queue Telegram notification
9. Send confirmation email
```

### Slug Generation
```
From name: "Silk Scarf Collection" → "silk-scarf-collection"
Append suffix on collision: "silk-scarf-collection-2"
```

---

*End of PRD*
