import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.user.findUnique({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newVerifiedStatus = !existing.isVerified;

    const user = await prisma.user.update({
      where: { id },
      data: {
        isVerified: newVerifiedStatus,
        emailVerifiedAt: newVerifiedStatus ? new Date() : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Admin user verify PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to toggle verification" },
      { status: 500 },
    );
  }
}
