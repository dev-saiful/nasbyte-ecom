"use client";

import { LogOut, Menu, Search, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "@/hooks/use-cart";

const navLinks = [
  { href: "/products", label: "Shop All" },
  { href: "/products?featured=true", label: "Featured" },
  { href: "/track-order", label: "Track Order" },
];

interface StorefrontHeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

export function StorefrontHeader({ user }: StorefrontHeaderProps) {
  const [open, setOpen] = useState(false);
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-xl font-heading font-bold text-primary"
          >
            NasByte SteCom
          </Link>

          <nav className="hidden items-center gap-4 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Search">
            <Search className="size-4" />
          </Button>

          <Link href="/cart">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Cart"
              className="relative"
            >
              <ShoppingBag className="size-4" />
              {totalItems > 0 && (
                <Badge
                  variant="secondary"
                  className="absolute -right-1 -top-1 size-4 justify-center rounded-full p-0 text-[10px]"
                >
                  {totalItems > 99 ? "99+" : totalItems}
                </Badge>
              )}
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon">
                    <User className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={<Link href="/account">My Account</Link>}
                />
                <DropdownMenuItem
                  render={<Link href="/account/orders">My Orders</Link>}
                />
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    window.location.href = "/api/auth/signout";
                  }}
                >
                  <LogOut className="mr-2 size-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/login"
                className="inline-flex h-7 items-center justify-center gap-1 rounded-md bg-transparent px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex h-7 items-center justify-center gap-1 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
              >
                Sign up
              </Link>
            </div>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="size-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              }
            />
            <SheetContent side="left" className="w-72">
              <SheetTitle className="text-lg font-heading font-bold">
                NasByte SteCom
              </SheetTitle>
              <nav className="mt-6 flex flex-col gap-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="my-2 border-t" />
                {user ? (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setOpen(false)}
                      className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      My Account
                    </Link>
                    <Link
                      href="/account/orders"
                      onClick={() => setOpen(false)}
                      className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      My Orders
                    </Link>
                    <div className="my-2 border-t" />
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = "/api/auth/signout";
                      }}
                      className="text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setOpen(false)}
                      className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
