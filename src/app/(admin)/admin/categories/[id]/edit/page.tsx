import { notFound } from "next/navigation";
import { AdminCategoryForm } from "@/components/admin/admin-category-form";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Admin - Edit Category",
};

export default async function AdminEditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const category = await prisma.category.findUnique({
    where: { id, deletedAt: null },
  });

  if (!category) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Edit Category</h1>
        <p className="text-muted-foreground">
          Editing &quot;{category.name}&quot;
        </p>
      </div>
      <AdminCategoryForm
        initialData={{
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          imagePath: category.imagePath,
          isActive: category.isActive,
        }}
      />
    </div>
  );
}
