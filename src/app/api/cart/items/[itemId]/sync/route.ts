import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface SyncItem {
  productId: string;
  variantId?: string | null;
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
      const product = await prisma.product.findUnique({
        where: { id: item.productId, deletedAt: null },
      });

      if (!product) continue;

      const existingItem = await prisma.cartItem.findFirst({
        where: {
          userId: session.user.id,
          productId: item.productId,
          variantId: item.variantId ?? null,
        },
      });

      if (existingItem) {
        const newQuantity = Math.min(
          existingItem.quantity + item.quantity,
          product.stock,
        );
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
        });
      } else {
        const quantity = Math.min(item.quantity, product.stock);
        if (quantity > 0) {
          await prisma.cartItem.create({
            data: {
              userId: session.user.id,
              productId: item.productId,
              variantId: item.variantId ?? null,
              quantity,
              price: product.price,
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
