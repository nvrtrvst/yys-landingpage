import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";

const baloo = Baloo_2({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-baloo" });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: "Beranda SD Nuurul Muttaqiin",
  description: "SD Nuurul Muttaqiin — Tumbuh Qurani, Berilmu, dan Berakhlak Mulia.",
};

export default function SDLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${baloo.variable} ${nunito.variable}`} style={{ fontFamily: "var(--font-nunito), 'Nunito', sans-serif" }}>
      {children}
    </div>
  );
}