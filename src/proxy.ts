import { NextResponse } from "next/server";
import NextAuth from "next-auth";

const { auth } = NextAuth({
  providers: [],
  session: { strategy: "jwt" },
});

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Guest-only routes (redirect to /account if logged in)
  const guestOnlyRoutes = ["/login", "/register"];
  if (guestOnlyRoutes.some((route) => pathname.startsWith(route))) {
    if (session) {
      return NextResponse.redirect(new URL("/account", req.url));
    }
  }

  // Auth-required routes
  const authRequiredRoutes = ["/account", "/checkout"];
  if (authRequiredRoutes.some((route) => pathname.startsWith(route))) {
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Verified-required routes
  const verifiedRequiredRoutes = ["/checkout"];
  if (verifiedRequiredRoutes.some((route) => pathname.startsWith(route))) {
    if (session && !session.user.isVerified) {
      return NextResponse.redirect(new URL("/verify-email", req.url));
    }
  }

  // Admin-only routes
  const adminRoutes = ["/admin"];
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/forbidden", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/account/:path*",
    "/admin/:path*",
    "/checkout/:path*",
    "/login",
    "/register",
  ],
};
