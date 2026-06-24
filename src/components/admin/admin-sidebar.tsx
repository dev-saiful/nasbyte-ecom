"use client";

import {
  Flag,
  FolderTree,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tags,
  Truck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, enabled: true },
  { href: "/admin/products", label: "Products", icon: Package, enabled: true },
  {
    href: "/admin/categories",
    label: "Categories",
    icon: FolderTree,
    enabled: true,
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: ShoppingCart,
    enabled: true,
  },
  { href: "/admin/users", label: "Users", icon: Users, enabled: true },
  { href: "/admin/reviews", label: "Reviews", icon: Flag, enabled: true },
  {
    href: "/admin/inventory",
    label: "Inventory",
    icon: Truck,
    enabled: false,
  },
  { href: "/admin/promos", label: "Promos", icon: Tags, enabled: false },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-muted/30">
      <div className="border-b px-4 py-4">
        <Link
          href="/admin"
          className="font-heading text-lg font-bold text-primary"
        >
          Admin Panel
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {sidebarLinks.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/admin" && pathname.startsWith(link.href));

          if (!link.enabled) {
            return (
              <div
                key={link.href}
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground opacity-50"
              >
                <link.icon className="size-4" />
                {link.label}
              </div>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-3 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          ← Back to Store
        </Link>
      </div>
    </aside>
  );
}
