import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [revenueResult, totalOrders, totalProducts, totalUsers] =
      await Promise.all([
        prisma.order.aggregate({
          _sum: { total: true },
          where: { status: { not: "CANCELLED" }, deletedAt: null },
        }),
        prisma.order.count({
          where: { status: { not: "CANCELLED" }, deletedAt: null },
        }),
        prisma.product.count({
          where: { isActive: true, deletedAt: null },
        }),
        prisma.user.count({
          where: { deletedAt: null },
        }),
      ]);

    const revenue = Number(revenueResult._sum.total ?? 0);

    return NextResponse.json({
      revenue,
      totalOrders,
      totalProducts,
      totalUsers,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 },
    );
  }
}
