import { Suspense } from "react";

import { ProductFilters } from "@/components/products/product-filters";
import { ProductList } from "@/components/products/product-list";
import { ProductPagination } from "@/components/products/product-pagination";
import { ProductSearch } from "@/components/products/product-search";
import { ProductSort } from "@/components/products/product-sort";
import { prisma } from "@/lib/prisma";

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = 12;
  const skip = (page - 1) * limit;

  const where = {
    isActive: true,
    deletedAt: null,
    ...(params.category && {
      category: { slug: params.category },
    }),
    ...(params.search && {
      name: { contains: params.search, mode: "insensitive" as const },
    }),
  };

  const orderBy = (() => {
    switch (params.sort) {
      case "price-asc":
        return { minPrice: "asc" as const };
      case "price-desc":
        return { minPrice: "desc" as const };
      case "popularity":
        return { reviewCount: "desc" as const };
      default:
        return { createdAt: "desc" as const };
    }
  })();

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true, slug: true } },
        productImages: {
          select: { path: true, sortOrder: true },
          orderBy: { sortOrder: "asc" },
          take: 1,
        },
        variants: {
          where: { isDefault: true },
          select: { price: true, compareAtPrice: true },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      where: { deletedAt: null },
      select: { name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="w-64 shrink-0">
          <Suspense fallback={<div>Loading filters...</div>}>
            <ProductFilters categories={categories} />
          </Suspense>
        </aside>
        <main className="flex-1">
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-2xl font-bold">
              {params.category
                ? `${params.category.charAt(0).toUpperCase() + params.category.slice(1)} Products`
                : "All Products"}
            </h1>
            <ProductSort />
          </div>
          <div className="mt-2">
            <ProductSearch />
          </div>
          <div className="mt-6">
            <ProductList
              products={products.map((p) => ({
                ...p,
                price: Number(p.variants[0]?.price ?? p.minPrice ?? 0),
                compareAtPrice: p.variants[0]?.compareAtPrice
                  ? Number(p.variants[0].compareAtPrice)
                  : null,
                averageRating: Number(p.averageRating),
              }))}
            />
          </div>
          <div className="mt-8">
            <ProductPagination currentPage={page} totalPages={totalPages} />
          </div>
        </main>
      </div>
    </div>
  );
}
