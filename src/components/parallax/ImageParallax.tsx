"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useMounted } from "@/lib/useMounted";

export function ImageParallax({ 
  src, 
  alt, 
  className = "" 
}: { 
  src: string; 
  alt: string; 
  className?: string;
}) {
  const ref = useRef(null);
  // isMounted ensures the initial client render matches the server render.
  // Only after mount do we check the OS preference and potentially switch
  // to a static image — at that point hydration is already complete.
  const isMounted = useMounted();
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-25%", "25%"]);

  // After mounting: if the user prefers reduced motion, render a static image.
  // Before mounting: always render the motion version so it matches the server HTML.
  if (isMounted && shouldReduceMotion) {
    return (
      <div className={`overflow-hidden relative ${className}`}>
        { }
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }

  return (
    <div ref={ref} className={`overflow-hidden relative ${className}`}>
      <motion.img
        style={{ y }}
        src={src}
        alt={alt}
        className="absolute inset-x-0 w-full h-[200%] object-cover -top-[50%] will-change-transform"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
