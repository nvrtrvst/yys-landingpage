import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import DOMPurify from "isomorphic-dompurify";

export function canAccessUnit(userRole: string, userUnitId: number | null, targetUnitId: number): boolean {
  if (userRole === "superadmin" || userRole === "admin") return true;
  return userUnitId === targetUnitId;
}

export function isModerator(role: string): boolean {
  return ["superadmin", "admin", "admin_unit", "guru"].includes(role);
}

export function slugifyTitle(title: string): string {
  return (title || "post")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "post";
}

export async function generateUniqueSlug(title: string, excludeId?: number): Promise<string> {
  const base = slugifyTitle(title);
  
  let sql = "SELECT slug FROM mading_posts WHERE (slug = ? OR slug LIKE ?)";
  const params: (string | number)[] = [base, base + "-%"];
  
  if (excludeId) {
    sql += " AND id != ?";
    params.push(excludeId);
  }
  
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  const taken = new Set(rows.map((r) => (r as { slug: string }).slug));
  
  if (!taken.has(base)) return base;
  
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["p","br","b","i","u","em","strong","a","ul","ol","li","h1","h2","h3","h4","h5","h6","img","blockquote","pre","code","hr","span","div","sub","sup"],
    ALLOWED_ATTR: ["href","src","alt","title","class","id","target","rel","width","height"],
  });
}

export function getPagination(page: number = 1, limit: number = 12) {
  const p = Math.max(1, page);
  const l = Math.min(50, Math.max(1, limit));
  return { page: p, limit: l, offset: (p - 1) * l };
}

export async function getUnitBySlug(slug: string): Promise<RowDataPacket | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT id, name, slug, logo_url, primary_color, secondary_color, tagline, address, phone, status FROM units WHERE slug = ? AND status = 'active'", [slug]
  );
  return rows[0] || null;
}

export async function getAllActiveUnits(): Promise<RowDataPacket[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT id, name, slug, logo_url, primary_color, secondary_color, tagline, description FROM units WHERE status = 'active' ORDER BY order_index ASC"
  );
  return rows;
}

export async function createAuditLog(
  userId: number,
  unitId: number | null,
  action: string,
  resourceType: string | null,
  resourceId: number | null,
  details: string | null,
  ipAddress: string | null
): Promise<void> {
  try {
    await pool.execute(
      "INSERT INTO mading_audit_logs (user_id, unit_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [userId, unitId, action, resourceType, resourceId, details, ipAddress]
    );
  } catch (e) { console.error("Failed to create audit log:", e); }
}

export async function createNotification(userId: number, postId: number | null, type: string, message: string): Promise<void> {
  try {
    await pool.execute("INSERT INTO mading_notifications (user_id, post_id, type, message) VALUES (?, ?, ?, ?)", [userId, postId, type, message]);
  } catch (e) { console.error("Failed to create notification:", e); }
}
