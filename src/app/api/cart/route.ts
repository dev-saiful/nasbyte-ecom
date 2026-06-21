import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ items: [] });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            stock: true,
            productImages: {
              select: { path: true },
              take: 1,
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        variant: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            variantOptions: {
              include: {
                optionValue: {
                  include: { option: true },
                },
              },
            },
          },
        },
      },
    });

    const items = cartItems.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      name: item.product.name,
      slug: item.product.slug,
      price: Number(item.variant?.price ?? item.price),
      image: item.product.productImages[0]?.path ?? null,
      quantity: item.quantity,
      stock: item.variant?.stock ?? item.product.stock,
      variantDetails: item.variant
        ? Object.fromEntries(
            item.variant.variantOptions.map((vo) => [
              vo.optionValue.option.name,
              vo.optionValue.value,
            ]),
          )
        : null,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Cart GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 },
    );
  }
}
