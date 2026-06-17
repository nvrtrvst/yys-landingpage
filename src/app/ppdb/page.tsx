import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PPDBForm } from "./PPDBForm";
import { FAQSection } from "@/components/FAQSection";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import Link from "next/link";

export const revalidate = 60;

export default async function PPDBPage() {
  let faqs: RowDataPacket[] = [];
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM faqs WHERE is_active = 1 ORDER BY order_index ASC"
    );
    faqs = rows;
  } catch (error) {
    console.error("Failed to fetch FAQs", error);
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-primary-900 pb-20">
        <Header />
        <div className="pt-32 pb-10 text-center text-white px-4">
          <h1 className="font-serif text-4xl font-bold mb-4">Penerimaan Peserta Didik Baru</h1>
          <p className="text-primary-100 max-w-2xl mx-auto mb-6">Tahun Ajaran 2024/2025. Silakan isi form di bawah ini dengan data yang sebenar-benarnya.</p>
          <Link href="/ppdb/status" className="inline-block px-6 py-2 border-2 border-primary-400 text-primary-50 rounded-lg hover:bg-primary-800 transition font-medium">
            Cek Status Pendaftaran &rarr;
          </Link>
        </div>
      </div>

      <div className="flex-1 -mt-16 mb-20 px-4 md:px-0">
        <PPDBForm />
      </div>

      {/* FAQ Section */}
      <FAQSection data={faqs} />
      
      <Footer />
    </main>
  );
}
