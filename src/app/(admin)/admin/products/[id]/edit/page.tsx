"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminProductForm } from "@/components/admin/admin-product-form";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminProductInput } from "@/lib/validators";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      try {
        const response = await fetch(`/api/admin/products/${params.id}`);
        const data = await response.json();
        setInitialData(data.product);
      } catch {
        toast.error("Failed to load product");
        router.push("/admin/products");
      } finally {
        setIsLoadingProduct(false);
      }
    }
    loadProduct();
  }, [params.id, router]);

  const onSubmit = async (data: AdminProductInput) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to update product");
      }

      toast.success("Product updated");
      router.push("/admin/products");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update product",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Edit Product</h1>
      <AdminProductForm
        onSubmit={onSubmit}
        isLoading={isLoading}
        initialData={initialData}
      />
    </div>
  );
}
