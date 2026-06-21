import { NextResponse } from "next/server";
import { isMaxAttemptsReached, isOtpExpired, verifyOtp } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { verifyEmailSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifyEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const { code, email } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email, deletedAt: null },
    });

    if (
      !user ||
      !user.emailVerificationOtpHash ||
      !user.emailVerificationOtpSentAt
    ) {
      return NextResponse.json(
        { error: "No pending verification found" },
        { status: 400 },
      );
    }

    if (
      user.emailVerificationOtpExpiresAt &&
      isOtpExpired(
        user.emailVerificationOtpSentAt,
        user.emailVerificationOtpExpiresAt,
      )
    ) {
      return NextResponse.json(
        { error: "Verification code expired. Please request a new one." },
        { status: 400 },
      );
    }

    if (isMaxAttemptsReached(user.emailVerificationOtpAttempts)) {
      return NextResponse.json(
        { error: "Too many attempts. Please request a new code." },
        { status: 429 },
      );
    }

    const result = await verifyOtp(code, user.emailVerificationOtpHash);

    if (!result.valid) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerificationOtpAttempts: { increment: 1 } },
      });

      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
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
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
