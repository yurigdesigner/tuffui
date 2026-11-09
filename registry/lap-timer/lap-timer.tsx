// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import { Timer } from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import { Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { enter } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type LapSector = {
  id: string;
  /** Stage name, e.g. "retrieve". */
  label: string;
  /** Best split for this stage, in seconds. */
  best: number;
  /** Split in seconds once the stage is done. Leave out while it runs. */
  split?: number;
};

export type LapTimerProps = {
  /** Stages in order. The first one without a `split` is the running one. */
  sectors: LapSector[];
  /** Seconds since the lap started. Drives the hand and the clock. */
  elapsed: number;
  /** Best full lap in seconds. Defaults to the sum of the sector bests. */
  best?: number;
  /** Whether the lap is still going. When false, the last split ends the lap. */
  running?: boolean;
  /** Seconds per turn of the dial. Picked from the best lap when left out. */
  dial?: number;
  title: string;
  subtitle?: string;
  /** Line above the sector table, e.g. "Lap 3". */
  lap?: string;
  /** Extra content on the right of the header, e.g. a status pill. */
  aside?: React.ReactNode;
  /** Formats split times. */
  format?: (seconds: number) => string;
  className?: string;
};

const MAX_DIAL = 288;
const DIALS = [10, 15, 20, 30, 60, 90, 120, 180, 300, 600, 900, 1800, 3600];

const round = (n: number) => Math.round(n * 100) / 100;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** 41.8 → "00:41.8" */
function clock(seconds: number) {
  const t = Math.max(0, Math.floor(seconds * 10) / 10);
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${String(m).padStart(2, "0")}:${s.toFixed(1).padStart(4, "0")}`;
}

/** Signed delta with a real minus sign: "−0.8", "+0.4". */
function signed(delta: number) {
  const d = Math.round(delta * 10) / 10;
  if (d === 0) return "±0.0";
  return `${d < 0 ? "−" : "+"}${Math.abs(d).toFixed(1)}`;
}

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  // null until measured: the dial draws once at its real size.
  const [width, setWidth] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width ?? MAX_DIAL, width !== null] as const;
}

/**
 * A run as a stopwatch. The hand sweeps the dial while each stage paints its
 * sector — green when it beat its best split, grey when it didn't — and the
 * clock carries the live delta against the best lap.
 */
export function LapTimer({
  sectors,
  elapsed,
  best: bestLap,
  running = true,
  dial: dialProp,
  title,
  subtitle,
  lap,
  aside,
  format = (s) => `${s.toFixed(1)} s`,
  className,
}: LapTimerProps) {
  const [ref, width, measured] = useWidth();
  const [hover, setHover] = useState<string | null>(null);

  const best = bestLap ?? sum(sectors.map((s) => s.best));
  const done = sectors.filter((s) => s.split !== undefined).length;
  const currentIndex = running && done < sectors.length ? done : -1;
  const doneTime = sum(sectors.slice(0, done).map((s) => s.split ?? 0));
  const finished = !running && done === sectors.length && sectors.length > 0;
  const now = finished ? doneTime : Math.max(elapsed, doneTime);
  const inSector = now - doneTime;

  // Live delta: what's lost or gained in finished sectors, plus any overrun
  // in the running one. Ahead of pace never shows until a sector closes.
  const current = currentIndex >= 0 ? sectors[currentIndex] : undefined;
  const delta =
    sum(sectors.slice(0, done).map((s) => (s.split ?? 0) - s.best)) +
    (current ? Math.max(0, inSector - current.best) : 0);
  const started = now > 0;
  const ahead = delta < -0.05;

  const turn = dialProp ?? DIALS.find((d) => d >= Math.max(best, now) * 1.04) ?? 3600;
  // Numbers around the face: the most that land on whole values.
  const count = [12, 6, 5, 4, 3, 2].find((n) => Number.isInteger(turn / n)) ?? 4;
  const labelOf = (v: number) => (turn >= 300 && v % 60 === 0 ? `${v / 60}m` : `${v}`);

  // Geometry
  const size = Math.max(160, Math.min(MAX_DIAL, Math.floor(width)));
  const c = size / 2;
  const R = c - 10;
  const ring = 5;
  const tickOut = R - ring - 5;
  const numR = tickOut - 20;
  const sub = { x: c, y: round(c - R * 0.36), r: round(R * 0.2) };

  const deg = (t: number) => (t / turn) * 360;
  const polar = (a: number, r: number, ox = c, oy = c) => {
    const rad = ((a - 90) * Math.PI) / 180;
    return [round(ox + r * Math.cos(rad)), round(oy + r * Math.sin(rad))] as const;
  };
  const arc = (a0: number, a1: number, r: number, ox = c, oy = c) => {
    const end = Math.min(a1, a0 + 359.9);
    const [x0, y0] = polar(a0, r, ox, oy);
    const [x1, y1] = polar(end, r, ox, oy);
    return `M${x0} ${y0}A${r} ${r} 0 ${end - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
  };

  // One arc per started sector; a small gap keeps neighbours apart.
  const arcs = sectors.flatMap((s, i) => {
    const start = sum(sectors.slice(0, i).map((x) => x.split ?? 0));
    const length = s.split ?? (i === currentIndex ? inSector : 0);
    if (length <= 0) return [];
    const a0 = deg(start);
    const a1 = deg(start + length);
    const gap = s.split !== undefined && a1 - a0 > 4 ? 1.2 : 0;
    const state = s.split === undefined ? "live" : s.split < s.best ? "faster" : "slower";
    return [{ id: s.id, d: arc(a0 + (i ? gap : 0), a1 - gap, R - ring / 2), state }];
  });

  const hand = deg(now);
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  const subFrac = current
    ? inSector / Math.max(current.best, 0.001)
    : started
      ? now / Math.max(best, 0.001)
      : 0;
  const subLabel = current ? `S${currentIndex + 1}` : "LAP";
  const last = done > 0 ? sectors[done - 1] : undefined;

  return (
    <MotionConfig reducedMotion="user">
      <Shell className={cn("max-w-md", className)}>
        <ShellHeader icon={Timer} title={title} subtitle={subtitle} aside={aside} />
        <Panel className="p-4 @sm:p-5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p
              className="font-mono text-[2rem] leading-none font-medium tracking-tight tabular-nums"
              aria-label={`Elapsed ${clock(now)}`}
            >
              {clock(now)}
            </p>
            {started && (
              <p
                className={cn(
                  "font-mono text-[0.8125rem] tabular-nums transition-colors duration-200",
                  ahead ? "text-positive" : "text-muted-foreground",
                )}
              >
                {done === 0 && delta <= 0 ? "on pace" : `${signed(delta)} s vs best lap`}
              </p>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-[0.8125rem] text-muted-foreground">
            <span className="truncate">
              {[lap, `${done} of ${sectors.length} sectors`].filter(Boolean).join(" · ")}
            </span>
            <span className="flex shrink-0 items-center gap-1.5 font-mono tabular-nums">
              <svg aria-hidden="true" width={8} height={6} className="fill-foreground">
                <path d="M4 6L0 0H8Z" />
              </svg>
              best {format(best)}
            </span>
          </div>

          <div ref={ref} className="mt-4 flex justify-center">
            <svg
              key={measured ? "measured" : "guess"}
              visibility={measured ? undefined : "hidden"}
              role="img"
              aria-label={`${title}: ${clock(now)} elapsed, ${signed(delta)} seconds against the best lap of ${format(best)}.`}
              width={size}
              height={size}
              className="block"
            >
              {/* Sector track */}
              <circle
                cx={c}
                cy={c}
                r={R - ring / 2}
                fill="none"
                strokeWidth={ring}
                className="stroke-foreground/[0.07]"
              />
              {arcs.map((a) => (
                <path
                  key={a.id}
                  d={a.d}
                  fill="none"
                  strokeWidth={ring}
                  strokeLinecap="round"
                  className={cn(
                    "transition-[stroke,opacity] duration-200 ease-ui-out",
                    a.state === "live"
                      ? "stroke-brand"
                      : a.state === "faster"
                        ? "stroke-positive"
                        : "stroke-foreground/35",
                    hover && hover !== a.id && "opacity-30",
                  )}
                />
              ))}

              {/* Best lap: a notch outside the track */}
              {best > 0 && best < turn && (
                <path
                  d={(() => {
                    const a = deg(best);
                    const w = (4 / (R + 8)) * (180 / Math.PI);
                    const [x0, y0] = polar(a, R + 1);
                    const [x1, y1] = polar(a - w, R + 8);
                    const [x2, y2] = polar(a + w, R + 8);
                    return `M${x0} ${y0}L${x1} ${y1}L${x2} ${y2}Z`;
                  })()}
                  strokeLinejoin="round"
                  strokeWidth={1}
                  className="fill-foreground stroke-foreground"
                />
              )}

              {/* Face: ticks light up as the hand passes */}
              {ticks.map((i) => {
                const major = i % (60 / count) === 0;
                const a = i * 6;
                const [x1, y1] = polar(a, tickOut);
                const [x2, y2] = polar(a, tickOut - (major ? 8 : 4));
                const lit = started && a <= hand;
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    strokeWidth={major ? 1.5 : 1}
                    strokeLinecap="round"
                    className={cn(
                      major
                        ? lit
                          ? "stroke-foreground/80"
                          : "stroke-foreground/35"
                        : lit
                          ? "stroke-foreground/45"
                          : "stroke-foreground/15",
                    )}
                  />
                );
              })}
              {Array.from({ length: count }, (_, k) => {
                const v = ((k + 1) * turn) / count;
                const [x, y] = polar((360 * (k + 1)) / count, numR);
                return (
                  <text
                    key={k}
                    x={x}
                    y={y}
                    dy="0.35em"
                    textAnchor="middle"
                    fontSize={size < 220 ? 10 : 11}
                    className="fill-muted-foreground font-mono tabular-nums"
                  >
                    {labelOf(v)}
                  </text>
                );
              })}

              {/* Sub-dial: the running sector against its best split */}
              <circle
                cx={sub.x}
                cy={sub.y}
                r={sub.r}
                className="fill-foreground/[0.05]"
              />
              <circle
                cx={sub.x}
                cy={sub.y}
                r={sub.r - 3}
                fill="none"
                strokeWidth={2}
                className="stroke-foreground/10"
              />
              {subFrac > 0 && (
                <path
                  d={arc(0, Math.min(subFrac, 1) * 360, sub.r - 3, sub.x, sub.y)}
                  fill="none"
                  strokeWidth={2}
                  strokeLinecap="round"
                  className={cn(
                    subFrac > 1
                      ? "stroke-foreground/40"
                      : current
                        ? "stroke-brand"
                        : "stroke-positive",
                  )}
                />
              )}
              <text
                x={sub.x}
                y={sub.y}
                dy="0.35em"
                textAnchor="middle"
                fontSize={size < 220 ? 9 : 10}
                className="fill-foreground font-mono font-medium tracking-wide"
              >
                {subLabel}
              </text>

              {/* Hand */}
              <g transform={`rotate(${round(hand)} ${c} ${c})`}>
                <line
                  x1={c}
                  y1={round(c + 16)}
                  x2={c}
                  y2={round(c - (R - ring - 4))}
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  className="stroke-foreground"
                />
                <circle cx={c} cy={round(c + 16)} r={3} className="fill-foreground" />
              </g>
              <circle cx={c} cy={c} r={6} className="fill-brand" />
              <circle cx={c} cy={c} r={2} className="fill-surface-inset" />
            </svg>
          </div>

          <table className="mt-5 w-full text-[0.8125rem]">
            <caption className="sr-only">Sector splits against best</caption>
            <thead className="sr-only">
              <tr>
                <th scope="col">Sector</th>
                <th scope="col">Split</th>
                <th scope="col">Delta vs best</th>
              </tr>
            </thead>
            <tbody>
              {sectors.map((s, i) => {
                const isLive = i === currentIndex;
                const has = s.split !== undefined;
                const faster = has && (s.split ?? 0) < s.best;
                return (
                  <tr
                    key={s.id}
                    onPointerEnter={() => has && setHover(s.id)}
                    onPointerLeave={() => setHover(null)}
                    className={cn(
                      "h-10 transition-opacity duration-200 ease-ui-out",
                      hover && hover !== s.id && "opacity-50",
                    )}
                  >
                    <th scope="row" className="pr-3 text-left font-normal">
                      <span className="flex items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className={cn(
                            "h-1 w-3.5 shrink-0 rounded-full transition-colors duration-200",
                            isLive
                              ? "bg-brand"
                              : !has
                                ? "bg-foreground/10"
                                : faster
                                  ? "bg-positive"
                                  : "bg-foreground/35",
                          )}
                        />
                        <span className="font-mono text-muted-foreground tabular-nums">
                          S{i + 1}
                        </span>
                        <span
                          className={cn(
                            "truncate",
                            !has && !isLive && "text-muted-foreground",
                          )}
                        >
                          {s.label}
                        </span>
                      </span>
                    </th>
                    <td
                      className={cn(
                        "w-20 text-right font-mono tabular-nums",
                        !has && "text-muted-foreground",
                      )}
                    >
                      {has ? format(s.split ?? 0) : isLive ? format(inSector) : "—"}
                    </td>
                    <td className="w-16 text-right font-mono tabular-nums">
                      <AnimatePresence initial={false}>
                        {has && (
                          <motion.span
                            key="delta"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={enter}
                            className={cn(
                              "inline-block",
                              faster ? "text-positive" : "text-muted-foreground",
                            )}
                          >
                            {signed((s.split ?? 0) - s.best)}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p role="status" aria-live="polite" className="sr-only">
            {last && last.split !== undefined
              ? `${last.label} split ${format(last.split)}, ${signed(last.split - last.best)} seconds against best.${finished ? ` Lap ${clock(now)}.` : ""}`
              : ""}
          </p>
        </Panel>
      </Shell>
    </MotionConfig>
  );
}
