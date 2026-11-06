"use client";

import { useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";

export function TiltCard({
  children,
  className = "",
  style = {},
  tiltDegree = 6,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  tiltDegree?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rotateX = useTransform(y, [0, 1], [tiltDegree, -tiltDegree]);
  const rotateY = useTransform(x, [0, 1], [-tiltDegree, tiltDegree]);
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width);
    y.set((e.clientY - r.top) / r.height);
  };
  const handleLeave = () => { x.set(0.5); y.set(0.5); };
  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", ...style }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Pin({ className = "" }: { className?: string }) {
  return (
    <span className={`absolute -top-2 left-1/2 z-10 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full shadow-md ring-1 ring-black/10 ${className}`}>
      <span className="h-2 w-2 rounded-full bg-white/70" />
    </span>
  );
}

export const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } },
};

export const paperNoteColors = [
  { bg: "bg-pink-200", pin: "bg-red-500" },
  { bg: "bg-purple-200", pin: "bg-purple-600" },
  { bg: "bg-yellow-200", pin: "bg-yellow-600" },
  { bg: "bg-blue-200", pin: "bg-blue-600" },
  { bg: "bg-teal-200", pin: "bg-teal-600" },
  { bg: "bg-orange-200", pin: "bg-orange-500" },
  { bg: "bg-rose-200", pin: "bg-rose-600" },
  { bg: "bg-lime-200", pin: "bg-lime-600" },
];

export const decorativeNotes = [
  { top: "5%", left: "2%", w: 20, h: 24, rotate: -8, colorIdx: 0 },
  { top: "15%", right: "2%", w: 16, h: 20, rotate: 10, colorIdx: 1 },
  { bottom: "8%", left: "3%", w: 18, h: 22, rotate: -6, colorIdx: 2 },
  { bottom: "12%", right: "2%", w: 22, h: 26, rotate: 7, colorIdx: 3 },
];
