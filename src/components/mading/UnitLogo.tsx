"use client";
import { useEffect, useState } from "react";

export function UnitLogo({ src, slug, alt }: { src: string | null; slug: string; alt: string }) {
  const fallback = slug ? `/${slug}.png` : "/logo.png";
  const [current, setCurrent] = useState<string>(src || fallback);
  useEffect(() => { setCurrent(src || fallback); }, [src, fallback]);
  return (
    <img
      src={current}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setCurrent("/logo.png")}
    />
  );
}
