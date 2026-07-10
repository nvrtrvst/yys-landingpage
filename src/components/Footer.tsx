import Link from "next/link";
import { getSettings } from "@/lib/db";

export async function Footer() {
  const settings = await getSettings();
  const address = settings.contact_address || "Jl. Pendidikan No. 1, Kota Islam";
  const phone = settings.contact_phone || "0812-3456-7890";
  const email = settings.contact_email || "info@nuurulmuttaqiin.or.id";
  let mapEmbedUrl = settings.map_embed_url;
  
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
  return (
    <footer className="bg-primary-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-serif text-2xl font-bold mb-4">Yayasan Nuurul Muttaqiin</h3>
            <p className="text-primary-100 max-w-md leading-relaxed mb-6">
              Lembaga pendidikan Islam terpadu yang berdedikasi mencetak generasi berkarakter Qurani, berwawasan global, dan siap menghadapi tantangan zaman.
            </p>
            <div className="flex gap-4">
              {/* Social Icons Placeholders */}
              <a href="#" aria-label="Facebook" className="w-11 h-11 md:w-10 md:h-10 rounded-full bg-primary-800 flex items-center justify-center hover:bg-primary-700 transition">
                FB
              </a>
              <a href="#" aria-label="Instagram" className="w-11 h-11 md:w-10 md:h-10 rounded-full bg-primary-800 flex items-center justify-center hover:bg-primary-700 transition">
                IG
              </a>
              <a href="#" aria-label="YouTube" className="w-11 h-11 md:w-10 md:h-10 rounded-full bg-primary-800 flex items-center justify-center hover:bg-primary-700 transition">
                YT
              </a>
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
