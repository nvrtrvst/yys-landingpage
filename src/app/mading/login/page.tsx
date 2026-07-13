"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { motion, useMotionValue, useTransform } from "framer-motion";
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
  Heart,
  Star,
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

const paperNotes: {
  top?: string; left?: string; right?: string; bottom?: string;
  w: number; h: number; rotate: number; bg: string; pin: string; dur: number; icon: string;
}[] = [
  // Edges — corners
  { top: "2%", left: "2%", w: 28, h: 32, rotate: -10, bg: "bg-pink-300", pin: "bg-red-600", dur: 9, icon: "pen" },
  { top: "3%", right: "2%", w: 24, h: 28, rotate: 9, bg: "bg-purple-200", pin: "bg-purple-600", dur: 10.5, icon: "sparkles" },
  { bottom: "2%", left: "2%", w: 24, h: 28, rotate: -6, bg: "bg-orange-200", pin: "bg-orange-500", dur: 11, icon: "star" },
  { bottom: "3%", right: "2%", w: 28, h: 32, rotate: 7, bg: "bg-rose-200", pin: "bg-rose-500", dur: 8.5, icon: "pen" },
  // Mid edges
  { top: "20%", left: "3%", w: 20, h: 24, rotate: 12, bg: "bg-yellow-200", pin: "bg-yellow-500", dur: 7, icon: "sparkles" },
  { top: "16%", right: "3%", w: 16, h: 20, rotate: -7, bg: "bg-blue-200", pin: "bg-blue-600", dur: 9.5, icon: "lines" },
  { bottom: "20%", left: "4%", w: 16, h: 20, rotate: -11, bg: "bg-teal-200", pin: "bg-teal-600", dur: 8, icon: "sparkles" },
  { bottom: "16%", right: "3%", w: 20, h: 24, rotate: 5, bg: "bg-primary-300", pin: "bg-green-600", dur: 10, icon: "pen" },
  // Behind card — scatter near center area
  { top: "10%", left: "16%", w: 20, h: 24, rotate: -8, bg: "bg-lime-200", pin: "bg-lime-600", dur: 9.5, icon: "heart" },
  { top: "12%", right: "14%", w: 22, h: 26, rotate: 6, bg: "bg-violet-200", pin: "bg-violet-600", dur: 8, icon: "pen" },
  { bottom: "10%", left: "18%", w: 18, h: 22, rotate: -9, bg: "bg-fuchsia-200", pin: "bg-fuchsia-600", dur: 10.5, icon: "sparkles" },
  { bottom: "12%", right: "16%", w: 20, h: 24, rotate: 11, bg: "bg-cyan-200", pin: "bg-cyan-600", dur: 7.5, icon: "star" },
  // Extra small accents
  { top: "38%", left: "1%", w: 14, h: 18, rotate: 4, bg: "bg-red-200", pin: "bg-red-600", dur: 8, icon: "sparkles" },
  { top: "42%", right: "1%", w: 14, h: 18, rotate: -5, bg: "bg-indigo-200", pin: "bg-indigo-600", dur: 9, icon: "pen" },
  { bottom: "38%", left: "1%", w: 16, h: 20, rotate: -3, bg: "bg-sky-200", pin: "bg-sky-600", dur: 10, icon: "lines" },
  { bottom: "42%", right: "1%", w: 16, h: 20, rotate: 3, bg: "bg-amber-200", pin: "bg-amber-600", dur: 7, icon: "heart" },
];

const polaroids = [
  { top: "8%", right: "8%", rotate: 14 },
  { bottom: "8%", left: "8%", rotate: -10 },
  { top: "28%", left: "5%", rotate: 6 },
];

const noteIcon = (icon: string) => {
  switch (icon) {
    case "pen": return <PenLine size={16} className="mx-auto mb-1 text-white/70" />;
    case "sparkles": return <Sparkles size={14} className="mx-auto mb-1 text-white/70" />;
    case "heart": return <Heart size={14} className="mx-auto mb-1 text-white/70" />;
    case "star": return <Star size={14} className="mx-auto mb-1 text-white/70" />;
    default: return null;
  }
};

export default function MadingLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rotateX = useTransform(mouseY, [0, 1], [4, -4]);
  const rotateY = useTransform(mouseX, [0, 1], [-4, 4]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

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
      ? "-top-2.5 left-3 bg-amber-50 px-1 text-xs text-primary-600"
      : "top-3 left-10 text-gray-400";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-stone-100 via-amber-50 to-amber-100 px-4 py-12">
      {/* Warm earthy blobs */}
      <motion.div
        className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl"
        animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-10 -right-10 h-96 w-96 rounded-full bg-stone-300/25 blur-3xl"
        animate={{ y: [0, -30, 0], x: [0, -20, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -top-1/3 left-1/3 h-80 w-80 rounded-full bg-primary-200/15 blur-3xl"
        animate={{ y: [0, 25, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Corkboard texture overlays */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: "radial-gradient(circle, #8B7355 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(139,115,85,0.08) 1px, rgba(139,115,85,0.08) 2px), repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(139,115,85,0.08) 1px, rgba(139,115,85,0.08) 2px)",
        }}
      />

      {/* Decorative string (yarn) across top */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-4 z-0 hidden h-[2px] sm:block"
        style={{
          background:
            "repeating-linear-gradient(90deg, #8B7355 0px, #8B7355 4px, transparent 4px, transparent 12px)",
        }}
      />

      {/* Bunting flags on string */}
      {[6, 14, 22, 30, 38, 46, 54, 62, 70, 78, 86, 94].map((pct, i) => (
        <div
          key={i}
          className="pointer-events-none absolute top-3 z-0 hidden h-5 w-4 rounded-b-sm sm:block"
          style={{
            left: `${pct}%`,
            backgroundColor: ["#f472b6", "#a78bfa", "#34d399", "#fbbf24", "#60a5fa", "#fb923c"][i % 6],
            clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
          }}
        />
      ))}

      {/* Polaroid frames */}
      {polaroids.map((p, i) => (
        <motion.div
          key={`p${i}`}
          className="absolute z-0 hidden flex-col items-center rounded bg-white p-2 pb-8 shadow-lg sm:flex"
          style={{ top: p.top, left: p.left, right: p.right, bottom: p.bottom, rotate: `${p.rotate}deg` }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="mb-1 h-2 w-2 rounded-full bg-gray-300 shadow-sm" />
          <div className="h-20 w-24 rounded bg-stone-200/60" />
        </motion.div>
      ))}

      {/* Floating paper notes */}
      {paperNotes.map((n, i) => (
        <motion.div
          key={i}
          className={`absolute z-0 hidden items-start justify-center rounded-lg shadow-lg sm:flex ${n.bg}`}
          style={{
            top: n.top, left: n.left, right: n.right, bottom: n.bottom,
            width: `${n.w / 4}rem`, height: `${n.h / 4}rem`,
          }}
          initial={{ rotate: n.rotate, y: 0 }}
          animate={{ y: [0, -14, 0], rotate: [n.rotate, n.rotate + 2, n.rotate] }}
          transition={{ duration: n.dur, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className={`absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full shadow-sm ring-1 ring-black/10 ${n.pin}`} />
          <div className="flex w-full flex-col gap-1.5 px-2 pt-4">
            {noteIcon(n.icon)}
            <div className="h-1.5 w-3/4 rounded bg-black/10" />
            <div className="h-1.5 w-full rounded bg-black/10" />
            <div className="h-1.5 w-2/3 rounded bg-black/10" />
          </div>
        </motion.div>
      ))}

      {/* Welcome sticky note */}
      <motion.div
        className="absolute left-1/2 top-[4%] z-0 hidden -translate-x-1/2 -translate-y-1/2 rounded shadow-lg sm:flex sm:w-64 sm:flex-col sm:items-center sm:bg-yellow-200 sm:p-3"
        style={{ transform: "translateX(-50%)" }}
        initial={{ rotate: -3, scale: 0.9 }}
        animate={{ rotate: [-3, -1, -3], scale: [0.9, 1, 0.9] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-red-500 shadow-sm ring-1 ring-black/10" />
        <p className="text-xs font-bold text-gray-800">Selamat Datang!</p>
        <p className="mt-0.5 text-[9px] text-gray-600">Tulis &bull; Bagikan &bull; Menginspirasi</p>
      </motion.div>

      {/* Sparkles */}
      <motion.div
        className="absolute left-[15%] top-[30%] z-0 text-amber-700/30"
        animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.2, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles size={20} />
      </motion.div>
      <motion.div
        className="absolute bottom-[30%] right-[12%] z-0 text-stone-600/35"
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles size={16} />
      </motion.div>

      {/* Washi tape edges */}
      <div className="pointer-events-none absolute left-0 top-14 z-0 hidden h-8 w-20 -rotate-6 rounded-r-lg bg-gradient-to-r from-primary-400/40 to-primary-300/30 sm:block" />
      <div className="pointer-events-none absolute bottom-20 right-0 z-0 hidden h-8 w-20 rotate-12 rounded-l-lg bg-gradient-to-l from-rose-300/40 to-rose-200/30 sm:block" />

      {/* Card container with 3D tilt */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full max-w-md"
        style={{ perspective: 1000 }}
      >
        {/* Washi tape */}
        <div className="absolute -top-3 left-1/2 h-7 w-28 -translate-x-1/2 -rotate-2 rounded-sm bg-accent-default/80 shadow-sm" />

        <motion.div
          variants={item}
          className="-rotate-1 rounded-2xl bg-amber-50/90 p-8 shadow-2xl ring-1 ring-black/5 backdrop-blur transition-all duration-300 hover:rotate-0 sm:p-10"
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Pushpin (CSS) */}
          <span className="absolute -right-2 -top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 shadow drop-shadow-md">
            <span className="h-2 w-2 rounded-full bg-white/80" />
          </span>

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
              animate={error ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
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
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  placeholder=" "
                  autoComplete="email"
                  className="peer w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-3 text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
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
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder=" "
                  autoComplete="current-password"
                  className="peer w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-10 text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
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
