import { prisma } from "@/lib/prisma";

export interface DashboardStats {
  revenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  pendingReviews: number;
  lowStockProducts: number;
  trends: {
    revenue: number;
    orders: number;
    products: number;
    users: number;
  };
  revenueChart: { month: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  usersGrowth: { month: string; users: number }[];
  categoryDistribution: { category: string; count: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
  lowStockAlerts: {
    id: string;
    name: string;
    variantName: string;
    stock: number;
    sku: string;
  }[];
}

const calcTrend = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const monthRange = Array.from({ length: 6 }, (_, i) => ({
    date: new Date(now.getFullYear(), now.getMonth() - (5 - i), 1),
    next: new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1),
  }));

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
    revenueChartRaw,
    ordersByStatus,
    usersGrowthRaw,
    categoryDistribution,
    recentOrders,
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { not: "CANCELLED" }, deletedAt: null },
    }),
    prisma.order.count({
      where: { status: { not: "CANCELLED" }, deletedAt: null },
    }),
    prisma.product.count({ where: { isActive: true, deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.review.count({ where: { isApproved: false } }),
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
      where: { deletedAt: null, createdAt: { gte: lastMonth, lt: thisMonth } },
    }),
    // Revenue chart - last 6 months (all in parallel)
    Promise.all(
      monthRange.map(({ date, next }) =>
        prisma.order.aggregate({
          _sum: { total: true },
          where: {
            status: { not: "CANCELLED" },
            deletedAt: null,
            createdAt: { gte: date, lt: next },
          },
        }),
      ),
    ),
    prisma.order.groupBy({
      by: ["status"],
      _count: true,
      where: { deletedAt: null },
    }),
    // Users growth - last 6 months (all in parallel)
    Promise.all(
      monthRange.map(({ date, next }) =>
        prisma.user.count({
          where: { deletedAt: null, createdAt: { gte: date, lt: next } },
        }),
      ),
    ),
    prisma.product.groupBy({
      by: ["categoryId"],
      _count: true,
      where: { deletedAt: null, isActive: true },
    }),
    prisma.order.findMany({
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
    }),
  ]);

  const revenue = Number(revenueResult._sum.total ?? 0);
  const thisMonthRev = Number(thisMonthRevenue._sum.total ?? 0);
  const lastMonthRev = Number(lastMonthRevenue._sum.total ?? 0);

  const revenueChart = monthRange.map(({ date }, i) => ({
    month: date.toLocaleString("default", { month: "short" }),
    revenue: Number(revenueChartRaw[i]._sum.total ?? 0),
  }));

  const usersGrowth = monthRange.map(({ date }, i) => ({
    month: date.toLocaleString("default", { month: "short" }),
    users: usersGrowthRaw[i],
  }));

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

  return {
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
      variantName: v.name ?? "",
      stock: v.stock,
      sku: v.sku ?? "",
    })),
  };
}
