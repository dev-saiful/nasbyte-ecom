"use client";

import { Eye, EyeOff, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBDT } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  minPrice: number | null;
  isActive: boolean;
  isFeatured: boolean;
  category?: { name: string; slug: string } | null;
  productImages?: { path: string; sortOrder: number }[];
  variantCount: number;
}

interface AdminProductTableProps {
  products: Product[];
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}

export function AdminProductTable({
  products,
  onToggleStatus,
  onDelete,
}: AdminProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No products found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Variants</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div className="relative size-10 overflow-hidden rounded-md bg-muted">
                  {product.productImages?.[0] ? (
                    <Image
                      src={product.productImages[0].path}
                      alt={product.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                      No Img
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">{product.name}</div>
                {product.isFeatured && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Featured
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {product.category?.name ?? "—"}
              </TableCell>
              <TableCell className="text-right font-medium">
                {product.minPrice ? formatBDT(product.minPrice) : "—"}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {product.variantCount}
              </TableCell>
              <TableCell>
                <Badge variant={product.isActive ? "default" : "secondary"}>
                  {product.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      render={
                        <Link href={`/admin/products/${product.id}`}>
                          <Eye className="mr-2 size-4" />
                          View
                        </Link>
                      }
                    />
                    <DropdownMenuItem
                      render={
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Pencil className="mr-2 size-4" />
                          Edit
                        </Link>
                      }
                    />
                    <DropdownMenuItem
                      onClick={() => onToggleStatus(product.id)}
                    >
                      {product.isActive ? (
                        <>
                          <EyeOff className="mr-2 size-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 size-4" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete(product.id)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
