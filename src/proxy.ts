import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const MADING_HOST_PREFIX = "penamaya.";
const MADING_ALLOWED = ["/mading", "/api/mading", "/_next/", "/uploads/", "/favicon.ico", "/logo.png"];

export default withAuth(
  function middleware(req) {
    const host = req.headers.get("host") || "";
    const path = req.nextUrl.pathname;
    const nonce = crypto.randomUUID();
    const response = NextResponse.next();

    // ── CSP with per-request nonce (replaces 'unsafe-inline' in next.config) ──
    const isDev = process.env.NODE_ENV !== "production";
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "frame-src 'self' https://www.google.com https://maps.google.com",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; ");

    response.headers.set("Content-Security-Policy", csp);
    response.headers.set("x-nonce", nonce);

    // ── Path traversal protection ──
    const encodedDots = path.includes("%2e") || path.includes("%2E");
    const doubleDots = path.includes("../") || path.includes("/..") || path.includes("..\\") || path.includes("\\..");
    if (encodedDots || doubleDots) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // ── Mading subdomain ──
    if (host.startsWith(MADING_HOST_PREFIX)) {
      const allowed = MADING_ALLOWED.some((p) => path === p || path.startsWith(p));
      if (!allowed) {
        if (path === "/") {
          return NextResponse.rewrite(new URL("/mading", req.url));
        }
        return new NextResponse("Not Found", { status: 404 });
      }
      return response;
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

    return response;
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
