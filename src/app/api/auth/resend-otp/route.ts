import { NextResponse } from "next/server";
import { sendOtpEmail } from "@/lib/email";
import { generateOtp, hashOtp, isOtpRateLimited, OTP_TTL_MS } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { emailSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = emailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email, deletedAt: null },
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
