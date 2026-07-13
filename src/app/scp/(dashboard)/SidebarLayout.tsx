"use client";

import { useState } from "react";
import { Toaster } from "sonner";
import Link from "next/link";
import { Home, SettingsIcon, Users, Image as ImageIcon, MessageSquare, Calendar, FileText, LogOut, UserCog, UserCircle, Database, Menu, X, Newspaper, FolderOpen, BarChart3, Shield } from "lucide-react";
import { SignOutButton } from "./SignOutButton";

const navItems = [
  { name: "Dashboard", href: "/scp", icon: Home, roles: ["superadmin", "admin", "editor"] },
  { name: "Units & Programs", href: "/scp/units", icon: Users, roles: ["superadmin", "admin"] },
  { name: "News & Articles", href: "/scp/news", icon: FileText, roles: ["superadmin", "admin", "editor"] },
  { name: "Gallery", href: "/scp/gallery", icon: ImageIcon, roles: ["superadmin", "admin", "editor"] },
  { name: "Testimonials & FAQ", href: "/scp/testimonials", icon: MessageSquare, roles: ["superadmin", "admin"] },
  { name: "Events Calendar", href: "/scp/events", icon: Calendar, roles: ["superadmin", "admin", "editor"] },
  { name: "PPDB Data", href: "/scp/ppdb", icon: Users, roles: ["superadmin", "admin"] },
  { name: "Pengaturan PPDB", href: "/scp/ppdb/settings", icon: SettingsIcon, roles: ["superadmin", "admin"] },
  // Mading Online
  { name: "Mading Dashboard", href: "/scp/mading", icon: BarChart3, roles: ["superadmin", "admin", "admin_unit", "guru"] },
  { name: "Mading Audit Log", href: "/scp/mading/audit-logs", icon: Shield, roles: ["superadmin", "admin", "admin_unit"] },
  { name: "Mading Settings", href: "/scp/mading/settings", icon: SettingsIcon, roles: ["superadmin", "admin", "admin_unit"] },
  { name: "Mading Posts", href: "/scp/mading/posts", icon: Newspaper, roles: ["superadmin", "admin", "admin_unit", "guru"] },
  { name: "Mading Kategori", href: "/scp/mading/categories", icon: FolderOpen, roles: ["superadmin", "admin", "admin_unit"] },
  { name: "Mading Users", href: "/scp/mading/users", icon: UserCircle, roles: ["superadmin", "admin", "admin_unit"] },
  { name: "Mading Moderasi", href: "/scp/mading/comments", icon: Shield, roles: ["superadmin", "admin", "admin_unit"] },
  { name: "Manajemen Pengguna", href: "/scp/users", icon: UserCog, roles: ["superadmin", "admin"] },
  { name: "Backup Database", href: "/scp/backup", icon: Database, roles: ["superadmin", "admin"] },
  { name: "Profil Saya", href: "/scp/profile", icon: UserCircle, roles: ["superadmin", "admin", "editor"] },
  { name: "Settings", href: "/scp/settings", icon: SettingsIcon, roles: ["superadmin", "admin"] },
];

export function SidebarLayout({
  children,
  userName,
  userRole,
}: {
  children: React.ReactNode;
  userName?: string | null;
  userRole: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-md flex flex-col transform transition-transform duration-200 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 md:static md:flex-shrink-0`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-green-700">CMS Admin</span>
          <button className="md:hidden p-1 rounded-md text-gray-500 hover:bg-gray-100" onClick={() => setSidebarOpen(false)} aria-label="Tutup sidebar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
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
        <Toaster position="top-right" richColors />
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100" onClick={() => setSidebarOpen(true)} aria-label="Buka sidebar">
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
          </div>
          <div className="flex items-center">
            <div className="text-right mr-4">
              <div className="text-sm font-semibold text-gray-900">{userName}</div>
              <div className="text-xs text-gray-500 capitalize">{userRole}</div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
