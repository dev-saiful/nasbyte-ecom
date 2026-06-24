import { AdminOrderTable } from "@/components/admin/admin-order-table";

export const metadata = {
  title: "Admin - Orders",
};

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Manage customer orders</p>
      </div>
      <AdminOrderTable />
    </div>
  );
}
