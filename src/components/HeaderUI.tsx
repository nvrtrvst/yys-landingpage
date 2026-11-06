"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X, Construction } from "lucide-react";
import { motion } from "framer-motion";
import { useMounted } from "@/lib/useMounted";

export interface UnitItem { slug: string; name: string }

export function HeaderUI({ settings, units }: { settings: Record<string, string>, units: UnitItem[] }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const isMounted = useMounted();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    mobileMenuRef.current?.querySelector<HTMLElement>("a")?.focus();
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { name: "Beranda", href: "/" },
    { name: "Tentang Kami", href: "/#tentang" },
    { name: "Berita", href: "/berita" },
    { name: "Agenda", href: "/agenda" },
  ];

  return (
    <header
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled || isMobileMenuOpen ? "bg-white shadow-md py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 py-1 z-50">
            {isMounted && settings.site_logo && !settings.site_logo.startsWith('/uploads/dummy/')               ? (
               
              <img 
                src={settings.site_logo}  
                alt={`Logo ${settings.site_name || "Yayasan Nuurul Muttaqiin"}`}
                className="h-10 md:h-12 w-auto object-contain" 
                loading="eager"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/uploads/dummy/site_logo.png";
                }}
              />
            ) : (
               
              <img src="/uploads/dummy/site_logo.png" alt={`Logo ${settings.site_name || "Yayasan Nuurul Muttaqiin"}`} className="h-10 md:h-12 w-auto object-contain" loading="eager" decoding="async" />
            )}
            <div className={`max-w-[7.5rem] truncate font-serif text-lg font-bold tracking-tight md:max-w-none md:text-2xl ${isScrolled || isMobileMenuOpen ? "text-primary-800" : "text-white drop-shadow-md"}`}>
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
              <Link href="/#unit" className={`text-sm font-medium transition-colors hover:text-primary-400 flex items-center gap-1 ${
                  isScrolled ? "text-gray-700" : "text-white drop-shadow-md"
                }`}>
                Unit Sekolah <span aria-hidden="true">▾</span>
              </Link>
              <div role="menu" className="absolute top-full left-0 mt-2 w-48 bg-white shadow-lg border border-gray-100 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible focus-within:opacity-100 focus-within:visible transition-all duration-200 py-2 min-w-[200px] w-max max-w-xs">
                {units.map(u => (
                  <Link key={u.slug} href={`/unit/${u.slug}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600">
                    {u.name}
                  </Link>
                ))}
                {units.length === 0 && (
                  <span className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-400">
                    <Construction className="h-4 w-4" aria-hidden="true" /> Sedang Dalam Pengembangan
                  </span>
                )}
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

          <div className="z-50 flex items-center gap-1.5 md:hidden">
            <Link
              href="/ppdb"
              onClick={() => setIsMobileMenuOpen(false)}
              className="inline-flex min-h-11 items-center rounded-full bg-primary-600 px-3 text-xs font-semibold text-white"
            >
              PPDB
            </Link>
            <button
              aria-label={isMobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded p-2.5 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
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
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <motion.div
          ref={mobileMenuRef}
          id="mobile-menu"
          role="navigation"
          aria-label="Navigasi mobile"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-0 left-0 flex h-[100dvh] w-full flex-col gap-6 overflow-y-auto bg-white px-6 pb-[env(safe-area-inset-bottom)] pt-24 shadow-xl md:hidden"
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
                  <Link key={u.slug} onClick={() => setIsMobileMenuOpen(false)} href={`/unit/${u.slug}`} className="inline-flex min-h-11 items-center py-2 text-lg text-gray-600 hover:text-primary-600">
                    {u.name}
                  </Link>
                ))}
               {units.length === 0 && (
                 <span className="flex items-center gap-2 text-lg text-gray-400">
                   <Construction className="h-5 w-5" aria-hidden="true" /> Sedang Dalam Pengembangan
                 </span>
               )}
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
