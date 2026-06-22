import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("orderNumber");

    if (!orderNumber) {
      return NextResponse.json(
        { error: "Order number is required" },
        { status: 400 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber, deletedAt: null },
      include: {
        items: {
          select: {
            id: true,
            productName: true,
            productImage: true,
            price: true,
            quantity: true,
            total: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      total: Number(order.total),
      shippingAddress: order.shippingAddress,
      shippingCity: order.shippingCity,
      shippingPostalCode: order.shippingPostalCode,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
        total: Number(item.total),
      })),
    });
  } catch (error) {
    console.error("Track order error:", error);
    return NextResponse.json(
      { error: "Failed to track order" },
      { status: 500 },
    );
  }
}
