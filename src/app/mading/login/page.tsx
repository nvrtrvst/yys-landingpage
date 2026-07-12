"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";

const roleRedirect: Record<string, string> = {
  guru: "/mading/guru/dashboard",
  siswa: "/mading/siswa/dashboard",
};

export default function MadingLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", { email, password, redirect: false });

      if (res?.error) {
        const isLocked = res.error.toUpperCase().includes("LOCK");
        setError(isLocked ? "Akun terkunci 15 menit. Coba lagi nanti." : "Email atau password salah.");
        setLoading(false);
        return;
      }

      const session = await getSession();
      const role = session?.user?.role || "siswa";
      router.push(roleRedirect[role] || "/mading/siswa/dashboard");
    } catch {
      setError("Kesalahan koneksi");
      setLoading(false);
    }
  };

  const handleLoginAs = (loginEmail: string, loginPassword: string) => {
    setEmail(loginEmail);
    setPassword(loginPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-700 to-green-900 py-12 px-4">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <Link href="/mading" className="text-green-600 font-bold text-xl">Mading Online</Link>
          <h2 className="text-2xl font-bold text-gray-900 mt-4">Masuk</h2>
          <p className="text-gray-500 text-sm mt-1">Yayasan Nuurul Muttaqiin</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="email@yayasan.com" autoComplete="email" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <Link href="/mading/siswa/forgot-password" className="text-sm text-green-600 hover:underline">
              Lupa Password?
            </Link>
          </div>
          <button type="submit" disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center mb-3">Quick login (demo)</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleLoginAs("guru.sd@yayasan.com", "rahasia123")}
              className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
              Guru SD
            </button>
            <button onClick={() => handleLoginAs("siswa.sd@yayasan.com", "rahasia123")}
              className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-100 transition-colors">
              Siswa SD
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/mading" className="text-green-600 hover:underline">&larr; Kembali ke Mading</Link>
        </p>
      </div>
    </div>
  );
}
