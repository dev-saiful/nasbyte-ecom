import { Plus } from "lucide-react";
import Link from "next/link";
import { AdminCategoryTable } from "@/components/admin/admin-category-table";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Admin - Categories",
};

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Categories</h1>
        <Button render={<Link href="/admin/categories/create" />}>
          <Plus className="mr-2 size-4" />
          Add Category
        </Button>
      </div>
      <AdminCategoryTable />
    </div>
  );
}
