"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import Link from "next/link";
import { Menu, X, PanelLeftClose, PanelLeftOpen, ChevronDown, ChevronRight } from "lucide-react";
import { SignOutButton } from "./SignOutButton";
import { dashboardItem, findActiveHref, navSections, type NavItem } from "@/lib/sidebar-nav";

const PREF_EVENT = "scp-sidebar-prefs";
const COLLAPSED_KEY = "scp_sidebar_collapsed";
const SECTIONS_KEY = "scp_nav_sections";

const defaultOpenSections = () =>
  Object.fromEntries(navSections.map((section) => [section.label, true])) as Record<string, boolean>;

const sectionSlug = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const subscribePrefs = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener(PREF_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(PREF_EVENT, callback);
  };
};

const readCollapsed = () => {
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) ?? "0";
  } catch {
    return "0";
  }
};

const readSections = () => {
  try {
    return window.localStorage.getItem(SECTIONS_KEY) ?? "";
  } catch {
    return "";
  }
};

const serverCollapsed = () => "0";
const serverSections = () => "";

const parseSections = (raw: string): Record<string, boolean> => {
  const defaults = defaultOpenSections();
  if (!raw) return defaults;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaults;
    const values = parsed as Record<string, unknown>;
    for (const section of navSections) {
      const value = values[section.label];
      if (typeof value === "boolean") defaults[section.label] = value;
    }
  } catch {
    // Ignore malformed persisted data and keep the defaults.
  }
  return defaults;
};

const writePrefs = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    return;
  }
  window.dispatchEvent(new Event(PREF_EVENT));
};

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.name : undefined}
      aria-label={collapsed ? item.name : undefined}
      aria-current={active ? "page" : undefined}
      className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100 ${
        collapsed ? "md:justify-center md:px-2" : ""
      } ${active ? "bg-primary-50 text-primary-700" : "text-slate-700 hover:bg-slate-50 hover:text-primary-700"}`}
    >
      <Icon
        className={`h-5 w-5 shrink-0 ${collapsed ? "mr-3 md:mr-0" : "mr-3"} ${active ? "text-primary-600" : "text-slate-400"}`}
        aria-hidden="true"
      />
      <span className={collapsed ? "md:hidden" : ""}>{item.name}</span>
    </Link>
  );
}

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
  const pathname = usePathname();

  const collapsedRaw = useSyncExternalStore(subscribePrefs, readCollapsed, serverCollapsed);
  const sectionsRaw = useSyncExternalStore(subscribePrefs, readSections, serverSections);
  const collapsed = collapsedRaw === "1";
  const openSections = useMemo(() => parseSections(sectionsRaw), [sectionsRaw]);

  const visibleSections = useMemo(
    () =>
      navSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => item.roles.includes(userRole)),
        }))
        .filter((section) => section.items.length > 0),
    [userRole]
  );

  const showDashboard = dashboardItem.roles.includes(userRole);
  const visibleHrefs = useMemo(
    () => [
      ...(showDashboard ? [dashboardItem.href] : []),
      ...visibleSections.flatMap((section) => section.items.map((item) => item.href)),
    ],
    [showDashboard, visibleSections]
  );
  const activeHref = findActiveHref(pathname, visibleHrefs);

  useEffect(() => {
    if (!activeHref) return;
    const section = visibleSections.find((entry) => entry.items.some((item) => item.href === activeHref));
    if (!section) return;
    const current = parseSections(readSections());
    if (current[section.label]) return;
    writePrefs(SECTIONS_KEY, JSON.stringify({ ...current, [section.label]: true }));
  }, [activeHref, visibleSections]);

  const closeMobile = () => setSidebarOpen(false);
  const toggleCollapsed = () => writePrefs(COLLAPSED_KEY, collapsed ? "0" : "1");
  const toggleSection = (label: string) => {
    const current = parseSections(readSections());
    writePrefs(SECTIONS_KEY, JSON.stringify({ ...current, [label]: !(current[label] ?? true) }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeMobile} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-[width,transform] duration-200 ease-in-out ${
          collapsed ? "md:w-20" : "md:w-64"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:flex-shrink-0`}
      >
        <div className={`h-16 flex items-center border-b border-slate-200 ${collapsed ? "px-3 md:justify-center" : "px-4"}`}>
          <img
            src="/logo.png"
            alt="Logo Yayasan Nuurul Muttaqiin"
            className="h-9 w-9 shrink-0 rounded-lg object-contain"
            loading="eager"
            decoding="async"
          />
          <span className={`ml-3 truncate text-lg font-bold text-primary-700 ${collapsed ? "md:hidden" : ""}`}>
            CMS Admin
          </span>
          <button
            className="md:hidden ml-auto p-1 rounded-md text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"
            onClick={closeMobile}
            aria-label="Tutup sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-3 overflow-y-auto" aria-label="Navigasi admin">
          {showDashboard && (
            <NavLink
              item={dashboardItem}
              active={activeHref === dashboardItem.href}
              collapsed={collapsed}
              onNavigate={closeMobile}
            />
          )}

          {visibleSections.map((section) => {
            const open = openSections[section.label] ?? true;
            const slug = sectionSlug(section.label);
            return (
              <div
                key={section.label}
                className={`pt-3 ${collapsed ? "md:mt-2 md:border-t md:border-slate-100 md:pt-2" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => toggleSection(section.label)}
                  aria-expanded={open}
                  aria-controls={`nav-group-${slug}`}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100 ${
                    collapsed ? "md:hidden" : ""
                  }`}
                >
                  <span>{section.label}</span>
                  {open ? (
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </button>

                <div
                  id={`nav-group-${slug}`}
                  role="group"
                  aria-label={section.label}
                  className={`mt-1 space-y-0.5 ${open ? "" : collapsed ? "hidden md:block" : "hidden"}`}
                >
                  {section.items.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      active={activeHref === item.href}
                      collapsed={collapsed}
                      onNavigate={closeMobile}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <SignOutButton collapsed={collapsed} />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Toaster position="top-right" richColors />
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-md text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
            <button
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
              aria-pressed={collapsed}
              className="hidden md:inline-flex items-center justify-center rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"
            >
              {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
            <h1 className="text-lg font-semibold text-slate-900">Admin Panel</h1>
          </div>
          <div className="flex items-center">
            <div className="text-right mr-4">
              <div className="text-sm font-semibold text-slate-900">{userName}</div>
              <div className="text-xs text-slate-500 capitalize">{userRole}</div>
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
