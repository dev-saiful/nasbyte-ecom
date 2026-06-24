import { AdminUserDetail } from "@/components/admin/admin-user-detail";

export const metadata = {
  title: "Admin - User Details",
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminUserDetail userId={id} />;
}
