import { Toaster } from "sonner";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Home, SettingsIcon, Users, Image as ImageIcon, MessageSquare, Calendar, FileText, UserCog, UserCircle, Database } from "lucide-react";
import { SidebarLayout } from "./SidebarLayout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/scp/login");
  }

  const navItems = [
    { name: "Dashboard", href: "/scp", icon: Home, roles: ["superadmin", "admin", "editor"] as const },
    { name: "Units & Programs", href: "/scp/units", icon: Users, roles: ["superadmin", "admin"] as const },
    { name: "News & Articles", href: "/scp/news", icon: FileText, roles: ["superadmin", "admin", "editor"] as const },
    { name: "Gallery", href: "/scp/gallery", icon: ImageIcon, roles: ["superadmin", "admin", "editor"] as const },
    { name: "Testimonials & FAQ", href: "/scp/testimonials", icon: MessageSquare, roles: ["superadmin", "admin"] as const },
    { name: "Events Calendar", href: "/scp/events", icon: Calendar, roles: ["superadmin", "admin", "editor"] as const },
    { name: "PPDB Data", href: "/scp/ppdb", icon: Users, roles: ["superadmin", "admin"] as const },
    { name: "Pengaturan PPDB", href: "/scp/ppdb/settings", icon: SettingsIcon, roles: ["superadmin", "admin"] as const },
    { name: "Manajemen Pengguna", href: "/scp/users", icon: UserCog, roles: ["superadmin", "admin"] as const },
    { name: "Backup Database", href: "/scp/backup", icon: Database, roles: ["superadmin", "admin"] as const },
    { name: "Profil Saya", href: "/scp/profile", icon: UserCircle, roles: ["superadmin", "admin", "editor"] as const },
    { name: "Settings", href: "/scp/settings", icon: SettingsIcon, roles: ["superadmin", "admin"] as const },
  ];

  const userRole = session.user.role || "editor";
  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole as any));

  return (
    <>
      <Toaster position="top-right" richColors />
      <SidebarLayout navItems={filteredNavItems} userName={session.user?.name} userRole={userRole}>
        {children}
      </SidebarLayout>
    </>
  );
}
