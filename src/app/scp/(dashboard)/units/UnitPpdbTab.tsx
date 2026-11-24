"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/get-error-message";
import { PpdbScheduleEditor } from "@/components/scp/PpdbScheduleEditor";
import { defaultPpdbConfig, type PpdbConfig } from "@/lib/ppdb-config";
import type { Unit } from "./UnitsManager";

function UnitPpdbForm({ unit, refresh }: { unit: Unit; refresh: () => void }) {
  const [config, setConfig] = useState<PpdbConfig>(() => defaultPpdbConfig());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/units/${unit.id}/ppdb`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "Gagal memuat jadwal");
        setConfig(data.config ?? defaultPpdbConfig());
      } catch (error: unknown) {
        if (!cancelled) toast.error(getErrorMessage(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [unit.id]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const toastId = toast.loading("Menyimpan jadwal PPDB...");
    try {
      const res = await fetch(`/api/admin/units/${unit.id}/ppdb`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");
      toast.success("Jadwal PPDB tersimpan", { id: toastId });
      refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error), { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-slate-500">Memuat jadwal PPDB...</p>;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <PpdbScheduleEditor value={config} onChange={setConfig} />
      <div className="flex justify-end border-t pt-4">
        <button type="submit" disabled={saving} className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50">
          {saving ? "Menyimpan..." : "Simpan Jadwal PPDB"}
        </button>
      </div>
    </form>
  );
}

export function UnitPpdbTab({ units, refresh, userRole }: { units: Unit[]; refresh: () => void; userRole?: string }) {
  const isUnitAdmin = userRole === "admin_unit";
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const activeId = selectedId && units.some((item) => item.id === selectedId) ? selectedId : units[0]?.id ?? null;
  const unit = units.find((item) => item.id === activeId) ?? units[0] ?? null;

  if (units.length === 0) return <p className="text-slate-500">Belum ada unit.</p>;
  if (!unit) return null;

  return (
    <div className="space-y-6">
      {!isUnitAdmin ? (
        <div>
          <label className="mb-1 block text-sm font-medium">Unit</label>
          <select value={activeId ?? ""} onChange={(event) => setSelectedId(Number(event.target.value))} className="w-full rounded border p-2">
            {units.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
      ) : null}
      <UnitPpdbForm key={unit.id} unit={unit} refresh={refresh} />
    </div>
  );
}