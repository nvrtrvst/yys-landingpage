"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { id } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'id': id };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

type EventItem = { id: number, title: string, description: string, start_date: string, end_date: string, location: string, image_url: string };

export function EventsClient() {
  const [data, setData] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Partial<EventItem> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/events');
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch (err) {
      toast.error("Gagal memuat agenda");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/events');
        if (!res.ok) throw new Error();
        if (!cancelled) setData(await res.json());
      } catch (err) {
        toast.error("Gagal memuat agenda");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSelectSlot = ({ start, end }: { start: Date, end: Date }) => {
    setEditingItem({
      start_date: format(start, "yyyy-MM-dd'T'HH:mm"),
      end_date: format(start, "yyyy-MM-dd'T'HH:mm") // default end same as start
    });
  };

  const handleSelectEvent = (event: { id: number }) => {
    const item = data.find(d => d.id === event.id);
    if (item) {
      setEditingItem({
        ...item,
        start_date: format(new Date(item.start_date), "yyyy-MM-dd'T'HH:mm"),
        end_date: format(new Date(item.end_date), "yyyy-MM-dd'T'HH:mm")
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading("Menyimpan...");
    try {
      const url = editingItem?.id ? `/api/admin/events/${editingItem.id}` : `/api/admin/events`;
      const res = await fetch(url, {
        method: editingItem?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingItem)
      });
      if (!res.ok) throw new Error();
      toast.success("Tersimpan!", { id: toastId });
      setEditingItem(null);
      fetchData();
    } catch (err) {
      toast.error("Gagal menyimpan", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus agenda ini?")) return;
    const toastId = toast.loading("Menghapus...");
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Dihapus!", { id: toastId });
      setEditingItem(null);
      fetchData();
    } catch (err) {
      toast.error("Gagal menghapus", { id: toastId });
    }
  };

  const eventsFormatted = data.map(d => ({
    id: d.id,
    title: d.title,
    start: new Date(d.start_date),
    end: new Date(d.end_date)
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="h-96 flex items-center justify-center text-gray-500">Memuat kalender...</div>
        ) : (
          <div className="h-[600px]">
            <Calendar
              localizer={localizer}
              events={eventsFormatted}
              startAccessor="start"
              endAccessor="end"
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              culture="id"
              messages={{
                next: "Maju",
                previous: "Mundur",
                today: "Hari Ini",
                month: "Bulan",
                week: "Minggu",
                day: "Hari"
              }}
            />
          </div>
        )}
        <p className="text-sm text-gray-500 mt-4">* Klik pada tanggal untuk menambah agenda baru, atau klik pada agenda yang sudah ada untuk mengedit.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{editingItem ? (editingItem.id ? "Edit Agenda" : "Tambah Agenda Baru") : "Form Agenda"}</h3>
          {!editingItem && <button onClick={() => setEditingItem({})} className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 font-semibold">+ Baru</button>}
        </div>

        {editingItem ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Judul Agenda *</label>
              <input type="text" value={editingItem.title || ""} onChange={e => setEditingItem({...editingItem, title: e.target.value})} className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Waktu Mulai *</label>
                <input type="datetime-local" value={editingItem.start_date || ""} onChange={e => setEditingItem({...editingItem, start_date: e.target.value})} className="w-full border rounded p-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Waktu Selesai *</label>
                <input type="datetime-local" value={editingItem.end_date || ""} onChange={e => setEditingItem({...editingItem, end_date: e.target.value})} className="w-full border rounded p-2 text-sm" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lokasi</label>
              <input type="text" value={editingItem.location || ""} onChange={e => setEditingItem({...editingItem, location: e.target.value})} className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Deskripsi Singkat</label>
              <textarea value={editingItem.description || ""} onChange={e => setEditingItem({...editingItem, description: e.target.value})} rows={3} className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500"></textarea>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              {editingItem.id && <button type="button" onClick={() => handleDelete(editingItem.id!)} className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50">Hapus</button>}
              <button type="button" onClick={() => setEditingItem(null)} className="px-4 py-2 border rounded hover:bg-gray-50">Batal</button>
              <button type="submit" disabled={isSaving} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium disabled:opacity-50">Simpan</button>
            </div>
          </form>
        ) : (
          <div className="text-center py-12 text-gray-400 bg-gray-50 rounded border border-dashed">
            Pilih tanggal di kalender atau klik tombol &quot;+ Baru&quot; untuk menambah agenda.
          </div>
        )}
      </div>
    </div>
  );
}
