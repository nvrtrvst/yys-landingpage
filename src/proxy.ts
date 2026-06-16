import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = (token as any)?.role;
    const path = req.nextUrl.pathname;

    // Restricted routes for superadmin & admin only (editors cannot access)
    const adminOnlyRoutes = [
      "/scp/settings",
      "/scp/ppdb",
      "/scp/units",
      "/scp/testimonials",
    ];

    if (adminOnlyRoutes.some(route => path.startsWith(route))) {
      if (role !== "superadmin" && role !== "admin") {
        // Redirect unauthorized roles back to the general admin dashboard
        return NextResponse.redirect(new URL("/scp", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/scp/login',
    }
  }
);

export const config = {
  matcher: ["/scp/((?!login).*)", "/api/admin/:path*"]
};
