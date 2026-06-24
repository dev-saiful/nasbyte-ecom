import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bulkReviewSchema = z.object({
  action: z.enum(["approve", "delete"]),
  reviewIds: z.array(z.string().uuid()).min(1),
});

async function recalculateProductStats(productId: string) {
  const stats = await prisma.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      averageRating: stats._avg.rating || 0,
      reviewCount: stats._count.rating || 0,
    },
  });
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = bulkReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { action, reviewIds } = parsed.data;

    const reviews = await prisma.review.findMany({
      where: { id: { in: reviewIds } },
      select: { productId: true },
    });
    const productIds = [...new Set(reviews.map((r) => r.productId))];

    if (action === "approve") {
      await prisma.review.updateMany({
        where: { id: { in: reviewIds } },
        data: { isApproved: true },
      });
    } else {
      await prisma.review.deleteMany({
        where: { id: { in: reviewIds } },
      });
    }

    for (const productId of productIds) {
      await recalculateProductStats(productId);
    }

    return NextResponse.json({
      success: true,
      affectedProducts: productIds.length,
    });
  } catch (error) {
    console.error("Admin reviews bulk error:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk action" },
      { status: 500 },
    );
  }
}
