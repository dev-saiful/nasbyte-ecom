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
  code: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "Must be 6 digits"),
});

export const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const verifyEmailSchema = z.object({
  code: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "Must be 6 digits"),
  email: z.string().email("Invalid email address"),
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
  country: z.string().optional(),
  isDefault: z.boolean().optional(),
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
export type EmailInput = z.infer<typeof emailSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;

export const cartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1),
});

export const productFiltersSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(["newest", "price-asc", "price-desc", "popularity"]).optional(),
  page: z.number().int().min(1).optional(),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;
export type ProductFiltersInput = z.infer<typeof productFiltersSchema>;

// ─── PRODUCT VARIANT ──────────────────────────────────────

export const productOptionSchema = z.object({
  name: z.string().min(1).max(100),
  values: z.array(z.string().min(1).max(100)).min(1),
});

export const productVariantSchema = z.object({
  name: z.string().max(255).optional(),
  sku: z.string().max(100).optional(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  stock: z.number().int().min(0),
  isActive: z.boolean().optional(),
  optionValues: z.record(z.string(), z.string()).optional(),
});

export const adminProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  sku: z.string().max(100).optional(),
  stock: z.number().int().min(0),
  categoryId: z.string().uuid().optional().nullable(),
  hasVariants: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  features: z.array(z.string()).optional(),
  options: z.array(productOptionSchema).optional(),
  variants: z.array(productVariantSchema).optional(),
});

export type ProductOptionInput = z.infer<typeof productOptionSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type AdminProductInput = z.infer<typeof adminProductSchema>;
