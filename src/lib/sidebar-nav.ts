import {
  Home,
  SettingsIcon,
  Users,
  Image as ImageIcon,
  MessageSquare,
  Calendar,
  FileText,
  UserCog,
  UserCircle,
  Database,
  Newspaper,
  FolderOpen,
  BarChart3,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { hasModuleAccess, MODULES_BY_KEY, type ModuleKey } from "@/lib/modules";
import { parseUnitTab } from "@/lib/unit-navigation";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles: string[];
  module: ModuleKey;
  group?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const dashboardItem: NavItem = {
  name: "Dashboard",
  href: "/scp",
  icon: Home,
  roles: ["superadmin", "admin", "admin_unit", "editor"],
  module: "dashboard",
};

export const navSections: NavSection[] = [
  {
    label: "Konten Publik",
    items: [
      { name: "Berita & Artikel", href: "/scp/news", icon: FileText, roles: ["superadmin", "admin", "admin_unit", "editor"], module: "news" },
      { name: "Agenda Kegiatan", href: "/scp/events", icon: Calendar, roles: ["superadmin", "admin", "admin_unit", "editor"], module: "events" },
      { name: "Galeri Foto", href: "/scp/gallery", icon: ImageIcon, roles: ["superadmin", "admin", "admin_unit", "editor"], module: "gallery" },
      { name: "Testimoni & Tanya Jawab", href: "/scp/testimonials", icon: MessageSquare, roles: ["superadmin", "admin", "admin_unit"], module: "testimonials" },
    ],
  },
  {
    label: "Penerimaan Siswa",
    items: [
      { name: "Data Pendaftar", href: "/scp/ppdb", icon: Users, roles: ["superadmin", "admin"], module: "ppdb_data" },
      { name: "Pengaturan Kartu Peserta", href: "/scp/ppdb/settings", icon: SettingsIcon, roles: ["superadmin", "admin"], module: "ppdb_settings" },
    ],
  },
  {
    label: "Website & Identitas",
    items: [
      { name: "Website Yayasan", href: "/scp/settings", icon: SettingsIcon, roles: ["superadmin", "admin"], module: "settings" },
      { name: "Identitas & Tampilan", group: "Website Unit Sekolah", href: "/scp/units", icon: Users, roles: ["superadmin", "admin", "admin_unit"], module: "units" },
      { name: "Program Unggulan", group: "Website Unit Sekolah", href: "/scp/units?tab=programs", icon: FileText, roles: ["superadmin", "admin", "admin_unit"], module: "units" },
      { name: "Foto & Video", group: "Website Unit Sekolah", href: "/scp/units?tab=media", icon: ImageIcon, roles: ["superadmin", "admin", "admin_unit"], module: "units" },
      { name: "Jadwal PPDB", group: "Website Unit Sekolah", href: "/scp/units?tab=ppdb", icon: Calendar, roles: ["superadmin", "admin", "admin_unit"], module: "units" },
    ],
  },
  {
    label: "Mading",
    items: [
      { name: "Ringkasan Mading", href: "/scp/mading", icon: BarChart3, roles: ["superadmin", "admin", "admin_unit", "guru"], module: "mading_dashboard" },
      { name: "Tulisan & Moderasi", href: "/scp/mading/posts", icon: Newspaper, roles: ["superadmin", "admin", "admin_unit", "guru"], module: "mading_posts" },
      { name: "Kategori", href: "/scp/mading/categories", icon: FolderOpen, roles: ["superadmin", "admin", "admin_unit"], module: "mading_categories" },
      { name: "Komentar", href: "/scp/mading/comments", icon: Shield, roles: ["superadmin", "admin", "admin_unit"], module: "mading_comments" },
      { name: "Pengguna Mading", href: "/scp/mading/users", icon: UserCircle, roles: ["superadmin", "admin", "admin_unit"], module: "mading_users" },
      { name: "Riwayat Aktivitas", href: "/scp/mading/audit-logs", icon: Shield, roles: ["superadmin", "admin", "admin_unit"], module: "mading_audit" },
      { name: "Pengaturan Mading", href: "/scp/mading/settings", icon: SettingsIcon, roles: ["superadmin", "admin", "admin_unit"], module: "mading_settings" },
    ],
  },
  {
    label: "Akun & Sistem",
    items: [
      { name: "Pengguna & Hak Akses", href: "/scp/users", icon: UserCog, roles: ["superadmin", "admin"], module: "users" },
      { name: "Backup Database", href: "/scp/backup", icon: Database, roles: ["superadmin", "admin"], module: "backup" },
      { name: "Profil Saya", href: "/scp/profile", icon: UserCircle, roles: ["superadmin", "admin", "admin_unit", "editor"], module: "profile" },
    ],
  },
];

export function canSeeNavItem(item: NavItem, role: string, permissions: readonly string[]): boolean {
  if (role === "superadmin" || role === "admin") return true;
  if (role === "petugas") return item.module === "profile" || (MODULES_BY_KEY[item.module].grantable && hasModuleAccess(role, permissions, item.module));
  return item.roles.includes(role);
}

export function findActiveHref(pathname: string, hrefs: string[], search = ""): string | null {
  const params = new URLSearchParams(search);
  let best: string | null = null;
  for (const href of hrefs) {
    const [path, query] = href.split("?");
    if (pathname === "/scp/units" && path === "/scp/units") {
      if (parseUnitTab(params.get("tab")) !== parseUnitTab(new URLSearchParams(query).get("tab"))) continue;
    } else if (query) continue;
    const matches = path === "/scp" ? pathname === "/scp" : pathname === path || pathname.startsWith(path + "/");
    if (matches && (best === null || href.length > best.length)) best = href;
  }
  return best;
}
