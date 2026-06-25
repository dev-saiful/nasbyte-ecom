import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validators";

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

    const categories = await prisma.category.findMany({
      where: { deletedAt: null },
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      categories: categories.map((c) => ({
        ...c,
        productCount: c._count.products,
      })),
    });
  } catch (error) {
    console.error("Admin categories GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
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
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Generate slug if not provided, handle collision
    let slug = data.slug || slugify(data.name);
    let slugAttempts = 0;
    while (slugAttempts < 5) {
      const existing = await prisma.category.findUnique({ where: { slug } });
      if (!existing) break;
      slug = `${slugify(data.name)}-${slugAttempts + 2}`;
      slugAttempts++;
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        imagePath: data.imagePath,
        isActive: data.isActive,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Admin categories POST error:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
