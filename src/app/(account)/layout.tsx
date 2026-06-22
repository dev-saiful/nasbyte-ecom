import { redirect } from "next/navigation";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { StorefrontFooter } from "@/components/layout/storefront-footer";
import { StorefrontHeader } from "@/components/layout/storefront-header";
import { auth } from "@/lib/auth";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row">
            <aside className="w-full shrink-0 lg:w-64">
              <h2 className="mb-4 font-heading text-lg font-semibold">
                My Account
              </h2>
              <AccountSidebar />
            </aside>
            <div className="flex-1">{children}</div>
          </div>
        </div>
      </main>
      <StorefrontFooter />
    </div>
  );
}
