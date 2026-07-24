"use client";

import { useEffect, useState } from "react";

export function LogoFill({ logoSrc }: { logoSrc: string }) {
  const [fill, setFill] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    function onScroll() {
      const d = Math.max(250, window.innerHeight * 0.4);
      const fp = Math.min(1, Math.max(0, window.scrollY / d));
      setFill(fp < 1 ? 1 - Math.pow(1 - fp, 1.8) : 1);
      setOpacity(
        window.scrollY <= d
          ? 1
          : Math.max(0, 1 - (window.scrollY - d) / Math.max(1, window.innerHeight))
      );
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const pct = 100 - Math.min(100, fill * 100);
  const textOpacity = Math.min(1, fill * 1.5);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 30, opacity }}
    >
      <div className="flex flex-col items-center">
        {/* Logo badge ~65% original size */}
        <div className="relative w-44 h-[190px] md:w-52 md:h-[235px] lg:w-64 lg:h-[275px] drop-shadow-2xl">
          <img
            src={logoSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{ opacity: 0.08, filter: "grayscale(1) brightness(1.6)" }}
          />
          <img
            src={logoSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{ clipPath: `inset(${pct}% 0 0 0)`, mixBlendMode: "darken" }}
          />
          {fill > 0 && (
            <img
              src={logoSrc}
              alt=""
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{
                clipPath: `inset(${pct}% 0 0 0)`,
                mixBlendMode: "darken",
                filter: "brightness(0.9) sepia(0.3) hue-rotate(60deg) saturate(1.6)",
              }}
            />
          )}
          {fill >= 1 && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 60%, rgba(16,185,129,0.25) 0%, transparent 65%)",
              }}
            />
          )}
        </div>

        {/* YAYASAN — scroll-linked clip reveal */}
        <div className="relative mt-4 md:mt-6">
          <span className="invisible text-lg md:text-xl lg:text-2xl font-bold tracking-[0.25em]">
            YAYASAN
          </span>
          <span className="absolute inset-0 flex items-center justify-center text-white/15 text-lg md:text-xl lg:text-2xl font-bold tracking-[0.25em]">
            YAYASAN
          </span>
          <span
            className="absolute inset-0 flex items-center justify-center text-white text-lg md:text-xl lg:text-2xl font-bold tracking-[0.25em] drop-shadow-lg"
            style={{ clipPath: `inset(${pct}% 0 0 0)` }}
          >
            YAYASAN
          </span>
        </div>

        {/* Subtitle — fade-in */}
        <div
          className="mt-1 md:mt-2"
          style={{ opacity: textOpacity }}
        >
          <span className="text-white/70 text-xs md:text-sm lg:text-base font-medium tracking-[0.2em] uppercase">
            Pendidikan Islam Terpadu
          </span>
        </div>

        {/* Title — fade-in */}
        <div
          className="mt-1"
          style={{ opacity: textOpacity }}
        >
          <span className="text-white text-2xl md:text-3xl lg:text-4xl font-bold drop-shadow-lg">
            Nuurul Muttaqiin
          </span>
        </div>
      </div>
    </div>
  );
}
