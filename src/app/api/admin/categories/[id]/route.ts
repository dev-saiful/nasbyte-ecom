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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id, deletedAt: null },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      category: { ...category, productCount: category._count.products },
    });
  } catch (error) {
    console.error("Admin category GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await prisma.category.findUnique({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    const data = parsed.data;

    // Generate slug with collision handling
    let slug = data.slug || slugify(data.name);
    let slugAttempts = 0;
    while (slugAttempts < 5) {
      const duplicate = await prisma.category.findFirst({
        where: { slug, id: { not: id }, deletedAt: null },
      });
      if (!duplicate) break;
      slug = `${slugify(data.name)}-${slugAttempts + 2}`;
      slugAttempts++;
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug,
        description: data.description,
        imagePath: data.imagePath,
        isActive: data.isActive,
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Admin category PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.category.findUnique({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    const category = await prisma.category.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Admin category PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to toggle category status" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.category.findUnique({
      where: { id, deletedAt: null },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    // Business rule: cannot delete category with products
    if (existing._count.products > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete category with assigned products",
          productCount: existing._count.products,
        },
        { status: 400 },
      );
    }

    await prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin category DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 },
    );
  }
}
