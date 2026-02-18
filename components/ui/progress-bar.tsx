"use client";

import { motion } from "framer-motion";

export const ProgressBar = ({ progress }: { progress: number }) => {
  return (
    <div className="sticky top-0 z-40 h-1.5 w-full bg-line/50">
      <motion.div
        className="h-full bg-accent"
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        transition={{ type: "spring", stiffness: 130, damping: 24 }}
      />
    </div>
  );
};
