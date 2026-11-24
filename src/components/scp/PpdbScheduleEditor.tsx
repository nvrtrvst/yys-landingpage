"use client";

import { Plus, Trash2 } from "lucide-react";
import type { PpdbConfig, PpdbScheduleItem } from "@/lib/ppdb-config";

const inputClass = "w-full rounded border border-slate-300 px-3 py-2 text-[16px] focus:ring-2 focus:ring-primary-500 md:px-2 md:py-1 md:text-sm";
const labelClass = "mb-1 block text-sm font-medium";

export function PpdbScheduleEditor({ value, onChange }: { value: PpdbConfig; onChange: (next: PpdbConfig) => void }) {
  const update = (patch: Partial<PpdbConfig>) => onChange({ ...value, ...patch });

  const updateRow = (index: number, field: keyof PpdbScheduleItem, next: string) => {
    const schedules = value.schedules.map((item, position) => position === index ? { ...item, [field]: next } : item);
    update({ schedules });
  };

  const addRow = () => update({ schedules: [...value.schedules, { activity: "", wave1: "", wave2: "" }] });
  const removeRow = (index: number) => update({ schedules: value.schedules.filter((_, position) => position !== index) });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="academic_year">Tahun Pelajaran</label>
          <input id="academic_year" type="text" value={value.academic_year} onChange={(e) => update({ academic_year: e.target.value })} placeholder="Contoh: 2026-2027" className={inputClass} required />
        </div>
        <div>
          <label className={labelClass} htmlFor="committee_name">Nama Ketua Panitia PPDB</label>
          <input id="committee_name" type="text" value={value.committee_name} onChange={(e) => update({ committee_name: e.target.value })} placeholder="Contoh: DADANG SAEPUDIN, SE." className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="headmaster_name">Nama Kepala Sekolah</label>
          <input id="headmaster_name" type="text" value={value.headmaster_name} onChange={(e) => update({ headmaster_name: e.target.value })} placeholder="Contoh: DASEP GUNAWAN, S.Pd." className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="wave1_label">Label Gelombang 1</label>
            <input id="wave1_label" type="text" value={value.wave1_label} onChange={(e) => update({ wave1_label: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="wave2_label">Label Gelombang 2</label>
            <input id="wave2_label" type="text" value={value.wave2_label} onChange={(e) => update({ wave2_label: e.target.value })} className={inputClass} />
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between border-b pb-2">
          <h3 className="text-xl font-bold">Jadwal Kegiatan SPMB</h3>
          <button type="button" onClick={addRow} className="flex items-center gap-1 rounded bg-slate-100 px-3 py-1 text-sm text-slate-800 hover:bg-slate-200">
            <Plus size={16} /> Tambah Baris
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border text-left text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="w-1/3 border-r p-3">Uraian Kegiatan</th>
                <th className="w-1/3 border-r p-3">{value.wave1_label || "Gelombang 1"} (Hari/Tanggal)</th>
                <th className="w-1/3 border-r p-3">{value.wave2_label || "Gelombang 2"} (Hari/Tanggal)</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {value.schedules.map((item, index) => (
                <tr key={index} className="border-b hover:bg-slate-50">
                  <td className="border-r p-2">
                    <input type="text" value={item.activity} onChange={(e) => updateRow(index, "activity", e.target.value)} className={inputClass} placeholder="Nama Kegiatan..." />
                  </td>
                  <td className="border-r p-2">
                    <input type="text" value={item.wave1} onChange={(e) => updateRow(index, "wave1", e.target.value)} className={inputClass} placeholder="Misal: 1 Maret - 24 April" />
                  </td>
                  <td className="border-r p-2">
                    <input type="text" value={item.wave2} onChange={(e) => updateRow(index, "wave2", e.target.value)} className={inputClass} placeholder="Kosongkan jika tidak ada" />
                  </td>
                  <td className="p-2 text-center">
                    <button type="button" onClick={() => removeRow(index)} className="p-1 text-rose-500 hover:text-rose-700" title="Hapus baris">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {value.schedules.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">Tidak ada jadwal. Klik &quot;Tambah Baris&quot; untuk menambahkan.</p>
        ) : null}
      </section>
    </div>
  );
}