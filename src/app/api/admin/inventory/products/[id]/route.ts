import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const adjustStockSchema = z.object({
  stock: z.number().int().min(0),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = adjustStockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await prisma.product.findUnique({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const oldStock = existing.stock;
    const newStock = parsed.data.stock;
    const delta = newStock - oldStock;

    if (delta === 0) {
      return NextResponse.json({ product: existing, log: null });
    }

    const [product, log] = await prisma.$transaction([
      prisma.product.update({
        where: { id },
        data: { stock: newStock },
      }),
      prisma.inventoryStockLog.create({
        data: {
          oldStock,
          newStock,
          delta,
          productId: id,
          userId: (session.user as any).id,
        },
      }),
    ]);

    return NextResponse.json({ product, log });
  } catch (error) {
    console.error("Admin inventory PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to adjust stock" },
      { status: 500 },
    );
  }
}
