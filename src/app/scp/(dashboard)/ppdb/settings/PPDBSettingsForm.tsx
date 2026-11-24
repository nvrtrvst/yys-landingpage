"use client";

import { getErrorMessage } from "@/lib/get-error-message";
import { useState } from "react";
import { toast } from "sonner";
import { PpdbScheduleEditor } from "@/components/scp/PpdbScheduleEditor";
import { defaultPpdbConfig, type PpdbConfig } from "@/lib/ppdb-config";

export function PPDBSettingsForm({ initialConfig }: { initialConfig: PpdbConfig | null }) {
  const [formData, setFormData] = useState<PpdbConfig>(
    () => initialConfig ?? { ...defaultPpdbConfig(), academic_year: "2026-2027" }
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading("Menyimpan pengaturan...");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ppdb_config: JSON.stringify(formData) }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");
      toast.success("Pengaturan PPDB berhasil disimpan!", { id: toastId });
    } catch (err: unknown) {
      toast.error((getErrorMessage(err)), { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <PpdbScheduleEditor value={formData} onChange={setFormData} />
      </section>

      <div className="sticky bottom-6 flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>
    </form>
  );
}