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

    const candidates = await prisma.user.findMany({
      where: {
        passwordResetTokenHash: { not: null },
        passwordResetExpiresAt: { gt: now },
        deletedAt: null,
      },
    });

    let matchedUser = null;
    for (const candidate of candidates) {
      if (!candidate.passwordResetTokenHash) continue;
      const isValid = await bcrypt.compare(
        token,
        candidate.passwordResetTokenHash,
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
