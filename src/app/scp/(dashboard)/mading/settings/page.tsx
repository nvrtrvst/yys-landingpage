"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, Settings, ToggleLeft, ToggleRight } from "lucide-react";

interface MadingUnitSetting {
  id: number;
  name: string;
  slug: string;
  mading_enabled: number | boolean;
}

interface MadingSettingsData {
  role: string;
  settings: Record<string, string>;
  units: MadingUnitSetting[];
}

export default function MadingSettingsPage() {
  const [data, setData] = useState<MadingSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [global, setGlobal] = useState<Record<string, string>>({});
  const [unitToggles, setUnitToggles] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/mading/settings");
        const d: MadingSettingsData = await res.json();
        if (cancelled) return;
        setData(d);
        setGlobal(d.settings || {});
        const toggles: Record<number, boolean> = {};
        (d.units || []).forEach((u: MadingUnitSetting) => { toggles[u.id] = !!u.mading_enabled; });
        setUnitToggles(toggles);
      } catch {
        toast.error("Gagal memuat");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const canEditGlobal = data && ["superadmin", "admin"].includes(data.role);
  const units = data?.units ?? [];

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (canEditGlobal) body.global = global;
      body.unitUpdates = unitToggles;
      const res = await fetch("/api/mading/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Gagal");
      toast.success("Pengaturan disimpan");
    } catch {
      toast.error("Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-100 rounded" />
      {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
    </div>
  );

  const toggleDefs = [
    { key: "mading_maintenance_mode", label: "Mode Pemeliharaan", desc: "Nonaktifkan semua halaman mading (tampilkan pesan maintenance)" },
    { key: "mading_allow_comments", label: "Izinkan Komentar", desc: "Siswa bisa memberikan komentar pada tulisan" },
    { key: "mading_allow_reactions", label: "Izinkan Reaksi", desc: "Tombol suka pada setiap tulisan" },
    { key: "mading_require_review", label: "Wajib Review Guru", desc: "Tulisan siswa harus direview guru sebelum tayang" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pengaturan Mading</h2>
          <p className="text-sm text-gray-500 mt-1">Konfigurasi global dan per-unit untuk modul mading online</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">
          <Save className="h-4 w-4" />
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>

      {canEditGlobal && (
        <div className="bg-white rounded-xl shadow-sm border mb-6">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Pengaturan Global</h3>
          </div>
          <div className="p-6 space-y-5">
            {toggleDefs.map(t => {
              const val = global[t.key];
              const isOn = val === "1";
              return (
                <div key={t.key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{t.label}</p>
                    <p className="text-sm text-gray-500">{t.desc}</p>
                  </div>
                  <button onClick={() => setGlobal({ ...global, [t.key]: isOn ? "0" : "1" })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isOn ? "bg-green-500" : "bg-gray-300"}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isOn ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {units.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <ToggleRight className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Status Mading per Unit</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {units.map((u: MadingUnitSetting) => (
              <div key={u.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{u.name}</p>
                  <p className="text-xs text-gray-400">/{u.slug}</p>
                </div>
                <button onClick={() => setUnitToggles({ ...unitToggles, [u.id]: !unitToggles[u.id] })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${unitToggles[u.id] ? "bg-green-500" : "bg-gray-300"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${unitToggles[u.id] ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
