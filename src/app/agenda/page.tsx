import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export const revalidate = 60;

export default async function AgendaPage() {
  let events: RowDataPacket[] = [];
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM events WHERE start_date >= CURRENT_DATE() ORDER BY start_date ASC LIMIT 30"
    );
    events = rows;
  } catch (error) {
    console.error("Failed to fetch events", error);
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-primary-900 pb-20">
        <Header />
        <div className="pt-32 pb-10 text-center text-white px-4">
          <h1 className="font-serif text-4xl font-bold mb-4">Agenda & Kalender Akademik</h1>
          <p className="text-primary-100 max-w-2xl mx-auto">
            Jadwal kegiatan penting dan acara mendatang di lingkungan Yayasan Nuurul Muttaqiin.
          </p>
        </div>
      </div>

      <div className="flex-1 -mt-16 mb-20 px-4 md:px-0">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100">
            
            {events.length > 0 ? (
              <div className="space-y-8">
                {events.map((evt, index) => {
                  const startDate = new Date(evt.start_date);
                  const endDate = evt.end_date ? new Date(evt.end_date) : null;
                  
                  return (
                    <div key={evt.id} className={`flex flex-col md:flex-row gap-6 ${index !== events.length - 1 ? 'border-b border-gray-100 pb-8' : ''}`}>
                      <div className="md:w-32 w-20 h-20 md:h-32 flex-shrink-0 flex flex-col items-center justify-center bg-primary-50 rounded-xl p-2 md:p-4 text-center border border-primary-100">
                        <span className="text-primary-600 font-bold text-sm uppercase tracking-wider">{startDate.toLocaleDateString('id-ID', { month: 'short' })}</span>
                        <span className="text-4xl font-black text-primary-900">{startDate.getDate()}</span>
                        <span className="text-primary-600 text-sm">{startDate.getFullYear()}</span>
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{evt.title}</h2>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                          {evt.location && (
                            <div className="flex items-center gap-1">
                              <span>📍</span> {evt.location}
                            </div>
                          )}
                          {endDate && (
                            <div className="flex items-center gap-1">
                              <span>⏱️</span> S/d {endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                          )}
                        </div>
                        
                        <p className="text-gray-600 leading-relaxed line-clamp-4 md:line-clamp-none">{evt.description}</p>
                      </div>

                      {evt.image_url && (
                        <div className="md:w-48 flex-shrink-0">
                           <div className="aspect-video md:aspect-square rounded-xl overflow-hidden border border-gray-100">
                             <img src={evt.image_url} alt={evt.title} className="w-full h-full object-cover" />
                           </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Belum Ada Agenda</h3>
                <p>Saat ini tidak ada agenda/kegiatan mendatang yang dijadwalkan.</p>
              </div>
            )}

          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
