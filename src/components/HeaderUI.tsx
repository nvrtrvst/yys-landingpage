"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import { useMounted } from "@/lib/useMounted";

export interface UnitItem { slug: string; name: string }

export function HeaderUI({ settings, units }: { settings: Record<string, string>, units: UnitItem[] }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMounted = useMounted();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Beranda", href: "/" },
    { name: "Tentang Kami", href: "/#tentang" },
    { name: "Berita", href: "/berita" },
    { name: "Agenda", href: "/agenda" },
  ];

  return (
    <header
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-white shadow-md py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 z-50">
            {isMounted && settings.site_logo && !settings.site_logo.startsWith('/uploads/dummy/')               ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={settings.site_logo}  
                alt="Logo" 
                className="h-10 md:h-12 w-auto object-contain" 
                loading="eager"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/uploads/dummy/site_logo.png";
                }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/uploads/dummy/site_logo.png" alt="Logo" className="h-10 md:h-12 w-auto object-contain" loading="eager" decoding="async" />
            )}
            <div className={`font-serif text-xl md:text-2xl font-bold tracking-tight ${isScrolled ? 'text-primary-800' : 'text-white drop-shadow-md'}`}>
              {settings.site_name || "Nuurul Muttaqiin"}
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary-400 ${
                  isScrolled ? "text-gray-700" : "text-white drop-shadow-md"
                }`}
              >
                {link.name}
              </Link>
            ))}

            {/* Dropdown Unit */}
            <div className="relative group focus-within:z-10">
              <button aria-expanded="false" aria-haspopup="true" className={`text-sm font-medium transition-colors hover:text-primary-400 flex items-center gap-1 ${
                  isScrolled ? "text-gray-700" : "text-white drop-shadow-md"
                }`}>
                Unit Sekolah ▾
              </button>
              <div role="menu" className="absolute top-full left-0 mt-2 w-48 bg-white shadow-xl border border-gray-100 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible focus-within:opacity-100 focus-within:visible transition-all duration-200 py-2 min-w-[200px] w-max max-w-xs">
                {units.map(u => (
                  <Link key={u.slug} href={`/unit/${u.slug}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600">
                    {u.name}
                  </Link>
                ))}
                {units.length === 0 && <span className="block px-4 py-2 text-sm text-gray-400">Sedang Dalam Pengembangan 🚧</span>}
              </div>
            </div>

            <Link
              href="/ppdb"
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${
                isScrolled
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "bg-white text-primary-700 hover:bg-gray-100"
              }`}
            >
              Daftar PPDB
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            aria-label={isMobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            className="md:hidden z-50 p-2 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsMobileMenuOpen(!isMobileMenuOpen); } }}
          >
            {isMobileMenuOpen ? (
              <X className={`h-6 w-6 ${isScrolled || isMobileMenuOpen ? 'text-gray-900' : 'text-white'}`} />
            ) : (
              <Menu className={`h-6 w-6 ${isScrolled ? 'text-gray-900' : 'text-white'}`} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <motion.div
          id="mobile-menu"
          role="navigation"
          aria-label="Navigasi mobile"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-0 left-0 w-full h-screen bg-white flex flex-col pt-24 px-6 gap-6 md:hidden shadow-xl overflow-y-auto"
        >
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-xl font-medium text-gray-800 border-b border-gray-100 pb-4"
            >
              {link.name}
            </Link>
          ))}
          <div className="text-xl font-medium text-gray-800 border-b border-gray-100 pb-4">
            <span className="block mb-4">Unit Sekolah:</span>
            <div className="flex flex-col gap-3 pl-4">
               {units.map(u => (
                  <Link key={u.slug} onClick={() => setIsMobileMenuOpen(false)} href={`/unit/${u.slug}`} className="text-lg text-gray-600 hover:text-primary-600">
                    {u.name}
                  </Link>
                ))}
               {units.length === 0 && <span className="text-lg text-gray-400">Sedang Dalam Pengembangan 🚧</span>}
            </div>
          </div>
          <Link
            href="/ppdb"
            onClick={() => setIsMobileMenuOpen(false)}
            className="mt-4 px-6 py-3 rounded-full text-center text-lg font-semibold bg-primary-600 text-white shadow-lg"
          >
            Daftar PPDB
          </Link>
        </motion.div>
      )}
    </header>
  );
}
