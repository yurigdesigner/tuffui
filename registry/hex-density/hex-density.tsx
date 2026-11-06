"use client";

import { Hexagon } from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import { Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { EASE_OUT, enter, exit } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type HexDensityAxis = {
  label?: string;
  /** Domain start. Defaults to the smallest value in `points`. */
  min?: number;
  /** Domain end. Defaults to the largest value in `points`. */
  max?: number;
  /** Formats axis labels and the tooltip. */
  format?: (value: number) => string;
};

export type HexDensityThreshold = {
  /** A y value. Points at or above it get the accent tone. */
  value: number;
  /** Shown on the line, e.g. “0.75 cut-off”. Defaults to the formatted value. */
  label?: string;
  /** What a point above the line means, e.g. “retrieved”. */
  above?: string;
  /** What a point below the line means, e.g. “dropped”. */
  below?: string;
};

export type HexDensityBin = {
  /** Grid position. Neighbours differ by one. */
  col: number;
  row: number;
  /** Data range the hexagon covers, clamped to the domain. */
  x: [number, number];
  y: [number, number];
  count: number;
  /** Whether the bin sits above the threshold line. */
  above: boolean;
};

export type HexDensityProps = {
  /** Raw [x, y] samples, e.g. one per retrieved chunk. */
  points: [number, number][];
  x?: HexDensityAxis;
  y?: HexDensityAxis;
  /** Horizontal line that splits the plot into an accent and a muted half. */
  threshold?: HexDensityThreshold;
  /** Largest hexagon radius in px. It shrinks so ~26 columns always fit. */
  radius?: number;
  /** Colour of bins above the threshold (or of every bin without one). */
  tone?: string;
  /** What one point is called, plural: "chunks", "requests". */
  unit?: string;
  title: string;
  subtitle?: string;
  /** Replaces the point count on the right of the header. */
  aside?: React.ReactNode;
  onSelect?: (bin: HexDensityBin) => void;
  className?: string;
};

const SQRT3 = Math.sqrt(3);
const COLUMNS = 26;
const TOP = 20;
const AXIS = 22;
const TIP_W = 184;
const STEPS = [0.2, 0.36, 0.54, 0.76, 1];

// Trig floats differ between server and client in the last digits; two
// decimals keep the markup identical.
const round = (n: number) => Math.round(n * 100) / 100;

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  // null until measured: the chart draws once at its real width, so entrance
  // animations don't tween from a guessed size.
  const [width, setWidth] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width ?? 560, width !== null] as const;
}

/** Pointy-top hex grid: pixel position → the cell whose centre is nearest. */
function locate(px: number, py: number, r: number) {
  const dx = SQRT3 * r;
  const dy = 1.5 * r;
  const guess = Math.round(py / dy);
  let best = { col: 0, row: guess, d: Infinity };
  // The nearest centre is always in the closest row or one of its neighbours.
  for (let row = guess - 1; row <= guess + 1; row++) {
    const col = Math.round(px / dx - (row & 1) / 2);
    const d = ((col + (row & 1) / 2) * dx - px) ** 2 + (row * dy - py) ** 2;
    if (d < best.d) best = { col, row, d };
  }
  return { col: best.col, row: best.row };
}

function hexPath(r: number) {
  return (
    Array.from({ length: 6 }, (_, k) => {
      const a = (Math.PI / 3) * k - Math.PI / 2;
      return `${k ? "L" : "M"}${round(r * Math.cos(a))} ${round(r * Math.sin(a))}`;
    }).join("") + "Z"
  );
}

function extent(values: number[]) {
  if (!values.length) return [0, 1] as const;
  let lo = values[0];
  let hi = values[0];
  for (const v of values) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  return hi > lo ? ([lo, hi] as const) : ([lo - 0.5, hi + 0.5] as const);
}

/**
 * Density of 2D points drawn as a hexagon grid: every hexagon counts the
 * points that fall inside it, and fills deeper the more it holds. A dashed
 * threshold line splits the plot into an accent half and a muted half, so
 * “how many made the cut, and where do they cluster” reads at a glance.
 */
export function HexDensity({
  points,
  x: xAxis = {},
  y: yAxis = {},
  threshold,
  radius = 11,
  tone = "var(--brand)",
  unit = "points",
  title,
  subtitle,
  aside,
  onSelect,
  className,
}: HexDensityProps) {
  const reduce = useReducedMotion();
  const [ref, width, measured] = useWidth();
  const [active, setActive] = useState<string | null>(null);
  const [fromKeyboard, setFromKeyboard] = useState(false);

  const fx = xAxis.format ?? ((v: number) => `${+v.toFixed(2)}`);
  const fy = yAxis.format ?? ((v: number) => `${+v.toFixed(2)}`);
  const [x0, x1] = [
    xAxis.min ?? extent(points.map((p) => p[0]))[0],
    xAxis.max ?? extent(points.map((p) => p[0]))[1],
  ];
  const [y0, y1] = [
    yAxis.min ?? extent(points.map((p) => p[1]))[0],
    yAxis.max ?? extent(points.map((p) => p[1]))[1],
  ];

  // The radius shrinks on narrow screens so the grid keeps its resolution.
  const r = round(Math.max(3.5, Math.min(radius, width / (COLUMNS * SQRT3 + 4))));
  // A hexagon can poke up to two radii past the point it holds.
  const pad = 2 * r;
  const plotW = Math.max(width - pad * 2, 40);
  const plotH = Math.round(Math.min(Math.max(plotW * 0.42, 168), 260));
  const toPx = (v: number) => ((v - x0) / (x1 - x0 || 1)) * plotW;
  const toPy = (v: number) => plotH - ((v - y0) / (y1 - y0 || 1)) * plotH;
  const fromPx = (px: number) => x0 + (px / plotW) * (x1 - x0);
  const fromPy = (py: number) => y1 - (py / plotH) * (y1 - y0);

  const split =
    threshold && threshold.value > y0 && threshold.value < y1 ? threshold : undefined;
  const lineY = split ? toPy(split.value) : 0;
  // Shift the grid so the line runs through the middle of the zigzag between
  // two rows: then every hexagon is wholly above or below it.
  const dy = 1.5 * r;
  const shift = split ? (((lineY - 0.75 * r) % dy) + dy) % dy : 0;
  const cell = (px: number, py: number) => locate(px, py - shift, r);

  const map = new Map<string, HexDensityBin & { cx: number; cy: number; key: string }>();
  let above = 0;
  for (const [vx, vy] of points) {
    if (vx < x0 || vx > x1 || vy < y0 || vy > y1) continue;
    const px = toPx(vx);
    let py = toPy(vy);
    const up = split ? vy >= split.value : true;
    // A point a hair from the line could land in the row across it; nudge it
    // back to its own side so counts match the colours.
    if (split) py = up ? Math.min(py, lineY - 0.3 * r) : Math.max(py, lineY + 0.3 * r);
    if (split && up) above++;
    const { col, row } = cell(px, py);
    const key = `${col}:${row}`;
    const bin = map.get(key);
    if (bin) {
      bin.count++;
      continue;
    }
    const cx = round((col + (row & 1) / 2) * SQRT3 * r);
    const cy = round(row * dy + shift);
    map.set(key, {
      key,
      col,
      row,
      cx,
      cy,
      count: 1,
      above: up,
      x: [
        Math.max(x0, fromPx(cx - (SQRT3 * r) / 2)),
        Math.min(x1, fromPx(cx + (SQRT3 * r) / 2)),
      ],
      y: [Math.max(y0, fromPy(cy + r)), Math.min(y1, fromPy(cy - r))],
    });
  }
  const bins = [...map.values()].sort((a, b) => a.row - b.row || a.col - b.col);
  const total = bins.reduce((sum, b) => sum + b.count, 0);
  const below = total - (split ? above : total);
  const peak = Math.max(1, ...bins.map((b) => b.count));
  const densest = bins.reduce<(typeof bins)[number] | undefined>(
    (best, b) => (!best || b.count > best.count ? b : best),
    undefined,
  );
  // Runners-up get the same outline, so a cluster reads as a cluster.
  const marked = new Set(
    [...bins]
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
      .filter((b) => b.count >= peak * 0.85)
      .map((b) => b.key),
  );
  const markColor = tone.includes("--brand") ? "var(--foreground)" : "var(--brand)";
  const level = (count: number) =>
    STEPS[
      Math.min(STEPS.length - 1, Math.ceil(Math.sqrt(count / peak) * STEPS.length) - 1)
    ];

  // One fading group per column, staggered left to right.
  const columns = new Map<number, typeof bins>();
  for (const b of bins) {
    const c = Math.round(b.cx / ((SQRT3 * r) / 2));
    columns.set(c, [...(columns.get(c) ?? []), b]);
  }
  const maxColumn = Math.max(1, ...columns.keys());

  const activeBin = active === null ? undefined : map.get(active);
  const path = hexPath(r * 0.9);
  const height = TOP + plotH + pad * 2 + AXIS;

  const select = (key: string | null, keyboard: boolean) => {
    setFromKeyboard(keyboard);
    setActive(key);
    const bin = key === null ? undefined : map.get(key);
    if (bin)
      onSelect?.({
        col: bin.col,
        row: bin.row,
        x: bin.x,
        y: bin.y,
        count: bin.count,
        above: bin.above,
      });
  };

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const { col, row } = cell(
      event.clientX - rect.left - pad,
      event.clientY - rect.top - TOP - pad,
    );
    const key = `${col}:${row}`;
    if (key !== active) select(map.has(key) ? key : null, false);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!bins.length) return;
    if (event.key === "Escape") return select(null, true);
    const from = activeBin ?? densest!;
    const dirs: Record<string, [number, number]> = {
      ArrowRight: [1, 0],
      ArrowLeft: [-1, 0],
      ArrowDown: [0, 1],
      ArrowUp: [0, -1],
    };
    let next: string | undefined;
    if (event.key === "Home") next = bins[0].key;
    else if (event.key === "End") next = bins.at(-1)!.key;
    else if (event.key in dirs) {
      if (!activeBin) next = from.key;
      else {
        // Nearest filled bin in that direction, preferring the same row or column.
        const [ux, uy] = dirs[event.key];
        let best = Infinity;
        for (const b of bins) {
          const along = (b.cx - from.cx) * ux + (b.cy - from.cy) * uy;
          if (along <= 1) continue;
          const across = Math.abs((b.cx - from.cx) * uy - (b.cy - from.cy) * ux);
          const score = along + across * 3;
          if (score < best) {
            best = score;
            next = b.key;
          }
        }
        next ??= from.key;
      }
    } else return;
    event.preventDefault();
    select(next, true);
  };

  const share = (n: number) => `${((n / Math.max(total, 1)) * 100).toFixed(1)}%`;
  const sideLabel = (bin: HexDensityBin) =>
    split ? (bin.above ? (split.above ?? "Above") : (split.below ?? "Below")) : "Bin";
  const tipBelow = activeBin ? activeBin.cy < 64 : false;
  const callout = densest && !activeBin;

  return (
    <MotionConfig reducedMotion="user">
      <Shell className={cn("max-w-2xl", className)}>
        <ShellHeader
          icon={Hexagon}
          title={title}
          subtitle={subtitle}
          aside={
            aside ?? (
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {total.toLocaleString("en-US")} {unit}
              </span>
            )
          }
        />
        <Panel className="p-4">
          <div
            ref={ref}
            tabIndex={0}
            role="group"
            aria-label={`${title}. Use arrow keys to move between bins.`}
            onKeyDown={onKeyDown}
            onBlur={() => fromKeyboard && setActive(null)}
            className="relative rounded-xl outline-offset-4"
          >
            <svg
              key={measured ? "measured" : "guess"}
              visibility={measured ? undefined : "hidden"}
              role="img"
              aria-label={`${total} ${unit} in ${bins.length} bins${
                densest ? `, densest bin ${densest.count} ${unit}` : ""
              }${
                split
                  ? `, ${above} ${split.above ?? "above"} and ${below} ${split.below ?? "below"} ${split.label ?? fy(split.value)}`
                  : ""
              }`}
              width={width}
              height={height}
              className="block overflow-visible"
              onPointerMove={onPointerMove}
              onPointerLeave={() => !fromKeyboard && select(null, false)}
            >
              <g fontSize="10" className="fill-muted-foreground">
                <text x={0} y={12}>
                  {yAxis.label ? `${yAxis.label} ` : ""}
                  <tspan className="font-mono">↑ {fy(y1)}</tspan>
                </text>
                <text x={width} y={12} textAnchor="end" className="font-mono">
                  {fy(y0)} ↓
                </text>
              </g>

              <g transform={`translate(${pad} ${TOP + pad})`}>
                {[...columns].map(([c, group]) => (
                  <motion.g
                    key={c}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      duration: 0.28,
                      ease: EASE_OUT,
                      delay: reduce ? 0 : (Math.max(c, 0) / maxColumn) * 0.3,
                    }}
                  >
                    {group.map((b) => {
                      const lit = !split || b.above;
                      const isActive = b.key === active;
                      return (
                        <path
                          key={b.key}
                          d={path}
                          transform={`translate(${b.cx} ${b.cy})`}
                          // Style, not attributes, so new batches ease into their shade
                          // and fresh bins fade in instead of popping.
                          style={{
                            fill: lit ? tone : "currentColor",
                            fillOpacity: level(b.count) * (lit ? 1 : 0.42),
                          }}
                          stroke={
                            isActive
                              ? "var(--foreground)"
                              : marked.has(b.key)
                                ? markColor
                                : "none"
                          }
                          strokeWidth={isActive ? 2 : 1.5}
                          strokeLinejoin="round"
                          className={cn(
                            "text-foreground transition-[opacity,fill-opacity,fill] duration-200 ease-ui-out starting:opacity-0",
                            active !== null && !isActive && "opacity-55",
                            fromKeyboard && "duration-0",
                          )}
                        />
                      );
                    })}
                  </motion.g>
                ))}

                {split && (
                  <line
                    x1={-pad}
                    x2={plotW + pad}
                    y1={round(lineY)}
                    y2={round(lineY)}
                    strokeWidth={1}
                    strokeDasharray="3 4"
                    className="pointer-events-none stroke-foreground/45"
                  />
                )}
              </g>

              <g fontSize="10" className="fill-muted-foreground">
                <text x={0} y={height - 6} className="font-mono">
                  {fx(x0)}
                </text>
                {xAxis.label && (
                  <text x={width / 2} y={height - 6} textAnchor="middle">
                    {xAxis.label} →
                  </text>
                )}
                <text x={width} y={height - 6} textAnchor="end" className="font-mono">
                  {fx(x1)}
                </text>
              </g>
            </svg>

            {split && (
              <span
                className="pointer-events-none absolute right-0 -translate-y-1/2 rounded-full bg-surface-raised px-2 py-0.5 font-mono text-[0.625rem] text-foreground tabular-nums"
                style={{ top: TOP + pad + lineY }}
              >
                {split.label ?? fy(split.value)}
              </span>
            )}

            <AnimatePresence>
              {callout && (
                <motion.span
                  key="callout"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: { ...enter, delay: reduce ? 0 : 0.35 },
                  }}
                  exit={{ opacity: 0, transition: exit }}
                  className="pointer-events-none absolute z-10 -translate-y-full rounded-full bg-surface-raised px-2.5 py-1 text-[0.6875rem] whitespace-nowrap text-muted-foreground"
                  style={{
                    top: Math.max(TOP + pad + densest.cy - r - 4, 26),
                    left: Math.min(Math.max(pad + densest.cx - 64, 0), width - 150),
                  }}
                >
                  Densest bin ·{" "}
                  <span className="font-mono text-foreground tabular-nums">
                    {densest.count.toLocaleString("en-US")} {unit}
                  </span>
                </motion.span>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {activeBin && (
                <motion.div
                  key="tip"
                  initial={fromKeyboard ? false : { opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1, transition: enter }}
                  exit={{ opacity: 0, transition: exit }}
                  className="pointer-events-none absolute z-20 rounded-xl bg-surface-raised px-3 py-2 text-xs"
                  style={{
                    width: Math.min(TIP_W, width),
                    left: Math.min(
                      Math.max(pad + activeBin.cx - TIP_W / 2, 0),
                      Math.max(width - TIP_W, 0),
                    ),
                    top: TOP + pad + activeBin.cy + (tipBelow ? r + 6 : -r - 6),
                    y: tipBelow ? 0 : "-100%",
                    transformOrigin: tipBelow ? "top center" : "bottom center",
                  }}
                >
                  <p className="text-muted-foreground first-letter:uppercase">
                    {sideLabel(activeBin)}
                  </p>
                  <p className="font-mono text-foreground tabular-nums">
                    {fx(activeBin.x[0])}–{fx(activeBin.x[1])}
                  </p>
                  <p className="font-mono text-foreground tabular-nums">
                    {fy(activeBin.y[0])}–{fy(activeBin.y[1])}
                  </p>
                  <p className="mt-1 font-mono text-foreground tabular-nums">
                    {activeBin.count.toLocaleString("en-US")} {unit} ·{" "}
                    {share(activeBin.count)}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {split ? (
              <>
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full"
                    style={{ background: tone }}
                  />
                  <span className="first-letter:uppercase">{split.above ?? "Above"}</span>
                  <span className="font-mono text-foreground tabular-nums">
                    {above.toLocaleString("en-US")} · {share(above)}
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full bg-foreground/35"
                  />
                  <span className="first-letter:uppercase">{split.below ?? "Below"}</span>
                  <span className="font-mono text-foreground tabular-nums">
                    {below.toLocaleString("en-US")} · {share(below)}
                  </span>
                </span>
              </>
            ) : (
              <span>
                {bins.length} bins · peak{" "}
                <span className="font-mono text-foreground tabular-nums">{peak}</span>
              </span>
            )}
            <span aria-hidden="true" className="ml-auto flex items-center gap-1">
              Fewer
              {STEPS.map((s) => (
                <svg key={s} width="9" height="10" viewBox="-5 -5.5 10 11">
                  <path d={hexPath(5)} fill={tone} fillOpacity={s} />
                </svg>
              ))}
              More
            </span>
          </div>

          <p role="status" aria-live="polite" className="sr-only">
            {fromKeyboard && activeBin
              ? `${sideLabel(activeBin)}: ${fx(activeBin.x[0])} to ${fx(activeBin.x[1])}, ${fy(activeBin.y[0])} to ${fy(activeBin.y[1])}, ${activeBin.count} ${unit}`
              : ""}
          </p>
        </Panel>
      </Shell>
    </MotionConfig>
  );
}
