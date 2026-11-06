"use client";

import { Rows } from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import { Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { EASE_OUT, enter, exit } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type MirrorRow = {
  id: string;
  label: string;
  sublabel?: string;
  /** One count per column, stacked above the line. */
  up: number[];
  /** One count per column, stacked below the line. */
  down: number[];
  /** Emphasize this row, e.g. the latest round. */
  current?: boolean;
};

export type MirrorMark = {
  column: number;
  label: string;
  /** Longer text for the tooltip. */
  note?: string;
};

export type MirrorStripsProps = {
  /** One label per column; every few are drawn under the chart. */
  columns: string[];
  rows: MirrorRow[];
  series: {
    up: { label: string; color?: string };
    down: { label: string; color?: string };
  };
  title: string;
  subtitle?: string;
  /** Columns pinned with a label above the chart. */
  marks?: MirrorMark[];
  onSelect?: (column: number) => void;
  className?: string;
};

const LEFT = 64;
const RIGHT = 44;
const STACK = 5;
const ROW_GAP = 14;
const AXIS = 22;
const TOP = 22;

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * Rows of dot strips with two series mirrored around a line, one above and
 * one below. Good for comparing rounds, weeks or releases on the same axis —
 * where activity clusters and how it shrinks over time.
 */
export function MirrorStrips({
  columns,
  rows,
  series,
  title,
  subtitle,
  marks = [],
  onSelect,
  className,
}: MirrorStripsProps) {
  const reduce = useReducedMotion();
  const [ref, width] = useWidth();
  const [active, setActive] = useState<number | null>(null);
  const [fromKeyboard, setFromKeyboard] = useState(false);

  const upColor = series.up.color ?? "var(--foreground)";
  const downColor = series.down.color ?? "var(--brand)";
  const n = columns.length;
  const plotW = Math.max(width - LEFT - RIGHT, 60);
  const colW = plotW / Math.max(n, 1);
  const step = Math.min(colW, 6);
  const r = step * 0.36;
  const peak = Math.max(1, ...rows.flatMap((row) => [...row.up, ...row.down]));
  // One dot per sample until a stack would pass STACK dots, then one per group.
  const per = Math.max(1, Math.ceil(peak / STACK));
  const rowH = STACK * step * 2 + step;
  const height = TOP + rows.length * (rowH + ROW_GAP) - ROW_GAP + AXIS;
  const cx = (i: number) => LEFT + (i + 0.5) * colW;
  const rowY = (i: number) => TOP + i * (rowH + ROW_GAP) + rowH / 2;
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(Math.floor(plotW / 48), 1)));
  const mark = active === null ? undefined : marks.find((m) => m.column === active);

  const select = (index: number | null, keyboard: boolean) => {
    setFromKeyboard(keyboard);
    setActive(index);
    if (index !== null) onSelect?.(index);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!n) return;
    const keys: Record<string, number> = {
      ArrowRight: (active ?? -1) + 1,
      ArrowLeft: (active ?? n) - 1,
      Home: 0,
      End: n - 1,
    };
    if (event.key === "Escape") return select(null, true);
    if (!(event.key in keys)) return;
    event.preventDefault();
    select((keys[event.key] + n) % n, true);
  };

  const total = (row: MirrorRow) =>
    row.up.reduce((a, b) => a + b, 0) + row.down.reduce((a, b) => a + b, 0);

  return (
    <MotionConfig reducedMotion="user">
      <Shell className={cn("max-w-3xl", className)}>
        <ShellHeader
          icon={Rows}
          title={title}
          subtitle={subtitle}
          aside={
            <div className="hidden items-center gap-3 text-xs text-muted-foreground @md:flex">
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full"
                  style={{ background: upColor }}
                />
                ↑ {series.up.label}
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full"
                  style={{ background: downColor }}
                />
                ↓ {series.down.label}
              </span>
            </div>
          }
        />
        <Panel className="p-4">
          <div
            ref={ref}
            tabIndex={0}
            role="group"
            aria-label={`${title}. Use arrow keys to read columns.`}
            onKeyDown={onKeyDown}
            onBlur={() => fromKeyboard && setActive(null)}
            className="relative rounded-xl outline-offset-4"
          >
            <svg
              role="img"
              aria-label={`${title}: ${rows.map((row) => `${row.label} ${total(row)}`).join(", ")}`}
              width={width}
              height={height}
              className="block overflow-visible"
              onPointerLeave={() => select(null, false)}
            >
              {[
                ...new Set([
                  ...marks.map((m) => m.column),
                  ...(active === null ? [] : [active]),
                ]),
              ].map((column) => {
                const pinned = marks.find((m) => m.column === column);
                return (
                  <g key={column}>
                    <rect
                      x={LEFT + column * colW - 1}
                      y={TOP - 4}
                      width={colW + 2}
                      height={height - TOP - AXIS + 8}
                      rx={Math.min(colW / 2 + 1, 6)}
                      className={
                        column === active
                          ? "fill-foreground/[0.08]"
                          : "fill-foreground/[0.04]"
                      }
                    />
                    {pinned && (
                      <text
                        x={cx(column)}
                        y={TOP - 10}
                        textAnchor="middle"
                        fontSize="11"
                        className="fill-muted-foreground font-mono"
                      >
                        {pinned.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {rows.map((row, ri) => {
                const y = rowY(ri);
                return (
                  <motion.g
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      duration: 0.3,
                      ease: EASE_OUT,
                      delay: reduce ? 0 : ri * 0.06,
                    }}
                  >
                    <text
                      x={0}
                      y={y - 3}
                      fontSize="12"
                      className={cn(
                        "font-mono",
                        row.current ? "fill-foreground" : "fill-muted-foreground",
                      )}
                    >
                      {row.label}
                    </text>
                    {row.sublabel && (
                      <text
                        x={0}
                        y={y + 12}
                        fontSize="11"
                        className={row.current ? "fill-brand" : "fill-muted-foreground"}
                      >
                        {row.sublabel}
                      </text>
                    )}
                    <text
                      x={width}
                      y={y}
                      dy="0.32em"
                      textAnchor="end"
                      fontSize="12"
                      className={cn(
                        "font-mono tabular-nums",
                        row.current ? "fill-foreground" : "fill-muted-foreground",
                      )}
                    >
                      {total(row).toLocaleString("en-US")}
                    </text>

                    {/* Empty slots, so the scale of each stack stays readable. */}
                    {columns.map((_, ci) =>
                      Array.from({ length: STACK * 2 }, (_, k) => {
                        const ring = (k % STACK) + 1;
                        const side = k < STACK ? -1 : 1;
                        return (
                          <circle
                            key={`${ci}-${k}`}
                            cx={cx(ci)}
                            cy={y + side * (ring - 0.5) * step}
                            r={r * 0.5}
                            className="fill-foreground/[0.07]"
                          />
                        );
                      }),
                    )}

                    {columns.map((_, ci) => {
                      const ups = Math.ceil((row.up[ci] ?? 0) / per);
                      const downs = Math.ceil((row.down[ci] ?? 0) / per);
                      const dim =
                        active !== null &&
                        active !== ci &&
                        !marks.some((m) => m.column === ci);
                      return (
                        <g
                          key={ci}
                          className={cn(
                            "transition-opacity duration-150",
                            dim && "opacity-50",
                            fromKeyboard && "duration-0",
                          )}
                        >
                          {Array.from({ length: ups }, (_, k) => (
                            <circle
                              key={`u${k}`}
                              cx={cx(ci)}
                              cy={y - (k + 0.5) * step}
                              r={r}
                              style={{ fill: upColor }}
                            />
                          ))}
                          {Array.from({ length: downs }, (_, k) => (
                            <circle
                              key={`d${k}`}
                              cx={cx(ci)}
                              cy={y + (k + 0.5) * step}
                              r={r}
                              style={{ fill: downColor }}
                            />
                          ))}
                        </g>
                      );
                    })}
                  </motion.g>
                );
              })}

              {columns.map((label, i) =>
                i % labelEvery === 0 ||
                (i === n - 1 && i % labelEvery >= labelEvery / 2) ? (
                  <text
                    key={i}
                    x={cx(i)}
                    y={height - 6}
                    textAnchor="middle"
                    fontSize="10"
                    className="fill-muted-foreground font-mono"
                  >
                    {label}
                  </text>
                ) : null,
              )}

              {columns.map((_, i) => (
                <rect
                  key={i}
                  x={LEFT + i * colW}
                  y={TOP}
                  width={colW}
                  height={height - TOP - AXIS}
                  fill="transparent"
                  onPointerEnter={() => select(i, false)}
                />
              ))}
            </svg>

            <AnimatePresence>
              {active !== null && (
                <motion.div
                  key="tip"
                  initial={fromKeyboard ? false : { opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1, transition: enter }}
                  exit={{ opacity: 0, transition: exit }}
                  className="pointer-events-none absolute z-10 min-w-40 rounded-xl bg-surface-raised px-3 py-2 text-xs"
                  style={{
                    top: TOP,
                    left:
                      cx(active) + colW + 168 > width
                        ? cx(active) - colW - 168
                        : cx(active) + colW + 4,
                    transformOrigin: "top left",
                  }}
                >
                  <p className="mb-1 font-medium">
                    {mark ? (mark.note ?? mark.label) : columns[active]}
                  </p>
                  {rows.map((row) => (
                    <p key={row.id} className="flex gap-3 text-muted-foreground">
                      <span className="flex-1 font-mono">{row.label}</span>
                      <span className="font-mono text-foreground tabular-nums">
                        ↑{row.up[active] ?? 0} ↓{row.down[active] ?? 0}
                      </span>
                    </p>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {per > 1 && (
            <p className="mt-2 text-right text-xs text-muted-foreground">1 dot = {per}</p>
          )}
          <p role="status" aria-live="polite" className="sr-only">
            {fromKeyboard && active !== null
              ? `${columns[active]}: ${rows.map((row) => `${row.label} ${series.up.label} ${row.up[active] ?? 0}, ${series.down.label} ${row.down[active] ?? 0}`).join("; ")}`
              : ""}
          </p>
        </Panel>
      </Shell>
    </MotionConfig>
  );
}
