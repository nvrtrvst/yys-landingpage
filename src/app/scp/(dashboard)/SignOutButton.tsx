"use client";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: `${window.location.origin}/scp/login` })}
      title={collapsed ? "Logout" : undefined}
      aria-label={collapsed ? "Logout" : undefined}
      className={`flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 ${
        collapsed ? "md:justify-center md:px-2" : ""
      }`}
    >
      <LogOut className={`h-5 w-5 flex-shrink-0 ${collapsed ? "mr-3 md:mr-0" : "mr-3"}`} aria-hidden="true" />
      <span className={collapsed ? "md:hidden" : ""}>Logout</span>
    </button>
  );
}
