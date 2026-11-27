"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { UNIT_TABS, type UnitTab } from "@/lib/unit-navigation";

const TAB_LABELS: Record<UnitTab, string> = {
  units: "Unit Sekolah",
  programs: "Program Unggulan",
  media: "Media Unit",
  ppdb: "Jadwal PPDB",
};

export function UnitTabs({ active }: { active: UnitTab }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefFor = (tab: UnitTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "units") params.delete("tab");
    else params.set("tab", tab);
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  return (
    <div role="tablist" aria-label="Bagian pengaturan unit" className="grid grid-cols-2 border-b border-slate-200 md:flex">
      {UNIT_TABS.map((tab) => {
        const isActive = tab === active;
        return (
          <Link
            key={tab}
            role="tab"
            id={`tab-${tab}`}
            aria-selected={isActive}
            aria-controls={`panel-${tab}`}
            href={hrefFor(tab)}
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
              event.preventDefault();
              router.push(hrefFor(tab), { scroll: false });
            }}
            className={`flex w-full min-h-11 items-center justify-center px-3 py-3 text-center font-semibold md:flex-1 md:py-4 ${
              isActive ? "border-b-2 border-primary-600 text-primary-700" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {TAB_LABELS[tab]}
          </Link>
        );
      })}
    </div>
  );
}