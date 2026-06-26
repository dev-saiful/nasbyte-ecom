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

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      revenueResult,
      totalOrders,
      totalProducts,
      totalUsers,
      pendingReviews,
      lowStockProducts,
      thisMonthRevenue,
      lastMonthRevenue,
      thisMonthOrders,
      lastMonthOrders,
      thisMonthUsers,
      lastMonthUsers,
    ] = await Promise.all([
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
      prisma.review.count({
        where: { isApproved: false },
      }),
      prisma.productVariant.findMany({
        where: { stock: { lt: 10 }, isActive: true },
        select: {
          id: true,
          name: true,
          stock: true,
          sku: true,
          product: { select: { name: true } },
        },
        orderBy: { stock: "asc" },
        take: 10,
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: { not: "CANCELLED" },
          deletedAt: null,
          createdAt: { gte: thisMonth },
        },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: { not: "CANCELLED" },
          deletedAt: null,
          createdAt: { gte: lastMonth, lt: thisMonth },
        },
      }),
      prisma.order.count({
        where: {
          status: { not: "CANCELLED" },
          deletedAt: null,
          createdAt: { gte: thisMonth },
        },
      }),
      prisma.order.count({
        where: {
          status: { not: "CANCELLED" },
          deletedAt: null,
          createdAt: { gte: lastMonth, lt: thisMonth },
        },
      }),
      prisma.user.count({
        where: { deletedAt: null, createdAt: { gte: thisMonth } },
      }),
      prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: { gte: lastMonth, lt: thisMonth },
        },
      }),
    ]);

    const revenue = Number(revenueResult._sum.total ?? 0);
    const thisMonthRev = Number(thisMonthRevenue._sum.total ?? 0);
    const lastMonthRev = Number(lastMonthRevenue._sum.total ?? 0);

    const calcTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // Revenue chart - last 6 months
    const revenueChart = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const result = await prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: { not: "CANCELLED" },
          deletedAt: null,
          createdAt: { gte: date, lt: nextDate },
        },
      });
      revenueChart.push({
        month: date.toLocaleString("default", { month: "short" }),
        revenue: Number(result._sum.total ?? 0),
      });
    }

    // Orders by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ["status"],
      _count: true,
      where: { deletedAt: null },
    });

    // Users growth - last 6 months
    const usersGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = await prisma.user.count({
        where: { deletedAt: null, createdAt: { gte: date, lt: nextDate } },
      });
      usersGrowth.push({
        month: date.toLocaleString("default", { month: "short" }),
        users: count,
      });
    }

    // Category distribution
    const categoryDistribution = await prisma.product.groupBy({
      by: ["categoryId"],
      _count: true,
      where: { deletedAt: null, isActive: true },
    });

    const categories = await prisma.category.findMany({
      where: {
        id: {
          in: categoryDistribution
            .map((c) => c.categoryId)
            .filter(Boolean) as string[],
        },
      },
      select: { id: true, name: true },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
    const categoryData = categoryDistribution
      .filter((c) => c.categoryId)
      .map((c) => ({
        category: categoryMap.get(c.categoryId ?? "") || "Unknown",
        count: c._count,
      }));

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      where: { deletedAt: null },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({
      revenue,
      totalOrders,
      totalProducts,
      totalUsers,
      pendingReviews,
      lowStockProducts: lowStockProducts.length,
      trends: {
        revenue: calcTrend(thisMonthRev, lastMonthRev),
        orders: calcTrend(thisMonthOrders, lastMonthOrders),
        products: 0,
        users: calcTrend(thisMonthUsers, lastMonthUsers),
      },
      revenueChart,
      ordersByStatus: ordersByStatus.map((o) => ({
        status: o.status,
        count: o._count,
      })),
      usersGrowth,
      categoryDistribution: categoryData,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.user?.name || "Guest",
        total: Number(o.total),
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      })),
      lowStockAlerts: lowStockProducts.map((v) => ({
        id: v.id,
        name: v.product.name,
        variantName: v.name,
        stock: v.stock,
        sku: v.sku,
      })),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 },
    );
  }
}
