"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Loader2,
  PenLine,
  Sparkles,
  ArrowLeft,
  Mail,
  Lock,
  GraduationCap,
  UserCheck,
} from "lucide-react";

const roleRedirect: Record<string, string> = {
  guru: "/mading/guru/dashboard",
  siswa: "/mading/siswa/dashboard",
  admin_unit: "/mading/admin-unit/dashboard",
  superadmin: "/mading/admin-unit/dashboard",
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 120, damping: 14 },
  },
};

export default function MadingLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);

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
    setError("");
  };

  const floatClass = (field: "email" | "password", value: string) =>
    focusedField === field || value.length > 0
      ? "-top-2.5 left-3 bg-white px-1 text-xs text-primary-600"
      : "top-3 left-10 text-gray-400";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 px-4 py-12">
      {/* Decorative floating blobs */}
      <motion.div
        className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary-400/30 blur-3xl"
        animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-10 -right-10 h-96 w-96 rounded-full bg-accent-default/20 blur-3xl"
        animate={{ y: [0, -30, 0], x: [0, -20, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Dotted paper pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          color: "white",
        }}
      />

      <motion.div variants={container} initial="hidden" animate="show" className="relative w-full max-w-md">
        {/* Washi tape */}
        <div className="absolute -top-3 left-1/2 h-7 w-28 -translate-x-1/2 -rotate-2 rounded-sm bg-accent-default/80 shadow-sm" />

        <motion.div
          variants={item}
          className="-rotate-1 rounded-2xl bg-white/95 p-8 shadow-2xl ring-1 ring-white/40 backdrop-blur transition-transform duration-300 hover:rotate-0 sm:p-10"
        >
          {/* Header */}
          <motion.div variants={item} className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-600/30">
              <PenLine size={26} />
            </div>
            <h1 className="font-serif text-3xl font-bold text-gray-900">Mading Online</h1>
            <p className="mt-1 text-sm text-gray-500">Yayasan Nuurul Muttaqiin</p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary-700">
              <Sparkles size={14} /> Tulis &middot; Bagikan &middot; Menginspirasi
            </p>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: [0, -6, 6, -4, 4, 0] }}
              transition={{ duration: 0.4 }}
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <motion.div variants={item}>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  placeholder=" "
                  autoComplete="email"
                  className="peer w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-3 text-gray-900 outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/30"
                />
                <label
                  htmlFor="email"
                  className={`pointer-events-none absolute font-medium transition-all ${floatClass("email", email)}`}
                >
                  Email
                </label>
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={item}>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder=" "
                  autoComplete="current-password"
                  className="peer w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-10 text-gray-900 outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/30"
                />
                <label
                  htmlFor="password"
                  className={`pointer-events-none absolute font-medium transition-all ${floatClass("password", password)}`}
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-primary-600"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </motion.div>

            <motion.div variants={item} className="flex justify-end">
              <Link href="/mading/siswa/forgot-password" className="text-sm text-primary-600 hover:underline">
                Lupa Password?
              </Link>
            </motion.div>

            <motion.button
              variants={item}
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/30 transition hover:bg-primary-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" /> Memproses&hellip;
                </span>
              ) : (
                "Masuk"
              )}
            </motion.button>
          </form>

          {/* Quick login */}
          <motion.div variants={item} className="mt-7 border-t border-dashed border-gray-200 pt-5">
            <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-gray-400">
              Masuk cepat (demo)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleLoginAs("guru.sd@yayasan.com", "rahasia123")}
                className="group flex items-center gap-2 rounded-xl border border-primary-100 bg-primary-50 px-3 py-2.5 text-left text-sm font-medium text-primary-700 transition hover:-translate-y-0.5 hover:bg-primary-100 hover:shadow-md"
              >
                <UserCheck size={18} className="text-primary-600" />
                Guru SD
              </button>
              <button
                type="button"
                onClick={() => handleLoginAs("siswa.sd@yayasan.com", "rahasia123")}
                className="group flex items-center gap-2 rounded-xl border border-purple-100 bg-purple-50 px-3 py-2.5 text-left text-sm font-medium text-purple-700 transition hover:-translate-y-0.5 hover:bg-purple-100 hover:shadow-md"
              >
                <GraduationCap size={18} className="text-purple-600" />
                Siswa SD
              </button>
            </div>
          </motion.div>

          <motion.div variants={item} className="mt-6 text-center">
            <Link
              href="/mading"
              className="inline-flex items-center gap-1 text-sm text-gray-500 transition hover:text-primary-600"
            >
              <ArrowLeft size={15} /> Kembali ke Mading
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
