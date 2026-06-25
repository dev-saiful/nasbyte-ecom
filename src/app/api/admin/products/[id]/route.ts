import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminProductSchema } from "@/lib/validators";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        productImages: {
          orderBy: { sortOrder: "asc" },
        },
        productOptions: {
          include: { values: true },
          orderBy: { displayOrder: "asc" },
        },
        variants: {
          where: { deletedAt: null },
          include: {
            variantOptions: {
              include: {
                optionValue: { include: { option: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      product: {
        ...product,
        minPrice: product.minPrice ? Number(product.minPrice) : null,
        averageRating: Number(product.averageRating),
        variants: product.variants.map((v) => ({
          ...v,
          price: Number(v.price),
          compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
          optionValues: Object.fromEntries(
            v.variantOptions.map((vo) => [
              vo.optionValue.option.name,
              vo.optionValue.value,
            ]),
          ),
        })),
      },
    });
  } catch (error) {
    console.error("Admin product GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = adminProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const existing = await prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          categoryId: data.categoryId,
          hasVariants: data.hasVariants,
          isFeatured: data.isFeatured,
          isActive: data.isActive,
          features: data.features,
        },
      });

      if (data.options !== undefined) {
        await tx.productOption.deleteMany({ where: { productId: id } });

        for (const option of data.options) {
          const createdOption = await tx.productOption.create({
            data: {
              name: option.name,
              productId: id,
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

      if (data.variants !== undefined) {
        await tx.productVariant.deleteMany({ where: { productId: id } });

        const options = await tx.productOption.findMany({
          where: { productId: id },
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
              productId: id,
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
        where: { productId: id, isDefault: true },
      });
      await tx.product.update({
        where: { id },
        data: { minPrice: defaultVariant?.price ?? null },
      });

      return updated;
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Admin product PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin product DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}
