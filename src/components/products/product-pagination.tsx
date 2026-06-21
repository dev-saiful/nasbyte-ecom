"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      <Link
        href={createPageURL(currentPage - 1)}
        aria-disabled={currentPage === 1}
        tabIndex={currentPage === 1 ? -1 : 0}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          currentPage === 1 && "pointer-events-none opacity-50",
        )}
      >
        <ChevronLeft className="size-4" />
      </Link>

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
            <Link
              key={page}
              href={createPageURL(page)}
              className={buttonVariants({
                variant: page === currentPage ? "default" : "outline",
                size: "icon",
              })}
            >
              {page}
            </Link>
          );
        });
      })()}

      <Link
        href={createPageURL(currentPage + 1)}
        aria-disabled={currentPage === totalPages}
        tabIndex={currentPage === totalPages ? -1 : 0}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          currentPage === totalPages && "pointer-events-none opacity-50",
        )}
      >
        <ChevronRight className="size-4" />
      </Link>
    </nav>
  );
}
