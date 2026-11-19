// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import { ArrowsIn, Lock, Warning } from "@phosphor-icons/react";
import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/action-button";
import { RollingNumber } from "@/components/ui/rolling-number";
import { Tag } from "@/components/ui/status-pill";
import { Panel, Shell } from "@/components/ui/surface";
import { cn } from "@/lib/utils";

export type ContextSegment = {
  id: string;
  label: string;
  tokens: number;
  /** Secondary text under the label, such as "14 tools". */
  detail?: string;
  /** Marks a segment that compaction never drops. */
  pinned?: boolean;
  /** Any CSS color. Defaults to the built-in palette by position. */
  color?: string;
};

export type ContextWindowMeterProps = {
  data: { limit: number; segments: ContextSegment[]; model?: string };
  /** Share of the limit (0–1) where the warning zone starts. */
  warnAt?: number;
  onCompact?: () => void;
  compacting?: boolean;
  /** `card` for a panel, `inline` for a single row in a composer footer. */
  variant?: "card" | "inline";
  /** BCP 47 locale for token counts and percentages, e.g. `he-IL`. */
  locale?: string;
  /** UI strings, for translating the meter. */
  labels?: Partial<ContextWindowMeterLabels>;
  className?: string;
};

export type ContextWindowMeterLabels = {
  region: string;
  meter: string;
  /** Spoken meter value; numbers come formatted. */
  valueText: (used: string, limit: string, percent: string) => string;
  compact: string;
  compacting: string;
  compactAria: string;
  compactingAria: string;
  approaching: string;
  nearLimit: string;
  context: string;
  /** Line next to the big number; `percent` is the animated number. */
  ofLimit: (limit: string, percent: ReactNode) => ReactNode;
  warningZone: (left: string) => string;
  /** `percent` is the warning zone's share, e.g. "20%". */
  tinted: (percent: string) => string;
  pinned: string;
};

const defaultLabels: ContextWindowMeterLabels = {
  region: "Context window",
  meter: "Context window usage",
  valueText: (used, limit, percent) => `${used} of ${limit} tokens (${percent})`,
  compact: "Compact",
  compacting: "Compacting…",
  compactAria: "Compact context",
  compactingAria: "Compacting context",
  approaching: "Approaching context limit",
  nearLimit: "Near limit",
  context: "Context",
  ofLimit: (limit, percent) => (
    <>
      of {limit} · {percent} full
    </>
  ),
  warningZone: (left) => `In the warning zone — ${left} tokens left`,
  tinted: (percent) => `Tinted cells mark the last ${percent}`,
  pinned: "Pinned",
};

// Segment colors: the brand blue, indigo, purple, teal, green, gray.
const palette = ["var(--brand)", "#5e5ce6", "#bf5af2", "#40c8e0", "#30c05a", "#8e8e93"];

export const formatTokens = (n: number) =>
  n < 1000 ? `${Math.round(n)}` : `${(n / 1000).toFixed(n < 100_000 ? 1 : 0)}k`;

/** Splits the limit into `count` cells and colors each by the segment that fills it. */
function fillCells(
  segments: { tokens: number; color: string }[],
  limit: number,
  count: number,
) {
  const cells: (string | null)[] = [];
  for (const s of segments) {
    // Every non-empty segment gets at least one cell, so small ones stay visible.
    const n = s.tokens > 0 ? Math.max(1, Math.round((s.tokens / limit) * count)) : 0;
    for (let i = 0; i < n && cells.length < count; i++) cells.push(s.color);
  }
  while (cells.length < count) cells.push(null);
  return cells;
}

export function ContextWindowMeter({
  data,
  warnAt = 0.8,
  onCompact,
  compacting = false,
  variant = "card",
  locale = "en-US",
  labels: labelOverrides,
  className,
}: ContextWindowMeterProps) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const pct = (n: number) =>
    new Intl.NumberFormat(locale, { style: "percent" }).format(n / 100);
  const { limit, segments } = data;
  const used = segments.reduce((n, s) => n + s.tokens, 0);
  const ratio = used / limit;
  const warning = ratio >= warnAt;
  const colored = segments.map((s, i) => ({
    ...s,
    color: s.color ?? palette[i % palette.length],
  }));
  const inline = variant === "inline";
  const count = inline ? 20 : 100;
  const cells = fillCells(colored, limit, count);
  const percent = Math.round(ratio * 100);

  const grid = (
    <div
      role="meter"
      aria-label={labels.meter}
      aria-valuemin={0}
      aria-valuemax={limit}
      aria-valuenow={used}
      aria-valuetext={labels.valueText(
        used.toLocaleString(locale),
        limit.toLocaleString(locale),
        pct(percent),
      )}
      className={cn(
        "grid",
        inline ? "w-28 grid-cols-[repeat(20,1fr)] gap-px" : "grid-cols-20 gap-1",
      )}
    >
      {cells.map((color, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn(
            "transition-colors duration-200 ease-out motion-reduce:duration-0",
            inline ? "h-2.5 rounded-[2px]" : "aspect-square rounded-[3px]",
            !color &&
              (i >= Math.round(warnAt * count)
                ? "bg-warning/20"
                : "bg-foreground/[0.07]"),
          )}
          style={{ background: color ?? undefined }}
        />
      ))}
    </div>
  );

  const compactButton = onCompact && (
    <Button
      onClick={onCompact}
      loading={compacting}
      icon={ArrowsIn}
      iconWeight="bold"
      aria-label={compacting ? labels.compactingAria : labels.compactAria}
      className={cn(
        "disabled:opacity-70",
        warning && "bg-warning/15 text-warning hover:bg-warning/25",
        inline && "h-6 gap-1.5 px-2.5 text-[0.6875rem]",
      )}
    >
      {compacting ? labels.compacting : labels.compact}
    </Button>
  );

  const announcement = compacting
    ? labels.compactingAria
    : warning
      ? labels.approaching
      : "";

  if (inline) {
    return (
      <MotionConfig reducedMotion="user">
        <div className={cn("flex items-center gap-2 text-xs", className)}>
          {warning && (
            <Warning
              weight="fill"
              className="size-3.5 text-warning"
              aria-label={labels.nearLimit}
            />
          )}
          {grid}
          <span dir="ltr" className="font-mono text-muted-foreground tabular-nums">
            <span className={cn("text-foreground", warning && "text-warning")}>
              <RollingNumber value={formatTokens(used)} />
            </span>
            {" / "}
            {formatTokens(limit)}
          </span>
          {warning && compactButton}
          <p role="status" aria-live="polite" className="sr-only">
            {announcement}
          </p>
        </div>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <Shell aria-label={labels.region} className={cn("max-w-md", className)}>
        <Panel className="p-4">
          <div className="mb-1 flex items-center justify-between gap-3">
            <h3 className="text-[0.8125rem] text-muted-foreground">
              {labels.context}
              {data.model && (
                <Tag className="ms-2 rounded-full px-2 text-foreground">{data.model}</Tag>
              )}
            </h3>
            {compactButton}
          </div>
          <p className="mb-4 flex items-baseline gap-2">
            <span
              className={cn(
                "font-mono text-[2rem] leading-tight font-medium tracking-tight tabular-nums",
                warning && "text-warning",
              )}
            >
              <RollingNumber value={formatTokens(used)} />
            </span>
            <span className="text-[0.8125rem] text-muted-foreground">
              {labels.ofLimit(
                formatTokens(limit),
                <RollingNumber value={pct(percent)} />,
              )}
            </span>
          </p>
          {grid}
          <p
            className={cn(
              "mt-3 flex items-center gap-1.5 text-xs",
              warning ? "text-warning" : "text-muted-foreground",
            )}
          >
            {warning && (
              <Warning weight="fill" className="size-3.5 shrink-0" aria-hidden="true" />
            )}
            {warning
              ? labels.warningZone(formatTokens(Math.max(limit - used, 0)))
              : labels.tinted(pct(100 - Math.round(warnAt * 100)))}
          </p>
        </Panel>
        <ul className="grid grid-cols-1 gap-x-4 gap-y-1 px-3 py-3 @sm:grid-cols-2">
          {colored.map((s) => (
            <li key={s.id} className="flex items-start gap-2.5 py-1">
              <span
                aria-hidden="true"
                className="mt-1 size-2.5 shrink-0 rounded-[3px]"
                style={{ background: s.color }}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 truncate text-[0.8125rem]">
                  {s.label}
                  {s.pinned && (
                    <Lock
                      weight="fill"
                      className="size-3 shrink-0 text-muted-foreground"
                      aria-label={labels.pinned}
                    />
                  )}
                </span>
                {s.detail && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {s.detail}
                  </span>
                )}
              </span>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {formatTokens(s.tokens)}
              </span>
            </li>
          ))}
        </ul>
        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </Shell>
    </MotionConfig>
  );
}
