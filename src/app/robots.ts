import type { MetadataRoute } from "next";
import { foundationUrl } from "@/lib/unit-sites";

export default function robots(): MetadataRoute.Robots {
  const base = foundationUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/scp", "/api", "/print", "/mading/admin-unit", "/mading/guru", "/mading/siswa"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}