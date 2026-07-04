import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminProductSchema } from "@/lib/validators";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      include: {
        category: { select: { name: true, slug: true } },
        productImages: {
          select: { path: true, sortOrder: true },
          orderBy: { sortOrder: "asc" },
          take: 1,
        },
        _count: { select: { variants: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        minPrice: p.minPrice ? Number(p.minPrice) : null,
        averageRating: Number(p.averageRating),
        variantCount: p._count.variants,
      })),
    });
  } catch (error) {
    console.error("Admin products GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = adminProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Validate variants — at least one required, exactly one default
    if (!data.variants || data.variants.length === 0) {
      return NextResponse.json(
        { error: "At least one product variant is required" },
        { status: 400 },
      );
    }
    const defaultCount = data.variants.filter((v) => v.isDefault).length;
    if (defaultCount !== 1) {
      return NextResponse.json(
        { error: "Exactly one variant must be marked as default" },
        { status: 400 },
      );
    }
    for (const variant of data.variants) {
      if (variant.price <= 0) {
        return NextResponse.json(
          { error: "All variants must have a positive price" },
          { status: 400 },
        );
      }
    }

    let slug = slugify(data.name);
    let slugAttempts = 0;
    while (slugAttempts < 5) {
      const existing = await prisma.product.findUnique({ where: { slug } });
      if (!existing) break;
      slug = `${slugify(data.name)}-${slugAttempts + 2}`;
      slugAttempts++;
    }

    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          categoryId: data.categoryId,
          hasVariants: data.hasVariants,
          isFeatured: data.isFeatured,
          isActive: data.isActive,
          features: data.features,
        },
      });

      if (data.options && data.options.length > 0) {
        for (const option of data.options) {
          const createdOption = await tx.productOption.create({
            data: {
              name: option.name,
              productId: newProduct.id,
              displayOrder: data.options.indexOf(option),
            },
          });

          for (const value of option.values) {
            await tx.productOptionValue.create({
              data: {
                value,
                optionId: createdOption.id,
                displayOrder: option.values.indexOf(value),
              },
            });
          }
        }
      }

      if (data.variants && data.variants.length > 0) {
        const options = await tx.productOption.findMany({
          where: { productId: newProduct.id },
          include: { values: true },
        });

        for (const variant of data.variants) {
          const createdVariant = await tx.productVariant.create({
            data: {
              name: variant.name,
              sku: variant.sku,
              price: variant.price,
              compareAtPrice: variant.compareAtPrice,
              stock: variant.stock,
              isActive: variant.isActive,
              isDefault: variant.isDefault ?? false,
              productId: newProduct.id,
            },
          });

          if (variant.optionValues) {
            for (const [optionName, valueName] of Object.entries(
              variant.optionValues,
            )) {
              const option = options.find((o) => o.name === optionName);
              const optionValue = option?.values.find(
                (v) => v.value === valueName,
              );
              if (optionValue) {
                await tx.variantOptionValue.create({
                  data: {
                    variantId: createdVariant.id,
                    optionValueId: optionValue.id,
                  },
                });
              }
            }
          }
        }
      }

      // Update minPrice from default variant
      const defaultVariant = await tx.productVariant.findFirst({
        where: { productId: newProduct.id, isDefault: true },
      });
      if (defaultVariant) {
        await tx.product.update({
          where: { id: newProduct.id },
          data: { minPrice: defaultVariant.price },
        });
      }

      // Persist product image if imageUrl provided
      if (data.imageUrl) {
        await tx.productImage.create({
          data: {
            path: data.imageUrl,
            disk: "public",
            sortOrder: 0,
            productId: newProduct.id,
          },
        });
      }

      return newProduct;
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Admin products POST error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
