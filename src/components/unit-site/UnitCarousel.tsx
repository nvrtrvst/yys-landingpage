"use client";

import { useState } from "react";

export function UnitCarousel({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);
  if (images.length === 0) return null;

  return (
    <div>
      <div className="unit-site-carousel-viewport">
        <div className="unit-site-carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {images.map((src, position) => (
            <div key={`${src}-${position}`} className="unit-site-carousel-slide">
              <img src={src} alt={`Media kegiatan ${position + 1}`} loading={position === 0 ? "eager" : "lazy"} decoding="async" />
            </div>
          ))}
        </div>
      </div>
      <div className="unit-site-carousel-controls">
        <button type="button" className="unit-site-carousel-button" onClick={() => setIndex((current) => (current - 1 + images.length) % images.length)} aria-label="Gambar sebelumnya">Sebelumnya</button>
        <button type="button" className="unit-site-carousel-button" onClick={() => setIndex((current) => (current + 1) % images.length)} aria-label="Gambar berikutnya">Berikutnya</button>
      </div>
      {images.length > 1 ? (
        <div className="unit-site-carousel-controls" aria-label="Pilih gambar">
          {images.map((_, position) => (
            <button key={position} type="button" className="unit-site-carousel-button" onClick={() => setIndex(position)} aria-label={`Tampilkan gambar ${position + 1}`} aria-current={position === index ? "true" : undefined}>
              {position + 1}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
