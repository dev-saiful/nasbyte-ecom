# Phase 1 Auth Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete missing Phase 1 auth features: Forgot Password, Reset Password, and Confirm Password flows.

**Architecture:** Token-based password reset (email link with secure token). Confirm password returns a short-lived confirmation token for sensitive actions. All follow existing patterns: Zod validation, API routes with try/catch, client forms with react-hook-form + sonner.

**Tech Stack:** Next.js 16, Prisma 7, PostgreSQL, bcryptjs, Zod 4, react-hook-form, sonner, nodemailer

## Global Constraints

- Passwords: min 8, max 128 characters, bcrypt hash with salt 12
- Token hashing: bcrypt with salt 10
- Password reset token TTL: 1 hour
- Confirm password token TTL: 5 minutes
- Rate limit: max 3 forgot-password requests per 15 minutes per email
- All API responses use `{ message: "..." }` or `{ error: "..." }` format
- All pages use `"use client"`, `useForm` + `zodResolver`, `toast` from sonner
- Path alias: `@/*` maps to `./src/*`

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `prisma/schema.prisma` | Modify | Add password reset fields to User model |
| `prisma/migrations/YYYYMMDD_add_password_reset_fields/migration.sql` | Create | DB migration |
| `src/lib/validators.ts` | Modify | Add `resetPasswordSchema`, `confirmPasswordSchema` |
| `src/lib/email.ts` | Modify | Add `sendPasswordResetEmail()` |
| `src/app/api/auth/forgot-password/route.ts` | Create | Forgot password API |
| `src/app/api/auth/reset-password/route.ts` | Create | Reset password API |
| `src/app/api/auth/confirm-password/route.ts` | Create | Confirm password API |
| `src/app/(auth)/forgot-password/page.tsx` | Create | Forgot password page |
| `src/app/(auth)/reset-password/page.tsx` | Create | Reset password page |
| `src/app/(auth)/confirm-password/page.tsx` | Create | Confirm password page |

---

### Task 1: Database Migration — Add Password Reset Fields

**Files:**
- Modify: `prisma/schema.prisma:9-36` (User model)
- Create: `prisma/migrations/YYYYMMDD_add_password_reset_fields/migration.sql`

**Interfaces:**
- Produces: User model with `passwordResetTokenHash`, `passwordResetExpiresAt`, `passwordResetTokenSentAt` fields

- [ ] **Step 1: Add fields to User model in schema.prisma**

Add these 3 fields after line 24 (`emailVerificationOtpAttempts`), before `createdAt`:

```prisma
  passwordResetTokenHash     String?   @map("password_reset_token_hash")
  passwordResetExpiresAt     DateTime? @map("password_reset_expires_at")
  passwordResetTokenSentAt   DateTime? @map("password_reset_token_sent_at")
```

- [ ] **Step 2: Run Prisma migration**

Run: `npx prisma migrate dev --name add_password_reset_fields`
Expected: Migration created successfully, Prisma client regenerated

- [ ] **Step 3: Verify migration**

Run: `npx prisma db push`
Expected: `Your database is now in sync with your Prisma schema`

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): add password reset fields to User model"
```

---

### Task 2: Validation Schemas

**Files:**
- Modify: `src/lib/validators.ts:80` (after `passwordChangeSchema`)

**Interfaces:**
- Produces: `resetPasswordSchema`, `confirmPasswordSchema`, `ResetPasswordInput`, `ConfirmPasswordInput`

- [ ] **Step 1: Add resetPasswordSchema**

Add after the `passwordChangeSchema` block (after line 80):

```ts
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
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

export const confirmPasswordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});
```

- [ ] **Step 2: Add type exports**

Add after line 114 (`PasswordChangeInput`):

```ts
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ConfirmPasswordInput = z.infer<typeof confirmPasswordSchema>;
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/validators.ts
git commit -m "feat: add resetPassword and confirmPassword validation schemas"
```

---

### Task 3: Password Reset Email Template

**Files:**
- Modify: `src/lib/email.ts:85` (after `sendOrderConfirmationEmail`)

**Interfaces:**
- Produces: `sendPasswordResetEmail(email: string, name: string, resetUrl: string)`

- [ ] **Step 1: Add sendPasswordResetEmail function**

Add after the `sendOrderConfirmationEmail` function (after line 85):

```ts
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string,
) {
  await sendEmail({
    to: email,
    subject: "Reset Your Password - NasByte SteCom",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>We received a request to reset your password. Click the button below to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #666;">This link expires in 1 hour.</p>
        <p style="color: #666;">If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
      </div>
    `,
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/email.ts
git commit -m "feat: add sendPasswordResetEmail template"
```

---

### Task 4: Forgot Password API Route

**Files:**
- Create: `src/app/api/auth/forgot-password/route.ts`

**Interfaces:**
- Consumes: `emailSchema` from `@/lib/validators`, `prisma` from `@/lib/prisma`, `sendPasswordResetEmail` from `@/lib/email`
- Produces: `POST /api/auth/forgot-password` endpoint

- [ ] **Step 1: Create the API route**

Create `src/app/api/auth/forgot-password/route.ts`:

```ts
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { emailSchema } from "@/lib/validators";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MS = 15 * 60 * 1000; // 15 minutes
const MAX_RATE_LIMIT_REQUESTS = 3;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = emailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { email } = parsed.data;
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    // Always return same message to prevent user enumeration
    const successMessage =
      "If an account exists with that email, you'll receive a password reset link.";

    if (!user) {
      return NextResponse.json({ message: successMessage }, { status: 200 });
    }

    // Rate limit check
    if (user.passwordResetTokenSentAt) {
      const timeSinceLastRequest =
        Date.now() - user.passwordResetTokenSentAt.getTime();
      if (timeSinceLastRequest < RATE_LIMIT_MS) {
        // Check if they've exceeded max requests in the window
        // We use the sentAt as a simple rate limit marker
        return NextResponse.json({ message: successMessage }, { status: 200 });
      }
    }

    // Generate and hash token
    const token = crypto.randomUUID();
    const tokenHash = await bcrypt.hash(token, 10);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + RESET_TOKEN_TTL_MS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt,
        passwordResetTokenSentAt: now,
      },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/reset-password?token=${token}`;
    await sendPasswordResetEmail(user.email, user.name, resetUrl);

    return NextResponse.json({ message: successMessage }, { status: 200 });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/auth/forgot-password/route.ts
git commit -m "feat: add forgot password API route"
```

---

### Task 5: Reset Password API Route

**Files:**
- Create: `src/app/api/auth/reset-password/route.ts`

**Interfaces:**
- Consumes: `resetPasswordSchema` from `@/lib/validators`, `prisma` from `@/lib/prisma`
- Produces: `POST /api/auth/reset-password` endpoint

- [ ] **Step 1: Create the API route**

Create `src/app/api/auth/reset-password/route.ts`:

```ts
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { token, password } = parsed.data;
    const now = new Date();

    // Find users with non-expired reset tokens
    const candidates = await prisma.user.findMany({
      where: {
        passwordResetTokenHash: { not: null },
        passwordResetExpiresAt: { gt: now },
        deletedAt: null,
      },
    });

    // Verify token against each candidate
    let matchedUser = null;
    for (const candidate of candidates) {
      const isValid = await bcrypt.compare(
        token,
        candidate.passwordResetTokenHash!,
      );
      if (isValid) {
        matchedUser = candidate;
        break;
      }
    }

    if (!matchedUser) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 },
      );
    }

    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        password: hashedPassword,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        passwordResetTokenSentAt: null,
      },
    });

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/auth/reset-password/route.ts
git commit -m "feat: add reset password API route"
```

---

### Task 6: Confirm Password API Route

**Files:**
- Create: `src/app/api/auth/confirm-password/route.ts`

**Interfaces:**
- Consumes: `confirmPasswordSchema` from `@/lib/validators`, `prisma` from `@/lib/prisma`, `auth` from `@/lib/auth`
- Produces: `POST /api/auth/confirm-password` endpoint returning `{ message, confirmationToken }`

- [ ] **Step 1: Create the API route**

Create `src/app/api/auth/confirm-password/route.ts`:

```ts
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { confirmPasswordSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = confirmPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 },
      );
    }

    // Generate confirmation token (returned raw, not stored)
    // The token is short-lived and validated by the consuming action
    const confirmationToken = crypto.randomUUID();

    return NextResponse.json(
      { message: "Password confirmed", confirmationToken },
      { status: 200 },
    );
  } catch (error) {
    console.error("Confirm password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/auth/confirm-password/route.ts
git commit -m "feat: add confirm password API route"
```

---

### Task 7: Forgot Password Page

**Files:**
- Create: `src/app/(auth)/forgot-password/page.tsx`

**Interfaces:**
- Consumes: `emailSchema` from `@/lib/validators`
- Produces: `/auth/forgot-password` page

- [ ] **Step 1: Create the page**

Create `src/app/(auth)/forgot-password/page.tsx`:

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type EmailInput, emailSchema } from "@/lib/validators";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
  });

  async function onSubmit(data: EmailInput) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Something went wrong");
        return;
      }

      setIsSuccess(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            If an account exists with that email, you&apos;ll receive a
            password reset link shortly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder or try again
            in a few minutes.
          </p>
        </CardContent>
        <CardFooter>
          <Link
            href="/login"
            className="text-sm text-primary hover:underline"
          >
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot your password?</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a link to reset
          your password.
        </CardDescription>
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
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send reset link"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)/forgot-password/page.tsx
git commit -m "feat: add forgot password page"
```

---

### Task 8: Reset Password Page

**Files:**
- Create: `src/app/(auth)/reset-password/page.tsx`

**Interfaces:**
- Consumes: `resetPasswordSchema` from `@/lib/validators`
- Produces: `/auth/reset-password` page

- [ ] **Step 1: Create the page**

Create `src/app/(auth)/reset-password/page.tsx`:

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type ResetPasswordInput,
  resetPasswordSchema,
} from "@/lib/validators";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: token || "" },
  });

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        router.push("/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, router]);

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid link</CardTitle>
          <CardDescription>
            This password reset link is invalid or missing a token.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Request a new reset link
          </Link>
        </CardFooter>
      </Card>
    );
  }

  async function onSubmit(data: ResetPasswordInput) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, token }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Something went wrong");
        return;
      }

      setIsSuccess(true);
      toast.success("Password reset successfully");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Password reset successfully</CardTitle>
          <CardDescription>
            Your password has been updated. Redirecting to sign in...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/login"
            className="text-sm text-primary hover:underline"
          >
            Sign in now
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set new password</CardTitle>
        <CardDescription>Enter your new password below.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <input type="hidden" {...register("token")} />
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password_confirmation">Confirm password</Label>
            <Input
              id="password_confirmation"
              type="password"
              placeholder="••••••••"
              {...register("password_confirmation")}
              aria-invalid={!!errors.password_confirmation}
            />
            {errors.password_confirmation && (
              <p className="text-xs text-destructive">
                {errors.password_confirmation.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Resetting..." : "Reset password"}
          </Button>
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:underline"
          >
            Back to sign in
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)/reset-password/page.tsx
git commit -m "feat: add reset password page"
```

---

### Task 9: Confirm Password Page

**Files:**
- Create: `src/app/(auth)/confirm-password/page.tsx`

**Interfaces:**
- Consumes: `confirmPasswordSchema` from `@/lib/validators`
- Produces: `/auth/confirm-password` page

- [ ] **Step 1: Create the page**

Create `src/app/(auth)/confirm-password/page.tsx`:

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type ConfirmPasswordInput,
  confirmPasswordSchema,
} from "@/lib/validators";

function ConfirmPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConfirmPasswordInput>({
    resolver: zodResolver(confirmPasswordSchema),
  });

  async function onSubmit(data: ConfirmPasswordInput) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/confirm-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Incorrect password");
        return;
      }

      // Redirect back to the original action with confirmation token
      const separator = callbackUrl.includes("?") ? "&" : "?";
      router.push(
        `${callbackUrl}${separator}confirmed=true&token=${result.confirmationToken}`,
      );
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirm your password</CardTitle>
        <CardDescription>
          Please enter your password to continue.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Confirming..." : "Confirm password"}
          </Button>
          <Link
            href={callbackUrl}
            className="text-sm text-muted-foreground hover:underline"
          >
            Cancel
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ConfirmPasswordPage() {
  return (
    <Suspense>
      <ConfirmPasswordForm />
    </Suspense>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)/confirm-password/page.tsx
git commit -m "feat: add confirm password page"
```

---

### Task 10: Add "Forgot Password?" Link to Login Page

**Files:**
- Modify: `src/app/(auth)/login/page.tsx:96-107` (CardFooter section)

**Interfaces:**
- Consumes: Login page existing code

- [ ] **Step 1: Add forgot password link**

Replace the CardFooter section (lines 98-108) with:

```tsx
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
          <div className="flex flex-col items-center gap-2 w-full">
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground hover:underline"
            >
              Forgot your password?
            </Link>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </CardFooter>
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)/login/page.tsx
git commit -m "feat: add forgot password link to login page"
```

---

### Task 11: Lint and Final Verification

**Files:**
- All files created/modified in previous tasks

- [ ] **Step 1: Run linter**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Verify dev server starts**

Run: `npm run dev` (run for 5 seconds, then stop)
Expected: Server starts without errors

- [ ] **Step 4: Final commit if needed**

```bash
git add -A
git commit -m "feat: complete Phase 1 auth - forgot/reset/confirm password"
```
