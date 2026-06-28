import { notFound } from "next/navigation";
import { ProductFeatures } from "@/components/products/product-features";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductInfo } from "@/components/products/product-info";
import { ProductPurchase } from "@/components/products/product-purchase";
import { ProductRelated } from "@/components/products/product-related";
import { ProductReviews } from "@/components/products/product-reviews";
import { ProductStock } from "@/components/products/product-stock";
import { prisma } from "@/lib/prisma";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug, deletedAt: null },
    include: {
      category: { select: { name: true, slug: true } },
      productImages: {
        select: { path: true, sortOrder: true },
        orderBy: { sortOrder: "asc" },
      },
      variants: {
        where: { isActive: true, deletedAt: null },
        include: {
          variantOptions: {
            include: {
              optionValue: {
                include: { option: true },
              },
            },
          },
        },
      },
      reviews: {
        where: { isApproved: true },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!product) {
    notFound();
  }

  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      isActive: true,
      deletedAt: null,
    },
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
    take: 4,
  });

  const defaultVariant =
    product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const stock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const price = Number(defaultVariant?.price ?? product.minPrice ?? 0);
  const compareAtPrice = defaultVariant?.compareAtPrice
    ? Number(defaultVariant.compareAtPrice)
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery
          images={product.productImages}
          productName={product.name}
        />

        <div className="space-y-6">
          <ProductInfo
            name={product.name}
            category={product.category}
            price={price}
            compareAtPrice={compareAtPrice}
            averageRating={Number(product.averageRating)}
            reviewCount={product.reviewCount}
            description={product.description}
          />

          <ProductStock stock={stock} />

          <ProductPurchase
            variantId={defaultVariant?.id ?? ""}
            name={product.name}
            slug={product.slug}
            price={price}
            image={product.productImages[0]?.path}
            stock={stock}
            variants={
              product.hasVariants
                ? product.variants.map((v) => ({
                    ...v,
                    price: Number(v.price),
                  }))
                : undefined
            }
          />

          {product.features && (
            <ProductFeatures features={product.features as string[]} />
          )}
        </div>
      </div>

      <div className="mt-16">
        <ProductReviews
          reviews={product.reviews.map((r) => ({
            ...r,
            createdAt: r.createdAt,
          }))}
          averageRating={Number(product.averageRating)}
          reviewCount={product.reviewCount}
        />
      </div>

      <div className="mt-16">
        <ProductRelated
          products={relatedProducts.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: Number(p.variants[0]?.price ?? p.minPrice ?? 0),
            compareAtPrice: p.variants[0]?.compareAtPrice
              ? Number(p.variants[0].compareAtPrice)
              : null,
            averageRating: Number(p.averageRating),
            reviewCount: p.reviewCount,
            isFeatured: p.isFeatured,
            category: p.category,
            productImages: p.productImages,
          }))}
        />
      </div>
    </div>
  );
}
