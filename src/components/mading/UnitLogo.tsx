 
"use client";
import { useState } from "react";

export function UnitLogo({ src, slug, alt }: { src: string | null; slug: string; alt: string }) {
  const fallback = slug ? `/${slug}.png` : "/logo.png";
  const [errored, setErrored] = useState(false);
  const current = errored ? "/logo.png" : src || fallback;
  return (
    <img
      src={current}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setErrored(true)}
    />
  );
}
