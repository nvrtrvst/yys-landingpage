"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: "", name: "", email: "", password: "", role: "editor" });
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Gagal memuat daftar pengguna");
      const data = await res.json();
      setUsers(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const url = isEditing ? \`/api/admin/users/\${formData.id}\` : "/api/admin/users";
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
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.")) return;
    
    try {
      const res = await fetch(\`/api/admin/users/\${id}\`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus pengguna");
      
      toast.success("Pengguna berhasil dihapus");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openModalForAdd = () => {
    setFormData({ id: "", name: "", email: "", password: "", role: "editor" });
    setIsEditing(false);
    setShowModal(true);
  };

  const openModalForEdit = (user: any) => {
    setFormData({ id: user.id, name: user.name, email: user.email, password: "", role: user.role });
    setIsEditing(true);
    setShowModal(true);
  };

  if (loading) return <div className="p-8 text-center">Memuat...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h1>
        <button onClick={openModalForAdd} className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700">
          + Tambah Pengguna
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={\`px-3 py-1 rounded-full text-xs font-bold uppercase \${
                    user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }\`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openModalForEdit(user)} className="text-primary-600 hover:text-primary-900 mr-4">Edit</button>
                  <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">{isEditing ? "Edit Pengguna" : "Tambah Pengguna Baru"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password {isEditing && <span className="text-gray-400 font-normal">(Kosongkan jika tidak ingin diubah)</span>}</label>
                <input type="password" required={!isEditing} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hak Akses (Role)</label>
                <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500">
                  <option value="editor">Editor (Hanya update Berita/Mading)</option>
                  <option value="admin">Admin (Akses Penuh)</option>
                  <option value="superadmin">Superadmin (Akses Penuh + Sistem)</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
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
