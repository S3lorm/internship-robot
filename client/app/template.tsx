"use client";

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(4px)", y: 15 }}
      animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
      transition={{ 
        duration: 0.4, 
        ease: "easeOut",
      }}
      className="flex min-h-[calc(100vh-4rem)] flex-col"
    >
      {children}
    </motion.div>
  );
}
