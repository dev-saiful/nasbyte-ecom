import { notFound } from "next/navigation";

import { AdminUserForm } from "@/components/admin/admin-user-form";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Admin - Edit User",
};

export default async function AdminEditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Edit User</h1>
        <p className="text-muted-foreground">Editing &quot;{user.name}&quot;</p>
      </div>
      <AdminUserForm
        initialData={{
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        }}
      />
    </div>
  );
}
