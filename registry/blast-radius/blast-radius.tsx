"use client";

import { Graph, type Icon } from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { EASE_OUT, enter, exit, instant } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type BlastNode = {
  id: string;
  label: string;
  /** Id of the node this one is reached through. Leave out to attach it to the centre. */
  parent?: string;
  /** Key into `kinds`: database, bucket, service, key, person… */
  kind: string;
  /** In the blast radius: drawn with a negative ring, its path turns negative. */
  affected?: boolean;
  /** Reached indirectly: its edge and ring are dashed. */
  indirect?: boolean;
  /** Shown under the name in the tooltip, e.g. "Read by the new key". */
  note?: string;
};

export type BlastKind = { label: string; color: string };

export type BlastRadiusProps = {
  /** The entity everything is measured from: a key, an agent, a person. */
  center: { label: string; initials?: string; icon?: Icon };
  nodes: BlastNode[];
  /** Legend and colours per kind. Missing kinds get the categorical palette. */
  kinds?: Record<string, BlastKind>;
  title: string;
  subtitle?: string;
  /** Right side of the header: a status pill or a count. */
  aside?: React.ReactNode;
  onSelect?: (node: BlastNode) => void;
  className?: string;
};

type Placed = BlastNode & {
  x: number;
  y: number;
  depth: number;
  /** Parent position, or the centre for the first hop. */
  px: number;
  py: number;
  /** Ids from this node back to the centre. */
  path: string[];
  /** Affected, or leads to something affected. */
  reach: boolean;
};

const SIZE = 320;
const C = SIZE / 2;
const OUTER = 132;
const CENTER_R = 22;
// Share of a parent's sector its children fan across, so neighbouring fans never touch.
const SPREAD = 0.72;
const palette = ["var(--brand)", "#1a9e8c", "#bf5af2", "#b8862b", "#5e5ce6", "#30b0c7"];

const round = (n: number) => Math.round(n * 100) / 100;

const polar = (turn: number, r: number) => {
  const a = turn * 2 * Math.PI - Math.PI / 2;
  // Rounded so server and client trig agree and hydration matches.
  return [round(C + r * Math.cos(a)), round(C + r * Math.sin(a))] as const;
};

const hops = (depth: number) => `${depth} ${depth === 1 ? "hop" : "hops"}`;

/**
 * Lays nodes out from data alone: the first hop evenly by angle, every later
 * hop fanned around its parent inside the parent's sector. Returns nodes in
 * clockwise depth-first order, which is also the keyboard order.
 */
function layout(nodes: BlastNode[]) {
  const ids = new Set(nodes.map((n) => n.id));
  const children = new Map<string, BlastNode[]>();
  for (const node of nodes) {
    const parent = node.parent && ids.has(node.parent) ? node.parent : "";
    children.set(parent, [...(children.get(parent) ?? []), node]);
  }

  const raw: { node: BlastNode; turn: number; depth: number; path: string[] }[] = [];
  const seen = new Set<string>();
  const walk = (
    parent: string,
    turn: number,
    span: number,
    depth: number,
    path: string[],
  ) => {
    const kids = (children.get(parent) ?? []).filter((k) => !seen.has(k.id));
    kids.forEach((kid, j) => {
      seen.add(kid.id);
      const share = depth === 0 ? span : span * SPREAD;
      const t =
        depth === 0 ? j / kids.length : turn + share * ((j + 0.5) / kids.length - 0.5);
      const kidPath = [kid.id, ...path];
      raw.push({ node: kid, turn: t, depth: depth + 1, path: kidPath });
      walk(kid.id, t, share / kids.length, depth + 1, kidPath);
    });
  };
  walk("", 0, 1, 0, []);

  const maxDepth = Math.max(1, ...raw.map((r) => r.depth));
  const radius = (depth: number) => round((OUTER * depth) / maxDepth);
  const pos = new Map<string, readonly [number, number]>();
  for (const r of raw) pos.set(r.node.id, polar(r.turn, radius(r.depth)));

  // A node is on an affected path when it, or anything reached through it, is affected.
  const reach = new Set<string>();
  for (const r of raw) if (r.node.affected) r.path.forEach((id) => reach.add(id));

  const placed: Placed[] = raw.map((r) => {
    const [x, y] = pos.get(r.node.id)!;
    const [px, py] = r.depth === 1 ? [C, C] : pos.get(r.path[1])!;
    return {
      ...r.node,
      x,
      y,
      px,
      py,
      depth: r.depth,
      path: r.path,
      reach: reach.has(r.node.id),
    };
  });

  // Ring labels sit on the sector boundary nearest 9 o'clock, where no edge runs.
  const first = children.get("")?.length ?? 0;
  const gap = first
    ? Array.from({ length: first }, (_, i) => (i + 0.5) / first).reduce((best, t) =>
        Math.abs(t - 0.75) < Math.abs(best - 0.75) ? t : best,
      )
    : 0.75;

  return { placed, maxDepth, radius, gap };
}

/**
 * What one entity can reach, drawn as rings of hops around it. An affected
 * set — what a leaked key or a risky tool call can touch — is traced in red
 * back to the centre, so the size of the blast is visible at a glance.
 */
export function BlastRadius({
  center,
  nodes,
  kinds = {},
  title,
  subtitle,
  aside,
  onSelect,
  className,
}: BlastRadiusProps) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);
  const [fromKeyboard, setFromKeyboard] = useState(false);

  const { placed, maxDepth, radius, gap } = layout(nodes);
  const n = placed.length;
  const affected = placed.filter((p) => p.affected).length;

  const used = [...new Set(placed.map((p) => p.kind))];
  const kindOf = (kind: string): BlastKind =>
    kinds[kind] ?? {
      label: kind.charAt(0).toUpperCase() + kind.slice(1),
      color: palette[used.indexOf(kind) % palette.length],
    };
  const legend = [
    ...Object.keys(kinds).filter((k) => used.includes(k)),
    ...used.filter((k) => !(k in kinds)),
  ];

  const current = active === null ? undefined : placed[active];
  const onPath = new Set(current?.path ?? []);
  const nodeR = (depth: number) => (depth === 1 ? 9 : 6.5);

  const select = (index: number | null, keyboard: boolean) => {
    setFromKeyboard(keyboard);
    setActive(index);
    if (index !== null) onSelect?.(placed[index]);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!n) return;
    const keys: Record<string, number> = {
      ArrowRight: (active ?? -1) + 1,
      ArrowDown: (active ?? -1) + 1,
      ArrowLeft: (active ?? n) - 1,
      ArrowUp: (active ?? n) - 1,
      Home: 0,
      End: n - 1,
    };
    if (event.key === "Escape") return select(null, true);
    if (!(event.key in keys)) return;
    event.preventDefault();
    select((keys[event.key] + n) % n, true);
  };

  // Ring by ring, then clockwise within a ring.
  const delay = (p: Placed, i: number) =>
    reduce ? 0 : (p.depth - 1) * 0.12 + Math.min(i * 0.012, 0.12);
  const fade = cn("transition-opacity duration-150", fromKeyboard && "duration-0");

  const tipLeft = current ? current.x < C : true;
  const tipTop = current ? current.y < C : true;
  const pct = (v: number) => `${round((v / SIZE) * 100)}%`;

  return (
    <MotionConfig reducedMotion="user">
      <Shell className={cn("max-w-md", className)}>
        <ShellHeader icon={Graph} title={title} subtitle={subtitle} aside={aside} />
        <Panel className="p-4">
          <div
            tabIndex={0}
            role="group"
            aria-label={`${title}. Use arrow keys to read each node.`}
            onKeyDown={onKeyDown}
            onBlur={() => fromKeyboard && setActive(null)}
            className="relative mx-auto w-full max-w-80 rounded-full outline-offset-4"
          >
            <svg
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              role="img"
              aria-label={`${title}: ${affected} of ${n} reachable from ${center.label} affected`}
              className="block w-full overflow-visible"
              onPointerLeave={() => select(null, false)}
            >
              {Array.from({ length: maxDepth }, (_, d) => {
                const r = radius(d + 1);
                const [tx, ty] = polar(gap, r);
                return (
                  <motion.g
                    key={d}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      duration: 0.3,
                      ease: EASE_OUT,
                      delay: reduce ? 0 : d * 0.12,
                    }}
                  >
                    <circle
                      cx={C}
                      cy={C}
                      r={r}
                      fill="none"
                      strokeDasharray="2 4"
                      className="stroke-foreground/15"
                    />
                    <text
                      x={tx}
                      y={ty}
                      dy="0.32em"
                      textAnchor="middle"
                      fontSize="11"
                      strokeWidth={5}
                      paintOrder="stroke"
                      className="fill-muted-foreground stroke-surface-inset"
                    >
                      {hops(d + 1)}
                    </text>
                  </motion.g>
                );
              })}

              {placed.map((p, i) => {
                const lit = onPath.has(p.id);
                return (
                  <motion.g
                    key={`edge-${p.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, ease: EASE_OUT, delay: delay(p, i) }}
                  >
                    <line
                      x1={p.px}
                      y1={p.py}
                      x2={p.x}
                      y2={p.y}
                      strokeWidth={p.reach ? (p.depth === 1 ? 1.75 : 1.25) : 1}
                      strokeDasharray={p.indirect ? "3 3" : undefined}
                      className={cn(
                        fade,
                        "[transition-property:opacity,stroke]",
                        p.reach
                          ? "stroke-negative"
                          : lit
                            ? "stroke-foreground/60"
                            : "stroke-foreground/15",
                        current && !lit && "opacity-25",
                      )}
                    />
                  </motion.g>
                );
              })}

              <motion.g
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: EASE_OUT }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              >
                {affected > 0 && (
                  <circle
                    cx={C}
                    cy={C}
                    r={CENTER_R + 4}
                    fill="none"
                    strokeWidth={1.75}
                    className="stroke-negative"
                  />
                )}
                <circle cx={C} cy={C} r={CENTER_R} className="fill-brand" />
                {center.icon ? (
                  <center.icon
                    weight="fill"
                    x={C - 9}
                    y={C - 9}
                    width={18}
                    height={18}
                    className="text-brand-foreground"
                    aria-hidden="true"
                  />
                ) : (
                  <text
                    x={C}
                    y={C}
                    dy="0.35em"
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight={500}
                    className="fill-brand-foreground"
                  >
                    {center.initials ?? center.label.slice(0, 2).toUpperCase()}
                  </text>
                )}
              </motion.g>

              {placed.map((p, i) => {
                const r = nodeR(p.depth);
                const dim = current ? !onPath.has(p.id) : affected > 0 && !p.reach;
                return (
                  <motion.g
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: EASE_OUT, delay: delay(p, i) }}
                    style={{ transformBox: "fill-box", transformOrigin: "center" }}
                  >
                    <g
                      className={cn(fade, dim && (current ? "opacity-25" : "opacity-60"))}
                    >
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={r + 3.5}
                        fill="none"
                        strokeWidth={1.5}
                        strokeDasharray={p.indirect ? "2 2" : undefined}
                        className={cn(
                          "stroke-negative transition-opacity duration-300",
                          !p.affected && "opacity-0",
                        )}
                      />
                      {active === i && !p.affected && (
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={r + 3.5}
                          fill="none"
                          strokeWidth={1.5}
                          className="stroke-foreground/40"
                        />
                      )}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={r}
                        style={{ fill: kindOf(p.kind).color }}
                      />
                    </g>
                  </motion.g>
                );
              })}

              {placed.map((p, i) => (
                <circle
                  key={`hit-${p.id}`}
                  cx={p.x}
                  cy={p.y}
                  r={14}
                  fill="transparent"
                  onPointerEnter={() => select(i, false)}
                />
              ))}
            </svg>

            <AnimatePresence>
              {current && (
                <motion.div
                  key={current.id}
                  initial={fromKeyboard ? false : { opacity: 0, scale: 0.97 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    transition: fromKeyboard ? instant : enter,
                  }}
                  exit={{ opacity: 0, transition: fromKeyboard ? instant : exit }}
                  className="pointer-events-none absolute z-10 w-max rounded-xl bg-surface-raised px-3 py-2 text-xs"
                  style={{
                    // Opens away from the centre's far side so it stays inside the card.
                    [tipLeft ? "left" : "right"]: tipLeft
                      ? `calc(${pct(current.x)} + 12px)`
                      : `calc(${pct(SIZE - current.x)} + 12px)`,
                    [tipTop ? "top" : "bottom"]: tipTop
                      ? `calc(${pct(current.y)} + 4px)`
                      : `calc(${pct(SIZE - current.y)} + 4px)`,
                    maxWidth: `min(13rem, calc(${pct(tipLeft ? SIZE - current.x : current.x)} - 12px))`,
                    transformOrigin: `${tipTop ? "top" : "bottom"} ${tipLeft ? "left" : "right"}`,
                  }}
                >
                  <p className="font-mono font-medium break-words text-foreground">
                    {current.label}
                  </p>
                  {current.note && (
                    <p className="mt-0.5 text-muted-foreground">{current.note}</p>
                  )}
                  <p className="mt-0.5 text-muted-foreground">
                    {kindOf(current.kind).label} · {hops(current.depth)}
                    {current.affected && (
                      <span className="text-negative"> · Affected</span>
                    )}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {legend.map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full"
                  style={{ background: kindOf(k).color }}
                />
                {kindOf(k).label}
              </span>
            ))}
            {affected > 0 && (
              <span className="flex items-center gap-1.5">
                <svg aria-hidden="true" viewBox="0 0 10 10" className="size-2.5">
                  <circle
                    cx={5}
                    cy={5}
                    r={4}
                    fill="none"
                    strokeWidth={1.5}
                    className="stroke-negative"
                  />
                </svg>
                Affected
              </span>
            )}
          </div>

          <p role="status" aria-live="polite" className="sr-only">
            {fromKeyboard && current
              ? `${current.label}, ${kindOf(current.kind).label}, ${hops(current.depth)}${current.affected ? ", affected" : ""}${current.indirect ? ", indirect" : ""}${current.note ? `. ${current.note}` : ""}`
              : ""}
          </p>
        </Panel>
      </Shell>
    </MotionConfig>
  );
}
