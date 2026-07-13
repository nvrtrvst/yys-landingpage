"use client";
import React, { useState } from "react";
import DOMPurify from "isomorphic-dompurify";

export interface FaqItem {
  id: number;
  category?: string;
  question: string;
  answer: string;
}

export function FAQSection({ data }: { data: FaqItem[] }) {
  const [openId, setOpenId] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  // Group by category
  const categories = data.reduce((acc, curr) => {
    const cat = curr.category || 'Umum';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(curr);
    return acc;
  }, {} as Record<string, FaqItem[]>);

  return (
    <section className="py-20 bg-white relative">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl relative z-10">
        <div className="text-center mb-16 fade-in">
          <span className="inline-block py-1 px-4 rounded-full bg-primary-100 text-primary-800 text-sm font-bold mb-4 tracking-widest uppercase">
            FAQ
          </span>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-gray-900 mb-6">Pertanyaan Seputar PPDB</h2>
          <div className="w-16 h-1.5 bg-accent-default mx-auto rounded-full"></div>
        </div>

        <div className="space-y-12">
          {Object.entries(categories).map(([category, faqs]) => (
            <div key={category} className="fade-in">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-100 flex items-center gap-3">
                <span className="text-primary-600">■</span> {category}
              </h3>
              <div className="space-y-4">
                {faqs.map((faq) => {
                  const isOpen = openId === faq.id;
                  return (
                    <div 
                      key={faq.id} 
                      className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-primary-300 bg-primary-50/30 shadow-md' : 'border-gray-200 bg-white hover:border-primary-200'}`}
                    >
                      <button 
                        onClick={() => setOpenId(isOpen ? null : faq.id)}
                        className="w-full text-left px-6 py-5 flex justify-between items-center focus:outline-none"
                      >
                        <span className="font-bold text-gray-900 text-lg pr-8">{faq.question}</span>
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center bg-white border border-gray-200 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180 bg-primary-100 border-primary-200 text-primary-700' : 'text-gray-400'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </button>
                      <div 
                        className={`transition-all duration-300 ease-in-out px-6 overflow-hidden ${isOpen ? 'max-h-[800px] pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
                      >
                        <div className="pt-4 border-t border-primary-100/50">
                          <div className="text-gray-600 leading-relaxed text-lg prose max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(faq.answer) }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
