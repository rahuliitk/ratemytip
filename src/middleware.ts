import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // ─── Admin route protection ───
  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  const isAdminLoginPage = pathname === "/admin/login";

  if ((isAdminRoute || isAdminApi) && !isAdminLoginPage) {
    if (!req.auth || req.auth.user?.userType !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // ─── Auth page redirect (already logged-in users) ───
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  if (isAuthPage && req.auth?.user?.userType === "user") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ─── User-protected routes ───
  const isUserProtectedRoute =
    pathname.startsWith("/settings") ||
    pathname.startsWith("/saved") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/feed");

  if (isUserProtectedRoute && !req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ─── Creator dashboard routes (require CREATOR role) ───
  const isCreatorRoute = pathname.startsWith("/creator-dashboard");

  if (isCreatorRoute) {
    if (!req.auth) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (req.auth.user?.userType !== "user" || req.auth.user?.role !== "CREATOR") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/settings/:path*",
    "/saved/:path*",
    "/dashboard/:path*",
    "/notifications/:path*",
    "/feed/:path*",
    "/creator-dashboard/:path*",
  ],
};
