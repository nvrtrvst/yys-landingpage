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

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles: string[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const dashboardItem: NavItem = {
  name: "Dashboard",
  href: "/scp",
  icon: Home,
  roles: ["superadmin", "admin", "editor"],
};

export const navSections: NavSection[] = [
  {
    label: "PPDB",
    items: [
      { name: "Data Pendaftar", href: "/scp/ppdb", icon: Users, roles: ["superadmin", "admin"] },
      { name: "Pengaturan PPDB", href: "/scp/ppdb/settings", icon: SettingsIcon, roles: ["superadmin", "admin"] },
    ],
  },
  {
    label: "Konten",
    items: [
      { name: "Units & Program", href: "/scp/units", icon: Users, roles: ["superadmin", "admin"] },
      { name: "Berita & Artikel", href: "/scp/news", icon: FileText, roles: ["superadmin", "admin", "editor"] },
      { name: "Galeri", href: "/scp/gallery", icon: ImageIcon, roles: ["superadmin", "admin", "editor"] },
      { name: "Testimoni & FAQ", href: "/scp/testimonials", icon: MessageSquare, roles: ["superadmin", "admin"] },
      { name: "Agenda", href: "/scp/events", icon: Calendar, roles: ["superadmin", "admin", "editor"] },
    ],
  },
  {
    label: "Mading",
    items: [
      { name: "Dashboard", href: "/scp/mading", icon: BarChart3, roles: ["superadmin", "admin", "admin_unit", "guru"] },
      { name: "Tulisan & Moderasi", href: "/scp/mading/posts", icon: Newspaper, roles: ["superadmin", "admin", "admin_unit", "guru"] },
      { name: "Kategori", href: "/scp/mading/categories", icon: FolderOpen, roles: ["superadmin", "admin", "admin_unit"] },
      { name: "Komentar", href: "/scp/mading/comments", icon: Shield, roles: ["superadmin", "admin", "admin_unit"] },
      { name: "Pengguna Mading", href: "/scp/mading/users", icon: UserCircle, roles: ["superadmin", "admin", "admin_unit"] },
      { name: "Audit Log", href: "/scp/mading/audit-logs", icon: Shield, roles: ["superadmin", "admin", "admin_unit"] },
      { name: "Pengaturan Mading", href: "/scp/mading/settings", icon: SettingsIcon, roles: ["superadmin", "admin", "admin_unit"] },
    ],
  },
  {
    label: "Sistem",
    items: [
      { name: "Manajemen Pengguna", href: "/scp/users", icon: UserCog, roles: ["superadmin", "admin"] },
      { name: "Pengaturan Global", href: "/scp/settings", icon: SettingsIcon, roles: ["superadmin", "admin"] },
      { name: "Backup Database", href: "/scp/backup", icon: Database, roles: ["superadmin", "admin"] },
      { name: "Profil Saya", href: "/scp/profile", icon: UserCircle, roles: ["superadmin", "admin", "editor"] },
    ],
  },
];

export function findActiveHref(pathname: string, hrefs: string[]): string | null {
  let best: string | null = null;
  for (const href of hrefs) {
    const matches = href === "/scp" ? pathname === "/scp" : pathname === href || pathname.startsWith(href + "/");
    if (matches && (best === null || href.length > best.length)) best = href;
  }
  return best;
}
