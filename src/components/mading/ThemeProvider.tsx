"use client";
import { createContext, useContext, useState } from "react";

interface Branding {
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  name: string;
  tagline: string | null;
  slug: string;
}

const defaultBranding: Branding = {
  logo_url: "/logo.png", primary_color: "#16a34a", secondary_color: "#fef08a",
  name: "Mading Online", tagline: null, slug: "",
};

const ThemeContext = createContext<Branding>(defaultBranding);

export function useMadingTheme() { return useContext(ThemeContext); }

export function ThemeProvider({ children, branding }: { children: React.ReactNode; branding?: Branding | null }) {
  const [brand] = useState<Branding>(branding || defaultBranding);
  return <ThemeContext.Provider value={brand}>{children}</ThemeContext.Provider>;
}
