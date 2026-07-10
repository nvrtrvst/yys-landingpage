"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Password baru dan konfirmasi password tidak cocok!");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter!");
      return;
    }

    setLoading(true);
    
    try {
      const res = await fetch("/api/admin/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Terjadi kesalahan");
      
      toast.success(data.message || "Password berhasil diubah");
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch(error: unknown) {
      toast.error((error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold mb-1">Profil Saya</h2>
        <p className="text-gray-500 mb-6 text-sm">Kelola informasi akun Anda.</p>
        
        <div className="space-y-4 border-b border-gray-100 pb-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Nama Lengkap</label>
            <div className="font-semibold text-gray-900">{session?.user?.name || '-'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
            <div className="font-semibold text-gray-900">{session?.user?.email || '-'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Hak Akses</label>
            <div className="font-semibold text-gray-900 uppercase">{(session?.user as any)?.role || '-'}</div>
          </div>
        </div>

        <h3 className="text-lg font-bold mb-4">Ganti Password</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password Lama</label>
            <input 
              type="password" 
              required 
              value={formData.oldPassword} 
              onChange={e => setFormData({...formData, oldPassword: e.target.value})} 
              className="w-full p-3 border rounded-lg focus:ring-primary-500 focus:border-primary-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
            <input 
              type="password" 
              required 
              value={formData.newPassword} 
              onChange={e => setFormData({...formData, newPassword: e.target.value})} 
              className="w-full p-3 border rounded-lg focus:ring-primary-500 focus:border-primary-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
            <input 
              type="password" 
              required 
              value={formData.confirmPassword} 
              onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
              className="w-full p-3 border rounded-lg focus:ring-primary-500 focus:border-primary-500" 
            />
          </div>
          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading} 
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
