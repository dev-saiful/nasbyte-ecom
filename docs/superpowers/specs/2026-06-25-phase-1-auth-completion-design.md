# Phase 1 Auth Completion Design

## Overview

Complete the missing authentication features from Phase 1: Forgot Password, Reset Password, and Confirm Password. These follow existing codebase patterns (Zod validation, API route structure, client-side forms with react-hook-form + sonner toasts).

## Scope

**In scope:**
- Forgot Password flow (email → reset link → new password)
- Reset Password page + API
- Confirm Password page + API (for sensitive actions)
- DB migration for password reset fields
- Email template for reset link

**Out of scope:**
- 2FA/TOTP functionality (not needed per user decision)
- Changes to `src/proxy.ts` middleware (left as-is per user decision)

---

## 1. Forgot Password

### Flow
1. User visits `/auth/forgot-password`
2. Enters email address
3. API finds user (does not reveal existence), generates secure token, stores hash + expiry
4. Sends reset link email: `{APP_URL}/auth/reset-password?token={rawToken}`
5. Page shows "If an account exists, you'll receive a reset link"

### DB Changes
Add to `User` model via migration:
- `passwordResetTokenHash` String?
- `passwordResetExpiresAt` DateTime?
- `passwordResetTokenSentAt` DateTime? (for rate limiting)

### API: `POST /api/auth/forgot-password`
- Validate `{ email }` with `emailSchema`
- Find user by email (skip if not found or deleted)
- Generate token: `crypto.randomUUID()`
- Hash token: `bcrypt.hash(token, 10)`
- Store hash + `expiresAt` (1 hour TTL) + `sentAt` in DB
- Send reset link email via `sendPasswordResetEmail()`
- Rate limit: max 3 requests per 15 minutes per email (check `passwordResetTokenSentAt`)
- Always return same success message (prevent user enumeration)

### Page
- Email input form using `useForm` + `zodResolver(emailSchema)`
- Success state: shows card with "If an account exists, you'll receive a reset link" message
- Link back to login

---

## 2. Reset Password

### Flow
1. User clicks reset link from email → lands on `/auth/reset-password?token={token}`
2. Enters new password + confirmation
3. API validates token, checks expiry, updates password
4. Redirects to login with success message

### API: `POST /api/auth/reset-password`
- Validate `{ token, password, password_confirmation }` with `resetPasswordSchema`
- Find all users with non-expired `passwordResetTokenHash` (check `passwordResetExpiresAt > now`)
- For each candidate, verify token with `bcrypt.compare(token, hash)`
- On match: hash new password with `bcrypt.hash(password, 12)`, update user, clear reset fields
- On no match or expired: return generic error "Invalid or expired reset link"
- Return `{ message: "Password reset successfully" }`

### Page
- Reads `token` from URL search params
- If no token: shows error state with link to forgot-password
- Password + confirmation form using `useForm` + `zodResolver(resetPasswordSchema)`
- On success: shows success card → auto-redirect to `/login` after 3 seconds
- Error state: shows error message with link to forgot-password

### Validation Schema: `resetPasswordSchema`
```ts
z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  password_confirmation: z.string(),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords do not match",
  path: ["password_confirmation"],
})
```

---

## 3. Confirm Password

### Flow
1. Before sensitive actions (change email, disable 2FA, delete account), redirect to `/auth/confirm-password?callbackUrl={action-url}`
2. User enters password
3. API verifies password, returns confirmation token
4. Client stores token, redirects back to original action with token

### API: `POST /api/auth/confirm-password`
- Require authentication (check NextAuth session)
- Validate `{ password }` with `confirmPasswordSchema`
- Find user by session ID
- Verify password: `bcrypt.compare(password, user.password)`
- On success: generate confirmation token (`crypto.randomUUID()`), store hash with 5-min expiry
- Return `{ message: "Password confirmed", confirmationToken: "..." }`
- On failure: return 401 "Incorrect password"

### Page
- Reads `callbackUrl` from URL search params (defaults to `/account`)
- Password input form
- On success: redirects to `callbackUrl` with `confirmed=true` search param
- Shows cancel link back to callbackUrl

### Validation Schema: `confirmPasswordSchema`
```ts
z.object({
  password: z.string().min(1, "Password is required"),
})
```

---

## 4. Database Migration

New fields on `User` model:
```prisma
passwordResetTokenHash   String?
passwordResetExpiresAt   DateTime?
passwordResetTokenSentAt DateTime?
```

Migration name: `add_password_reset_fields`

---

## 5. Email Template

### `sendPasswordResetEmail(email, name, resetUrl)`
- Subject: "Reset your password"
- HTML template matching existing `sendOtpEmail` style
- Contains reset link button + expiry notice (1 hour)
- Fallback: plain text reset link

---

## 6. Files to Create/Modify

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add 3 password reset fields to User |
| `prisma/migrations/...` | New migration |
| `src/lib/validators.ts` | Add `resetPasswordSchema`, `confirmPasswordSchema` |
| `src/lib/email.ts` | Add `sendPasswordResetEmail()` |
| `src/app/api/auth/forgot-password/route.ts` | New |
| `src/app/api/auth/reset-password/route.ts` | New |
| `src/app/api/auth/confirm-password/route.ts` | New |
| `src/app/(auth)/forgot-password/page.tsx` | New |
| `src/app/(auth)/reset-password/page.tsx` | New |
| `src/app/(auth)/confirm-password/page.tsx` | New |

---

## 7. Patterns to Follow

### API Route Pattern
- Export `async function POST(request: Request)`
- Parse body, validate with Zod, return 400 on failure
- try/catch with `console.error` and 500 response
- Response format: `{ message: "..." }` or `{ error: "..." }`

### Page Pattern
- `"use client"` directive
- `useForm<SchemaType>({ resolver: zodResolver(schema) })`
- `useState` for loading/success/error states
- `fetch("/api/...")` with JSON body
- `toast.success/error` from sonner
- Card > CardHeader > CardContent layout

### Validation Pattern
- Passwords: min 8, max 128, with `.refine()` for confirmation match
- Email: standard `z.string().email()`
- All schemas exported with `z.infer<typeof schema>` type
