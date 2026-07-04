"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface ScheduleItem {
  activity: string;
  wave1: string;
  wave2: string;
}

interface PPDBConfig {
  academic_year: string;
  headmaster_name: string;
  committee_name: string;
  schedules: ScheduleItem[];
}

const defaultSchedules: ScheduleItem[] = [
  { activity: "Pendaftaran SPMB", wave1: "", wave2: "" },
  { activity: "Rapat Orang Tua Peserta Didik Baru", wave1: "", wave2: "" },
  { activity: "Daftar Ulang Peserta Didik Baru", wave1: "", wave2: "" },
  { activity: "Seleksi Tes & Penelusuran Pemilihan Jurusan", wave1: "", wave2: "" },
  { activity: "Pengumuman Peserta Didik yang diterima", wave1: "", wave2: "" },
  { activity: "Pembekalan MPLS", wave1: "", wave2: "" },
  { activity: "Pelaksanaan MPLS & Orientasi Ekstrakurikuler", wave1: "", wave2: "" },
  { activity: "Belajar Efektif Tahun Pelajaran", wave1: "", wave2: "" },
];

export function PPDBSettingsForm({ initialConfig }: { initialConfig: PPDBConfig | null }) {
  const [formData, setFormData] = useState<PPDBConfig>({
    academic_year: initialConfig?.academic_year || "2026-2027",
    headmaster_name: initialConfig?.headmaster_name || "",
    committee_name: initialConfig?.committee_name || "",
    schedules: initialConfig?.schedules && initialConfig.schedules.length > 0 ? initialConfig.schedules : defaultSchedules,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleScheduleChange = (index: number, field: keyof ScheduleItem, value: string) => {
    const newSchedules = [...formData.schedules];
    newSchedules[index][field] = value;
    setFormData({ ...formData, schedules: newSchedules });
  };

  const addScheduleRow = () => {
    setFormData({
      ...formData,
      schedules: [...formData.schedules, { activity: "", wave1: "", wave2: "" }]
    });
  };

  const removeScheduleRow = (index: number) => {
    const newSchedules = formData.schedules.filter((_, i) => i !== index);
    setFormData({ ...formData, schedules: newSchedules });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading("Menyimpan pengaturan...");
    
    try {
      const payload = {
        ppdb_config: JSON.stringify(formData)
      };

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");
      toast.success("Pengaturan PPDB berhasil disimpan!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Identitas PPDB */}
      <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-xl font-bold mb-4 border-b pb-2">Informasi Dasar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Tahun Pelajaran</label>
            <input type="text" name="academic_year" value={formData.academic_year} onChange={handleChange} placeholder="Contoh: 2026-2027" className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500" required />
          </div>
          <div className="hidden md:block"></div>
          <div>
            <label className="block text-sm font-medium mb-1">Nama Kepala Sekolah</label>
            <input type="text" name="headmaster_name" value={formData.headmaster_name} onChange={handleChange} placeholder="Contoh: DASEP GUNAWAN, S.Pd." className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nama Ketua Panitia PPDB</label>
            <input type="text" name="committee_name" value={formData.committee_name} onChange={handleChange} placeholder="Contoh: DADANG SAEPUDIN, SE." className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500" required />
          </div>
        </div>
      </section>

      {/* Jadwal Kegiatan */}
      <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-xl font-bold">Jadwal Kegiatan SPMB</h3>
          <button type="button" onClick={addScheduleRow} className="flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-3 rounded">
            <Plus size={16} /> Tambah Baris
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 border-r w-1/3">Uraian Kegiatan</th>
                <th className="p-3 border-r w-1/3">Gelombang 1 (Hari/Tanggal)</th>
                <th className="p-3 border-r w-1/3">Gelombang 2 (Hari/Tanggal)</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {formData.schedules.map((item, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-2 border-r">
                    <input 
                      type="text" 
                      value={item.activity} 
                      onChange={(e) => handleScheduleChange(index, "activity", e.target.value)} 
                      className="w-full border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-primary-500" 
                      placeholder="Nama Kegiatan..."
                    />
                  </td>
                  <td className="p-2 border-r">
                    <input 
                      type="text" 
                      value={item.wave1} 
                      onChange={(e) => handleScheduleChange(index, "wave1", e.target.value)} 
                      className="w-full border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-primary-500"
                      placeholder="Misal: 1 Maret - 24 April"
                    />
                  </td>
                  <td className="p-2 border-r">
                    <input 
                      type="text" 
                      value={item.wave2} 
                      onChange={(e) => handleScheduleChange(index, "wave2", e.target.value)} 
                      className="w-full border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-primary-500"
                      placeholder="Kosongkan jika tidak ada"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button type="button" onClick={() => removeScheduleRow(index)} className="text-red-500 hover:text-red-700 p-1" title="Hapus baris">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {formData.schedules.length === 0 && (
          <p className="text-center text-gray-500 py-4 text-sm">Tidak ada jadwal. Klik "Tambah Baris" untuk menambahkan.</p>
        )}
      </section>

      {/* Submit Button */}
      <div className="flex justify-end sticky bottom-6">
        <button 
          type="submit" 
          disabled={isSaving}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>
    </form>
  );
}
