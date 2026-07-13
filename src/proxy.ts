import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const MADING_HOST_PREFIX = "mading.";
const MADING_ALLOWED = ["/mading", "/api/mading", "/_next/", "/uploads/", "/favicon.ico", "/logo.png"];

export default withAuth(
  function middleware(req) {
    const host = req.headers.get("host") || "";
    const path = req.nextUrl.pathname;

    // ── Mading subdomain ──
    if (host.startsWith(MADING_HOST_PREFIX)) {
      const allowed = MADING_ALLOWED.some((p) => path === p || path.startsWith(p));
      if (!allowed) {
        if (path === "/") {
          return NextResponse.rewrite(new URL("/mading", req.url));
        }
        return new NextResponse("Not Found", { status: 404 });
      }
      return NextResponse.next();
    }

    // ── SCP admin-only routes ──
    const token = req.nextauth.token;
    const role = (token as { role?: string } | undefined)?.role;
    const adminOnlyRoutes = ["/scp/settings", "/scp/ppdb", "/scp/units", "/scp/testimonials", "/scp/users"];
    if (adminOnlyRoutes.some((r) => path.startsWith(r))) {
      if (role !== "superadmin" && role !== "admin") {
        return NextResponse.redirect(new URL("/scp", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (!path.startsWith("/scp") && !path.startsWith("/api/admin")) return true;
        return !!token;
      },
    },
    pages: {
      signIn: "/scp/login",
    },
  }
);

export const config = {
  matcher: ["/:path*"],
};
