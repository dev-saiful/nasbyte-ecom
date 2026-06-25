import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { emailSchema } from "@/lib/validators";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MS = 15 * 60 * 1000; // 15 minutes

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
