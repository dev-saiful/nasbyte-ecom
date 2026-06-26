import { AdminPromoForm } from "@/components/admin/admin-promo-form";

async function getPromo() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/admin/storefront/promo`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function AdminPromoPage() {
  const promo = await getPromo();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        Storefront Promo Banner
      </h1>
      <AdminPromoForm promo={promo} />
    </div>
  );
}
