import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { WhatsAppWidget } from "@/components/WhatsAppWidget";
import { getSettings } from "@/lib/db";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
});

export async function generateMetadata(): Promise<Metadata> {
  let settings: Record<string, string> = {};
  try {
    settings = await getSettings();
  } catch {
    settings = {};
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nuurulmuttaqiin.or.id";
  const siteName = settings.site_name || "Yayasan Nuurul Muttaqiin";
  const description =
    settings.hero_subtitle?.trim() ||
    "Yayasan Pendidikan Islam Nuurul Muttaqiin menghadirkan pendidikan berkualitas dari jenjang LPQ hingga SMK dengan mengedepankan adab, ilmu, dan teknologi.";
  const image = settings.site_logo || settings.hero_background || "/uploads/dummy/hero_bg.png";

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description,
    keywords: ["sekolah islam", "yayasan nuurul muttaqiin", "sekolah unggulan", "ppdb online", "pendidikan karakter"],
    alternates: { canonical: "/" },
    openGraph: {
      title: siteName,
      description: settings.hero_subtitle || "Membentuk Generasi Qurani & Berprestasi",
      url: "/",
      siteName,
      locale: "id_ID",
      type: "website",
      images: [{ url: image, alt: siteName }],
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description: settings.hero_subtitle || "Membentuk Generasi Qurani & Berprestasi",
      images: [image],
    },
  };
}

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
