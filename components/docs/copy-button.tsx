"use client";

import { Check, Copy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
      }}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition-[color,background-color,scale] duration-150 ease-ui-out hover:bg-foreground/[0.07] hover:text-foreground active:scale-[0.97]",
        className,
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={copied ? "check" : "copy"}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.1 } }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        >
          {copied ? (
            <Check className="size-3.5 text-positive" aria-hidden="true" />
          ) : (
            <Copy className="size-3.5" aria-hidden="true" />
          )}
        </motion.span>
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </button>
  );
}
