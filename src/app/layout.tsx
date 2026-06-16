import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { WhatsAppWidget } from "@/components/WhatsAppWidget";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Yayasan Nuurul Muttaqiin",
    template: "%s | Yayasan Nuurul Muttaqiin",
  },
  description: "Yayasan Pendidikan Islam Nuurul Muttaqiin menghadirkan pendidikan berkualitas dari jenjang LPQ hingga SMK dengan mengedepankan adab, ilmu, dan teknologi.",
  keywords: ["sekolah islam", "yayasan nuurul muttaqiin", "sekolah unggulan", "ppdb online", "pendidikan karakter"],
  openGraph: {
    title: "Yayasan Nuurul Muttaqiin",
    description: "Membentuk Generasi Qurani & Berprestasi",
    url: "/",
    siteName: "Yayasan Nuurul Muttaqiin",
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased text-gray-900 bg-white">
        <Providers>
          {children}
          <WhatsAppWidget />
        </Providers>
      </body>
    </html>
  );
}
