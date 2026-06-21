import { CreditCard, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/products/product-card";
import { prisma } from "@/lib/prisma";

export default async function StorefrontHomePage() {
  const [featuredProducts, categories, announcement] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true, deletedAt: null },
      include: {
        category: { select: { name: true, slug: true } },
        productImages: {
          select: { path: true, sortOrder: true },
          orderBy: { sortOrder: "asc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.category.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true, slug: true, imagePath: true },
      orderBy: { name: "asc" },
    }),
    prisma.storefrontAnnouncement.findFirst({
      where: { isActive: true },
      select: { title: true },
    }),
  ]);

  return (
    <div className="space-y-12 pb-16">
      {announcement?.title && (
        <div className="bg-primary/10 py-3 text-center text-sm font-medium text-primary">
          {announcement.title}
        </div>
      )}

      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-4xl font-heading font-bold tracking-tight sm:text-5xl">
              Discover Your Style
            </h1>
            <p className="text-lg text-muted-foreground">
              Explore our curated collection of ladies accessories — scarves,
              bags, jewelry, and more. Crafted for elegance, priced for you.
            </p>
            <div className="flex gap-3">
              <Link
                href="/products"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
              >
                Shop All
              </Link>
              <Link
                href="/products?featured=true"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Featured
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-4 md:gap-8">
          <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
            <Truck className="size-8 text-primary" />
            <div>
              <p className="text-sm font-semibold">Free Shipping</p>
              <p className="text-xs text-muted-foreground">
                On orders over 1000 BDT
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
            <ShieldCheck className="size-8 text-primary" />
            <div>
              <p className="text-sm font-semibold">Secure Payment</p>
              <p className="text-xs text-muted-foreground">
                100% secure checkout
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
            <CreditCard className="size-8 text-primary" />
            <div>
              <p className="text-sm font-semibold">Cash on Delivery</p>
              <p className="text-xs text-muted-foreground">
                Pay when you receive
              </p>
            </div>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-2xl font-heading font-bold">
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {category.name.charAt(0)}
                </div>
                <span className="text-sm font-medium group-hover:text-primary">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featuredProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-heading font-bold">
              Featured Products
            </h2>
            <Link
              href="/products?featured=true"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  price: Number(product.price),
                  compareAtPrice: product.compareAtPrice
                    ? Number(product.compareAtPrice)
                    : null,
                  averageRating: Number(product.averageRating),
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
