import { revalidatePath } from "next/cache";
import { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

const RESERVED_SLUGS = new Set([
  "api",
  "scp",
  "berita",
  "agenda",
  "ppdb",
  "unit",
  "mading",
  "galeri",
  "events",
  "print",
]);

export function isReservedUnitSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.trim().toLowerCase());
}

export async function revalidateUnitSites(extraSlugs: (string | null | undefined)[] = []): Promise<void> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT slug FROM units WHERE status = 'active'"
    );
    const slugs = new Set<string>();
    rows.forEach((row) => {
      const slug = String(row.slug || "").trim().toLowerCase();
      if (slug && !isReservedUnitSlug(slug)) slugs.add(slug);
    });
    extraSlugs.forEach((slug) => {
      const value = String(slug || "").trim().toLowerCase();
      if (value && !isReservedUnitSlug(value)) slugs.add(value);
    });
    for (const slug of slugs) revalidatePath(`/${slug}`);
  } catch (error) {
    console.error("Failed to revalidate unit sites", error);
  }
}
