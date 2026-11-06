"use client";

import { getErrorMessage } from "@/lib/get-error-message";

import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/scp/PageHeader";
import { btnPrimary, inputClass } from "@/components/scp/ui";

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
      toast.error((getErrorMessage(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <PageHeader title="Profil Saya" description="Kelola informasi akun dan password Anda." />

      <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl">
        <div className="space-y-4 border-b border-slate-100 pb-6 mb-6">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Nama Lengkap</label>
            <div className="font-semibold text-slate-900">{session?.user?.name || '-'}</div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
            <div className="font-semibold text-slate-900">{session?.user?.email || '-'}</div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Hak Akses</label>
            <div className="font-semibold text-slate-900 capitalize">{(session?.user as { role?: string })?.role || '-'}</div>
          </div>
        </div>

        <h3 className="text-base font-semibold text-slate-900 mb-4">Ganti Password</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password Lama</label>
            <input 
              type="password" 
              required 
              value={formData.oldPassword} 
              onChange={e => setFormData({...formData, oldPassword: e.target.value})} 
              className={inputClass} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password Baru</label>
            <input 
              type="password" 
              required 
              value={formData.newPassword} 
              onChange={e => setFormData({...formData, newPassword: e.target.value})} 
              className={inputClass} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Konfirmasi Password Baru</label>
            <input 
              type="password" 
              required 
              value={formData.confirmPassword} 
              onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
              className={inputClass} 
            />
          </div>
          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading} 
              className={btnPrimary}
            >
              {loading ? "Menyimpan..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
