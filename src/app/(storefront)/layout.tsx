import { StorefrontFooter } from "@/components/layout/storefront-footer";
import { StorefrontHeader } from "@/components/layout/storefront-header";
import { auth } from "@/lib/auth";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader user={session?.user} />
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
    </div>
  );
}
