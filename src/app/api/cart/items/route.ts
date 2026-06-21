import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cartItemSchema } from "@/lib/validators";

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
    const data = cartItemSchema.parse(body);

    const product = await prisma.product.findUnique({
      where: { id: data.productId, deletedAt: null },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.stock < data.quantity) {
      return NextResponse.json(
        { error: "Insufficient stock" },
        { status: 400 },
      );
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId: session.user.id,
        productId: data.productId,
        variantId: data.variantId ?? null,
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + data.quantity;
      if (newQuantity > product.stock) {
        return NextResponse.json(
          { error: "Insufficient stock" },
          { status: 400 },
        );
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          userId: session.user.id,
          productId: data.productId,
          variantId: data.variantId ?? null,
          quantity: data.quantity,
          price: product.price,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart POST error:", error);
    return NextResponse.json(
      { error: "Failed to add item to cart" },
      { status: 500 },
    );
  }
}
