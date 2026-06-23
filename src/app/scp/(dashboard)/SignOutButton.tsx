"use client";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/scp/login" })}
      className="flex w-full items-center px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
    >
      <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-red-500" />
      Logout
    </button>
  );
}
