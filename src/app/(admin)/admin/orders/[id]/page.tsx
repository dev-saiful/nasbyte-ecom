import { AdminOrderDetail } from "@/components/admin/admin-order-detail";

export const metadata = {
  title: "Admin - Order Details",
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminOrderDetail orderId={id} />;
}
