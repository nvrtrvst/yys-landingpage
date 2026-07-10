"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function SidebarNav({ items }: { items: { name: string; href: string; icon: LucideIcon }[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/scp" && pathname.startsWith(item.href + "/"));
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? "bg-green-50 text-green-700"
                : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? "text-green-600" : "text-gray-400"}`} aria-hidden="true" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
