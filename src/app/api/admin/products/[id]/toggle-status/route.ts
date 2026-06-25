import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
    });

    return NextResponse.json({
      product: { ...updated, price: Number(updated.price) },
    });
  } catch (error) {
    console.error("Admin product toggle error:", error);
    return NextResponse.json(
      { error: "Failed to toggle status" },
      { status: 500 },
    );
  }
}
