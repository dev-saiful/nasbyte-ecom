import { AdminUserForm } from "@/components/admin/admin-user-form";

export const metadata = {
  title: "Admin - Create User",
};

export default function AdminCreateUserPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Create User</h1>
        <p className="text-muted-foreground">Add a new user account</p>
      </div>
      <AdminUserForm />
    </div>
  );
}
