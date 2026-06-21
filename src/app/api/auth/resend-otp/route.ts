import { NextResponse } from "next/server";
import { sendOtpEmail } from "@/lib/email";
import { generateOtp, hashOtp, isOtpRateLimited, OTP_TTL_MS } from "@/lib/otp";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationOtpHash: { not: null },
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No pending verification found" },
        { status: 400 },
      );
    }

    if (
      user.emailVerificationOtpSentAt &&
      isOtpRateLimited(user.emailVerificationOtpSentAt)
    ) {
      return NextResponse.json(
        { error: "Please wait before requesting a new code" },
        { status: 429 },
      );
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const now = new Date();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationOtpHash: otpHash,
        emailVerificationOtpSentAt: now,
        emailVerificationOtpExpiresAt: new Date(now.getTime() + OTP_TTL_MS),
        emailVerificationOtpAttempts: 0,
      },
    });

    await sendOtpEmail(user.email, otp, user.name);

    return NextResponse.json({ message: "New verification code sent" });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
