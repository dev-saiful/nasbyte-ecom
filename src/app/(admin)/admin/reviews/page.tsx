import { AdminReviewTable } from "@/components/admin/admin-review-table";

export const metadata = {
  title: "Admin - Reviews",
};

export default function AdminReviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Reviews</h1>
        <p className="text-muted-foreground">Manage product reviews</p>
      </div>
      <AdminReviewTable />
    </div>
  );
}
