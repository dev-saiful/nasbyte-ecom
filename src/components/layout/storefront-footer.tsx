import Link from "next/link";

const footerLinks = [
  {
    title: "Shop",
    links: [
      { href: "/products", label: "All Products" },
      { href: "/products?featured=true", label: "Featured" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/account", label: "My Account" },
      { href: "/account/orders", label: "Order History" },
      { href: "/cart", label: "Cart" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/policy", label: "Privacy Policy" },
      { href: "/policy", label: "Terms of Service" },
      { href: "/track-order", label: "Track Order" },
    ],
  },
];

export function StorefrontFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <Link
              href="/"
              className="text-lg font-heading font-bold text-primary"
            >
              NasByte SteCom
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              Ladies accessories for every occasion.
            </p>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} NasByte SteCom. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
