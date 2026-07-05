import { Toaster } from "sonner";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Home, SettingsIcon, Users, Image as ImageIcon, MessageSquare, Calendar, FileText, LogOut, UserCog, UserCircle, Database } from "lucide-react";
import { SignOutButton } from "./SignOutButton";

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
    { name: "Dashboard", href: "/scp", icon: Home, roles: ["superadmin", "admin", "editor"] },
    { name: "Units & Programs", href: "/scp/units", icon: Users, roles: ["superadmin", "admin"] },
    { name: "News & Articles", href: "/scp/news", icon: FileText, roles: ["superadmin", "admin", "editor"] },
    { name: "Gallery", href: "/scp/gallery", icon: ImageIcon, roles: ["superadmin", "admin", "editor"] },
    { name: "Testimonials & FAQ", href: "/scp/testimonials", icon: MessageSquare, roles: ["superadmin", "admin"] },
    { name: "Events Calendar", href: "/scp/events", icon: Calendar, roles: ["superadmin", "admin", "editor"] },
    { name: "PPDB Data", href: "/scp/ppdb", icon: Users, roles: ["superadmin", "admin"] },
    { name: "Pengaturan PPDB", href: "/scp/ppdb/settings", icon: SettingsIcon, roles: ["superadmin", "admin"] },
    { name: "Manajemen Pengguna", href: "/scp/users", icon: UserCog, roles: ["superadmin", "admin"] },
    { name: "Backup Database", href: "/scp/backup", icon: Database, roles: ["superadmin", "admin"] },
    { name: "Profil Saya", href: "/scp/profile", icon: UserCircle, roles: ["superadmin", "admin", "editor"] },
    { name: "Settings", href: "/scp/settings", icon: SettingsIcon, roles: ["superadmin", "admin"] },
  ];

  const userRole = (session.user as any)?.role || "editor";
  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex-shrink-0 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-green-700">CMS Admin</span>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-green-600"
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
          <div className="flex items-center">
            <div className="text-right mr-4">
               <div className="text-sm font-semibold text-gray-900">{session.user?.name}</div>
               <div className="text-xs text-gray-500 capitalize">{userRole}</div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <Toaster position="top-right" richColors />
          {children}
        </div>
      </main>
    </div>
  );
}
