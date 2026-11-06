"use client";

import { Briefcase, Target, type Icon } from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { EASE_OUT, enter, exit, instant } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type MatchItem = {
  id: string;
  name: string;
  /** Shown in the avatar. Defaults to the first letters of the name. */
  initials?: string;
  /** Index into `sectors`. */
  sector: number;
  /** Fit from 0 to 1. Higher sits closer to the middle. */
  score: number;
  /** Avatar color, any CSS color. Defaults to a categorical palette. */
  color?: string;
};

export type MatchFieldProps = {
  /** Categories around the edge, clockwise from the top. */
  sectors: string[];
  items: MatchItem[];
  title: string;
  subtitle?: string;
  /** Scores drawn as dashed rings. */
  rings?: number[];
  /** Score that counts as a strong fit: its ring and everything inside it is tinted. */
  threshold?: number;
  /** Score that sits on the outer edge. Lower scores are clamped to it. */
  min?: number;
  /** Icon in the middle, e.g. the role or request being matched. */
  icon?: Icon;
  onSelect?: (item: MatchItem) => void;
  className?: string;
};

const W = 440;
const H = 380;
const CX = W / 2;
const CY = H / 2;
const R = 150;
const INNER = 26;
const DOT_STEP = 7.5;
const palette = ["var(--brand)", "#1a9e8c", "#bf5af2", "#b8862b", "#0a84ff"];

const round = (n: number) => Math.round(n * 100) / 100;
const pct = (score: number) => `${Math.round(score * 100)}%`;

const polar = (turn: number, r: number) => {
  const a = turn * 2 * Math.PI - Math.PI / 2;
  // Rounded so server and client trig agree and hydration matches.
  return [round(CX + r * Math.cos(a)), round(CY + r * Math.sin(a))] as const;
};

/** Integer hash in [0, 1): the same on every engine, unlike Math.random. */
function hash(a: number, b: number) {
  let h = Math.imul(a + 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x7f4a7c15, 0xc2b2ae35);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

/** Distance from the middle: a perfect score sits next to the icon. */
function radiusOf(score: number, min: number) {
  const t = (1 - Math.min(Math.max(score, min), 1)) / Math.max(1 - min, 0.01);
  return INNER + 12 + t * (R - INNER - 16);
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(400);
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
 * A polar fit field: sectors are categories, distance from the middle is how
 * well something matches. People, bots or documents sit in their category, and
 * the dashed rings show score levels, with the strong-fit zone tinted.
 */
export function MatchField({
  sectors,
  items,
  title,
  subtitle,
  rings = [0.5, 0.7, 0.85],
  threshold = rings.length ? Math.max(...rings) : 0.85,
  min = Math.max(0, Math.min(threshold, ...rings) - 0.15),
  icon: CenterIcon = Briefcase,
  onSelect,
  className,
}: MatchFieldProps) {
  const reduce = useReducedMotion();
  const [ref, width] = useWidth();
  const [active, setActive] = useState<string | null>(null);
  const [fromKeyboard, setFromKeyboard] = useState(false);

  const n = Math.max(sectors.length, 1);
  const radius = (score: number) => radiusOf(score, min);
  const thresholdR = radius(threshold);

  // Spread each sector's items across its width, best first, then go round.
  const placed = useMemo(() => {
    const out: (MatchItem & { turn: number; x: number; y: number })[] = [];
    sectors.forEach((_, s) => {
      const group = items
        .filter((item) => item.sector === s)
        .sort((a, b) => b.score - a.score);
      group.forEach((item, j) => {
        const f = group.length === 1 ? 0.5 : 0.26 + (0.48 * j) / (group.length - 1);
        const turn = (s + f - 0.5) / n;
        const [x, y] = polar(turn, radiusOf(item.score, min));
        out.push({ ...item, turn, x, y });
      });
    });
    return out
      .sort((a, b) => ((a.turn + 1) % 1) - ((b.turn + 1) % 1))
      .map((item, i) => ({ ...item, color: item.color ?? palette[i % palette.length] }));
  }, [sectors, items, n, min]);

  // The background field: rings of dots, one lobe per sector that reaches
  // further out where that sector has more items.
  const field = useMemo(() => {
    const counts = sectors.map((_, s) => items.filter((i) => i.sector === s).length);
    const most = Math.max(1, ...counts);
    const rows: {
      r: number;
      dots: { x: number; y: number; size: number; on: boolean }[];
    }[] = [];
    for (let r = INNER + 10, ring = 0; r <= R - 3; r += DOT_STEP, ring++) {
      const count = Math.floor((2 * Math.PI * r) / DOT_STEP);
      const gap = 3 / ((2 * Math.PI * r) / n);
      const dots = [];
      for (let k = 0; k < count; k++) {
        const turn = (k + (ring % 2) * 0.5) / count;
        const pos = (((turn + 0.5 / n) % 1) + 1) % 1;
        const s = Math.floor(pos * n) % n;
        const f = pos * n - Math.floor(pos * n);
        if (f < gap || f > 1 - gap) continue;
        const reach =
          (INNER + (R - INNER) * (0.5 + (0.42 * (counts[s] ?? 0)) / most)) *
          (0.84 + 0.16 * Math.sin(Math.PI * f));
        const noise = hash(ring, k);
        const on = r <= round(reach) && noise > 0.08;
        const [x, y] = polar(turn, r);
        dots.push({ x, y, on, size: on ? round(1.6 + noise * 0.8) : 0.8 });
      }
      rows.push({ r, dots });
    }
    return rows;
  }, [sectors, items, n]);

  const current = placed.find((item) => item.id === active) ?? null;
  const strong = placed.filter((item) => item.score >= threshold);
  const best = placed.reduce<(typeof placed)[number] | null>(
    (top, item) => (!top || item.score > top.score ? item : top),
    null,
  );

  const select = (id: string | null, keyboard: boolean) => {
    setFromKeyboard(keyboard);
    setActive(id);
    const item = placed.find((p) => p.id === id);
    if (item) onSelect?.(items.find((i) => i.id === item.id) ?? item);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const count = placed.length;
    if (!count) return;
    const at = placed.findIndex((item) => item.id === active);
    const keys: Record<string, number> = {
      ArrowRight: (at === -1 ? -1 : at) + 1,
      ArrowDown: (at === -1 ? -1 : at) + 1,
      ArrowLeft: (at === -1 ? count : at) - 1,
      ArrowUp: (at === -1 ? count : at) - 1,
      Home: 0,
      End: count - 1,
    };
    if (event.key === "Escape") return select(null, true);
    if (!(event.key in keys)) return;
    event.preventDefault();
    select(placed[(keys[event.key] + count) % count].id, true);
  };

  const scale = width / W;
  const left = (x: number) => `${(x / W) * 100}%`;
  const top = (y: number) => `${(y / H) * 100}%`;

  return (
    <MotionConfig reducedMotion="user">
      <Shell className={cn("max-w-md", className)}>
        <ShellHeader
          icon={Target}
          title={title}
          subtitle={subtitle}
          aside={
            <span className="rounded-full bg-foreground/[0.06] px-2.5 py-1 text-xs text-muted-foreground tabular-nums">
              {strong.length} above {pct(threshold)}
            </span>
          }
        />
        <Panel className="px-3 py-4 @md:px-4">
          <div
            ref={ref}
            tabIndex={0}
            role="group"
            aria-label={`${title}. Use arrow keys to go through matches.`}
            onKeyDown={onKeyDown}
            onBlur={() => fromKeyboard && setActive(null)}
            onPointerLeave={() => select(null, false)}
            className="relative aspect-[440/380] w-full rounded-xl outline-offset-4"
          >
            <svg
              viewBox={`0 0 ${W} ${H}`}
              role="img"
              aria-label={`${title}: ${strong.length} of ${placed.length} above ${pct(threshold)}${best ? `, best ${best.name} at ${pct(best.score)}` : ""}`}
              className="absolute inset-0 block size-full overflow-visible"
            >
              <circle
                cx={CX}
                cy={CY}
                r={R}
                fill="none"
                className="stroke-foreground/10"
              />
              <circle cx={CX} cy={CY} r={thresholdR} className="fill-foreground/[0.04]" />

              {field.map((row, ring) => (
                <motion.g
                  key={ring}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.3,
                    ease: EASE_OUT,
                    delay: reduce ? 0 : ring * 0.02,
                  }}
                >
                  {row.dots.map((dot, k) => (
                    <circle
                      key={k}
                      cx={dot.x}
                      cy={dot.y}
                      r={dot.size}
                      className={
                        !dot.on
                          ? "fill-foreground/15"
                          : row.r <= thresholdR
                            ? "fill-brand/75"
                            : "fill-foreground/30"
                      }
                    />
                  ))}
                </motion.g>
              ))}

              {[...new Set([...rings, threshold])].map((score) => (
                <circle
                  key={score}
                  cx={CX}
                  cy={CY}
                  r={round(radius(score))}
                  fill="none"
                  strokeDasharray="3 4"
                  strokeWidth={1.25}
                  className={
                    score === threshold ? "stroke-brand/70" : "stroke-foreground/25"
                  }
                />
              ))}
            </svg>

            {sectors.map((label, s) => {
              const a = (s / n) * 2 * Math.PI - Math.PI / 2;
              const [x, y] = polar(s / n, R + 14);
              const cos = round(Math.cos(a));
              return (
                <span
                  key={s}
                  className={cn(
                    "pointer-events-none absolute w-max max-w-24 text-xs text-balance transition-colors duration-150",
                    cos > 0.3 ? "text-left" : cos < -0.3 ? "text-right" : "text-center",
                    current?.sector === s ? "text-foreground" : "text-muted-foreground",
                  )}
                  style={{
                    left: left(x),
                    top: top(y),
                    transform: `translate(${-50 + 50 * cos}%, ${-50 + 50 * round(Math.sin(a))}%)`,
                  }}
                >
                  {label}
                </span>
              );
            })}

            {[...new Set([...rings, threshold])].map((score) => {
              // On the sector gap nearest 7 o'clock, where no avatars sit.
              const gap =
                (Math.round(0.62 * sectors.length - 0.5) + 0.5) / sectors.length;
              const [x, y] = polar(gap, radius(score));
              return (
                <span
                  key={score}
                  className={cn(
                    "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface-inset px-1 font-mono text-[0.625rem] tabular-nums",
                    score === threshold ? "text-brand" : "text-muted-foreground",
                  )}
                  style={{ left: left(x), top: top(y) }}
                >
                  {pct(score)}
                </span>
              );
            })}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-brand-foreground"
              style={{ left: "50%", top: "50%" }}
            >
              <CenterIcon weight="fill" className="size-4" />
            </div>

            {placed.map((item, i) => {
              const on = item.id === active;
              const dim = active !== null && !on;
              const labeled = on || item.score >= threshold;
              // Pill goes outward unless it would leave the chart, then inward.
              const pill = (item.name.length + 4) * 6.6 + 24;
              const px = item.x * scale;
              const right =
                item.x >= CX ? px + 22 + pill <= width + 12 : px - 22 - pill < -12;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 transition-opacity duration-150",
                    dim && "opacity-40",
                    fromKeyboard && "duration-0",
                    on && "z-10",
                  )}
                  style={{ left: left(item.x), top: top(item.y) }}
                  onPointerEnter={() => select(item.id, false)}
                  onClick={() => select(item.id, false)}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.25,
                      ease: EASE_OUT,
                      delay: reduce ? 0 : 0.2 + i * 0.04,
                    }}
                    className="relative"
                  >
                    <div
                      className={cn(
                        "rounded-full p-[2px] transition-colors duration-150",
                        on ? "bg-foreground" : "bg-surface-inset",
                        fromKeyboard && "duration-0",
                      )}
                    >
                      <div
                        aria-hidden="true"
                        className="flex size-7 items-center justify-center rounded-full text-[0.6875rem] font-medium text-white @md:size-8"
                        style={{ background: item.color }}
                      >
                        {item.initials ?? initialsOf(item.name)}
                      </div>
                    </div>
                    <AnimatePresence initial={false}>
                      {labeled && (
                        <motion.span
                          key="pill"
                          initial={fromKeyboard ? false : { opacity: 0, scale: 0.96 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            transition: fromKeyboard ? instant : enter,
                          }}
                          exit={{ opacity: 0, transition: fromKeyboard ? instant : exit }}
                          className={cn(
                            "pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-full bg-surface-raised px-2.5 py-1 text-xs whitespace-nowrap",
                            right ? "left-full ml-1.5" : "right-full mr-1.5",
                          )}
                          style={{
                            transformOrigin: right ? "left center" : "right center",
                          }}
                        >
                          <span className="max-w-32 truncate">{item.name}</span>
                          <span
                            className={cn(
                              "font-mono tabular-nums",
                              item.score >= threshold
                                ? "text-brand"
                                : "text-muted-foreground",
                            )}
                          >
                            {pct(item.score)}
                          </span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              );
            })}
          </div>

          <p role="status" aria-live="polite" className="sr-only">
            {fromKeyboard && current
              ? `${current.name}, ${sectors[current.sector]}, ${pct(current.score)} match`
              : ""}
          </p>
        </Panel>
      </Shell>
    </MotionConfig>
  );
}
