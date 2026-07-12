"use client";
import { useMadingTheme } from "./ThemeProvider";

export function MadingFooter() {
  const brand = useMadingTheme();
  return (
    <footer className="bg-gray-900 text-gray-300 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <p className="text-sm font-semibold text-white">{brand.name}</p>
          <p className="text-xs text-gray-400">{brand.tagline || "Mading Online Yayasan Nuurul Muttaqiin"}</p>
        </div>
        <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Yayasan Nuurul Muttaqiin</p>
      </div>
    </footer>
  );
}
