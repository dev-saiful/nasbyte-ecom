# Phase 1: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up project foundation: shadcn/ui, Tailwind theming, NextAuth v5 with credentials + OTP, auth middleware, Zod validation schemas, and utility libraries.

**Architecture:** Next.js 16 App Router with Prisma 7 (PostgreSQL), NextAuth v5 (Auth.js) for session management, shadcn/ui (New York style) for UI components, Zod 4 for validation. All imports use `@/*` alias to `./src/*`.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.7+, Tailwind CSS 4, shadcn/ui, Prisma 7, NextAuth v5 (Auth.js), Zod 4, react-hook-form, bcryptjs, sonner

## Global Constraints

- Next.js 16 with Turbopack (default bundler)
- Tailwind CSS 4 via `@tailwindcss/postcss` — uses `@import "tailwindcss"` not `@tailwind` directives
- Biome 2.2 for linting/formatting — NOT ESLint/Prettier
- TypeScript strict mode, bundler module resolution, `@/*` path alias
- UUID primary keys for all models except `storefront_announcements`
- Currency: BDT. Shipping: flat 150 BDT
- Run `npm run lint` before committing
- PRD is source of truth: `PRD-NEXTJS.md`

---

## Task 1: Initialize shadcn/ui

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/ui/button.tsx` (via shadcn CLI)
- Create: `components.json` (via shadcn CLI)

**Interfaces:**
- Produces: shadcn/ui component system available at `src/components/ui/`

- [ ] **Step 1: Run shadcn init**

```bash
npx shadcn@latest init -d
```

This will create `components.json` and update `src/app/globals.css` with CSS variables.

- [ ] **Step 2: Add base components**

```bash
npx shadcn@latest add button card input label separator sheet dialog dropdown-menu avatar badge textarea select toast sonner
```

- [ ] **Step 3: Verify globals.css has shadcn variables**

Check that `src/app/globals.css` now contains the shadcn CSS variable system with `@layer base` blocks for `:root` and `.dark`.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: initialize shadcn/ui with base components"
```

---

## Task 2: Setup Design Tokens & Typography

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: shadcn/ui CSS variables from Task 1
- Produces: Design tokens (colors, typography) matching PRD Section 11

- [ ] **Step 1: Update globals.css with PRD design tokens**

Replace the CSS variables in `src/app/globals.css` with the PRD Section 11 tokens. Keep the shadcn structure but override values:

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 270 50% 75%;
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

@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --color-success: hsl(var(--success));
  --color-warning: hsl(var(--warning));
  --color-info: hsl(var(--info));
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --font-heading: var(--font-playfair);
  --font-body: var(--font-dm-sans);
}
```

- [ ] **Step 2: Update layout.tsx with Playfair Display + DM Sans fonts**

```tsx
import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NasByte SteCom",
  description: "Ladies accessories eCommerce store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${dmSans.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create theme-provider component**

Create `src/components/layout/theme-provider.tsx`:

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

- [ ] **Step 4: Install next-themes**

```bash
npm install next-themes
```

- [ ] **Step 5: Run lint**

```bash
npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: setup design tokens, typography (Playfair Display + DM Sans), and theme provider"
```

---

## Task 3: Create Utility Libraries

**Files:**
- Create: `src/lib/utils.ts`
- Create: `src/lib/price.ts`
- Create: `src/lib/utils.test.ts`

**Interfaces:**
- Produces: `cn()` class merge helper, `formatPrice()`, `generateOrderNumber()`, `slugify()`

- [ ] **Step 1: Create src/lib/utils.ts**

```tsx
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateOrderNumber(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "ORD-";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function formatBDT(amount: number): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
```

- [ ] **Step 2: Create src/lib/price.ts**

```ts
import { Decimal } from "@prisma/client/runtime/library";

export const SHIPPING_COST = 150;

export function calculateSubtotal(
  items: { price: Decimal; quantity: number }[],
): number {
  return items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );
}

export function calculateTotal(subtotal: number): number {
  return subtotal + SHIPPING_COST;
}
```

- [ ] **Step 3: Create src/lib/utils.test.ts**

```ts
import { describe, expect, it } from "vitest";
import { formatBDT, generateOrderNumber, slugify } from "./utils";

describe("slugify", () => {
  it("converts text to slug", () => {
    expect(slugify("Silk Scarf Collection")).toBe("silk-scarf-collection");
  });

  it("handles special characters", () => {
    expect(slugify("Hello! @World#")).toBe("hello-world");
  });

  it("handles multiple spaces", () => {
    expect(slugify("  Hello   World  ")).toBe("hello-world");
  });
});

describe("generateOrderNumber", () => {
  it("starts with ORD-", () => {
    expect(generateOrderNumber()).toMatch(/^ORD-/);
  });

  it("has 14 characters total", () => {
    expect(generateOrderNumber()).toHaveLength(14);
  });
});

describe("formatBDT", () => {
  it("formats number as BDT", () => {
    expect(formatBDT(1500)).toContain("1,500");
  });
});
```

- [ ] **Step 4: Add test script to package.json**

Add to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Create vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
  },
});
```

- [ ] **Step 6: Install vite-tsconfig-paths**

```bash
npm install -D vite-tsconfig-paths
```

- [ ] **Step 7: Run tests**

```bash
npm test
```

Expected: All 5 tests pass.

- [ ] **Step 8: Run lint**

```bash
npm run lint
```

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat: add utility libraries (cn, slugify, formatPrice, generateOrderNumber) with tests"
```

---

## Task 4: Create Zod Validation Schemas

**Files:**
- Create: `src/lib/validators.ts`

**Interfaces:**
- Produces: `registerSchema`, `loginSchema`, `otpSchema`, `checkoutSchema`, `addressSchema`, `profileSchema`, `passwordChangeSchema`, `productSchema`, `categorySchema`

- [ ] **Step 1: Create src/lib/validators.ts**

```ts
import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(255),
    email: z.string().email("Invalid email address"),
    phone: z.string().max(20).optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const otpSchema = z.object({
  code: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "Must be 6 digits"),
});

export const checkoutSchema = z.object({
  shippingAddress: z.string().min(1, "Address is required"),
  shippingCity: z.string().min(1, "City is required"),
  shippingPostalCode: z.string().max(20).optional(),
  shippingPhone: z.string().min(1, "Phone is required"),
  paymentMethod: z.enum(["CASH_ON_DELIVERY", "CARD", "MOBILE_BANKING"]),
  notes: z.string().max(500).optional(),
});

export const addressSchema = z.object({
  recipientName: z.string().min(1, "Recipient name is required").max(150),
  phone: z.string().min(1, "Phone is required").max(20),
  addressLine: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required").max(100),
  postalCode: z.string().max(20).optional(),
  country: z.string().default("Bangladesh"),
  isDefault: z.boolean().default(false),
});

export const profileSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
});

export const passwordChangeSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });

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

export const categorySchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),
  imagePath: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
```

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add Zod validation schemas for all forms and API inputs"
```

---

## Task 5: Setup NextAuth.js v5

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/types/next-auth.d.ts`

**Interfaces:**
- Consumes: Prisma client from `src/lib/prisma.ts`, User model from schema
- Produces: `auth()` session getter, `signIn()`/`signOut()` helpers, NextAuth API route

- [ ] **Step 1: Create src/lib/auth.ts**

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";

export const {
  handlers,
  signIn,
  signOut,
  auth,
} = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email, deletedAt: null },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isVerified: user.isVerified,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.isVerified = (user as any).isVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).isVerified = token.isVerified;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
});
```

- [ ] **Step 2: Create src/app/api/auth/[...nextauth]/route.ts**

```ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 3: Create src/types/next-auth.d.ts**

```ts
import "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    isVerified: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      isVerified: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    isVerified: boolean;
  }
}
```

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: setup NextAuth.js v5 with credentials provider and JWT sessions"
```

---

## Task 6: Create OTP & Email Services

**Files:**
- Create: `src/lib/otp.ts`
- Create: `src/lib/email.ts`

**Interfaces:**
- Produces: `generateOtp()`, `hashOtp()`, `verifyOtp()`, `sendOtpEmail()`, `sendOrderConfirmation()`

- [ ] **Step 1: Create src/lib/otp.ts**

```ts
import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

export function generateOtp(): string {
  return crypto
    .randomInt(0, 10 ** OTP_LENGTH)
    .toString()
    .padStart(OTP_LENGTH, "0");
}

export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

export async function verifyOtp(
  inputOtp: string,
  storedHash: string,
): Promise<{ valid: boolean; reason?: string }> {
  const valid = await bcrypt.compare(inputOtp, storedHash);
  if (!valid) return { valid: false, reason: "Invalid OTP" };
  return { valid: true };
}

export function isOtpExpired(sentAt: Date, expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

export function isOtpRateLimited(sentAt: Date): boolean {
  const cooldownEnd = new Date(sentAt.getTime() + RESEND_COOLDOWN_MS);
  return new Date() < cooldownEnd;
}

export function isMaxAttemptsReached(attempts: number): boolean {
  return attempts >= MAX_ATTEMPTS;
}

export { OTP_TTL_MS, MAX_ATTEMPTS, RESEND_COOLDOWN_MS };
```

- [ ] **Step 2: Create src/lib/email.ts**

```ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error("Failed to send email:", error);
    // In development, log instead of failing
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] Email would have been sent to ${to}: ${subject}`);
    }
  }
}

export async function sendOtpEmail(email: string, otp: string, name: string) {
  await sendEmail({
    to: email,
    subject: "Verify Your Email - NasByte SteCom",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Email Verification</h2>
        <p>Hi ${name},</p>
        <p>Your verification code is:</p>
        <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #666;">This code expires in 10 minutes.</p>
        <p style="color: #666;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
}

export async function sendOrderConfirmationEmail(
  email: string,
  name: string,
  orderNumber: string,
  total: number,
) {
  await sendEmail({
    to: email,
    subject: `Order Confirmed - ${orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Order Confirmed!</h2>
        <p>Hi ${name},</p>
        <p>Your order <strong>${orderNumber}</strong> has been confirmed.</p>
        <p>Total: <strong>${total.toLocaleString()} BDT</strong></p>
        <p>We'll notify you when your order ships.</p>
        <p style="color: #666;">Thank you for shopping with NasByte SteCom!</p>
      </div>
    `,
  });
}
```

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add OTP generation/verification and email service (Nodemailer)"
```

---

## Task 7: Create Telegram Notification Service

**Files:**
- Create: `src/lib/telegram.ts`

**Interfaces:**
- Produces: `sendTelegramNotification()`

- [ ] **Step 1: Create src/lib/telegram.ts**

```ts
interface OrderNotificationData {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  shippingAddress: string;
}

export async function sendTelegramNotification(
  data: OrderNotificationData,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log("[DEV] Telegram not configured. Notification skipped.");
    return;
  }

  const itemsList = data.items
    .map((item) => `  • ${item.name} x${item.quantity} — ${item.price.toLocaleString()} BDT`)
    .join("\n");

  const message = [
    `🛒 *New Order* — ${data.orderNumber}`,
    "",
    `👤 *Customer:* ${data.customerName}`,
    `📱 *Phone:* ${data.customerPhone}`,
    "",
    "*Items:*",
    itemsList,
    "",
    `💰 *Total:* ${data.total.toLocaleString()} BDT`,
    "",
    `📍 *Address:* ${data.shippingAddress}`,
  ].join("\n");

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
        }),
      },
    );

    if (!response.ok) {
      console.error("Telegram API error:", await response.text());
    }
  } catch (error) {
    console.error("Failed to send Telegram notification:", error);
  }
}
```

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add Telegram notification service for new orders"
```

---

## Task 8: Create Auth Middleware

**Files:**
- Create: `src/middleware.ts`

**Interfaces:**
- Consumes: `auth()` from `src/lib/auth.ts`
- Produces: Route protection for `/account/*`, `/admin/*`, `/auth/*`

- [ ] **Step 1: Create src/middleware.ts**

```ts
import NextAuth from "next-auth";
import { NextResponse } from "next/server";

const { auth } = NextAuth({
  providers: [],
  session: { strategy: "jwt" },
});

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Guest-only routes (redirect to /account if logged in)
  const guestOnlyRoutes = ["/auth/login", "/auth/register"];
  if (guestOnlyRoutes.some((route) => pathname.startsWith(route))) {
    if (session) {
      return NextResponse.redirect(new URL("/account", req.url));
    }
  }

  // Auth-required routes
  const authRequiredRoutes = ["/account", "/checkout"];
  if (authRequiredRoutes.some((route) => pathname.startsWith(route))) {
    if (!session) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Verified-required routes
  const verifiedRequiredRoutes = ["/checkout"];
  if (verifiedRequiredRoutes.some((route) => pathname.startsWith(route))) {
    if (session && !(session.user as any).isVerified) {
      return NextResponse.redirect(new URL("/auth/verify-email", req.url));
    }
  }

  // Admin-only routes
  const adminRoutes = ["/admin"];
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!session) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.redirect(new URL("/forbidden", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/account/:path*",
    "/admin/:path*",
    "/checkout/:path*",
    "/auth/login",
    "/auth/register",
  ],
};
```

- [ ] **Step 2: Create src/app/forbidden/page.tsx**

```tsx
import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground">403</h1>
        <p className="mt-2 text-muted-foreground">Access Denied</p>
        <Link href="/" className="mt-4 inline-block text-primary hover:underline">
          Go Home
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create src/app/not-found.tsx**

```tsx
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-muted-foreground">Page Not Found</p>
        <Link href="/" className="mt-4 inline-block text-primary hover:underline">
          Go Home
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add auth middleware with role-based route protection"
```

---

## Task 9: Build Auth Pages (Login, Register, Verify Email)

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/register/page.tsx`
- Create: `src/app/(auth)/verify-email/page.tsx`
- Create: `src/app/api/auth/register/route.ts`
- Create: `src/app/api/auth/verify-email/route.ts`
- Create: `src/app/api/auth/resend-otp/route.ts`

**Interfaces:**
- Consumes: `signIn`/`signOut` from `src/lib/auth.ts`, schemas from `src/lib/validators.ts`, OTP from `src/lib/otp.ts`, email from `src/lib/email.ts`
- Produces: Auth pages and API routes

- [ ] **Step 1: Create src/app/(auth)/layout.tsx**

```tsx
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold font-heading text-primary">
            NasByte SteCom
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create src/app/(auth)/login/page.tsx**

```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-primary hover:underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
```

- [ ] **Step 3: Create src/app/(auth)/register/page.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterInput) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Registration failed");
        return;
      }

      toast.success("Registration successful! Please verify your email.");
      router.push("/auth/verify-email");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Join NasByte SteCom today</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input id="phone" type="tel" {...register("phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password_confirmation">Confirm Password</Label>
            <Input id="password_confirmation" type="password" {...register("password_confirmation")} />
            {errors.password_confirmation && (
              <p className="text-sm text-destructive">{errors.password_confirmation.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
```

- [ ] **Step 4: Create src/app/(auth)/verify-email/page.tsx**

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { otpSchema, type OtpInput } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpInput>({
    resolver: zodResolver(otpSchema),
  });

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  async function onSubmit(data: OtpInput) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: data.code }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Verification failed");
        return;
      }

      toast.success("Email verified successfully!");
      router.push("/account");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    setCountdown(60);
    try {
      const res = await fetch("/api/auth/resend-otp", { method: "POST" });
      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Failed to resend OTP");
        setCountdown(0);
        return;
      }

      toast.success("OTP sent to your email");
    } catch {
      toast.error("Something went wrong");
      setCountdown(0);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify Email</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to your email
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              placeholder="000000"
              maxLength={6}
              {...register("code")}
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify Email"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleResend}
            disabled={countdown > 0}
          >
            {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
```

- [ ] **Step 5: Create src/app/api/auth/register/route.ts**

```ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { generateOtp, hashOtp, OTP_TTL_MS } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { name, email, phone, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        emailVerificationOtpHash: otpHash,
        emailVerificationOtpSentAt: new Date(),
        emailVerificationOtpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    await sendOtpEmail(email, otp, name);

    return NextResponse.json({
      message: "Registration successful. Please check your email for verification code.",
      userId: user.id,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 6: Create src/app/api/auth/verify-email/route.ts**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { otpSchema } from "@/lib/validators";
import { verifyOtp, isOtpExpired, isMaxAttemptsReached } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = otpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { code } = parsed.data;

    // Get user with pending verification
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationOtpHash: { not: null },
        emailVerificationOtpExpiresAt: { not: null },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!user || !user.emailVerificationOtpHash || !user.emailVerificationOtpExpiresAt) {
      return NextResponse.json(
        { error: "No pending verification found" },
        { status: 400 },
      );
    }

    if (isOtpExpired(user.emailVerificationOtpSentAt!, user.emailVerificationOtpExpiresAt)) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 },
      );
    }

    if (isMaxAttemptsReached(user.emailVerificationOtpAttempts)) {
      return NextResponse.json(
        { error: "Max attempts reached. Please request a new OTP." },
        { status: 400 },
      );
    }

    const result = await verifyOtp(code, user.emailVerificationOtpHash);

    if (!result.valid) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerificationOtpAttempts: { increment: 1 } },
      });

      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationOtpHash: null,
        emailVerificationOtpSentAt: null,
        emailVerificationOtpExpiresAt: null,
        emailVerificationOtpAttempts: 0,
      },
    });

    return NextResponse.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 7: Create src/app/api/auth/resend-otp/route.ts**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtp, hashOtp, OTP_TTL_MS, isOtpRateLimited } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";

export async function POST() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        isVerified: false,
        emailVerificationOtpHash: { not: null },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No pending verification found" },
        { status: 400 },
      );
    }

    if (user.emailVerificationOtpSentAt && isOtpRateLimited(user.emailVerificationOtpSentAt)) {
      return NextResponse.json(
        { error: "Please wait 60 seconds before requesting a new OTP" },
        { status: 429 },
      );
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationOtpHash: otpHash,
        emailVerificationOtpSentAt: new Date(),
        emailVerificationOtpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
        emailVerificationOtpAttempts: 0,
      },
    });

    await sendOtpEmail(user.email, otp, user.name);

    return NextResponse.json({ message: "OTP resent successfully" });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 8: Run lint**

```bash
npm run lint
```

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat: add auth pages (login, register, verify-email) and API routes"
```

---

## Task 10: Build Homepage

**Files:**
- Create: `src/app/(storefront)/layout.tsx`
- Create: `src/app/(storefront)/page.tsx`
- Create: `src/components/layout/storefront-header.tsx`
- Create: `src/components/layout/storefront-footer.tsx`
- Create: `src/components/products/product-card.tsx`

**Interfaces:**
- Consumes: Prisma for products/categories/announcements
- Produces: Storefront layout and homepage

- [ ] **Step 1: Create src/app/(storefront)/layout.tsx**

```tsx
import { StorefrontHeader } from "@/components/layout/storefront-header";
import { StorefrontFooter } from "@/components/layout/storefront-footer";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader />
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
    </div>
  );
}
```

- [ ] **Step 2: Create src/components/layout/storefront-header.tsx**

```tsx
"use client";

import Link from "next/link";
import { ShoppingCart, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function StorefrontHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold font-heading text-primary">
          NasByte SteCom
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/products" className="text-sm font-medium hover:text-primary">
            Products
          </Link>
          <Link href="/track-order" className="text-sm font-medium hover:text-primary">
            Track Order
          </Link>
          <Link href="/policy" className="text-sm font-medium hover:text-primary">
            Policy
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
          <Link href="/cart">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/auth/login" className="hidden md:block">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/products" className="text-lg font-medium">
                  Products
                </Link>
                <Link href="/track-order" className="text-lg font-medium">
                  Track Order
                </Link>
                <Link href="/policy" className="text-lg font-medium">
                  Policy
                </Link>
                <Link href="/auth/login" className="text-lg font-medium">
                  Sign In
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Create src/components/layout/storefront-footer.tsx**

```tsx
import Link from "next/link";

export function StorefrontFooter() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold font-heading text-primary">NasByte SteCom</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Ladies accessories store in Dhaka, Bangladesh.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Quick Links</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-primary">Products</Link></li>
              <li><Link href="/policy" className="hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="/track-order" className="hover:text-primary">Track Order</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Contact</h4>
            <p className="text-sm text-muted-foreground">support@nasbyte.com</p>
            <p className="text-sm text-muted-foreground">Dhaka, Bangladesh</p>
          </div>
        </div>
        <div className="mt-8 border-t pt-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} NasByte SteCom. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Create src/components/products/product-card.tsx**

```tsx
import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBDT } from "@/lib/utils";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number | null;
    averageRating: number;
    reviewCount: number;
    category?: { name: string } | null;
    productImages?: { path: string }[];
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.productImages?.[0]?.path || "/images/placeholder.png";

  return (
    <Card className="group overflow-hidden">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          {product.compareAtPrice && (
            <Badge className="absolute top-2 left-2 bg-destructive">
              Sale
            </Badge>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        {product.category && (
          <Badge variant="secondary" className="mb-2 text-xs">
            {product.category.name}
          </Badge>
        )}
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold line-clamp-1 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="mt-1 flex items-center gap-1">
          <Star className="h-3 w-3 fill-primary text-primary" />
          <span className="text-xs text-muted-foreground">
            {product.averageRating.toFixed(1)} ({product.reviewCount})
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-bold">{formatBDT(product.price)}</span>
          {product.compareAtPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatBDT(product.compareAtPrice)}
            </span>
          )}
        </div>
        <Button className="mt-3 w-full" size="sm">
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Create src/app/(storefront)/page.tsx**

```tsx
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/products/product-card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function HomePage() {
  const [announcement, categories, featuredProducts] = await Promise.all([
    prisma.storefrontAnnouncement.findFirst({
      where: { isActive: true },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      take: 6,
    }),
    prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      include: { category: true, productImages: true },
      take: 8,
    }),
  ]);

  return (
    <div>
      {/* Promo Banner */}
      {announcement?.title && (
        <div className="bg-primary text-primary-foreground py-2 text-center text-sm font-medium">
          {announcement.title}
        </div>
      )}

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-3xl font-bold font-heading text-center mb-8">
          Shop by Category
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="group"
            >
              <div className="rounded-lg border p-4 text-center transition-colors hover:border-primary hover:bg-muted/50">
                <h3 className="font-medium group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold font-heading">Featured Products</h2>
          <Link href="/products" className="text-primary hover:underline text-sm font-medium">
            View All
          </Link>
        </div>
        {featuredProducts.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No featured products yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 6: Run lint**

```bash
npm run lint
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add storefront layout, homepage with promo banner, categories, and featured products"
```

---

## Task 11: Create Error Pages

**Files:**
- Create: `src/app/error.tsx`

**Interfaces:**
- Produces: Global error boundary

- [ ] **Step 1: Create src/app/error.tsx**

```tsx
"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">{error.message}</p>
        <Button onClick={reset} className="mt-4">
          Try again
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add global error boundary page"
```

---

## Task 12: Verify Build

- [ ] **Step 1: Run lint**

```bash
npm run lint
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

- [ ] **Step 3: Run build**

```bash
npm run build
```

- [ ] **Step 4: Fix any issues and commit**

```bash
git add .
git commit -m "fix: resolve build and lint issues for Phase 1"
```

---

## Summary

After completing all tasks, Phase 1 delivers:

| Deliverable | Status |
|------------|--------|
| shadcn/ui initialized | ✅ |
| Design tokens (colors, typography) | ✅ |
| Theme provider (light/dark/system) | ✅ |
| Utility libraries (cn, formatPrice, slugify) | ✅ |
| Zod validation schemas | ✅ |
| NextAuth.js v5 (credentials + JWT) | ✅ |
| OTP email verification flow | ✅ |
| Auth middleware (guest/auth/admin) | ✅ |
| Auth pages (login, register, verify-email) | ✅ |
| Storefront layout + homepage | ✅ |
| Error pages (403, 404, generic) | ✅ |
| Unit tests for utilities | ✅ |

**Phase 1 Complete. Ready for Phase 2: Storefront.**
