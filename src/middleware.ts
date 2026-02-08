import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  const isAdminApi = req.nextUrl.pathname.startsWith("/api/admin");
  const isLoginPage = req.nextUrl.pathname === "/admin/login";

  if ((isAdminRoute || isAdminApi) && !isLoginPage && !req.auth) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
