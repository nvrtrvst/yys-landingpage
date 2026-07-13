"use client";

import { motion } from "framer-motion";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1, y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 },
  },
};

export function CorkboardWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex-1 bg-gradient-to-br from-stone-100 via-amber-50 to-amber-100">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.10]"
        style={{
          backgroundImage: "radial-gradient(circle, #8B7355 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <motion.div
        initial="hidden"
        animate="show"
        variants={itemVariants}
        className="relative"
      >
        {children}
      </motion.div>
    </div>
  );
}
