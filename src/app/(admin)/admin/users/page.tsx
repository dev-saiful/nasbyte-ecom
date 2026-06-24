import { AdminUserTable } from "@/components/admin/admin-user-table";

export const metadata = {
  title: "Admin - Users",
};

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage user accounts</p>
      </div>
      <AdminUserTable />
    </div>
  );
}
