"use client";

import {
  ArrowUpRight,
  Check,
  CircleNotch,
  Clock,
  type Icon as PhosphorIcon,
  Pause,
  Play,
  Prohibit,
  X,
} from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useId, useState, type KeyboardEvent } from "react";
import { Button, IconButton } from "@/components/ui/action-button";
import { RollingNumber } from "@/components/ui/rolling-number";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { Shell } from "@/components/ui/surface";
import { EASE_IN_OUT, enter, instant } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type AgentStatus =
  "queued" | "running" | "waiting" | "paused" | "done" | "failed" | "cancelled";

export type BackgroundAgent = {
  id: string;
  name: string;
  task: string;
  status: AgentStatus;
  /** 0–1 */
  progress: number;
  /** What the agent is doing right now. */
  action?: string;
  /** Time spent so far. */
  elapsedMs: number;
};

export type BackgroundAgentsProps = {
  data: BackgroundAgent[];
  /** `grid` shows a tile per agent; `dock` is a row of avatars that expands. */
  layout?: "grid" | "dock";
  onPause?: (agent: BackgroundAgent) => void;
  onResume?: (agent: BackgroundAgent) => void;
  onOpen?: (agent: BackgroundAgent) => void;
  onCancel?: (agent: BackgroundAgent) => void;
  /** Called from the Review action of an agent waiting for input. Falls back to `onOpen`. */
  onReview?: (agent: BackgroundAgent) => void;
  /** Controlled dock selection; `null` collapses the strip. */
  selectedId?: string | null;
  onSelect?: (agent: BackgroundAgent | null) => void;
  className?: string;
};

// Shape icons are filled; line glyphs (check, cross, arrow) read better bold.
const filled = new Set<unknown>([Clock, Pause, Prohibit]);
const statuses: Record<
  AgentStatus,
  { label: string; icon?: PhosphorIcon; tone: StatusTone; fill: string; badge: string }
> = {
  queued: {
    label: "Queued",
    icon: Clock,
    tone: "neutral",
    fill: "bg-foreground/[0.04]",
    badge: "bg-surface-raised text-muted-foreground",
  },
  running: {
    label: "Running",
    tone: "brand",
    fill: "bg-brand/[0.13]",
    badge: "bg-brand text-brand-foreground",
  },
  waiting: {
    label: "Needs review",
    icon: ArrowUpRight,
    tone: "warning",
    fill: "bg-warning/[0.14]",
    badge: "bg-warning text-white",
  },
  paused: {
    label: "Paused",
    icon: Pause,
    tone: "neutral",
    fill: "bg-foreground/[0.06]",
    badge: "bg-surface-raised text-foreground",
  },
  done: {
    label: "Done",
    icon: Check,
    tone: "positive",
    fill: "bg-positive/[0.12]",
    badge: "bg-positive text-white",
  },
  failed: {
    label: "Failed",
    icon: X,
    tone: "negative",
    fill: "bg-negative/[0.12]",
    badge: "bg-negative text-white",
  },
  cancelled: {
    label: "Cancelled",
    icon: Prohibit,
    tone: "neutral",
    fill: "bg-foreground/[0.03]",
    badge: "bg-surface-raised text-muted-foreground",
  },
};

// Movement on screen: a short spring with no bounce. Swaps: strong ease-out, exits faster.
const spring = { type: "spring", duration: 0.35, bounce: 0 } as const;
const leave = { duration: 0.12, ease: enter.ease };
const finished = (s: AgentStatus) => s === "done" || s === "failed" || s === "cancelled";
const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
const formatElapsed = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** The tinted level that rises with progress. */
function Fill({ agent, horizontal }: { agent: BackgroundAgent; horizontal?: boolean }) {
  const level = Math.min(Math.max(agent.progress, 0), 1);
  // Clip instead of width/height (no layout work) or scale (would skew the stripes).
  return (
    <motion.span
      aria-hidden="true"
      initial={false}
      animate={{
        clipPath: horizontal
          ? `inset(0 ${(1 - level) * 100}% 0 0)`
          : `inset(${(1 - level) * 100}% 0 0 0)`,
      }}
      transition={spring}
      className={cn(
        "absolute inset-0 bg-[image:repeating-linear-gradient(-45deg,rgb(255_255_255/0.1)_0_3px,transparent_3px_7px)] transition-colors duration-300 dark:bg-[image:repeating-linear-gradient(-45deg,rgb(255_255_255/0.035)_0_3px,transparent_3px_7px)]",
        statuses[agent.status].fill,
      )}
    />
  );
}

function AgentPill({ status }: { status: AgentStatus }) {
  const { label, icon, tone } = statuses[status];
  return (
    <StatusPill
      size="sm"
      tone={tone}
      icon={icon}
      iconWeight={icon && filled.has(icon) ? "fill" : "bold"}
    >
      {label}
    </StatusPill>
  );
}

function Ticker({ text }: { text?: string }) {
  return (
    <span className="relative block h-4 overflow-hidden font-mono text-xs text-muted-foreground">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={text ?? ""}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1, transition: enter }}
          exit={{ y: -14, opacity: 0, transition: leave }}
          className="block truncate"
        >
          {text ?? "—"}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function BackgroundAgents({
  data,
  layout = "grid",
  onPause,
  onResume,
  onOpen,
  onCancel,
  onReview,
  selectedId,
  onSelect,
  className,
}: BackgroundAgentsProps) {
  const base = useId();
  const [announcement, setAnnouncement] = useState("");
  const [picked, setPicked] = useState<string | null>(data[0]?.id ?? null);
  const selected = selectedId !== undefined ? selectedId : picked;
  const current = data.find((a) => a.id === selected) ?? null;

  const act = (
    agent: BackgroundAgent,
    verb: string,
    cb?: (a: BackgroundAgent) => void,
  ) => {
    setAnnouncement(`${verb} ${agent.name}`);
    cb?.(agent);
  };

  const actions = (agent: BackgroundAgent) => {
    const quiet =
      "size-7 bg-surface-raised hover:bg-surface-raised hover:text-foreground";
    if (agent.status === "waiting") {
      return (
        <Button
          onClick={() => act(agent, "Reviewing", onReview ?? onOpen)}
          className="h-7 flex-row-reverse gap-1 bg-warning px-3 text-xs text-white hover:bg-warning/90"
          icon={ArrowUpRight}
          iconWeight="bold"
        >
          Review
        </Button>
      );
    }
    return (
      <span className="flex items-center gap-1">
        {agent.status === "running" && onPause && (
          <IconButton
            icon={Pause}
            label={`Pause ${agent.name}`}
            onClick={() => act(agent, "Paused", onPause)}
            className={quiet}
          />
        )}
        {agent.status === "paused" && onResume && (
          <IconButton
            icon={Play}
            label={`Resume ${agent.name}`}
            onClick={() => act(agent, "Resumed", onResume)}
            className={quiet}
          />
        )}
        {onOpen && (
          <IconButton
            icon={ArrowUpRight}
            iconWeight="bold"
            label={`Open ${agent.name}`}
            onClick={() => act(agent, "Opened", onOpen)}
            className={quiet}
          />
        )}
        {!finished(agent.status) && onCancel && (
          <IconButton
            icon={X}
            iconWeight="bold"
            label={`Cancel ${agent.name}`}
            onClick={() => act(agent, "Cancelled", onCancel)}
            className={quiet}
          />
        )}
      </span>
    );
  };

  // Arrow-key moves swap instantly; clicks animate.
  const [keyboard, setKeyboard] = useState(false);
  const select = (agent: BackgroundAgent | null, viaKeyboard = false) => {
    setKeyboard(viaKeyboard);
    setPicked(agent?.id ?? null);
    onSelect?.(agent);
  };

  const onDockKey = (e: KeyboardEvent, index: number) => {
    const next =
      e.key === "ArrowRight" ? index + 1 : e.key === "ArrowLeft" ? index - 1 : null;
    if (next === null || !data[next]) return;
    e.preventDefault();
    select(data[next], true);
    document.getElementById(`${base}-tab-${data[next].id}`)?.focus();
  };

  return (
    <MotionConfig reducedMotion="user">
      <Shell aria-label="Background agents" className={cn("max-w-xl", className)}>
        {layout === "grid" ? (
          <ul className="grid grid-cols-1 gap-1.5 @md:grid-cols-2">
            {data.map((agent, i) => (
              <motion.li
                key={agent.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...enter, delay: i * 0.04 }}
              >
                <article
                  aria-label={`${agent.name}, ${statuses[agent.status].label}, ${Math.round(agent.progress * 100)}%`}
                  className={cn(
                    "group relative flex h-full min-h-40 flex-col overflow-hidden rounded-2xl bg-surface-inset p-3.5",
                    agent.status === "cancelled" && "opacity-60",
                  )}
                >
                  <Fill agent={agent} />
                  <div className="relative flex items-start justify-between gap-2">
                    <h4 className="min-w-0 text-sm font-medium">{agent.name}</h4>
                    <AgentPill status={agent.status} />
                  </div>
                  <p className="relative mt-1 line-clamp-2 text-[0.8125rem] text-muted-foreground">
                    {agent.task}
                  </p>
                  <div className="relative mt-auto pt-4">
                    <Ticker text={agent.action} />
                    <div className="mt-2 flex h-7 items-center justify-between gap-2">
                      <span className="font-mono text-xs text-muted-foreground tabular-nums">
                        <RollingNumber value={formatElapsed(agent.elapsedMs)} /> ·{" "}
                        <RollingNumber value={`${Math.round(agent.progress * 100)}%`} />
                      </span>
                      <span
                        className={cn(
                          "transition-opacity duration-150",
                          agent.status !== "waiting" &&
                            "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100",
                        )}
                      >
                        {actions(agent)}
                      </span>
                    </div>
                  </div>
                </article>
              </motion.li>
            ))}
          </ul>
        ) : (
          <>
            <div role="tablist" aria-label="Agents" className="flex flex-wrap gap-1 p-1">
              {data.map((agent, i) => {
                const { icon: Icon, badge, label } = statuses[agent.status];
                const isSelected = agent.id === current?.id;
                return (
                  <button
                    key={agent.id}
                    id={`${base}-tab-${agent.id}`}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    aria-controls={`${base}-panel`}
                    aria-label={`${agent.name}, ${label}`}
                    tabIndex={isSelected || (!current && i === 0) ? 0 : -1}
                    onClick={() => select(isSelected ? null : agent)}
                    onKeyDown={(e) => onDockKey(e, i)}
                    className="relative rounded-full p-1 transition-transform duration-150 ease-out outline-none focus-visible:bg-foreground/[0.08] active:scale-[0.95]"
                  >
                    {isSelected && (
                      <motion.span
                        layoutId={`${base}-dock`}
                        transition={keyboard ? instant : spring}
                        className="absolute inset-0 rounded-full bg-surface-raised"
                      />
                    )}
                    <span className="relative flex size-10 items-center justify-center overflow-hidden rounded-full bg-surface-inset text-xs font-medium">
                      <Fill agent={agent} />
                      <span className="relative">{initials(agent.name)}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute right-0.5 bottom-0.5 flex size-4 items-center justify-center rounded-full",
                        badge,
                      )}
                    >
                      {Icon ? (
                        <Icon
                          weight={filled.has(Icon) ? "fill" : "bold"}
                          className="size-2.5"
                          strokeWidth={3}
                        />
                      ) : (
                        <CircleNotch
                          weight="bold"
                          className="size-2.5 animate-spin motion-reduce:animate-none"
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            <AnimatePresence initial={false}>
              {current && (
                <motion.div
                  key="strip"
                  id={`${base}-panel`}
                  role="tabpanel"
                  aria-labelledby={`${base}-tab-${current.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1, transition: spring }}
                  exit={{
                    height: 0,
                    opacity: 0,
                    transition: { duration: 0.18, ease: EASE_IN_OUT },
                  }}
                  className="overflow-hidden"
                >
                  <div className="relative mt-1 overflow-hidden rounded-2xl bg-surface-inset p-3.5">
                    <Fill agent={current} horizontal />
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.div
                        key={current.id}
                        initial={keyboard ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0, transition: enter }}
                        exit={{ opacity: 0, transition: keyboard ? instant : leave }}
                        className="relative"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="min-w-0 truncate text-sm font-medium">
                            {current.name}
                          </h4>
                          <AgentPill status={current.status} />
                        </div>
                        <p className="mt-0.5 truncate text-[0.8125rem] text-muted-foreground">
                          {current.task}
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <span className="min-w-0 flex-1">
                            <Ticker text={current.action} />
                          </span>
                          <span className="font-mono text-xs text-muted-foreground tabular-nums">
                            <RollingNumber value={formatElapsed(current.elapsedMs)} /> ·{" "}
                            <RollingNumber
                              value={`${Math.round(current.progress * 100)}%`}
                            />
                          </span>
                          {actions(current)}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </Shell>
    </MotionConfig>
  );
}
