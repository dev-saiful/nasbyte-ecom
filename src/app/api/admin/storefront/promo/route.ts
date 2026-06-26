import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const announcement = await prisma.storefrontAnnouncement.findFirst({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Promo GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch promo" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, isActive } = body;

    const existing = await prisma.storefrontAnnouncement.findFirst({
      orderBy: { createdAt: "desc" },
    });

    const announcement = existing
      ? await prisma.storefrontAnnouncement.update({
          where: { id: existing.id },
          data: { title, isActive },
        })
      : await prisma.storefrontAnnouncement.create({
          data: { title, isActive },
        });

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Promo PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update promo" },
      { status: 500 },
    );
  }
}
