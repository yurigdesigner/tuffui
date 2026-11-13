// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import { Broom, Check, Sparkle, type Icon } from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/action-button";
import { RollingNumber } from "@/components/ui/rolling-number";
import { StatusPill } from "@/components/ui/status-pill";
import { Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { CSS_EASE_OUT, EASE_OUT, enter, exit } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type InboxSender = {
  id: string;
  /** Newsletter or sender name, e.g. "The Daily Brief". */
  name: string;
  /** Emails a week, averaged over the period. */
  perWeek: number;
  /** Share of those emails opened, 0–1. */
  openRate: number;
};

/** Senders at or above `minPerWeek` and below `maxOpenRate` are in the zone. */
export type InboxZone = { minPerWeek: number; maxOpenRate: number };

export type InboxCleanupStats = {
  /** Senders in the zone. */
  count: number;
  /** Emails a week from those senders. */
  perWeek: number;
  /** Emails a week from them you don't open. */
  skippedPerWeek: number;
  zone: InboxZone;
};

export type InboxCleanupProps = {
  senders: InboxSender[];
  zone?: InboxZone;
  defaultZone?: InboxZone;
  /** Called while a zone edge is dragged or moved with the keyboard. */
  onZoneChange?: (zone: InboxZone) => void;
  /** Shows the two zone handles. */
  adjustable?: boolean;
  /** Controlled selection. Only ids inside the zone count. */
  selectedIds?: string[];
  /** Starting selection when uncontrolled. Omitted, every sender in the zone starts checked. */
  defaultSelectedIds?: string[];
  onSelectedChange?: (ids: string[]) => void;
  /** Sender the agent points at: its tooltip shows until someone hovers another dot. */
  highlightedId?: string | null;
  /** Emails a week, `[min, max]` of the x axis. */
  xDomain?: [number, number];
  xTicks?: number[];
  /** Open rate, `[min, max]` of the log y axis, 0–1. */
  yDomain?: [number, number];
  yTicks?: number[];
  /** Agent text above the chart. A function gets the live zone stats. */
  summary?: React.ReactNode | ((stats: InboxCleanupStats) => React.ReactNode);
  /** `"analyzing"` plots grey dots only: no zone, list or actions yet. */
  status?: "analyzing" | "ready";
  /** Shown in place of the summary while analyzing. */
  analyzingText?: React.ReactNode;
  /** Shows the list of senders in the zone, with checkboxes. */
  list?: boolean;
  onUnsubscribe?: (ids: string[]) => void;
  onKeep?: () => void;
  onDigest?: (ids: string[]) => void;
  icon?: Icon;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Chart heading, left of the header row. */
  chartTitle?: string;
  /** Period label, right of the header row. */
  period?: string;
  zoneLabel?: string;
  formatPerWeek?: (perWeek: number) => string;
  formatOpenRate?: (openRate: number) => string;
  formatXTick?: (value: number, index: number, ticks: number[]) => string;
  formatYTick?: (value: number) => string;
  /** Dots fade and scale in on mount. Skipped with reduced motion. */
  intro?: boolean;
  className?: string;
};

const PAD = { top: 14, right: 10, bottom: 24, left: 38 };
const HIT = 18;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const r1 = (v: number) => Math.round(v * 10) / 10;
const n2 = (v: number) => Math.round(v * 100) / 100;

const num = (v: number) => (Number.isInteger(r1(v)) ? String(r1(v)) : r1(v).toFixed(1));
const defaultPerWeek = (v: number) => `${num(v)} / wk`;
const defaultOpenRate = (v: number) => {
  const p = v * 100;
  if (p > 0 && p < 1) return "<1%";
  return `${Math.round(p)}%`;
};
const defaultXTick = (v: number, i: number, ticks: number[]) =>
  i === ticks.length - 1 ? `${num(v)} / wk` : num(v);
const defaultYTick = (v: number) => `${Math.round(v * 100)}%`;

export function inZone(sender: InboxSender, zone: InboxZone) {
  return sender.perWeek >= zone.minPerWeek && sender.openRate < zone.maxOpenRate;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function defaultSummary(s: InboxCleanupStats, fmtRate: (v: number) => string) {
  if (!s.count) return "No sender is in the zone. Widen it to find newsletters to cut.";
  return (
    <>
      {plural(s.count, "sender")} send {num(s.zone.minPerWeek)}+ emails a week and you
      open under {fmtRate(s.zone.maxOpenRate)}. That&apos;s ~
      {Math.round(s.skippedPerWeek)} emails a week you skip.
    </>
  );
}

/**
 * An agent's answer to "which newsletters should I unsubscribe from?": every
 * sender on a volume × opens scatter, with the high-volume, rarely opened
 * corner hatched as the unsubscribe zone and its senders listed to confirm.
 */
export function InboxCleanup({
  senders,
  zone: zoneProp,
  defaultZone = { minPerWeek: 4, maxOpenRate: 0.1 },
  onZoneChange,
  adjustable = true,
  selectedIds: selectedProp,
  defaultSelectedIds,
  onSelectedChange,
  highlightedId = null,
  xDomain = [0, 12],
  xTicks,
  yDomain = [0.01, 1],
  yTicks = [1, 0.5, 0.25, 0.1],
  summary,
  status = "ready",
  analyzingText,
  list = true,
  onUnsubscribe,
  onKeep,
  onDigest,
  icon = Broom,
  title = "Inbox cleanup",
  subtitle,
  chartTitle = "Volume × opens",
  period = "Last 90 days",
  zoneLabel = "Unsubscribe zone",
  formatPerWeek = defaultPerWeek,
  formatOpenRate = defaultOpenRate,
  formatXTick = defaultXTick,
  formatYTick = defaultYTick,
  intro = true,
  className,
}: InboxCleanupProps) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const hatchId = `ic-hatch-${uid}`;
  const clipId = `ic-clip-${uid}`;
  const summaryId = `ic-summary-${uid}`;
  const boxRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // The SVG is drawn in CSS pixels, so text and dots keep their size at any width.
  const [width, setWidth] = useState(520);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(Math.round(entry.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const height = Math.round(clamp(width * 0.48, 184, 248));

  const [innerZone, setInnerZone] = useState(defaultZone);
  const zone = zoneProp ?? innerZone;
  const setZone = (z: InboxZone) => {
    if (!zoneProp) setInnerZone(z);
    onZoneChange?.(z);
  };

  // Uncontrolled selection keeps the unchecked ids, so senders that enter the
  // zone later start checked.
  const [excluded, setExcluded] = useState<string[]>(() =>
    defaultSelectedIds
      ? senders.filter((s) => !defaultSelectedIds.includes(s.id)).map((s) => s.id)
      : [],
  );
  const ready = status === "ready";
  const zoneSenders = ready ? senders.filter((s) => inZone(s, zone)) : [];
  const zoneIds = new Set(zoneSenders.map((s) => s.id));
  const isSelected = (id: string) =>
    zoneIds.has(id) &&
    (selectedProp ? selectedProp.includes(id) : !excluded.includes(id));
  const selected = zoneSenders.filter((s) => isSelected(s.id)).map((s) => s.id);

  const toggle = (id: string) => {
    if (!zoneIds.has(id)) return;
    const next = isSelected(id) ? selected.filter((x) => x !== id) : [...selected, id];
    if (!selectedProp) {
      setExcluded((ex) => (isSelected(id) ? [...ex, id] : ex.filter((x) => x !== id)));
    }
    onSelectedChange?.(next);
  };

  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<"x" | "y" | null>(null);

  // The zone reveal staggers its dots once; later toggles answer at once.
  const [prevReady, setPrevReady] = useState(ready);
  const [staggering, setStaggering] = useState(false);
  if (prevReady !== ready) {
    setPrevReady(ready);
    setStaggering(ready && intro && !reduce);
  }

  // Scales.
  const [x0, x1] = xDomain;
  const [ylo, yhi] = yDomain;
  const plotL = PAD.left;
  const plotR = width - PAD.right;
  const plotT = PAD.top;
  const plotB = height - PAD.bottom;
  const sx = (v: number) =>
    plotL + ((clamp(v, x0, x1) - x0) / (x1 - x0)) * (plotR - plotL);
  const ly = (v: number) => Math.log10(clamp(v, ylo, yhi));
  const sy = (v: number) =>
    plotT + ((ly(yhi) - ly(v)) / (ly(yhi) - ly(ylo))) * (plotB - plotT);
  const invX = (px: number) => x0 + ((px - plotL) / (plotR - plotL)) * (x1 - x0);
  const invY = (py: number) =>
    10 ** (ly(yhi) - ((py - plotT) / (plotB - plotT)) * (ly(yhi) - ly(ylo)));

  const ticksX = xTicks ?? [0, 1, 2, 3].map((i) => x0 + ((x1 - x0) * i) / 3);
  const maxPerWeek = Math.max(x1, 1);
  const radius = (s: InboxSender) =>
    3 + 2.5 * Math.sqrt(clamp(s.perWeek, 0, maxPerWeek) / maxPerWeek);

  // Left to right, then top to bottom: the arrow-key order.
  const ordered = [...senders].sort(
    (a, b) => a.perWeek - b.perWeek || b.openRate - a.openRate,
  );
  const dots = ordered.map((s, i) => ({
    s,
    i,
    cx: n2(sx(s.perWeek)),
    cy: n2(sy(s.openRate)),
    r: radius(s),
  }));
  const dotById = new Map(dots.map((d) => [d.s.id, d]));

  const activeId = dragging ? null : (hoverId ?? highlightedId);
  const active = activeId ? (dotById.get(activeId) ?? null) : null;
  const tabId =
    (focusId && dotById.has(focusId) ? focusId : null) ??
    zoneSenders[0]?.id ??
    ordered[0]?.id;

  // Zone geometry.
  const zx = n2(sx(zone.minPerWeek));
  const zy = n2(sy(zone.maxOpenRate));
  const zw = Math.max(0, plotR - zx);
  const zh = Math.max(0, plotB - zy);

  const perWeekTotal = zoneSenders.reduce((a, s) => a + s.perWeek, 0);
  const stats: InboxCleanupStats = {
    count: zoneSenders.length,
    perWeek: perWeekTotal,
    skippedPerWeek: zoneSenders.reduce((a, s) => a + s.perWeek * (1 - s.openRate), 0),
    zone,
  };
  const summaryNode =
    typeof summary === "function"
      ? summary(stats)
      : (summary ?? defaultSummary(stats, formatOpenRate));

  const describe = (s: InboxSender) =>
    `${s.name}: ${formatPerWeek(s.perWeek)}, ${formatOpenRate(s.openRate)} opened${
      zoneIds.has(s.id)
        ? isSelected(s.id)
          ? ", in the zone, will unsubscribe"
          : ", in the zone, kept"
        : ""
    }.`;

  // Pointer: the nearest dot within reach, so small dots stay easy to hit.
  const local = (e: React.PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top] as const;
  };
  const nearest = (px: number, py: number) => {
    let best: string | null = null;
    let bestD = HIT * HIT;
    for (const d of dots) {
      const dd = (d.cx - px) ** 2 + (d.cy - py) ** 2;
      if (dd <= bestD) {
        bestD = dd;
        best = d.s.id;
      }
    }
    return best;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging) {
      const [px, py] = local(e);
      if (dragging === "x") {
        const v = clamp(Math.round(invX(px) * 2) / 2, x0 + 0.5, x1 - 0.5);
        if (v !== zone.minPerWeek) setZone({ ...zone, minPerWeek: v });
      } else {
        const raw = invY(py);
        const step = raw < 0.1 ? 0.005 : 0.01;
        const v = clamp(Math.round(raw / step) * step, ylo * 1.5, yhi * 0.9);
        const vv = Math.round(v * 1000) / 1000;
        if (vv !== zone.maxOpenRate) setZone({ ...zone, maxOpenRate: vv });
      }
      return;
    }
    if (e.pointerType !== "mouse" && e.type === "pointermove") return;
    const [px, py] = local(e);
    setHoverId(nearest(px, py));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const [px, py] = local(e);
    const id = nearest(px, py);
    setHoverId(id);
  };

  const onClick = () => {
    if (hoverId) toggle(hoverId);
  };

  const focusDot = (id: string) =>
    svgRef.current?.querySelector<SVGElement>(`[data-dot="${CSS.escape(id)}"]`)?.focus();

  const onDotKeyDown = (event: React.KeyboardEvent, id: string) => {
    const i = ordered.findIndex((s) => s.id === id);
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle(id);
      return;
    }
    if (event.key === "Escape") {
      setHoverId(null);
      return;
    }
    const moves: Record<string, number> = {
      ArrowLeft: i - 1,
      ArrowDown: i - 1,
      ArrowRight: i + 1,
      ArrowUp: i + 1,
      Home: 0,
      End: ordered.length - 1,
    };
    const to = moves[event.key];
    if (to === undefined) return;
    event.preventDefault();
    focusDot(ordered[clamp(to, 0, ordered.length - 1)].id);
  };

  const onHandleKey = (axis: "x" | "y", event: React.KeyboardEvent) => {
    const big = event.shiftKey || event.key.startsWith("Page");
    const dir =
      event.key === "ArrowRight" || event.key === "ArrowUp" || event.key === "PageUp"
        ? 1
        : event.key === "ArrowLeft" ||
            event.key === "ArrowDown" ||
            event.key === "PageDown"
          ? -1
          : 0;
    if (!dir) return;
    event.preventDefault();
    if (axis === "x") {
      const v = clamp(zone.minPerWeek + dir * (big ? 2 : 0.5), x0 + 0.5, x1 - 0.5);
      setZone({ ...zone, minPerWeek: v });
    } else {
      const step = (big ? 5 : 1) / 100;
      const v = clamp(zone.maxOpenRate + dir * step, ylo * 1.5, yhi * 0.9);
      setZone({ ...zone, maxOpenRate: Math.round(v * 1000) / 1000 });
    }
  };

  const startDrag = (axis: "x" | "y", e: React.PointerEvent) => {
    e.stopPropagation();
    svgRef.current?.setPointerCapture(e.pointerId);
    setDragging(axis);
    setHoverId(null);
  };
  const endDrag = (e: React.PointerEvent) => {
    if (!dragging) return;
    svgRef.current?.releasePointerCapture(e.pointerId);
    setDragging(null);
  };

  const animateIn = intro && !reduce;

  // Tooltip: above the dot, flipped below near the top; slides with the dot so it stays inside.
  const tipGap = 30;
  const below = active ? active.cy - tipGap - 38 < 0 : false;
  const tipShift = active ? clamp(active.cx / width, 0.08, 0.92) : 0.5;

  return (
    <MotionConfig reducedMotion="user">
      <Shell className={cn("max-w-2xl", className)}>
        <ShellHeader
          icon={icon}
          title={title}
          subtitle={subtitle ?? `${plural(senders.length, "sender")} · ${period}`}
          aside={
            ready ? (
              <StatusPill
                tone={zoneSenders.length ? "brand" : "neutral"}
                size="sm"
                className="font-mono tabular-nums"
              >
                <RollingNumber value={zoneSenders.length} />
                in zone
              </StatusPill>
            ) : null
          }
        />

        <Panel className="p-4 @max-sm:p-3 @lg:p-5">
          <div className="mb-4 flex min-h-5 items-start gap-2 text-[0.8125rem]">
            <Sparkle
              weight="fill"
              aria-hidden="true"
              className={cn(
                "mt-0.5 size-4 shrink-0 transition-colors duration-200",
                ready ? "text-brand" : "text-muted-foreground",
              )}
            />
            <div aria-live="polite" className="relative min-w-0 flex-1">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.p
                  key={ready ? "summary" : "analyzing"}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0, transition: enter }}
                  exit={{ opacity: 0, y: -6, transition: exit }}
                  className={cn("text-pretty", !ready && "text-muted-foreground")}
                >
                  {ready
                    ? summaryNode
                    : (analyzingText ??
                      `Plotting ${plural(senders.length, "sender")} by volume and opens…`)}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h4 className="text-[0.6875rem] font-medium tracking-[0.08em] uppercase">
              {chartTitle}
            </h4>
            <p className="shrink-0 font-mono text-[0.625rem] tracking-[0.06em] text-muted-foreground uppercase">
              {period}
            </p>
          </div>

          <div ref={boxRef} className="relative w-full" style={{ height }}>
            <svg
              ref={svgRef}
              width={width}
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              role="group"
              aria-label={`${chartTitle}: ${plural(senders.length, "sender")}. Arrow keys move between senders; Enter or Space checks a sender in the zone.`}
              aria-describedby={summaryId}
              onPointerMove={onPointerMove}
              onPointerDown={onPointerDown}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onPointerLeave={() => !dragging && setHoverId(null)}
              onClick={onClick}
              className={cn(
                "absolute inset-0 block touch-pan-y overflow-visible select-none",
                dragging === "x" && "cursor-ew-resize",
                dragging === "y" && "cursor-ns-resize",
                !dragging && hoverId && zoneIds.has(hoverId) && "cursor-pointer",
              )}
            >
              <defs>
                <pattern
                  id={hatchId}
                  width={5}
                  height={5}
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <line
                    x1={0}
                    y1={0}
                    x2={0}
                    y2={5}
                    strokeWidth={1.5}
                    className="stroke-brand/35"
                  />
                </pattern>
                <clipPath id={clipId}>
                  <rect x={0} y={0} width={width} height={plotB} />
                </clipPath>
              </defs>

              {/* Y gridlines and labels. */}
              <g aria-hidden="true">
                {yTicks.map((t) => {
                  const y = n2(sy(t));
                  return (
                    <g key={t}>
                      <line
                        x1={plotL}
                        x2={plotR}
                        y1={y}
                        y2={y}
                        className="stroke-foreground/[0.07]"
                        strokeWidth={1}
                      />
                      <text
                        x={plotL - 8}
                        y={y}
                        textAnchor="end"
                        dominantBaseline="central"
                        className="fill-muted-foreground font-mono text-[10px] tabular-nums"
                      >
                        {formatYTick(t)}
                      </text>
                    </g>
                  );
                })}
                {ticksX.map((t, i) => (
                  <text
                    key={t}
                    x={n2(sx(t))}
                    y={plotB + 15}
                    textAnchor={
                      i === 0 ? "start" : i === ticksX.length - 1 ? "end" : "middle"
                    }
                    className="fill-muted-foreground font-mono text-[10px] uppercase tabular-nums"
                  >
                    {formatXTick(t, i, ticksX)}
                  </text>
                ))}
              </g>

              {/* Unsubscribe zone. */}
              <AnimatePresence>
                {ready && zw > 0 && zh > 0 && (
                  <motion.g
                    key="zone"
                    aria-hidden="true"
                    initial={animateIn ? { opacity: 0, scale: 0.96 } : false}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, transition: exit }}
                    transition={{ duration: 0.28, ease: EASE_OUT }}
                    onAnimationComplete={() => setStaggering(false)}
                    style={{ transformBox: "fill-box", transformOrigin: "100% 100%" }}
                    clipPath={`url(#${clipId})`}
                  >
                    <rect
                      x={zx + 0.75}
                      y={zy + 0.75}
                      width={Math.max(0, zw - 1.5)}
                      height={zh + 8}
                      rx={8}
                      className="fill-brand/[0.06]"
                    />
                    <rect
                      x={zx + 0.75}
                      y={zy + 0.75}
                      width={Math.max(0, zw - 1.5)}
                      height={zh + 8}
                      rx={8}
                      fill={`url(#${hatchId})`}
                      className="stroke-brand/70"
                      strokeWidth={1.25}
                      strokeDasharray="4 3"
                    />
                    {zw > 96 && zh > 22 && (
                      <text
                        x={plotR - 8}
                        y={zy + 14}
                        textAnchor="end"
                        className="fill-brand font-mono text-[9.5px] font-medium tracking-[0.08em] uppercase"
                        style={{
                          stroke: "var(--surface-inset)",
                          strokeWidth: 3,
                          strokeLinejoin: "round",
                          paintOrder: "stroke",
                        }}
                      >
                        {zoneLabel}
                      </text>
                    )}
                  </motion.g>
                )}
              </AnimatePresence>

              {/* Baseline. */}
              <line
                aria-hidden="true"
                x1={plotL}
                x2={plotR}
                y1={plotB + 0.5}
                y2={plotB + 0.5}
                strokeWidth={1}
                className="stroke-foreground/25"
              />

              {/* Leader from the tooltip to the active dot. */}
              {active && (
                <line
                  aria-hidden="true"
                  x1={active.cx}
                  x2={active.cx}
                  y1={below ? active.cy + active.r + 6 : active.cy - active.r - 6}
                  y2={below ? active.cy + tipGap : active.cy - tipGap}
                  strokeWidth={1.25}
                  strokeLinecap="round"
                  strokeDasharray="0 3"
                  className="stroke-foreground/50"
                />
              )}

              {/* Dots: grey senders first, the zone on top. */}
              {[false, true].map((layer) =>
                dots
                  .filter((d) => zoneIds.has(d.s.id) === layer)
                  .map((d) => {
                    const id = d.s.id;
                    const z = layer;
                    const on = isSelected(id);
                    const zi = z ? zoneSenders.findIndex((s) => s.id === id) : 0;
                    const delay = staggering ? 0.12 + zi * 0.045 : 0;
                    return (
                      <motion.g
                        key={id}
                        data-dot={id}
                        role={z ? "checkbox" : "img"}
                        aria-checked={z ? on : undefined}
                        aria-label={describe(d.s)}
                        tabIndex={id === tabId ? 0 : -1}
                        initial={animateIn ? { opacity: 0, scale: 0.9 } : false}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.22,
                          ease: EASE_OUT,
                          delay: animateIn ? Math.min(d.i * 0.014, 0.55) : 0,
                        }}
                        style={{ transformBox: "fill-box", transformOrigin: "center" }}
                        onFocus={() => {
                          setFocusId(id);
                          setHoverId(id);
                        }}
                        onBlur={() => setHoverId((h) => (h === id ? null : h))}
                        onKeyDown={(e) => onDotKeyDown(e, id)}
                        className="outline-none"
                      >
                        <circle
                          cx={d.cx}
                          cy={d.cy}
                          r={d.r}
                          className="fill-foreground/25 transition-opacity duration-200"
                          style={{
                            opacity: z ? 0 : 1,
                            transitionDelay: `${delay}s`,
                            transitionTimingFunction: CSS_EASE_OUT,
                          }}
                        />
                        <g
                          className="transition-opacity duration-200"
                          style={{
                            opacity: z ? (on ? 1 : 0.4) : 0,
                            transitionDelay: `${delay}s`,
                            transitionTimingFunction: CSS_EASE_OUT,
                          }}
                        >
                          {on && (
                            <circle
                              cx={d.cx}
                              cy={d.cy}
                              r={d.r + 2.25}
                              fill="none"
                              strokeWidth={2.5}
                              className="stroke-brand/30"
                            />
                          )}
                          <circle cx={d.cx} cy={d.cy} r={d.r} className="fill-brand" />
                        </g>
                      </motion.g>
                    );
                  }),
              )}

              {/* Ring on the active dot. */}
              {active && (
                <circle
                  aria-hidden="true"
                  cx={active.cx}
                  cy={active.cy}
                  r={active.r + 3.5}
                  fill="none"
                  strokeWidth={1.75}
                  pointerEvents="none"
                  className="stroke-foreground"
                />
              )}

              {/* Zone handles: drag, or focus and use the arrow keys. */}
              {ready && adjustable && zw > 0 && zh > 0 && (
                <g>
                  <Handle
                    axis="x"
                    x={zx}
                    y={zy + Math.min(zh, plotB - zy) / 2}
                    label="Fewest emails a week in the zone"
                    value={zone.minPerWeek}
                    min={x0 + 0.5}
                    max={x1 - 0.5}
                    valueText={`${formatPerWeek(zone.minPerWeek)} or more`}
                    active={dragging === "x"}
                    onPointerDown={(e) => startDrag("x", e)}
                    onKeyDown={(e) => onHandleKey("x", e)}
                  />
                  <Handle
                    axis="y"
                    x={zx + zw / 2}
                    y={zy}
                    label="Highest open rate in the zone"
                    value={Math.round(zone.maxOpenRate * 1000) / 10}
                    min={Math.round(ylo * 150) / 1}
                    max={Math.round(yhi * 90)}
                    valueText={`under ${formatOpenRate(zone.maxOpenRate)} opened`}
                    active={dragging === "y"}
                    onPointerDown={(e) => startDrag("y", e)}
                    onKeyDown={(e) => onHandleKey("y", e)}
                  />
                </g>
              )}
            </svg>

            <AnimatePresence>
              {active && (
                <motion.div
                  key="tip"
                  aria-hidden="true"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    transition: { duration: 0.15, ease: EASE_OUT },
                  }}
                  exit={{ opacity: 0, transition: { duration: 0.1, ease: EASE_OUT } }}
                  className="pointer-events-none absolute z-10 w-max max-w-[15rem] rounded-lg bg-surface-raised px-2.5 py-1.5 font-mono text-[0.625rem] leading-[1.45] tracking-[0.04em] uppercase tabular-nums"
                  style={{
                    left: active.cx,
                    top: below ? active.cy + tipGap : active.cy - tipGap,
                    translate: `${-tipShift * 100}% ${below ? "0" : "-100%"}`,
                    transformOrigin: `${tipShift * 100}% ${below ? "0%" : "100%"}`,
                  }}
                >
                  <p className="truncate text-foreground">{active.s.name}</p>
                  <p className="text-muted-foreground">
                    {formatPerWeek(active.s.perWeek)} ·{" "}
                    {formatOpenRate(active.s.openRate)} open
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p id={summaryId} className="sr-only">
            {`${plural(zoneSenders.length, "sender")} in the zone: ${num(zone.minPerWeek)} or more emails a week, under ${formatOpenRate(zone.maxOpenRate)} opened. `}
            {zoneSenders.map(describe).join(" ")}
          </p>
        </Panel>

        <AnimatePresence initial={false}>
          {ready && (
            <motion.div
              key="confirm"
              initial={animateIn ? { height: 0, opacity: 0 } : false}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0, transition: exit }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="overflow-hidden"
            >
              {list && zoneSenders.length > 0 && (
                <Panel className="mt-1.5 p-1.5">
                  <ul aria-label={`${zoneLabel}: senders`}>
                    {[...zoneSenders]
                      .sort((a, b) => b.perWeek - a.perWeek || a.openRate - b.openRate)
                      .map((s) => {
                        const on = isSelected(s.id);
                        const hot = activeId === s.id;
                        return (
                          <li key={s.id}>
                            <label
                              onPointerEnter={() => {
                                setHoverId(s.id);
                              }}
                              onPointerLeave={() =>
                                setHoverId((h) => (h === s.id ? null : h))
                              }
                              className={cn(
                                "flex h-9 cursor-pointer items-center gap-3 rounded-xl px-2.5 text-[0.8125rem] transition-colors duration-150 has-focus-visible:bg-foreground/[0.06]",
                                hot && "bg-foreground/[0.04]",
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={on}
                                onChange={() => toggle(s.id)}
                                onFocus={() => setHoverId(s.id)}
                                onBlur={() => setHoverId((h) => (h === s.id ? null : h))}
                                className="peer sr-only"
                              />
                              <span
                                aria-hidden="true"
                                className={cn(
                                  "flex size-4 shrink-0 items-center justify-center rounded-[5px] transition-colors duration-150",
                                  on
                                    ? "bg-brand text-brand-foreground"
                                    : "bg-foreground/[0.12]",
                                )}
                              >
                                <Check
                                  weight="bold"
                                  className={cn(
                                    "size-2.5 transition-[opacity,scale] duration-150",
                                    on ? "scale-100 opacity-100" : "scale-75 opacity-0",
                                  )}
                                  style={{ transitionTimingFunction: CSS_EASE_OUT }}
                                />
                              </span>
                              <span
                                className={cn(
                                  "min-w-0 flex-1 truncate transition-colors duration-150",
                                  on ? "text-foreground" : "text-muted-foreground",
                                )}
                              >
                                {s.name}
                              </span>
                              <span className="w-[4.5rem] shrink-0 text-right font-mono text-xs text-muted-foreground tabular-nums">
                                {formatPerWeek(s.perWeek)}
                              </span>
                              <span className="w-[4.25rem] shrink-0 text-right font-mono text-xs text-muted-foreground tabular-nums @max-[24rem]:w-9">
                                {formatOpenRate(s.openRate)}
                                <span className="@max-[24rem]:hidden"> open</span>
                              </span>
                            </label>
                          </li>
                        );
                      })}
                  </ul>
                </Panel>
              )}

              {(onUnsubscribe || onKeep || onDigest) && (
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 pr-1 pb-0.5 pl-1">
                  {onKeep && (
                    <Button variant="quiet" onClick={onKeep} className="@max-sm:px-3">
                      Keep all
                    </Button>
                  )}
                  {onDigest && (
                    <Button
                      variant="secondary"
                      disabled={!selected.length}
                      onClick={() => onDigest(selected)}
                    >
                      Digest instead
                    </Button>
                  )}
                  {onUnsubscribe && (
                    <Button
                      variant="primary"
                      icon={Broom}
                      disabled={!selected.length}
                      onClick={() => onUnsubscribe(selected)}
                      aria-label={`Unsubscribe from ${plural(selected.length, "sender")}`}
                      className="@max-sm:w-full"
                    >
                      Unsubscribe from
                      <RollingNumber value={selected.length} className="tabular-nums" />
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Shell>
    </MotionConfig>
  );
}

function Handle({
  axis,
  x,
  y,
  label,
  value,
  min,
  max,
  valueText,
  active,
  onPointerDown,
  onKeyDown,
}: {
  axis: "x" | "y";
  x: number;
  y: number;
  label: string;
  value: number;
  min: number;
  max: number;
  valueText: string;
  active: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  const vertical = axis === "x";
  const w = vertical ? 4 : 16;
  const h = vertical ? 16 : 4;
  return (
    <g
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-orientation={vertical ? "horizontal" : "vertical"}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={valueText}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "group outline-none",
        vertical ? "cursor-ew-resize" : "cursor-ns-resize",
      )}
    >
      <rect
        x={x - (vertical ? 10 : 18)}
        y={y - (vertical ? 18 : 10)}
        width={vertical ? 20 : 36}
        height={vertical ? 36 : 20}
        rx={10}
        className={cn(
          "fill-brand/0 transition-[fill] duration-150 group-hover:fill-brand/10 group-focus-visible:fill-brand/20",
          active && "fill-brand/20",
        )}
      />
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx={2}
        className="fill-brand"
      />
    </g>
  );
}
