"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CopyButtonProps {
  text: string;
}

export default function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const reduceMotion = useReducedMotion();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.button
      onClick={handleCopy}
      className={`hover:bg-foreground text-primary inline-flex shrink-0 items-center justify-center rounded-sm border-slate-200 bg-transparent p-1 hover:text-slate-900 ${copied ? "copy-btn--copied" : ""}`}
      title={copied ? "Đã copy!" : "Copy link"}
      aria-label={copied ? "Đã copy!" : "Copy link"}
      whileHover={reduceMotion ? undefined : { y: -1, scale: 1.04 }}
      whileTap={reduceMotion ? undefined : { scale: 0.94 }}
      animate={copied && !reduceMotion ? { scale: [1, 1.12, 1] } : undefined}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </motion.button>
  );
}
