import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productFiltersSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const filters = productFiltersSchema.parse({
      category: params.category || undefined,
      search: params.search || undefined,
      sort: params.sort || "newest",
      page: params.page ? Number.parseInt(params.page, 10) : 1,
    });

    const page = filters.page || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    const where = {
      isActive: true,
      deletedAt: null,
      ...(filters.category && {
        category: { slug: filters.category },
      }),
      ...(filters.search && {
        name: { contains: filters.search, mode: "insensitive" as const },
      }),
    };

    const orderBy = (() => {
      switch (filters.sort) {
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

    const [products, total] = await Promise.all([
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
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        price: Number(p.variants[0]?.price ?? p.minPrice ?? 0),
        compareAtPrice: p.variants[0]?.compareAtPrice
          ? Number(p.variants[0].compareAtPrice)
          : null,
        averageRating: Number(p.averageRating),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
