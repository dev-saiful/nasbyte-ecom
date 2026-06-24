import { Package, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminInventoryTable } from "@/components/admin/admin-inventory-table";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Admin - Inventory",
};

async function getStats() {
  const baseWhere = { isActive: true, deletedAt: null };

  const [totalProducts, lowStock, outOfStock] = await Promise.all([
    prisma.product.count({ where: baseWhere }),
    prisma.product.count({
      where: { ...baseWhere, stock: { gt: 0, lte: 10 } },
    }),
    prisma.product.count({
      where: { ...baseWhere, stock: 0 },
    }),
  ]);

  return { totalProducts, lowStock, outOfStock };
}

export default async function AdminInventoryPage() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Inventory</h1>
        <p className="text-muted-foreground">Manage product stock levels</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
            <Package className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStock}</div>
            <p className="text-muted-foreground text-xs">Stock ≤ 10</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <XCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.outOfStock}</div>
          </CardContent>
        </Card>
      </div>

      <AdminInventoryTable />
    </div>
  );
}
