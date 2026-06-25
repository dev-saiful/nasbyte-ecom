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
        variant: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                productImages: {
                  select: { path: true },
                  take: 1,
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
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
      variantId: item.variantId,
      name: item.variant.product.name,
      slug: item.variant.product.slug,
      price: Number(item.variant.price),
      image: item.variant.product.productImages[0]?.path ?? null,
      quantity: item.quantity,
      stock: item.variant.stock,
      variantDetails: Object.fromEntries(
        item.variant.variantOptions.map((vo) => [
          vo.optionValue.option.name,
          vo.optionValue.value,
        ]),
      ),
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
