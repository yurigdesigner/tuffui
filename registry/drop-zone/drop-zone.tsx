"use client";

import { FileArrowUp, WarningCircle } from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/action-button";
import { EASE_OUT } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type RejectedFile = { file: File; reason: string };

export type FileRules = {
  /** MIME types or extensions, like the input's accept: "image/*,.pdf,.csv". */
  accept?: string;
  /** Bytes. */
  maxSize?: number;
  multiple?: boolean;
  /** Most files in one drop. */
  maxFiles?: number;
};

const formatBytes = (n: number) =>
  n < 1024
    ? `${n} B`
    : n < 1024 ** 2
      ? `${Math.round(n / 1024)} KB`
      : `${(n / 1024 ** 2).toFixed(1)} MB`;

function matches(file: File, accept?: string) {
  if (!accept) return true;
  return accept.split(",").some((rule) => {
    const r = rule.trim().toLowerCase();
    if (r.startsWith(".")) return file.name.toLowerCase().endsWith(r);
    if (r.endsWith("/*")) return file.type.startsWith(r.slice(0, -1));
    return file.type === r;
  });
}

/** Splits files into accepted and rejected with a reason for each rejection. */
export function checkFiles(files: File[], rules: FileRules) {
  const accepted: File[] = [];
  const rejected: RejectedFile[] = [];
  const limit = rules.multiple === false ? 1 : (rules.maxFiles ?? Infinity);
  for (const file of files) {
    if (!matches(file, rules.accept))
      rejected.push({ file, reason: "Type not supported" });
    else if (rules.maxSize && file.size > rules.maxSize)
      rejected.push({ file, reason: `Larger than ${formatBytes(rules.maxSize)}` });
    else if (accepted.length >= limit) rejected.push({ file, reason: "Too many files" });
    else accepted.push(file);
  }
  return { accepted, rejected };
}

/** "image/*" → "images", "application/pdf" → "PDF", ".csv" → "CSV". */
function describeType(rule: string) {
  const r = rule.trim();
  if (r.endsWith("/*")) return `${r.slice(0, -2)}s`;
  return (r.startsWith(".") ? r.slice(1) : r.split("/").pop()!).toUpperCase();
}

const hasFiles = (e: React.DragEvent) =>
  Array.from(e.dataTransfer.types).includes("Files");

/** Counts nested dragenter / dragleave so the hover state doesn't flicker over children. */
function useDragging(onDrop: (files: File[]) => void) {
  const depth = useRef(0);
  const [dragging, setDragging] = useState(false);
  return {
    dragging,
    handlers: {
      onDragEnter: (e: React.DragEvent) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current += 1;
        setDragging(true);
      },
      onDragOver: (e: React.DragEvent) => {
        if (hasFiles(e)) e.preventDefault();
      },
      onDragLeave: () => {
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setDragging(false);
      },
      onDrop: (e: React.DragEvent) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current = 0;
        setDragging(false);
        onDrop(Array.from(e.dataTransfer.files));
      },
    },
  };
}

export type DropZoneProps = FileRules & {
  onFiles: (accepted: File[]) => void;
  onReject?: (rejected: RejectedFile[]) => void;
  title?: string;
  /** Hint under the title; defaults to the accepted types and size limit. */
  hint?: string;
  disabled?: boolean;
  className?: string;
};

/** A drop target with a browse button; tells the user why a file was turned away. */
export function DropZone({
  onFiles,
  onReject,
  title = "Drop files here",
  hint,
  disabled,
  className,
  ...rules
}: DropZoneProps) {
  const input = useRef<HTMLInputElement>(null);
  const [rejected, setRejected] = useState<RejectedFile[]>([]);
  const statusId = useId();

  const take = (files: File[]) => {
    const result = checkFiles(files, rules);
    setRejected(result.rejected);
    if (result.accepted.length) onFiles(result.accepted);
    if (result.rejected.length) onReject?.(result.rejected);
  };
  const { dragging, handlers } = useDragging(take);
  const defaultHint = [
    rules.accept?.split(",").map(describeType).join(", "),
    rules.maxSize && `up to ${formatBytes(rules.maxSize)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("w-full", className)}>
        <div
          {...(disabled ? {} : handlers)}
          data-dragging={dragging || undefined}
          className={cn(
            "flex flex-col items-center gap-3 rounded-2xl bg-foreground/[0.04] px-6 py-8 text-center transition-[background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
            dragging && "bg-brand/12",
            disabled && "opacity-40",
          )}
        >
          <motion.span
            animate={{ y: dragging ? -3 : 0, scale: dragging ? 1.06 : 1 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className={cn(
              "flex size-11 items-center justify-center rounded-xl bg-foreground/[0.06] text-muted-foreground transition-colors",
              dragging && "bg-brand/15 text-brand",
            )}
          >
            <FileArrowUp weight="fill" aria-hidden="true" className="size-5" />
          </motion.span>
          <div>
            <p className="text-sm font-medium">
              {dragging ? "Release to attach" : title}
            </p>
            {(hint ?? defaultHint) && (
              <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">
                {hint ?? defaultHint}
              </p>
            )}
          </div>
          <Button
            size="sm"
            disabled={disabled}
            aria-describedby={statusId}
            onClick={() => input.current?.click()}
          >
            Browse files
          </Button>
          <input
            ref={input}
            type="file"
            hidden
            accept={rules.accept}
            multiple={rules.multiple !== false}
            onChange={(e) => {
              take(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </div>
        <div id={statusId} role="status" aria-live="polite">
          <AnimatePresence initial={false}>
            {rejected.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{
                  opacity: 1,
                  height: "auto",
                  transition: { duration: 0.2, ease: EASE_OUT },
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                  transition: { duration: 0.14, ease: EASE_OUT },
                }}
                className="overflow-hidden"
              >
                {rejected.map(({ file, reason }) => (
                  <li
                    key={file.name + file.size}
                    className="mt-1.5 flex items-center gap-2 rounded-xl bg-negative/10 px-3 py-2 text-[0.8125rem] first:mt-2"
                  >
                    <WarningCircle
                      weight="fill"
                      aria-hidden="true"
                      className="size-4 shrink-0 text-negative"
                    />
                    <span className="min-w-0 flex-1 truncate">{file.name}</span>
                    <span className="shrink-0 text-negative">{reason}</span>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
}

export type DropOverlayProps = FileRules & {
  onFiles: (accepted: File[]) => void;
  onReject?: (rejected: RejectedFile[]) => void;
  /** Text on the overlay. */
  title?: string;
  /** Shows the overlay regardless of dragging, e.g. for a page-level drag you track yourself. */
  show?: boolean;
  children: React.ReactNode;
  className?: string;
};

/**
 * Wraps a chat (or any area): while files are dragged over it, a full overlay
 * says where they'll go. Keyboard users attach through the composer's own button.
 */
export function DropOverlay({
  onFiles,
  onReject,
  title = "Drop to attach to this chat",
  show,
  children,
  className,
  ...rules
}: DropOverlayProps) {
  const drag = useDragging((files) => {
    const { accepted, rejected } = checkFiles(files, rules);
    if (accepted.length) onFiles(accepted);
    if (rejected.length) onReject?.(rejected);
  });
  const { handlers } = drag;
  const dragging = show ?? drag.dragging;

  return (
    <MotionConfig reducedMotion="user">
      <div {...handlers} className={cn("relative", className)}>
        {children}
        <AnimatePresence>
          {dragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.15, ease: EASE_OUT } }}
              exit={{ opacity: 0, transition: { duration: 0.12, ease: EASE_OUT } }}
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-surface p-1.5"
            >
              <motion.div
                initial={{ scale: 0.96 }}
                animate={{ scale: 1, transition: { duration: 0.2, ease: EASE_OUT } }}
                className="flex size-full flex-col items-center justify-center gap-3 rounded-2xl bg-brand/12 text-brand"
              >
                <FileArrowUp weight="fill" aria-hidden="true" className="size-7" />
                <p className="text-sm font-medium">{title}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <p role="status" aria-live="polite" className="sr-only">
          {dragging ? title : ""}
        </p>
      </div>
    </MotionConfig>
  );
}
