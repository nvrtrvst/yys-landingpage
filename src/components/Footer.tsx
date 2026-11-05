import Link from "next/link";
import { getSettings } from "@/lib/db";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

function safeUrl(url: string | undefined): string {
  if (!url || url === "#") return "#";
  return /^(https?:\/\/|mailto:|tel:)/i.test(url) ? url : "#";
}

function safeImg(url: string | undefined): string | null {
  if (!url) return null;
  return /^(https?:\/\/|\/)/i.test(url) ? url : null;
}

export async function Footer() {
  const settings = await getSettings();
  const address = settings.contact_address || "Jl. Pendidikan No. 1, Kota Islam";
  const phone = settings.contact_phone || "0812-3456-7890";
  const email = settings.contact_email || "info@nuurulmuttaqiin.or.id";
  let mapEmbedUrl = settings.map_embed_url;

  let units: RowDataPacket[] = [];
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, name, slug, logo_url FROM units WHERE status = 'active' ORDER BY order_index ASC"
    );
    units = rows;
  } catch (error) {
    console.error("Failed to fetch units for footer", error);
  }

  if (mapEmbedUrl) {
    // If user pasted an iframe tag, extract the src
    const srcMatch = mapEmbedUrl.match(/src="([^"]+)"/);
    if (srcMatch && srcMatch[1]) {
      mapEmbedUrl = srcMatch[1];
    }

    // If it's NOT a proper embed URL after extraction, force fallback to the safe query-based embed
    if (!mapEmbedUrl.includes("embed")) {
      mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }
  }

  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  const socials = [
    {
      label: "Facebook",
      href: settings.social_facebook || "#",
      color: "text-[#1877F2]",
      hover: "hover:bg-[#1877F2]/15",
      path: "M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.91 3.78-3.91 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z",
    },
    {
      label: "Instagram",
      href: settings.social_instagram || "#",
      color: "text-[#E4405F]",
      hover: "hover:bg-[#E4405F]/15",
      path: "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.22.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.05.41 2.22.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.22-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.05.36-2.22.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.22-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.05-.41-2.22C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.22.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.05-.36 2.22-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 1.62c-3.15 0-3.5.01-4.74.07-1.14.05-1.76.24-2.17.4-.55.21-.94.47-1.35.88-.41.41-.67.8-.88 1.35-.16.41-.35 1.03-.4 2.17-.06 1.24-.07 1.59-.07 4.74s.01 3.5.07 4.74c.05 1.14.24 1.76.4 2.17.21.55.47.94.88 1.35.41.41.8.67 1.35.88.41.16 1.03.35 2.17.4 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c1.14-.05 1.76-.24 2.17-.4.55-.21.94-.47 1.35-.88.41-.41.67-.8.88-1.35.16-.41.35-1.03.4-2.17.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.05-1.14-.24-1.76-.4-2.17a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.41-.16-1.03-.35-2.17-.4-1.24-.06-1.59-.07-4.74-.07Zm0 2.76a5.46 5.46 0 1 1 0 10.92 5.46 5.46 0 0 1 0-10.92Zm0 1.62a3.84 3.84 0 1 0 0 7.68 3.84 3.84 0 0 0 0-7.68Zm5.65-2.9a1.28 1.28 0 1 1 0 2.56 1.28 1.28 0 0 1 0-2.56Z",
    },
    {
      label: "YouTube",
      href: settings.social_youtube || "#",
      color: "text-[#FF0000]",
      hover: "hover:bg-[#FF0000]/15",
      path: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z",
    },
  ];

  return (
    <footer className="bg-primary-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-serif text-2xl font-bold mb-4">Yayasan Nuurul Muttaqiin</h3>
            <p className="text-primary-100 max-w-md leading-relaxed mb-6">
              Lembaga pendidikan Islam terpadu yang berdedikasi mencetak generasi berkarakter Qurani, berwawasan global, dan siap menghadapi tantangan zaman.
            </p>

            {units.length > 0 && (
              <div className="mb-6">
                <p className="text-[11px] uppercase tracking-[0.18em] text-primary-300 mb-3">Unit Kami</p>
                <div className="flex flex-wrap gap-3">
                  {units.map((u) => (
                    <Link
                      key={u.id}
                      href={`/unit/${u.slug}`}
                      aria-label={u.name}
                      title={u.name}
                      className="w-11 h-11 rounded-full bg-white/10 overflow-hidden flex items-center justify-center hover:bg-white/20 hover:scale-105 transition border border-white/10"
                    >
                      {safeImg(u.logo_url) ? (
                        <img src={safeImg(u.logo_url)!} alt={u.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                        <span className="text-sm font-bold text-white">{u.name.charAt(0)}</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={safeUrl(s.href)}
                  target={safeUrl(s.href).startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className={`w-11 h-11 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center transition ${s.hover}`}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${s.color}`} aria-hidden="true">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div className="col-span-1 md:col-span-1">
            <h4 className="text-lg font-semibold mb-4 text-primary-200">Unit Sekolah</h4>
            <ul className="space-y-3 text-primary-100">
              <li><Link href="/unit/lpq" className="hover:text-white transition">LPQ Nuurul Muttaqiin</Link></li>
              <li><Link href="/unit/tk" className="hover:text-white transition">TK Nuurul Muttaqiin</Link></li>
              <li><Link href="/unit/sd" className="hover:text-white transition">SD Nuurul Muttaqiin</Link></li>
              <li><Link href="/unit/smp" className="hover:text-white transition">SMP Nuurul Muttaqiin</Link></li>
              <li><Link href="/unit/smk" className="hover:text-white transition">SMK Nuurul Muttaqiin</Link></li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-3">
            <h4 className="text-lg font-semibold mb-4 text-primary-200">Kontak & Lokasi</h4>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <ul className="space-y-3 text-primary-100 lg:col-span-6">
                <li className="flex items-start gap-3">
                  <span className="mt-1">📍</span>
                  <span>{address}</span>
                </li>
                <li className="flex items-center gap-3">
                  <span>📞</span>
                  <span>{phone}</span>
                </li>
                <li className="flex items-center gap-3">
                  <span>✉️</span>
                  <span className="whitespace-nowrap">{email}</span>
                </li>
              </ul>

              <div className="flex flex-col gap-3 h-full lg:col-span-6">
                {mapEmbedUrl ? (
                  <div className="w-full aspect-[16/10] min-h-[170px] rounded-2xl overflow-hidden border border-white/10 shadow-lg relative group bg-primary-800 transition-all duration-300 hover:border-accent-default/30 hover:shadow-2xl">
                    <iframe
                      src={mapEmbedUrl}
                      className="absolute top-0 left-0 w-full h-full transition-transform duration-500 group-hover:scale-105"
                      style={{ border: 0 }}
                      allowFullScreen={false}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Peta Lokasi Yayasan"
                    ></iframe>
                    {/* Glassmorphic Badge */}
                    <div className="absolute top-3 right-3 bg-primary-950/80 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold text-accent-default tracking-wide uppercase shadow-md pointer-events-none border border-white/10">
                      📍 Lokasi Yayasan
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-[16/10] min-h-[170px] rounded-2xl overflow-hidden border border-primary-800 border-dashed bg-primary-900/50 flex flex-col items-center justify-center text-primary-300">
                    <span className="text-3xl mb-2">🗺️</span>
                    <p className="text-sm font-medium">Peta Lokasi Belum Diatur</p>
                    <p className="text-xs text-primary-400 mt-1 opacity-70">(Hanya terlihat oleh admin)</p>
                  </div>
                )}

                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-default bg-white/5 hover:bg-white/10 border border-white/10 hover:border-accent-default/30 px-4 py-2.5 rounded-xl transition-all duration-300 hover:-translate-y-0.5 shadow-sm hover:shadow-md mt-1 w-fit"
                >
                  Buka di Google Maps <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-800 pt-8 flex flex-col md:flex-row items-center justify-between text-primary-200 text-sm">
          <p>&copy; {new Date().getFullYear()} Yayasan Nuurul Muttaqiin. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
