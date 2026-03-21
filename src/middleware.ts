export const runtime = "nodejs";

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const protectedPaths = ["/my", "/cases/new", "/cases/edit", "/admin", "/publish"];
const adminPaths = ["/admin"];
const authPaths = ["/login", "/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && authPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Protect authenticated routes
  if (!isLoggedIn && protectedPaths.some((p) => pathname.startsWith(p))) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, req.url)
    );
  }

  // Protect admin routes - SUPER_ADMIN, ADMIN, MODERATOR can access
  if (
    adminPaths.some((p) => pathname.startsWith(p)) &&
    userRole !== "SUPER_ADMIN" &&
    userRole !== "ADMIN" &&
    userRole !== "MODERATOR"
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/my/:path*",
    "/cases/new",
    "/cases/edit/:path*",
    "/admin/:path*",
    "/publish",
    "/login",
    "/register",
  ],
};
