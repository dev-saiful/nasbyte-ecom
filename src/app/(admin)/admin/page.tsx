import {
  AlertTriangle,
  DollarSign,
  Package,
  ShoppingCart,
  Star,
  Users,
} from "lucide-react";
import { AdminDashboardCharts } from "@/components/admin/admin-dashboard-charts";
import { AdminKpiCard } from "@/components/admin/admin-kpi-card";
import { AdminLowStockAlerts } from "@/components/admin/admin-low-stock-alerts";
import { AdminRecentOrders } from "@/components/admin/admin-recent-orders";
import { formatBDT } from "@/lib/utils";

async function getDashboardStats() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/admin/dashboard`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch dashboard stats");
  }
  return res.json();
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKpiCard
          title="Total Revenue"
          value={formatBDT(stats.revenue)}
          icon={DollarSign}
          description="From completed orders"
          trend={stats.trends?.revenue}
        />
        <AdminKpiCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          icon={ShoppingCart}
          description="Non-cancelled orders"
          trend={stats.trends?.orders}
        />
        <AdminKpiCard
          title="Total Products"
          value={stats.totalProducts.toLocaleString()}
          icon={Package}
          description="Active products"
          trend={stats.trends?.products}
        />
        <AdminKpiCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          description="Registered users"
          trend={stats.trends?.users}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <AdminKpiCard
          title="Pending Reviews"
          value={stats.pendingReviews.toLocaleString()}
          icon={Star}
          description="Awaiting moderation"
        />
        <AdminKpiCard
          title="Low Stock"
          value={stats.lowStockProducts.toLocaleString()}
          icon={AlertTriangle}
          description="Products with stock < 10"
        />
      </div>

      <AdminDashboardCharts
        data={{
          revenueChart: stats.revenueChart,
          ordersByStatus: stats.ordersByStatus,
          usersGrowth: stats.usersGrowth,
          categoryDistribution: stats.categoryDistribution,
        }}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminRecentOrders orders={stats.recentOrders} />
        <AdminLowStockAlerts items={stats.lowStockAlerts} />
      </div>
    </div>
  );
}
