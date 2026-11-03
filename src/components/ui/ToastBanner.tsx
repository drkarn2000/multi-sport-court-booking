"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePlayCourt } from "@/context/PlayCourtContext";
import { CheckCircle2 } from "lucide-react";

export function ToastBanner() {
  const { toastMessage } = usePlayCourt();

  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          key={toastMessage}
          initial={{ opacity: 0, y: 18, scale: 0.96, x: "-50%" }}
          animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
          exit={{ opacity: 0, y: 12, scale: 0.96, x: "-50%" }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-5 left-1/2 z-[90] bg-gradient-to-r from-[#12382b] via-[#1e503e] to-[#115e59] text-white px-4 py-3 rounded-xl shadow-2xl border border-pc-lime/40 flex items-center gap-2.5 text-[12.5px] font-bold max-w-[92vw] hover:border-pc-lime transition-colors"
        >
          <CheckCircle2 className="w-4 h-4 text-pc-lime shrink-0" />
          <span>{toastMessage}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
