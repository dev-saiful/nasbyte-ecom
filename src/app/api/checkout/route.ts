import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { SHIPPING_COST } from "@/lib/price";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import { checkoutSchema } from "@/lib/validators";

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
    const data = checkoutSchema.parse(body);

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: true,
        variant: {
          include: {
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

    if (cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const order = await prisma.$transaction(async (tx) => {
      for (const item of cartItems) {
        const stock = item.variant?.stock ?? item.product.stock;
        if (item.quantity > stock) {
          throw new Error(`Insufficient stock for ${item.product.name}`);
        }
      }

      let orderNumber = generateOrderNumber();
      let attempts = 0;
      while (attempts < 3) {
        const existing = await tx.order.findUnique({
          where: { orderNumber },
        });
        if (!existing) break;
        orderNumber = generateOrderNumber();
        attempts++;
      }

      const subtotal = cartItems.reduce(
        (sum, item) =>
          sum + Number(item.variant?.price ?? item.price) * item.quantity,
        0,
      );
      const total = subtotal + SHIPPING_COST;

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          subtotal,
          shippingCost: SHIPPING_COST,
          total,
          shippingAddress: data.shippingAddress,
          shippingCity: data.shippingCity,
          shippingPostalCode: data.shippingPostalCode,
          shippingPhone: data.shippingPhone,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          userId: session.user.id,
          items: {
            create: cartItems.map((item) => ({
              productName: item.product.name,
              productImage: item.product.productImages[0]?.path ?? null,
              variantDetails: item.variant
                ? Object.fromEntries(
                    item.variant.variantOptions.map((vo) => [
                      vo.optionValue.option.name,
                      vo.optionValue.value,
                    ]),
                  )
                : null,
              price: item.variant?.price ?? item.price,
              quantity: item.quantity,
              total: Number(item.variant?.price ?? item.price) * item.quantity,
              productId: item.productId,
              variantId: item.variantId,
            })),
          },
        },
      });

      for (const item of cartItems) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }

        const oldStock = item.variant?.stock ?? item.product.stock;
        await tx.inventoryStockLog.create({
          data: {
            productId: item.productId,
            userId: session.user.id,
            oldStock,
            newStock: oldStock - item.quantity,
            delta: -item.quantity,
          },
        });
      }

      await tx.cartItem.deleteMany({
        where: { userId: session.user.id },
      });

      return newOrder;
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to process checkout" },
      { status: 500 },
    );
  }
}
