import { StorefrontFooter } from "@/components/layout/storefront-footer";
import { StorefrontHeader } from "@/components/layout/storefront-header";
import { auth } from "@/lib/auth";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;
  try {
    session = await auth();
  } catch {
    // JWT decode fails if cookie was created with a different secret.
    // Treat as logged-out — the page works fine without a session.
  }

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader user={session?.user} />
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
    </div>
  );
}
