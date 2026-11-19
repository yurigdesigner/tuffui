// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import {
  ArrowCounterClockwise,
  CaretRight,
  Check,
  CircleNotch,
  Clock,
  Copy,
  X,
} from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { Button, IconButton } from "@/components/ui/action-button";
import { Inset, Panel, Shell } from "@/components/ui/surface";
import {
  EASE_OUT,
  exit as exitFast,
  instant,
  spring as morph,
} from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type ToolCallStatus = "pending" | "running" | "success" | "error";

export type ToolCall = {
  id: string;
  /** Tool identifier, e.g. `web.search` or `fs.read`. */
  name: string;
  args: Record<string, unknown>;
  status: ToolCallStatus;
  /** Final duration; while running the block counts up on its own. */
  durationMs?: number;
  result?: string | Record<string, unknown>;
  error?: string;
};

export type ToolCallBlockProps = {
  data: ToolCall;
  defaultOpen?: boolean;
  onRetry?: (call: ToolCall) => void;
  /** UI strings, for translating the block. */
  labels?: Partial<ToolCallBlockLabels>;
  className?: string;
};

export type ToolCallBlockLabels = {
  status: Record<ToolCallStatus, string>;
  arguments: string;
  result: string;
  /** Shown when an error call has no message of its own. */
  failed: string;
  retry: string;
  /** Screen-reader names of the copy buttons; `section` is "Arguments" or "Result". */
  copy: (section: string) => string;
  copied: (section: string) => string;
};

const defaultLabels: ToolCallBlockLabels = {
  status: { pending: "Queued", running: "Running", success: "Done", error: "Failed" },
  arguments: "Arguments",
  result: "Result",
  failed: "Tool call failed.",
  retry: "Retry",
  copy: (section) => `Copy ${section.toLowerCase()}`,
  copied: (section) => `${section} copied`,
};

const statuses = {
  pending: {
    icon: Clock,
    className: "bg-foreground/[0.06] text-muted-foreground",
  },
  running: { icon: CircleNotch, className: "bg-brand/15 text-brand" },
  success: { icon: Check, className: "bg-positive/15 text-positive" },
  error: { icon: X, className: "bg-negative/15 text-negative" },
} as const;

// Height morphs on a damped spring; opacity leads on enter and exits faster.
const reveal = { height: morph, opacity: { duration: 0.2, ease: EASE_OUT } } as const;

export function ToolCallBlock({
  data,
  defaultOpen = false,
  onRetry,
  labels: labelOverrides,
  className,
}: ToolCallBlockProps) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const [open, setOpen] = useState(defaultOpen);
  // Toggling from the keyboard (detail === 0) or with reduced motion is instant.
  const [viaKeys, setViaKeys] = useState(false);
  const reduce = useReducedMotion();
  const still = viaKeys || !!reduce;
  const panelId = useId();
  const status = { ...statuses[data.status], label: labels.status[data.status] };
  const Icon = status.icon;
  const running = data.status === "running";

  return (
    <MotionConfig reducedMotion="user">
      <Shell className={cn("max-w-xl overflow-hidden rounded-[1.125rem] p-1", className)}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={(e) => {
            setViaKeys(e.detail === 0);
            setOpen((o) => !o);
          }}
          className="flex w-full items-center gap-2.5 rounded-[0.875rem] py-1.5 ps-1.5 pe-2.5 text-start text-sm transition-[background-color,scale] duration-150 ease-out hover:bg-foreground/[0.03] active:scale-[0.99]"
        >
          <span className="relative flex size-6 shrink-0 items-center justify-center">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={data.status}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0, transition: exitFast }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                className={cn(
                  "flex size-6 items-center justify-center rounded-full",
                  status.className,
                )}
              >
                <Icon
                  weight={Icon === Clock ? "fill" : "bold"}
                  className={cn(
                    "size-3.5",
                    running && "animate-spin motion-reduce:animate-none",
                  )}
                  aria-hidden="true"
                />
              </motion.span>
            </AnimatePresence>
          </span>
          <span dir="ltr" className="shrink-0 font-mono text-[0.8125rem] font-medium">
            {data.name}
          </span>
          {/* Args read left to right and truncate at their end; in RTL they hug the name. */}
          <span
            dir="ltr"
            className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground rtl:text-right"
          >
            {summarize(data.args)}
          </span>
          <span className="sr-only">{status.label}</span>
          <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
            {running ? (
              <Elapsed key={data.id} />
            ) : data.durationMs !== undefined && data.status !== "pending" ? (
              formatMs(data.durationMs)
            ) : null}
          </span>
          {/* Mirrored in RTL: points to the start side closed, down when open. */}
          <span className="flex rtl:-scale-x-100">
            <motion.span
              animate={{ rotate: open ? 90 : 0 }}
              transition={still ? instant : morph}
              className="flex"
            >
              <CaretRight
                weight="bold"
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            </motion.span>
          </span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id={panelId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0, transition: still ? instant : exitFast }}
              transition={still ? instant : reveal}
              className="overflow-hidden"
            >
              <Panel className="mt-1 flex flex-col gap-3 rounded-[0.875rem] p-3">
                <Section
                  title={labels.arguments}
                  copy={JSON.stringify(data.args, null, 2)}
                  labels={labels}
                >
                  <Json value={data.args} />
                </Section>
                {data.status === "error" ? (
                  <div className="flex items-start gap-2 rounded-xl bg-negative/10 py-2 ps-3 pe-2 text-[0.8125rem] text-negative">
                    <X
                      weight="bold"
                      className="mt-0.5 size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <p className="min-w-0 flex-1 font-mono text-xs leading-5 break-words">
                      <bdi>{data.error ?? labels.failed}</bdi>
                    </p>
                    {onRetry && (
                      <Button
                        variant="danger"
                        icon={ArrowCounterClockwise}
                        iconWeight="bold"
                        onClick={() => onRetry(data)}
                        className="h-7 gap-1 px-3 text-xs"
                      >
                        {labels.retry}
                      </Button>
                    )}
                  </div>
                ) : data.status === "success" && data.result !== undefined ? (
                  <Section
                    title={labels.result}
                    labels={labels}
                    copy={
                      typeof data.result === "string"
                        ? data.result
                        : JSON.stringify(data.result, null, 2)
                    }
                  >
                    <div className="max-h-40 overflow-hidden [mask-image:linear-gradient(to_bottom,black_70%,transparent)]">
                      {typeof data.result === "string" ? (
                        <p
                          dir="ltr"
                          className="text-start font-mono text-xs leading-5 whitespace-pre-wrap"
                        >
                          {data.result}
                        </p>
                      ) : (
                        <Json value={data.result} />
                      )}
                    </div>
                  </Section>
                ) : null}
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>
        <p role="status" aria-live="polite" className="sr-only">
          {`${data.name}: ${status.label}`}
        </p>
      </Shell>
    </MotionConfig>
  );
}

function Section({
  title,
  copy,
  labels,
  children,
}: {
  title: string;
  copy: string;
  labels: ToolCallBlockLabels;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="ps-1 text-[0.8125rem] text-muted-foreground">{title}</span>
        <IconButton
          icon={copied ? Check : Copy}
          iconWeight={copied ? "bold" : "fill"}
          label={copied ? labels.copied(title) : labels.copy(title)}
          onClick={async () => {
            await navigator.clipboard.writeText(copy);
            setCopied(true);
          }}
          className={cn("size-7", copied && "text-positive hover:text-positive")}
        />
      </div>
      <Inset className="px-3 py-2.5">{children}</Inset>
    </div>
  );
}

const tokenPattern =
  /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g;

function Json({ value }: { value: unknown }) {
  const text = JSON.stringify(value, null, 2) ?? "";
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(tokenPattern)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    const [token, str, colon, literal] = match;
    const className = colon
      ? "text-muted-foreground"
      : str
        ? "text-positive"
        : literal
          ? "text-brand"
          : "text-warning";
    parts.push(
      <span key={index} className={className}>
        {colon ? str : token}
      </span>,
    );
    if (colon) parts.push(colon);
    last = index + token.length;
  }
  parts.push(text.slice(last));
  return (
    <pre
      dir="ltr"
      className="font-mono text-xs leading-5 break-words whitespace-pre-wrap text-foreground"
    >
      {parts}
    </pre>
  );
}

/** Counts up from mount; remounted (via key) each time a call starts running. */
function Elapsed() {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const timer = setInterval(() => setMs(performance.now() - start), 100);
    return () => clearInterval(timer);
  }, []);
  return <>{formatMs(ms)}</>;
}

function summarize(args: Record<string, unknown>) {
  const first = Object.values(args).find(
    (v) => typeof v === "string" || typeof v === "number",
  );
  return first === undefined ? "" : String(first);
}

function formatMs(ms: number) {
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
}
