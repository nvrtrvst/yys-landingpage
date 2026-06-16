"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type Testimonial = { id: number, author_name: string, role: string, content: string, image_url: string, order_index: number, is_active: number };
type Faq = { id: number, question: string, answer: string, category: string, order_index: number, is_active: number };

export function TestimonialsFaqManager() {
  const [activeTab, setActiveTab] = useState<'testimonials' | 'faqs'>('testimonials');
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingTesti, setEditingTesti] = useState<Partial<Testimonial> | null>(null);
  const [editingFaq, setEditingFaq] = useState<Partial<Faq> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, fRes] = await Promise.all([
        fetch('/api/admin/testimonials'),
        fetch('/api/admin/faqs')
      ]);
      if (tRes.ok) setTestimonials(await tRes.json());
      if (fRes.ok) setFaqs(await fRes.json());
    } catch (err) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append("file", file);
    const toastId = toast.loading("Mengunggah...");
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: uploadData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditingTesti(prev => ({ ...prev, image_url: data.url }));
      toast.success("Berhasil", { id: toastId });
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
  };

  const saveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading("Menyimpan...");
    try {
      const payload = {
        ...editingTesti,
        is_active: editingTesti?.is_active ? true : (editingTesti?.is_active === 0 ? false : true)
      };
      const url = editingTesti?.id ? `/api/admin/testimonials/${editingTesti.id}` : `/api/admin/testimonials`;
      const res = await fetch(url, {
        method: editingTesti?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error();
      toast.success("Tersimpan!", { id: toastId });
      setEditingTesti(null);
      fetchData();
    } catch (err) {
      toast.error("Gagal menyimpan", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const saveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading("Menyimpan...");
    try {
      const payload = {
        ...editingFaq,
        is_active: editingFaq?.is_active ? true : (editingFaq?.is_active === 0 ? false : true)
      };
      const url = editingFaq?.id ? `/api/admin/faqs/${editingFaq.id}` : `/api/admin/faqs`;
      const res = await fetch(url, {
        method: editingFaq?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error();
      toast.success("Tersimpan!", { id: toastId });
      setEditingFaq(null);
      fetchData();
    } catch (err) {
      toast.error("Gagal menyimpan", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (type: 'testi'|'faq', id: number) => {
    if (!confirm("Yakin ingin menghapus?")) return;
    const toastId = toast.loading("Menghapus...");
    try {
      const url = type === 'testi' ? `/api/admin/testimonials/${id}` : `/api/admin/faqs/${id}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Dihapus!", { id: toastId });
      fetchData();
    } catch (err) {
      toast.error("Gagal menghapus", { id: toastId });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex border-b">
        <button 
          className={`flex-1 py-4 text-center font-semibold ${activeTab === 'testimonials' ? 'border-b-2 border-primary-600 text-primary-700 bg-gray-50' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => { setActiveTab('testimonials'); setEditingFaq(null); }}
        >
          Testimoni
        </button>
        <button 
          className={`flex-1 py-4 text-center font-semibold ${activeTab === 'faqs' ? 'border-b-2 border-primary-600 text-primary-700 bg-gray-50' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => { setActiveTab('faqs'); setEditingTesti(null); }}
        >
          FAQ (Tanya Jawab)
        </button>
      </div>
      
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Memuat data...</div>
        ) : (
          <>
            {/* TAB TESTIMONIALS */}
            {activeTab === 'testimonials' && (
              editingTesti !== null ? (
                <form onSubmit={saveTestimonial} className="space-y-6">
                  <div className="flex justify-between items-center border-b pb-4">
                    <h3 className="text-xl font-bold">{editingTesti.id ? "Edit Testimoni" : "Tambah Testimoni"}</h3>
                    <button type="button" onClick={() => setEditingTesti(null)} className="text-gray-500">Batal</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nama Pembuat Testimoni *</label>
                      <input type="text" value={editingTesti.author_name || ""} onChange={e => setEditingTesti({...editingTesti, author_name: e.target.value})} className="w-full border rounded p-2" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Peran / Posisi</label>
                      <input type="text" value={editingTesti.role || ""} onChange={e => setEditingTesti({...editingTesti, role: e.target.value})} placeholder="Misal: Orang Tua Siswa, Alumni" className="w-full border rounded p-2" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Isi Testimoni *</label>
                      <textarea value={editingTesti.content || ""} onChange={e => setEditingTesti({...editingTesti, content: e.target.value})} rows={3} className="w-full border rounded p-2" required></textarea>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Foto Profile (Opsional)</label>
                      <div className="flex gap-2">
                        <input type="text" value={editingTesti.image_url || ""} readOnly className="flex-1 border rounded p-2 bg-gray-50" />
                        <input type="file" onChange={handleUpload} className="text-sm border p-1 rounded" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Urutan</label>
                      <input type="number" value={editingTesti.order_index || 0} onChange={e => setEditingTesti({...editingTesti, order_index: parseInt(e.target.value)||0})} className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select value={editingTesti.is_active === 0 ? "0" : "1"} onChange={e => setEditingTesti({...editingTesti, is_active: parseInt(e.target.value)})} className="w-full border rounded p-2">
                        <option value="1">Aktif (Tampil)</option>
                        <option value="0">Sembunyikan</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" disabled={isSaving} className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700">Simpan Testimoni</button>
                </form>
              ) : (
                <div>
                  <button onClick={() => setEditingTesti({})} className="bg-green-600 text-white px-4 py-2 rounded mb-4">+ Tambah Testimoni</button>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b"><th className="p-3">Urutan</th><th className="p-3">Nama</th><th className="p-3">Peran</th><th className="p-3">Status</th><th className="p-3 text-right">Aksi</th></tr>
                    </thead>
                    <tbody>
                      {testimonials.map(t => (
                        <tr key={t.id} className="border-b">
                          <td className="p-3">{t.order_index}</td>
                          <td className="p-3 font-semibold">{t.author_name}</td>
                          <td className="p-3">{t.role}</td>
                          <td className="p-3">{t.is_active ? 'Aktif' : 'Nonaktif'}</td>
                          <td className="p-3 text-right">
                            <button onClick={() => setEditingTesti(t)} className="text-blue-600 mr-3">Edit</button>
                            <button onClick={() => handleDelete('testi', t.id)} className="text-red-600">Hapus</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* TAB FAQS */}
            {activeTab === 'faqs' && (
              editingFaq !== null ? (
                <form onSubmit={saveFaq} className="space-y-6">
                  <div className="flex justify-between items-center border-b pb-4">
                    <h3 className="text-xl font-bold">{editingFaq.id ? "Edit FAQ" : "Tambah FAQ"}</h3>
                    <button type="button" onClick={() => setEditingFaq(null)} className="text-gray-500">Batal</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Pertanyaan *</label>
                      <input type="text" value={editingFaq.question || ""} onChange={e => setEditingFaq({...editingFaq, question: e.target.value})} className="w-full border rounded p-2" required />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Jawaban *</label>
                      <textarea value={editingFaq.answer || ""} onChange={e => setEditingFaq({...editingFaq, answer: e.target.value})} rows={3} className="w-full border rounded p-2" required></textarea>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Kategori</label>
                      <input type="text" value={editingFaq.category || ""} onChange={e => setEditingFaq({...editingFaq, category: e.target.value})} placeholder="Misal: Pendaftaran, Pembayaran" className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Urutan</label>
                      <input type="number" value={editingFaq.order_index || 0} onChange={e => setEditingFaq({...editingFaq, order_index: parseInt(e.target.value)||0})} className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select value={editingFaq.is_active === 0 ? "0" : "1"} onChange={e => setEditingFaq({...editingFaq, is_active: parseInt(e.target.value)})} className="w-full border rounded p-2">
                        <option value="1">Aktif (Tampil)</option>
                        <option value="0">Sembunyikan</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" disabled={isSaving} className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700">Simpan FAQ</button>
                </form>
              ) : (
                <div>
                  <button onClick={() => setEditingFaq({})} className="bg-green-600 text-white px-4 py-2 rounded mb-4">+ Tambah FAQ</button>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b"><th className="p-3">Urutan</th><th className="p-3 w-1/2">Pertanyaan</th><th className="p-3">Kategori</th><th className="p-3">Status</th><th className="p-3 text-right">Aksi</th></tr>
                    </thead>
                    <tbody>
                      {faqs.map(f => (
                        <tr key={f.id} className="border-b">
                          <td className="p-3">{f.order_index}</td>
                          <td className="p-3 font-semibold">{f.question}</td>
                          <td className="p-3">{f.category || '-'}</td>
                          <td className="p-3">{f.is_active ? 'Aktif' : 'Nonaktif'}</td>
                          <td className="p-3 text-right">
                            <button onClick={() => setEditingFaq(f)} className="text-blue-600 mr-3">Edit</button>
                            <button onClick={() => handleDelete('faq', f.id)} className="text-red-600">Hapus</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
