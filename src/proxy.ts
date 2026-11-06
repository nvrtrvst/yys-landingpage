import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { firstAccessibleHref, hasModuleAccess, moduleForApiPath, moduleForPath, type ModuleKey } from "@/lib/modules";

const MADING_HOST_PREFIX = "penamaya.";
const MADING_ALLOWED = ["/mading", "/api/mading", "/_next/", "/uploads/", "/favicon.ico", "/logo.png"];
const PAGE_ALLOWLIST = ["/scp/login", "/scp/reset-password", "/scp/no-access", "/scp/profile"];
const CONTENT_MODULES: ModuleKey[] = ["ppdb_data", "units", "news", "gallery", "testimonials", "events"];

function denyApi() {
  return NextResponse.json({ error: "Dilarang" }, { status: 403 });
}

export default withAuth(
  function middleware(req) {
    const host = req.headers.get("host") || "";
    const path = req.nextUrl.pathname;
    const response = NextResponse.next();
    const isDev = process.env.NODE_ENV !== "production";
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
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

    // Path traversal protection
    const encodedDots = path.includes("%2e") || path.includes("%2E");
    const doubleDots = path.includes("../") || path.includes("/..") || path.includes("..\\") || path.includes("\\..");
    if (encodedDots || doubleDots) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Mading subdomain
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

    const token = req.nextauth.token as
      | { role?: string; permissions?: string[] }
      | null
      | undefined;
    const role = token?.role;

    // SCP admin-only routes
    const adminOnlyRoutes = ["/scp/settings", "/scp/ppdb", "/scp/units", "/scp/testimonials", "/scp/users"];
    if (adminOnlyRoutes.some((r) => path.startsWith(r))) {
      if (role !== "superadmin" && role !== "admin" && role !== "petugas") {
        return NextResponse.redirect(new URL("/scp", req.url));
      }
    }

    if (role === "petugas") {
      const permissions = Array.isArray(token?.permissions) ? token.permissions : [];

      if (path.startsWith("/api/")) {
        if (path.startsWith("/api/admin/profile")) return response;

        if (path.startsWith("/api/admin/upload")) {
          const canUpload = CONTENT_MODULES.some((module) =>
            hasModuleAccess("petugas", permissions, module)
          );
          return canUpload ? response : denyApi();
        }

        const requiredModule = moduleForApiPath(path);
        if (!requiredModule) return denyApi();
        return hasModuleAccess("petugas", permissions, requiredModule) ? response : denyApi();
      }

      if (PAGE_ALLOWLIST.some((allowed) => path === allowed || path.startsWith(allowed + "/"))) {
        return response;
      }

      const requiredPageModule = moduleForPath(path);
      if (requiredPageModule && hasModuleAccess("petugas", permissions, requiredPageModule)) {
        return response;
      }

      const fallback = firstAccessibleHref("petugas", permissions);
      return NextResponse.redirect(new URL(fallback ?? "/scp/no-access", req.url));
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
