"use client";

import { TABS, type TabKey } from "./shared";

export function TabsGrid({
  activeTab,
  counts,
  onChange,
}: {
  activeTab: TabKey;
  counts: Record<TabKey, number>;
  onChange: (tab: TabKey) => void;
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {TABS.map((t) => {
        const Icon = t.icon;
        const active = activeTab === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`text-left bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4 transition-all hover:shadow-md ${
              active ? "border-primary-300 ring-2 ring-primary-100" : "border-gray-100"
            }`}
          >
            <div className={`h-12 w-12 rounded-xl bg-linear-to-br ${t.ring} flex items-center justify-center shrink-0`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 leading-none">{counts[t.key]}</p>
              <p className="text-sm text-gray-500 mt-1">{t.label}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
