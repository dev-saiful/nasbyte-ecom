import { AdminCategoryForm } from "@/components/admin/admin-category-form";

export const metadata = {
  title: "Admin - Create Category",
};

export default function AdminCreateCategoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Create Category</h1>
        <p className="text-muted-foreground">Add a new product category</p>
      </div>
      <AdminCategoryForm />
    </div>
  );
}
