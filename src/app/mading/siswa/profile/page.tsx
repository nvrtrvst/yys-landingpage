"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { Camera, Loader2, Save, ArrowLeft, ShieldCheck, User } from "lucide-react";

function getInitials(nameValue?: string | null): string {
  if (!nameValue) return "?";
  return nameValue.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export default function SiswaProfilePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [nameValue, setNameValue] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/mading/siswa/login"); return; }
    if (session?.user.role !== "siswa") { router.push("/mading"); return; }
  }, [status, session, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync state dari session
    if (session?.user.photo) setPhoto(session.user.photo);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync state dari session
    if (session?.user.name) setNameValue(session.user.name);
  }, [session?.user.photo, session?.user.name]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Format harus JPG, PNG, atau WebP");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const res = await fetch("/api/mading/profile/photo", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Gagal mengunggah foto"); return; }
      setPhoto(data.photo);
      await update({ photo: data.photo });
      toast.success("Foto profil diperbarui");
    } catch {
      toast.error("Kesalahan server");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/mading/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Gagal"); return; }
      toast.success("Password berhasil diganti!");
      setCurrentPassword(""); setNewPassword("");
    } catch { toast.error("Kesalahan server"); }
    finally { setLoading(false); }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const displayName = nameValue || session?.user.name || "Siswa";

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/mading/siswa/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Dashboard
        </Link>

        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-green-500 to-emerald-600" />
          <div className="px-6 pb-6">
            <div className="-mt-12 flex flex-col sm:flex-row sm:items-end gap-4">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative group shrink-0 self-start sm:self-auto"
                title="Ubah foto profil"
                aria-label="Ubah foto profil"
              >
                <div className="h-24 w-24 rounded-full ring-4 ring-white bg-green-100 overflow-hidden flex items-center justify-center text-2xl font-bold text-green-700 shadow">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    getInitials(displayName)
                  )}
                </div>
                <span className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white shadow border border-gray-200 flex items-center justify-center group-hover:bg-green-50 transition-colors">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                  ) : (
                    <Camera className="h-4 w-4 text-gray-600" />
                  )}
                </span>
              </button>
              <div className="pb-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900 truncate">{displayName}</h1>
                <p className="text-sm text-gray-500 truncate">{session?.user.email}</p>
                <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 capitalize">
                  <ShieldCheck className="h-3.5 w-3.5" /> {session?.user.role}
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-400">Klik lingkaran foto untuk mengganti (maks 2&nbsp;MB, JPG/PNG/WebP)</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        </div>

        {/* nameValue card - read only (locked & verified) */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-2">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <User className="h-4 w-4 text-green-600" /> Nama
          </h2>
          <div className="flex items-center justify-between gap-3">
            <p className="text-gray-900 font-medium">{displayName}</p>
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
              <ShieldCheck className="h-3.5 w-3.5" /> Terkunci &amp; Terverifikasi
            </span>
          </div>
          <p className="text-xs text-gray-400">Nama diambil dari data resmi (NIS) dan tidak dapat diubah.</p>
        </div>

        {/* Password card */}
        <form onSubmit={handleSubmit} className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Save className="h-4 w-4 text-green-600" /> Ganti Password
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password Saat Ini</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <p className="text-xs text-gray-400 mt-1">Minimal 6 karakter</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Menyimpan..." : "Simpan Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
