"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

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
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Responsive percentage-based translation for a highly noticeable parallax effect.
  // -25% to 25% of the image's own height (which is 200% of the container height).
  // This guarantees a total parallax movement of 100% of the container height.
  const y = useTransform(scrollYProgress, [0, 1], ["-25%", "25%"]);

  // When reduced motion is preferred, render a simple static image — no parallax scroll
  if (shouldReduceMotion) {
    return (
      <div className={`overflow-hidden relative ${className}`}>
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
