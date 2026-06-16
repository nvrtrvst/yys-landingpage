import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { notFound } from "next/navigation";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";

export const revalidate = 60;

export default async function UnitDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  let unit: RowDataPacket | null = null;
  let programs: RowDataPacket[] = [];
  
  try {
    const slug = (await params).slug;
    const [unitRows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM units WHERE slug = ? AND status = 'active'",
      [slug]
    );
    
    if (unitRows.length === 0) {
      notFound();
    }
    
    unit = unitRows[0];

    const [programRows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM programs WHERE unit_id = ? AND status = 'active' ORDER BY order_index ASC",
      [unit.id]
    );
    programs = programRows;

  } catch (error) {
    console.error("Failed to fetch unit detail", error);
    notFound();
  }

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <div className="bg-primary-900">
        <Header />
        <div className="pt-24 pb-12"></div>
      </div>

      {/* HEADER UNIT */}
      <section className="bg-primary-50 py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center gap-12">
            {unit.image_url && (
              <div className="w-full md:w-1/3">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                  <img src={unit.image_url} alt={unit.name} className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            <div className={`w-full ${unit.image_url ? 'md:w-2/3' : 'text-center'}`}>
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-6">{unit.name}</h1>
              <p className="text-xl text-gray-600 leading-relaxed mb-8">
                {unit.description}
              </p>
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                {unit.address && (
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
                    <span>📍</span> {unit.address}
                  </div>
                )}
                {unit.phone && (
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
                    <span>📞</span> {unit.phone}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DETAIL KONTEN UNIT */}
      {unit.content && (
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <h2 className="font-serif text-3xl font-bold text-gray-900 mb-8">Profil {unit.name}</h2>
            <div 
              className="prose prose-lg prose-primary max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(unit.content) }}
            />
          </div>
        </section>
      )}

      {/* PROGRAM UNGGULAN UNIT INI */}
      {programs.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="font-serif text-3xl font-bold text-gray-900 mb-4">Program Unggulan</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {programs.map((prog) => (
                <div key={prog.id} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  {prog.image_url ? (
                     <img src={prog.image_url} alt={prog.title} className="w-20 h-20 object-cover rounded-full mb-6" />
                  ) : (
                    <div className="w-20 h-20 bg-primary-100 rounded-full mb-6 flex items-center justify-center text-primary-600 text-2xl font-bold">
                      {prog.title.charAt(0)}
                    </div>
                  )}
                  <h3 className="font-bold text-xl text-gray-900 mb-3">{prog.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{prog.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA DAFTAR */}
      <section className="py-20 bg-primary-900 text-center text-white">
        <div className="container mx-auto px-4 md:px-6 max-w-2xl">
          <h2 className="font-serif text-3xl font-bold mb-6">Bergabunglah Bersama Kami</h2>
          <p className="text-primary-100 text-lg mb-10">Daftarkan putra-putri Anda ke {unit.name} sekarang juga dan wujudkan generasi berprestasi berkarakter Islami.</p>
          <Link href="/ppdb" className="inline-block px-10 py-4 bg-accent-default text-primary-900 rounded-full font-bold text-lg hover:bg-accent-light transition shadow-xl hover:-translate-y-1">
            Daftar PPDB Sekarang
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
