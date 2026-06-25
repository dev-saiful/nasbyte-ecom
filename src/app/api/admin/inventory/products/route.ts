import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const stockStatus = searchParams.get("stockStatus");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit")) || 20),
    );
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      isActive: true,
      deletedAt: null,
      product: { deletedAt: null },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { product: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (stockStatus === "out_of_stock") {
      where.stock = 0;
    } else if (stockStatus === "low") {
      where.stock = { gt: 0, lte: 10 };
    } else if (stockStatus === "in_stock") {
      where.stock = { gt: 10 };
    }

    const [variants, total] = await Promise.all([
      prisma.productVariant.findMany({
        where,
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          price: true,
          product: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy: { stock: "asc" },
        skip,
        take: limit,
      }),
      prisma.productVariant.count({ where }),
    ]);

    return NextResponse.json({
      products: variants.map((v) => ({
        id: v.id,
        name: v.name ?? v.product.name,
        sku: v.sku,
        stock: v.stock,
        price: Number(v.price),
        productName: v.product.name,
        productId: v.product.id,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin inventory products GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
