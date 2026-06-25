import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const baseWhere = {
      isActive: true,
      deletedAt: null,
      product: { deletedAt: null },
    };

    const [totalVariants, lowStock, outOfStock, stockAggregate] =
      await Promise.all([
        prisma.productVariant.count({ where: baseWhere }),
        prisma.productVariant.count({
          where: { ...baseWhere, stock: { gt: 0, lte: 10 } },
        }),
        prisma.productVariant.count({
          where: { ...baseWhere, stock: 0 },
        }),
        prisma.productVariant.aggregate({
          where: baseWhere,
          _sum: { stock: true },
        }),
      ]);

    return NextResponse.json({
      stats: {
        totalProducts: totalVariants,
        lowStock,
        outOfStock,
        totalStock: stockAggregate._sum.stock || 0,
      },
    });
  } catch (error) {
    console.error("Admin inventory GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory stats" },
      { status: 500 },
    );
  }
}
