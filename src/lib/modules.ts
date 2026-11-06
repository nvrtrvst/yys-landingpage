export type ModuleKey =
  | "dashboard"
  | "ppdb_data"
  | "ppdb_settings"
  | "units"
  | "news"
  | "gallery"
  | "testimonials"
  | "events"
  | "mading_dashboard"
  | "mading_posts"
  | "mading_categories"
  | "mading_comments"
  | "mading_users"
  | "mading_audit"
  | "mading_settings"
  | "users"
  | "settings"
  | "backup"
  | "profile";

export interface ModuleMeta {
  key: ModuleKey;
  label: string;
  href: string;
  group: "PPDB" | "Konten" | "Mading" | "Sistem";
  grantable: boolean;
  sensitive: boolean;
}

export const MODULES: ModuleMeta[] = [
  { key: "dashboard", label: "Dashboard", href: "/scp", group: "Sistem", grantable: true, sensitive: false },
  { key: "ppdb_data", label: "Data Pendaftar", href: "/scp/ppdb", group: "PPDB", grantable: true, sensitive: false },
  { key: "ppdb_settings", label: "Pengaturan PPDB", href: "/scp/ppdb/settings", group: "PPDB", grantable: true, sensitive: false },
  { key: "units", label: "Units & Program", href: "/scp/units", group: "Konten", grantable: true, sensitive: false },
  { key: "news", label: "Berita & Artikel", href: "/scp/news", group: "Konten", grantable: true, sensitive: false },
  { key: "gallery", label: "Galeri", href: "/scp/gallery", group: "Konten", grantable: true, sensitive: false },
  { key: "testimonials", label: "Testimoni & FAQ", href: "/scp/testimonials", group: "Konten", grantable: true, sensitive: false },
  { key: "events", label: "Agenda", href: "/scp/events", group: "Konten", grantable: true, sensitive: false },
  { key: "mading_dashboard", label: "Dashboard Mading", href: "/scp/mading", group: "Mading", grantable: false, sensitive: false },
  { key: "mading_posts", label: "Tulisan & Moderasi", href: "/scp/mading/posts", group: "Mading", grantable: false, sensitive: false },
  { key: "mading_categories", label: "Kategori Mading", href: "/scp/mading/categories", group: "Mading", grantable: false, sensitive: false },
  { key: "mading_comments", label: "Komentar", href: "/scp/mading/comments", group: "Mading", grantable: false, sensitive: false },
  { key: "mading_users", label: "Pengguna Mading", href: "/scp/mading/users", group: "Mading", grantable: false, sensitive: false },
  { key: "mading_audit", label: "Audit Log", href: "/scp/mading/audit-logs", group: "Mading", grantable: false, sensitive: false },
  { key: "mading_settings", label: "Pengaturan Mading", href: "/scp/mading/settings", group: "Mading", grantable: false, sensitive: false },
  { key: "users", label: "Manajemen Pengguna", href: "/scp/users", group: "Sistem", grantable: false, sensitive: true },
  { key: "settings", label: "Pengaturan Global", href: "/scp/settings", group: "Sistem", grantable: false, sensitive: true },
  { key: "backup", label: "Backup Database", href: "/scp/backup", group: "Sistem", grantable: false, sensitive: true },
  { key: "profile", label: "Profil Saya", href: "/scp/profile", group: "Sistem", grantable: false, sensitive: false },
];

export const MODULE_KEYS = MODULES.map((module) => module.key);

export const GRANTABLE_MODULES = MODULES.filter((module) => module.grantable);

export function sanitizePetugasPermissions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const cleaned = value.filter(
    (entry): entry is string =>
      typeof entry === "string" && GRANTABLE_MODULES.some((module) => module.key === entry)
  );
  if (cleaned.includes("dashboard") && !cleaned.includes("ppdb_data")) {
    return cleaned.filter((entry) => entry !== "dashboard");
  }
  return cleaned;
}

export const MODULES_BY_KEY = Object.fromEntries(
  MODULES.map((module) => [module.key, module])
) as Record<ModuleKey, ModuleMeta>;

const PATH_MODULES: Array<{ prefix: string; module: ModuleKey; exactOnly?: boolean }> = [
  ...MODULES.filter((module) => module.key !== "dashboard" && module.key !== "profile").map(
    (module): { prefix: string; module: ModuleKey } => ({
      prefix: module.href,
      module: module.key,
    })
  ),
  { prefix: "/scp/print-kelulusan", module: "ppdb_data" },
  { prefix: "/scp/profile", module: "profile" },
];
PATH_MODULES.sort((a, b) => b.prefix.length - a.prefix.length);

export function hasModuleAccess(
  role: string,
  permissions: readonly string[] | null | undefined,
  module: ModuleKey
): boolean {
  if (role === "superadmin" || role === "admin") return true;
  if (module === "profile") return true;
  if (role !== "petugas") return true;
  const granted = Array.isArray(permissions) && permissions.includes(module);
  if (module === "dashboard") {
    return granted && Array.isArray(permissions) && permissions.includes("ppdb_data");
  }
  return granted;
}

const API_MODULES: Array<{ prefix: string; module: ModuleKey }> = [
  { prefix: "/api/admin/ppdb", module: "ppdb_data" },
  { prefix: "/api/admin/news", module: "news" },
  { prefix: "/api/admin/gallery", module: "gallery" },
  { prefix: "/api/admin/events", module: "events" },
  { prefix: "/api/admin/testimonials", module: "testimonials" },
  { prefix: "/api/admin/faqs", module: "testimonials" },
  { prefix: "/api/admin/units", module: "units" },
  { prefix: "/api/admin/programs", module: "units" },
  { prefix: "/api/admin/settings", module: "ppdb_settings" },
];
API_MODULES.sort((a, b) => b.prefix.length - a.prefix.length);

export function moduleForApiPath(pathname: string): ModuleKey | null {
  for (const entry of API_MODULES) {
    if (pathname === entry.prefix || pathname.startsWith(entry.prefix + "/")) return entry.module;
  }
  return null;
}

export function moduleForPath(pathname: string): ModuleKey | null {
  if (pathname === "/scp") return "dashboard";
  if (pathname.startsWith("/scp/no-access")) return null;
  for (const entry of PATH_MODULES) {
    if (pathname === entry.prefix || (!entry.exactOnly && pathname.startsWith(entry.prefix + "/"))) {
      return entry.module;
    }
  }
  return null;
}

export function firstAccessibleHref(
  role: string,
  permissions: readonly string[] | null | undefined
): string | null {
  if (role === "superadmin" || role === "admin") return "/scp";
  if (role !== "petugas") return "/scp";
  const granted = GRANTABLE_MODULES.find((module) =>
    hasModuleAccess("petugas", permissions, module.key)
  );
  return granted?.href ?? null;
}
