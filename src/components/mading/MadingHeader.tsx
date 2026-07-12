"use client";
import Link from "next/link";
import { useMadingTheme } from "./ThemeProvider";
import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { UserAvatar } from "./UserAvatar";

const roleLabel: Record<string, string> = {
  guru: "Guru",
  siswa: "Siswa",
  admin_unit: "Admin Unit",
  admin: "Admin",
  superadmin: "Superadmin",
};

export function MadingHeader() {
  const brand = useMadingTheme();
  const { data: session, status } = useSession();
  const logo = brand.logo_url || (brand.slug ? `/${brand.slug}.png` : null) || "/logo.png";
  const authed = status === "authenticated" && session?.user;
  const dashboardHref =
    authed
      ? session!.user.role === "siswa"
        ? "/mading/siswa/dashboard"
        : "/mading/guru/dashboard"
      : "/mading/login";

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href={brand.slug ? `/mading/${brand.slug}` : "/mading"} className="flex items-center gap-3">
            <img src={logo} alt={brand.name} className="h-10 w-10 rounded-full object-cover" onError={(e) => { e.currentTarget.src = "/logo.png"; }} />
            <div>
              <h1 className="font-bold text-lg" style={{ color: brand.primary_color }}>{brand.name}</h1>
              {brand.tagline && <p className="text-xs text-gray-500 -mt-0.5">{brand.tagline}</p>}
            </div>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-5">
            <Link href="/mading" className="text-sm font-medium text-gray-600 hover:text-gray-900">Semua Unit</Link>
            {authed ? (
              <div className="flex items-center gap-3">
                <Link href={dashboardHref} className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900">
                  <UserAvatar name={session!.user.name} photo={session!.user.photo} size={32} className="rounded-full" />
                  <span className="flex flex-col leading-tight">
                    <span className="text-xs font-semibold text-gray-900">{session!.user.name}</span>
                    <span className="text-[11px] text-gray-400">{roleLabel[session!.user.role] || session!.user.role}</span>
                  </span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/mading" })}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            ) : (
              <Link href="/mading/login" className="text-sm font-medium text-primary-600 hover:text-primary-700">Masuk</Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
