// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import {
  ArrowClockwise,
  Check,
  Copy,
  FileText,
  Image as ImageIcon,
  PencilSimple,
  WarningCircle,
} from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button, IconButton } from "@/components/ui/action-button";
import { TextArea } from "@/components/ui/text-field";
import { enter, exit } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/loader";

export type UserMessageAttachment = {
  id: string;
  name: string;
  kind: "image" | "file";
  /** Bytes. */
  size?: number;
  /** Optional thumbnail for images. */
  previewUrl?: string;
};

export type UserMessageStatus = "sending" | "sent" | "failed";

export type UserMessageData = {
  id: string;
  content: string;
  attachments?: UserMessageAttachment[];
  /** Display time, e.g. "14:02". */
  sentAt?: string;
  status?: UserMessageStatus;
  edited?: boolean;
};

export type UserMessageProps = {
  data: UserMessageData;
  /** Save & resend from the inline editor. Hides the edit action when omitted. */
  onEdit?: (text: string) => void;
  onRetry?: () => void;
  onCopy?: (text: string) => void;
  /** UI strings, for translating. */
  labels?: Partial<UserMessageLabels>;
  className?: string;
};

export type UserMessageLabels = {
  attachments: string;
  image: string;
  file: string;
  /** File size shown under an attachment name. */
  bytes: (n: number) => string;
  edit: string;
  copy: string;
  copied: string;
  cancel: string;
  saveAndResend: string;
  sending: string;
  notSent: string;
  /** Screen-reader announcement when sending fails. */
  failed: string;
  retry: string;
  sent: string;
  edited: string;
};

const defaultLabels: UserMessageLabels = {
  attachments: "Attachments",
  image: "Image",
  file: "File",
  bytes: (n) => formatBytes(n),
  edit: "Edit message",
  copy: "Copy message",
  copied: "Copied",
  cancel: "Cancel",
  saveAndResend: "Save & resend",
  sending: "Sending",
  notSent: "Not sent",
  failed: "Message not sent",
  retry: "Retry",
  sent: "Sent",
  edited: "Edited",
};

export const formatBytes = (n: number) =>
  n < 1024
    ? `${n} B`
    : n < 1024 ** 2
      ? `${Math.round(n / 1024)} KB`
      : `${(n / 1024 ** 2).toFixed(1)} MB`;

export function UserMessage({
  data,
  onEdit,
  onRetry,
  onCopy,
  labels: labelOverrides,
  className,
}: UserMessageProps) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const { content, attachments = [], sentAt, status = "sent", edited } = data;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const [copied, setCopied] = useState(false);
  const editButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const startEdit = () => {
    setDraft(content);
    setEditing(true);
  };
  const cancel = () => {
    setEditing(false);
    // Return focus to where editing started.
    requestAnimationFrame(() => editButton.current?.focus());
  };
  const save = () => {
    const text = draft.trim();
    if (!text) return;
    setEditing(false);
    if (text !== content) onEdit?.(text);
  };
  const copy = () => {
    navigator.clipboard?.writeText(content).catch(() => {});
    onCopy?.(content);
    setCopied(true);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("group flex w-full flex-col items-end gap-1.5", className)}>
        {attachments.length > 0 && (
          <ul
            aria-label={labels.attachments}
            className="flex max-w-[85%] flex-wrap justify-end gap-1.5"
          >
            {attachments.map((file) => (
              <li
                key={file.id}
                className="flex items-center gap-2 rounded-xl bg-foreground/[0.05] py-1.5 ps-1.5 pe-3"
              >
                <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-foreground/[0.06] text-muted-foreground">
                  {file.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={file.previewUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : file.kind === "image" ? (
                    <ImageIcon weight="fill" className="size-4" aria-hidden="true" />
                  ) : (
                    <FileText weight="fill" className="size-4" aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block max-w-40 truncate text-[0.8125rem]">
                    {file.name}
                  </span>
                  {file.size !== undefined && (
                    <span className="block text-[0.6875rem] text-muted-foreground">
                      {file.kind === "image" ? labels.image : labels.file} ·{" "}
                      <span dir="ltr">{labels.bytes(file.size)}</span>
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}

        <AnimatePresence mode="popLayout" initial={false}>
          {editing ? (
            <motion.form
              key="edit"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1, transition: enter }}
              exit={{ opacity: 0, transition: exit }}
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
              className="flex w-full max-w-[85%] flex-col gap-2 rounded-2xl bg-surface p-1.5 ltr:origin-top-right rtl:origin-top-left"
            >
              <TextArea
                aria-label={labels.edit}
                dir="auto"
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onFocus={(e) => e.target.setSelectionRange(draft.length, draft.length)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") cancel();
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    save();
                  }
                }}
                rows={Math.min(6, Math.max(2, draft.split("\n").length))}
              />
              <div className="flex justify-end gap-1.5">
                <Button type="button" variant="quiet" size="sm" onClick={cancel}>
                  {labels.cancel}
                </Button>
                <Button type="submit" size="sm" disabled={!draft.trim()}>
                  {labels.saveAndResend}
                </Button>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="bubble"
              dir="auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: enter }}
              exit={{ opacity: 0, transition: exit }}
              className={cn(
                "max-w-[85%] rounded-2xl rounded-ee-md bg-surface-raised px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                status === "sending" && "opacity-70",
              )}
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>

        {!editing && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span
              className={cn(
                "flex items-center gap-1 opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100",
              )}
            >
              {onEdit && status !== "sending" && (
                <IconButton
                  ref={editButton}
                  icon={PencilSimple}
                  label={labels.edit}
                  variant="quiet"
                  size="sm"
                  onClick={startEdit}
                />
              )}
              <IconButton
                icon={copied ? Check : Copy}
                iconWeight={copied ? "bold" : "fill"}
                label={copied ? labels.copied : labels.copy}
                variant="quiet"
                size="sm"
                onClick={copy}
              />
            </span>
            <Delivery
              status={status}
              sentAt={sentAt}
              edited={edited}
              onRetry={onRetry}
              labels={labels}
            />
          </div>
        )}
        <p role="status" aria-live="polite" className="sr-only">
          {status === "failed" ? labels.failed : copied ? labels.copied : ""}
        </p>
      </div>
    </MotionConfig>
  );
}

function Delivery({
  status,
  sentAt,
  edited,
  onRetry,
  labels,
}: {
  status: UserMessageStatus;
  sentAt?: string;
  edited?: boolean;
  onRetry?: () => void;
  labels: UserMessageLabels;
}) {
  if (status === "sending")
    return (
      <span className="flex items-center gap-1 px-1">
        <Spinner size="sm" label={labels.sending} className="text-current" />
        <span aria-hidden="true">{labels.sending}</span>
      </span>
    );
  if (status === "failed")
    return (
      <span className="flex items-center gap-1.5 ps-1 text-negative">
        <WarningCircle weight="fill" className="size-3.5" aria-hidden="true" />
        {labels.notSent}
        {onRetry && (
          <Button
            variant="danger"
            size="sm"
            icon={ArrowClockwise}
            iconWeight="bold"
            onClick={onRetry}
          >
            {labels.retry}
          </Button>
        )}
      </span>
    );
  return (
    <span className="px-1 tabular-nums">
      {edited ? labels.edited : labels.sent}
      {sentAt && ` · ${sentAt}`}
    </span>
  );
}
