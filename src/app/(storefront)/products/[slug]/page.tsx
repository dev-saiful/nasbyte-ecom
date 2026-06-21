import { notFound } from "next/navigation";
import { ProductActions } from "@/components/products/product-actions";
import { ProductFeatures } from "@/components/products/product-features";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductInfo } from "@/components/products/product-info";
import { ProductQuantity } from "@/components/products/product-quantity";
import { ProductRelated } from "@/components/products/product-related";
import { ProductReviews } from "@/components/products/product-reviews";
import { ProductStock } from "@/components/products/product-stock";
import { ProductVariants } from "@/components/products/product-variants";
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
    },
    take: 4,
  });

  const stock = product.hasVariants
    ? product.variants.reduce((sum, v) => sum + v.stock, 0)
    : product.stock;

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
            price={Number(product.price)}
            compareAtPrice={
              product.compareAtPrice ? Number(product.compareAtPrice) : null
            }
            averageRating={Number(product.averageRating)}
            reviewCount={product.reviewCount}
            description={product.description}
          />

          <ProductStock stock={stock} />

          {product.hasVariants && (
            <ProductVariants
              variants={product.variants}
              selectedVariantId={null}
              onSelectVariant={() => {}}
            />
          )}

          <ProductQuantity quantity={1} maxStock={stock} onChange={() => {}} />

          <ProductActions
            productId={product.id}
            name={product.name}
            slug={product.slug}
            price={Number(product.price)}
            image={product.productImages[0]?.path}
            stock={stock}
            quantity={1}
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
            ...p,
            price: Number(p.price),
            compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
            averageRating: Number(p.averageRating),
          }))}
        />
      </div>
    </div>
  );
}
