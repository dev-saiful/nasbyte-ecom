"use client";

import { ArrowLeft, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBDT } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  sku: string | null;
  stock: number;
  features: string[] | null;
  hasVariants: boolean;
  isFeatured: boolean;
  isActive: boolean;
  averageRating: number;
  reviewCount: number;
  category?: { id: string; name: string; slug: string } | null;
  productImages: { id: string; path: string; sortOrder: number }[];
  productOptions: {
    id: string;
    name: string;
    values: { id: string; value: string }[];
  }[];
  variants: {
    id: string;
    name: string | null;
    sku: string | null;
    price: number;
    stock: number;
    isActive: boolean;
    optionValues: Record<string, string>;
  }[];
}

export default function AdminProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      try {
        const response = await fetch(`/api/admin/products/${params.id}`);
        const data = await response.json();
        setProduct(data.product);
      } catch {
        toast.error("Failed to load product");
        router.push("/admin/products");
      } finally {
        setIsLoading(false);
      }
    }
    loadProduct();
  }, [params.id, router]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            render={<Link href="/admin/products" />}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="font-heading text-2xl font-bold">{product.name}</h1>
        </div>
        <Button render={<Link href={`/admin/products/${product.id}/edit`} />}>
          <Pencil className="mr-2 size-4" />
          Edit
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Category
                  </p>
                  <p>{product.category?.name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    SKU
                  </p>
                  <p>{product.sku ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Price
                  </p>
                  <p className="font-medium">{formatBDT(product.price)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Compare at
                  </p>
                  <p>
                    {product.compareAtPrice
                      ? formatBDT(product.compareAtPrice)
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Stock
                  </p>
                  <p>{product.stock}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Rating
                  </p>
                  <p>
                    {product.averageRating.toFixed(1)} ({product.reviewCount}{" "}
                    reviews)
                  </p>
                </div>
              </div>
              {product.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Description
                  </p>
                  <p className="mt-1 text-sm">{product.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {product.productImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {product.productImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative size-24 overflow-hidden rounded-md bg-muted"
                    >
                      <Image
                        src={img.path}
                        alt=""
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {product.features && product.features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-inside list-disc space-y-1">
                  {product.features.map((f, i) => (
                    <li key={i} className="text-sm">
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Active</span>
                <Badge variant={product.isActive ? "default" : "secondary"}>
                  {product.isActive ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Featured</span>
                <Badge variant={product.isFeatured ? "default" : "secondary"}>
                  {product.isFeatured ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Has Variants</span>
                <Badge variant={product.hasVariants ? "default" : "secondary"}>
                  {product.hasVariants ? "Yes" : "No"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {product.variants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Variants ({product.variants.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.variants.map((v) => (
                  <div key={v.id} className="rounded-md border p-3 text-sm">
                    <div className="font-medium">
                      {v.name || Object.values(v.optionValues).join(" / ")}
                    </div>
                    <div className="text-muted-foreground">
                      {formatBDT(v.price)} · Stock: {v.stock}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
