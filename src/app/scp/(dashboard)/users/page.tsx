"use client";

import { getErrorMessage } from "@/lib/get-error-message";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/scp/PageHeader";
import { LoadingState } from "@/components/scp/LoadingState";
import { btnPrimary, inputClass, selectClass } from "@/components/scp/ui";
import { GRANTABLE_MODULES } from "@/lib/modules";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions?: string | string[] | null;
  unit_id: number | null;
  created_at?: string;
}

function parsePermissions(value: AdminUser["permissions"]): string[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<{ id: number | string; name: string; email: string; password: string; role: string; permissions: string[] }>({ id: "", name: "", email: "", password: "", role: "editor", permissions: [] });
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Gagal memuat daftar pengguna");
      const data = await res.json();
      setUsers(data);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/users");
        if (!res.ok) throw new Error("Gagal memuat daftar pengguna");
        const data = await res.json();
        if (!cancelled) setUsers(data);
      } catch (error: unknown) {
        if (!cancelled) toast.error(getErrorMessage(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const url = isEditing ? `/api/admin/users/${formData.id}` : "/api/admin/users";
      const method = isEditing ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Terjadi kesalahan");
      
      toast.success(isEditing ? "Pengguna berhasil diperbarui" : "Pengguna berhasil ditambahkan dan email telah dikirim");
      setShowModal(false);
      fetchUsers();
    } catch(error: unknown) {
      toast.error((getErrorMessage(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.")) return;
    
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus pengguna");
      
      toast.success("Pengguna berhasil dihapus");
      fetchUsers();
    } catch(error: unknown) {
      toast.error((getErrorMessage(error)));
    }
  };

  const openModalForAdd = () => {
    setFormData({ id: "", name: "", email: "", password: "", role: "editor", permissions: [] });
    setIsEditing(false);
    setShowModal(true);
  };

  const openModalForEdit = (user: AdminUser) => {
    setFormData({ id: user.id, name: user.name, email: user.email, password: "", role: user.role, permissions: parsePermissions(user.permissions) });
    setIsEditing(true);
    setShowModal(true);
  };

  if (loading) return <div className="max-w-7xl mx-auto pb-12"><LoadingState label="Memuat pengguna…" /></div>;

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      <PageHeader
        title="Manajemen Pengguna"
        description="Kelola akun admin, editor, dan hak aksesnya."
        actions={
          <button onClick={openModalForAdd} className={btnPrimary}>
            + Tambah Pengguna
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50/70">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Nama</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Role</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{user.name}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{user.email}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${
                    user.role === 'superadmin' ? 'bg-slate-100 text-slate-700' :
                    user.role === 'admin' ? 'bg-sky-50 text-sky-700' :
                    'bg-emerald-50 text-emerald-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openModalForEdit(user)} className="text-primary-700 hover:text-primary-800 mr-4">Edit</button>
                  <button onClick={() => handleDelete(user.id)} className="text-rose-600 hover:text-rose-700">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{isEditing ? "Edit Pengguna" : "Tambah Pengguna Baru"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password {isEditing && <span className="text-slate-400 font-normal">(Kosongkan jika tidak ingin diubah)</span>}</label>
                <input type="password" required={!isEditing} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hak Akses (Role)</label>
                <select
                  required
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value, permissions: e.target.value === "petugas" ? formData.permissions : [] })}
                  className={selectClass}
                >
                  <option value="editor">Editor (Hanya update Berita/Mading)</option>
                  <option value="petugas">Petugas (Modul dipilih)</option>
                  <option value="admin">Admin (Akses Penuh)</option>
                  <option value="superadmin">Superadmin (Akses Penuh + Sistem)</option>
                </select>
              </div>

              {formData.role === "petugas" && (
                <div className="rounded-lg border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">Modul yang dapat diakses</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, permissions: GRANTABLE_MODULES.map((module) => module.key) })}
                        className="text-xs font-medium text-primary-700 hover:underline"
                      >
                        Pilih semua
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, permissions: [] })}
                        className="text-xs font-medium text-slate-500 hover:underline"
                      >
                        Kosongkan
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {["PPDB", "Konten", "Sistem"].map((group) => {
                      const modules = GRANTABLE_MODULES.filter((module) => module.group === group);
                      if (modules.length === 0) return null;
                      return (
                        <div key={group}>
                          <p className="mb-1 text-xs font-semibold text-slate-500">{group}</p>
                          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                            {modules.map((module) => (
                              <label key={module.key} className="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={formData.permissions.includes(module.key)}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? [...formData.permissions, module.key]
                                      : formData.permissions.filter((key) => key !== module.key);
                                    setFormData({ ...formData, permissions: next });
                                  }}
                                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                />
                                {module.label}
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={isSubmitting} className={btnPrimary}>
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
