"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Search, Plus, X, Pencil, Trash2, UserCheck, User, Upload } from "lucide-react";

interface UnitUser {
  id: number;
  name: string;
  email: string;
  role: "guru" | "siswa";
  unit_id: number | null;
  created_at: string;
}

export default function MadingUsersPage() {
  const [users, setUsers] = useState<UnitUser[]>([]);
  const [filtered, setFiltered] = useState<UnitUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<UnitUser | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "siswa" as "guru" | "siswa" });
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mading/unit-users");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data);
      setFiltered(data);
    } catch {
      toast.error("Gagal memuat data user");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    let result = users;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (roleFilter !== "all") result = result.filter(u => u.role === roleFilter);
    setFiltered(result);
  }, [search, roleFilter, users]);

  const resetForm = () => {
    setEditing(null);
    setForm({ name: "", email: "", password: "", role: "siswa" as const });
  };

  const openEdit = (user: UnitUser) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { toast.error("Nama dan email wajib diisi"); return; }
    if (!editing && !form.password.trim()) { toast.error("Password wajib diisi untuk user baru"); return; }
    if (form.password && form.password.length < 6) { toast.error("Password minimal 6 karakter"); return; }

    setSaving(true);
    try {
      if (editing) {
        const body: any = { name: form.name.trim() };
        if (form.password) body.password = form.password;
        const res = await fetch(`/api/mading/unit-users/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Gagal update"); }
        toast.success("User berhasil diperbarui");
      } else {
        const res = await fetch("/api/mading/unit-users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "Gagal membuat user");
        toast.success("User berhasil dibuat");
      }
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Kesalahan server");
    } finally {
      setSaving(false);
    }
  };

  const [importModal, setImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const handleImport = async () => {
    if (!importFile) { toast.error("Pilih file CSV"); return; }
    setImporting(true);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      const res = await fetch("/api/mading/unit-users/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Gagal"); return; }
      setImportResult(data);
      if (data.created > 0) { toast.success(`${data.created} user berhasil diimport`); fetchUsers(); }
    } catch {
      toast.error("Kesalahan server");
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (user: UnitUser) => {
    if (!confirm(`Hapus user "${user.name}" (${user.email})? Aksi ini tidak bisa dibatalkan.`)) return;
    try {
      const res = await fetch(`/api/mading/unit-users/${user.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Gagal"); }
      toast.success("User dihapus");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus");
    }
  };

  const totalGuru = users.filter(u => u.role === "guru").length;
  const totalSiswa = users.filter(u => u.role === "siswa").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kelola Pengguna</h2>
          <p className="text-sm text-gray-500 mt-1">Manajemen akun guru &amp; siswa unit Anda</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setImportFile(null); setImportResult(null); setImportModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
          <button onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm">
            <Plus className="h-4 w-4" />
            Tambah User
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            <p className="text-sm text-gray-500">Total User</p>
          </div>
        </div>
        <div className="bg-white border rounded-xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
            <UserCheck className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalGuru}</p>
            <p className="text-sm text-gray-500">Guru</p>
          </div>
        </div>
        <div className="bg-white border rounded-xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <User className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalSiswa}</p>
            <p className="text-sm text-gray-500">Siswa</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Cari nama atau email..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="all">Semua Role</option>
            <option value="guru">Guru</option>
            <option value="siswa">Siswa</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bergabung</th>
                <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="p-4"><div className="h-5 w-32 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="p-4"><div className="h-5 w-48 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="p-4"><div className="h-5 w-16 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="p-4"><div className="h-5 w-24 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="p-4"><div className="h-5 w-16 bg-gray-100 rounded animate-pulse ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="text-gray-300 mb-2"><User className="h-10 w-10 mx-auto" /></div>
                    <p className="text-gray-500 font-medium">Belum ada user</p>
                    <p className="text-gray-400 text-sm mt-1">Tambahkan user guru atau siswa untuk mulai</p>
                  </td>
                </tr>
              ) : filtered.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${user.role === "guru" ? "bg-blue-500" : "bg-purple-500"}`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900 text-sm">{user.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{user.email}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === "guru"
                        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-700/10"
                        : "bg-green-50 text-green-700 ring-1 ring-green-700/10"
                    }`}>
                      {user.role === "guru" ? "Guru" : "Siswa"}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(user)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit user">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(user)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus user">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-sm text-gray-500 bg-gray-50/50">
            Menampilkan {filtered.length} dari {users.length} user
          </div>
        )}
      </div>

      {importModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setImportModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
            <button onClick={() => setImportModal(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Import User dari CSV</h3>
            <p className="text-sm text-gray-500 mb-4">Format: <code className="bg-gray-100 px-1 rounded">name,email,password,role</code> (role: guru/siswa)</p>

            {importResult ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl text-sm ${importResult.created > 0 ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                  {importResult.created > 0 ? `✅ ${importResult.created} user berhasil dibuat` : "Tidak ada user yang berhasil diimport"}
                </div>
                {importResult.failed > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-600 mb-2">{importResult.failed} gagal:</p>
                    <div className="max-h-40 overflow-y-auto text-xs text-red-600 space-y-1 bg-red-50 p-3 rounded-xl">
                      {importResult.errors?.map((e: string, i: number) => <div key={i}>{e}</div>)}
                    </div>
                  </div>
                )}
                <button onClick={() => { setImportModal(false); setImportResult(null); }}
                  className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  Tutup
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-400 transition-colors">
                  <Upload className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500 mb-2">Pilih file CSV</p>
                  <input type="file" accept=".csv" onChange={e => setImportFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
                  {importFile && <p className="text-xs text-gray-400 mt-2">{importFile.name}</p>}
                </div>
                <button onClick={handleImport} disabled={!importFile || importing}
                  className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">
                  {importing ? "Mengimport..." : "Import"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
            <button onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {editing ? "Edit User" : "Tambah User Baru"}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {editing ? "Perbarui informasi user. Kosongkan password jika tidak diubah." : "Buat akun baru untuk guru atau siswa."}
            </p>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editing && <span className="text-gray-400 font-normal">(kosongkan jika tidak diubah)</span>}
                </label>
                <input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder={editing ? "Biarkan kosong jika tidak diubah" : "Minimal 6 karakter"}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as "guru" | "siswa" })}
                  disabled={!!editing}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500 transition-shadow">
                  <option value="siswa">Siswa</option>
                  <option value="guru">Guru</option>
                </select>
                {editing && <p className="text-xs text-gray-400 mt-1">Role tidak bisa diubah setelah dibuat</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
                  {saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Buat User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
