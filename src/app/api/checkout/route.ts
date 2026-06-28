import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { SHIPPING_COST } from "@/lib/price";
import { prisma } from "@/lib/prisma";
import { sendTelegramNotification } from "@/lib/telegram";
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
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = parsed.data;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        variant: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                productImages: {
                  select: { path: true },
                  orderBy: { sortOrder: "asc" as const },
                  take: 1,
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

    if (cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const order = await prisma.$transaction(async (tx) => {
      const variantIds = [...new Set(cartItems.map((i) => i.variantId))];

      const lockedVariants = await tx.$queryRaw<
        { id: string; stock: number }[]
      >`
        SELECT id, stock FROM product_variants WHERE id = ANY(${variantIds}::uuid[]) FOR UPDATE
      `;

      const variantStockMap = new Map(
        lockedVariants.map((v) => [v.id, v.stock]),
      );

      for (const item of cartItems) {
        const stock = variantStockMap.get(item.variantId) ?? 0;
        if (item.quantity > stock) {
          throw new Error(
            `Insufficient stock for ${item.variant.product.name}`,
          );
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
        (sum, item) => sum + Number(item.variant.price) * item.quantity,
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
              productName: item.variant.product.name,
              productImage: item.variant.product.productImages[0]?.path ?? null,
              variantDetails: Object.fromEntries(
                item.variant.variantOptions.map((vo) => [
                  vo.optionValue.option.name,
                  vo.optionValue.value,
                ]),
              ),
              price: Number(item.variant.price),
              quantity: item.quantity,
              total: Number(item.variant.price) * item.quantity,
              productId: item.variant.product.id,
              variantId: item.variantId,
            })),
          },
        },
      });

      for (const item of cartItems) {
        const oldStock = variantStockMap.get(item.variantId) ?? 0;

        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });

        await tx.inventoryStockLog.create({
          data: {
            productId: item.variant.product.id,
            variantId: item.variantId,
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

    const [user, orderWithItems] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true },
      }),
      prisma.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      }),
    ]);

    if (user && orderWithItems) {
      await sendOrderConfirmationEmail(
        user.email,
        user.name,
        orderWithItems.orderNumber,
        Number(orderWithItems.total),
      ).catch((err) =>
        console.error("Failed to send order confirmation email:", err),
      );

      await sendTelegramNotification({
        orderNumber: orderWithItems.orderNumber,
        customerName: user.name,
        customerPhone: orderWithItems.shippingPhone,
        items: orderWithItems.items.map((item) => ({
          name: item.productName,
          quantity: item.quantity,
          price: Number(item.price),
        })),
        total: Number(orderWithItems.total),
        shippingAddress: `${orderWithItems.shippingAddress}, ${orderWithItems.shippingCity}`,
      }).catch((err) =>
        console.error("Failed to send Telegram notification:", err),
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.flatten() },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to process checkout" },
      { status: 500 },
    );
  }
}
