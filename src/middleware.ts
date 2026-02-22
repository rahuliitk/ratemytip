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
    pathname === "/forgot-password";

  if (isAuthPage && req.auth?.user?.userType === "user") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ─── User-protected routes ───
  const isUserProtectedRoute =
    pathname.startsWith("/settings") ||
    pathname.startsWith("/saved") ||
    pathname.startsWith("/dashboard");

  if (isUserProtectedRoute && !req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
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
    "/settings/:path*",
    "/saved/:path*",
    "/dashboard/:path*",
  ],
};
