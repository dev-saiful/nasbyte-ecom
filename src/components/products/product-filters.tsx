"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface Category {
  name: string;
  slug: string;
}

interface ProductFiltersProps {
  categories: Category[];
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "";

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Categories</h3>
      <nav className="flex flex-col gap-1">
        {categories.map((category) => {
          const params = new URLSearchParams(searchParams.toString());
          if (category.slug) {
            params.set("category", category.slug);
          } else {
            params.delete("category");
          }
          const href = `/products?${params.toString()}`;
          return (
            <Link
              key={category.slug}
              href={href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                currentCategory === category.slug
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {category.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
