"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { focusRing, inputClass } from "@/components/scp/ui";

const authButton = `inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-800 disabled:opacity-50 ${focusRing}`;

export default function ScpResetPasswordPage() {
  const { token } = useParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Password tidak cocok"); return; }
    if (password.length < 6) { setError("Password minimal 6 karakter"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/mading/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Gagal"); return; }
      setSuccess(true);
      setTimeout(() => router.push("/scp/login"), 1500);
    } catch {
      setError("Kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4">
      <div className="max-w-md w-full p-8 bg-white rounded-xl border border-slate-200">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Buat Password CMS</h2>
          <p className="text-slate-500 text-sm mt-1">Akun baru Anda perlu password</p>
        </div>

        {error && <div role="alert" className="mb-4 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</div>}

        {success ? (
          <div className="text-center">
            <div role="status" className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Password berhasil dibuat! Mengalihkan ke halaman login...
            </div>
            <Link href="/scp/login" className={authButton}>
              Login Sekarang
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700">Password Baru</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className={inputClass}
                placeholder="Minimal 6 karakter" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Konfirmasi Password</label>
              <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                className={inputClass}
                placeholder="Ketik ulang password" />
            </div>
            <button type="submit" disabled={loading} className={authButton}>
              {loading ? "Memproses..." : "Buat Password"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-500 mt-6">
          <Link href="/scp/login" className="text-primary-700 hover:underline">&larr; Kembali ke Login</Link>
        </p>
      </div>
    </div>
  );
}
