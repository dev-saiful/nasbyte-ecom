import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface SyncItem {
  variantId: string;
  quantity: number;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { items } = body as { items: SyncItem[] };

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Invalid items format" },
        { status: 400 },
      );
    }

    for (const item of items) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: { select: { deletedAt: true } } },
      });

      if (!variant || variant.product.deletedAt) continue;

      const existingItem = await prisma.cartItem.findFirst({
        where: {
          userId: session.user.id,
          variantId: item.variantId,
        },
      });

      if (existingItem) {
        const newQuantity = Math.min(
          existingItem.quantity + item.quantity,
          variant.stock,
        );
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
        });
      } else {
        const quantity = Math.min(item.quantity, variant.stock);
        if (quantity > 0) {
          await prisma.cartItem.create({
            data: {
              userId: session.user.id,
              variantId: item.variantId,
              quantity,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart sync error:", error);
    return NextResponse.json({ error: "Failed to sync cart" }, { status: 500 });
  }
}
