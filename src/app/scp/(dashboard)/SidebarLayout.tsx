"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, SettingsIcon, Users, Image as ImageIcon, MessageSquare, Calendar, FileText, LogOut, UserCog, UserCircle, Database, Menu, X } from "lucide-react";
import { SignOutButton } from "./SignOutButton";

export function SidebarLayout({
  children,
  navItems,
  userName,
  userRole,
}: {
  children: React.ReactNode;
  navItems: { name: string; href: string; icon: any }[];
  userName?: string | null;
  userRole: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          {navItems.map((item) => (
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
