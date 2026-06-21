"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
}

export function ProductPagination({
  currentPage,
  totalPages,
}: ProductPaginationProps) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const createPageURL = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    return `/products?${params.toString()}`;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(
      (page) =>
        page === 1 ||
        page === totalPages ||
        (page >= currentPage - 1 && page <= currentPage + 1),
    )
    .reduce<(number | "ellipsis")[]>((acc, page, i, arr) => {
      if (i > 0 && page - (arr[i - 1] as number) > 1) {
        acc.push("ellipsis");
      }
      acc.push(page);
      return acc;
    }, []);

  return (
    <nav className="flex items-center justify-center gap-1">
      <Button
        variant="outline"
        size="icon"
        asChild
        disabled={currentPage === 1}
      >
        <Link href={createPageURL(currentPage - 1)}>
          <ChevronLeft className="size-4" />
        </Link>
      </Button>

      {(() => {
        let ellipsisCount = 0;
        return pages.map((page) => {
          if (page === "ellipsis") {
            ellipsisCount += 1;
            return (
              <span key={`ellipsis-${ellipsisCount}`} className="px-2">
                ...
              </span>
            );
          }
          return (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="icon"
              asChild
            >
              <Link href={createPageURL(page)}>{page}</Link>
            </Button>
          );
        });
      })()}

      <Button
        variant="outline"
        size="icon"
        asChild
        disabled={currentPage === totalPages}
      >
        <Link href={createPageURL(currentPage + 1)}>
          <ChevronRight className="size-4" />
        </Link>
      </Button>
    </nav>
  );
}
