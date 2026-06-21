import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { sendOtpEmail } from "@/lib/email";
import { generateOtp, hashOtp, OTP_TTL_MS } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const now = new Date();

    await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        emailVerificationOtpHash: otpHash,
        emailVerificationOtpSentAt: now,
        emailVerificationOtpExpiresAt: new Date(now.getTime() + OTP_TTL_MS),
      },
    });

    await sendOtpEmail(email, otp, name);

    return NextResponse.json(
      {
        message:
          "Account created. Please check your email for verification code.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
