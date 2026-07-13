"use client";

import React from "react";

export interface Testimonial {
  id: number;
  content: string;
  image_url?: string;
  author_name: string;
  role: string;
}

export function TestimonialsSection({ data }: { data: Testimonial[] }) {
  if (!data || data.length === 0) return null;

  return (
    <section className="py-24 bg-gradient-to-b from-white to-primary-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-200 rounded-full blur-3xl mix-blend-multiply"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent-light rounded-full blur-3xl mix-blend-multiply"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 fade-in">
          <span className="inline-block py-1 px-4 rounded-full bg-primary-100 text-primary-800 text-sm font-bold mb-4 tracking-widest uppercase shadow-sm">
            Testimoni
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">Apa Kata Mereka?</h2>
          <div className="w-20 h-1.5 bg-accent-default mx-auto rounded-full mb-6"></div>
          <p className="text-gray-600 text-lg md:text-xl">
            Cerita dan pengalaman berharga dari orang tua, alumni, serta tokoh masyarakat tentang pendidikan di Yayasan Nuurul Muttaqiin.
          </p>
        </div>

        {/* Gunakan flex overflow-x-auto di mobile agar bisa di-swipe, grid di desktop */}
        <div className="flex overflow-x-auto pb-10 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 -mx-4 px-4 md:mx-0 md:px-0">
          {data.map((testi) => (
            <div key={testi.id} className="bg-white p-8 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-primary-100/50 min-w-[320px] snap-center flex flex-col relative transition-all duration-300 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-2 group">
              <div className="absolute top-8 right-8 text-7xl text-primary-50 font-serif leading-none group-hover:text-primary-100 transition-colors duration-300">
                &rdquo;
              </div>
              <p className="text-gray-700 font-serif text-lg md:text-xl leading-relaxed flex-1 mb-8 relative z-10">
                &quot;{testi.content}&quot;
              </p>
              <div className="flex items-center gap-4 mt-auto pt-6 border-t border-gray-50">
                {testi.image_url ? (
                  <img src={testi.image_url} alt={testi.author_name} className="w-14 h-14 rounded-full object-cover ring-2 ring-primary-100" />
                ) : (
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 rounded-full flex items-center justify-center font-bold text-xl ring-2 ring-white shadow-sm">
                    {testi.author_name?.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-gray-900 text-base">{testi.author_name}</h4>
                  <p className="text-primary-600 text-sm font-medium">{testi.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
