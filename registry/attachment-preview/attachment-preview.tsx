// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import {
  ArrowClockwise,
  File,
  FileCode,
  FilePdf,
  FileText,
  Table,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "@/components/ui/action-button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { enter, exit, spring } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type AttachmentStatus = "uploading" | "ready" | "failed";

export type Attachment = {
  id: string;
  name: string;
  /** Bytes. */
  size: number;
  /** MIME type, e.g. "image/png" or "application/pdf". */
  type: string;
  /** Image URL or object URL; images without it show as file tiles. */
  src?: string;
  /** Alt text for images. Defaults to the file name. */
  alt?: string;
  status?: AttachmentStatus;
  /** Upload progress 0–1 while uploading. */
  progress?: number;
  error?: string;
};

export type AttachmentPreviewProps = {
  data: Attachment[];
  onRemove?: (attachment: Attachment) => void;
  onRetry?: (attachment: Attachment) => void;
  /** Called with the attachment shown in the enlarged view, or null when it closes. */
  onOpen?: (attachment: Attachment | null) => void;
  className?: string;
};

export const formatBytes = (n: number) =>
  n < 1024
    ? `${n} B`
    : n < 1024 ** 2
      ? `${(n / 1024).toFixed(0)} KB`
      : `${(n / 1024 ** 2).toFixed(1)} MB`;

const isImage = (a: Attachment) => a.type.startsWith("image/") && !!a.src;

function FileGlyph({ type, className }: { type: string; className: string }) {
  const props = { weight: "fill" as const, className, "aria-hidden": true };
  if (type === "application/pdf") return <FilePdf {...props} />;
  if (/csv|spreadsheet|excel/.test(type)) return <Table {...props} />;
  if (/json|javascript|typescript|x-python|html|css/.test(type))
    return <FileCode {...props} />;
  if (type.startsWith("text/")) return <FileText {...props} />;
  return <File {...props} />;
}

const extension = (name: string) => name.split(".").pop()?.toUpperCase() ?? "";

export function AttachmentPreview({
  data,
  onRemove,
  onRetry,
  onOpen,
  className,
}: AttachmentPreviewProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const opened = data.find((a) => a.id === openId && isImage(a)) ?? null;
  const uploading = data.filter((a) => a.status === "uploading").length;
  const failed = data.filter((a) => a.status === "failed").length;

  const open = (a: Attachment | null) => {
    setOpenId(a?.id ?? null);
    onOpen?.(a);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("w-full", className)}>
        <ul aria-label="Attachments" className="flex flex-wrap gap-2">
          <AnimatePresence initial={false} mode="popLayout">
            {data.map((a) => (
              <motion.li
                key={a.id}
                layout="position"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1, transition: enter }}
                exit={{ opacity: 0, scale: 0.95, transition: exit }}
                transition={{ layout: spring }}
                className="group relative"
              >
                {isImage(a) ? (
                  <ImageTile attachment={a} onOpen={() => open(a)} />
                ) : (
                  <FileTile attachment={a} onRetry={onRetry} />
                )}
                {onRemove && (
                  <IconButton
                    icon={X}
                    iconWeight="bold"
                    label={`Remove ${a.name}`}
                    onClick={() => onRemove(a)}
                    className="absolute -top-1.5 -right-1.5 size-6 bg-surface-raised text-foreground opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-surface-raised [@media(hover:none)]:opacity-100"
                  />
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <p role="status" aria-live="polite" className="sr-only">
          {uploading
            ? `Uploading ${uploading} file${uploading > 1 ? "s" : ""}`
            : failed
              ? `${failed} upload${failed > 1 ? "s" : ""} failed`
              : ""}
        </p>
      </div>
      <Lightbox attachment={opened} onClose={() => open(null)} />
    </MotionConfig>
  );
}

function ImageTile({
  attachment: a,
  onOpen,
}: {
  attachment: Attachment;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${a.name}`}
      className="relative block size-20 overflow-hidden rounded-2xl bg-foreground/[0.06] transition-[scale] duration-150 ease-out active:scale-[0.97]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- user-provided URLs, no optimizer */}
      <img src={a.src} alt={a.alt ?? a.name} className="size-full object-cover" />
      {a.status === "uploading" && (
        <span className="absolute inset-x-2 bottom-2">
          <ProgressBar
            value={a.progress ?? 0}
            max={1}
            size="sm"
            label={`Uploading ${a.name}`}
            className="bg-black/30"
          />
        </span>
      )}
      {a.status === "failed" && (
        <span className="absolute inset-0 flex items-center justify-center bg-negative/70 text-white">
          <WarningCircle weight="fill" className="size-5" aria-hidden="true" />
          <span className="sr-only">Upload failed</span>
        </span>
      )}
    </button>
  );
}

function FileTile({
  attachment: a,
  onRetry,
}: {
  attachment: Attachment;
  onRetry?: (a: Attachment) => void;
}) {
  const failed = a.status === "failed";
  return (
    <div
      className={cn(
        "flex h-20 w-56 items-center gap-3 rounded-2xl px-3",
        failed ? "bg-negative/10" : "bg-foreground/[0.06]",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          failed
            ? "bg-negative/15 text-negative"
            : "bg-foreground/[0.06] text-muted-foreground",
        )}
      >
        <FileGlyph type={a.type} className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.8125rem] font-medium">{a.name}</span>
        {a.status === "uploading" ? (
          <span className="mt-1.5 block">
            <ProgressBar
              value={a.progress ?? 0}
              max={1}
              size="sm"
              label={`Uploading ${a.name}`}
              valueText={`${Math.round((a.progress ?? 0) * 100)}%`}
            />
            <span className="mt-1 block font-mono text-[0.6875rem] text-muted-foreground tabular-nums">
              {Math.round((a.progress ?? 0) * 100)}% of {formatBytes(a.size)}
            </span>
          </span>
        ) : failed ? (
          <span className="flex flex-col items-start gap-0.5 text-xs text-negative">
            <span className="max-w-full truncate">{a.error ?? "Upload failed"}</span>
            {onRetry && (
              <button
                type="button"
                onClick={() => onRetry(a)}
                className="-ml-1.5 inline-flex h-5 items-center gap-1 rounded-full px-1.5 font-medium transition-[background-color,scale] duration-150 ease-out hover:bg-negative/15 active:scale-[0.97]"
              >
                <ArrowClockwise weight="bold" className="size-3" aria-hidden="true" />
                Retry
              </button>
            )}
          </span>
        ) : (
          <span className="block font-mono text-[0.6875rem] text-muted-foreground">
            {extension(a.name)} · {formatBytes(a.size)}
          </span>
        )}
      </span>
    </div>
  );
}

function Lightbox({
  attachment,
  onClose,
}: {
  attachment: Attachment | null;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!attachment) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // Only one focusable control inside, so Tab stays on it.
      if (e.key === "Tab") {
        e.preventDefault();
        closeRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      returnFocus.current?.focus();
    };
  }, [attachment, onClose]);

  return (
    <AnimatePresence>
      {attachment && (
        <motion.div
          key="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={attachment.name}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: enter }}
          exit={{ opacity: 0, transition: exit }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-6"
        >
          <motion.figure
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1, transition: { ...enter, duration: 0.24 } }}
            exit={{ opacity: 0, scale: 0.98, transition: exit }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-full max-w-3xl flex-col gap-2 rounded-[1.375rem] bg-surface p-1.5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- user-provided URLs */}
            <img
              src={attachment.src}
              alt={attachment.alt ?? attachment.name}
              className="max-h-[75vh] w-auto rounded-2xl object-contain"
            />
            <figcaption className="flex items-center gap-2 pr-1 pb-0.5 pl-3 text-[0.8125rem]">
              <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {formatBytes(attachment.size)}
              </span>
              <IconButton
                ref={closeRef}
                icon={X}
                iconWeight="bold"
                label="Close preview"
                onClick={onClose}
              />
            </figcaption>
          </motion.figure>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
