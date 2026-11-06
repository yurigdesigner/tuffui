"use client";

import { ArrowClockwise, Check, Clock, Gauge, Hourglass } from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/action-button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { RollingNumber } from "@/components/ui/rolling-number";
import { StatusPill } from "@/components/ui/status-pill";
import { Panel, Shell, ShellHeader } from "@/components/ui/surface";
import { enter, exit, spring } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type RateLimit = {
  id: string;
  /** e.g. "Requests", "Input tokens". Shown with "/ min". */
  label: string;
  limit: number;
  remaining: number;
  /** Time until this bucket refills, in ms. */
  resetsInMs: number;
};

export type QueuedCall = {
  id: string;
  label: string;
  /** Tokens the call will spend, if known. */
  tokens?: number;
};

export type RateLimitsProps = {
  data: {
    /** e.g. "opus-5.5 · Tier 3". */
    model?: string;
    limits: RateLimit[];
    /** Calls waiting for capacity, oldest first. */
    queued?: QueuedCall[];
    /** Set when the API answered 429; counts down locally. */
    retryAfterMs?: number;
  };
  onRetry?: () => void;
  className?: string;
};

const compact = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 10_000
      ? `${Math.round(n / 1000)}k`
      : n.toLocaleString("en-US");

const seconds = (ms: number) => `${Math.max(0, Math.ceil(ms / 1000))}s`;

/** Counts `ms` down to zero, restarting whenever a new value comes in. */
function useCountdown(ms: number) {
  const [left, setLeft] = useState(ms);
  useEffect(() => {
    const end = Date.now() + ms;
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 250);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [ms]);
  return left;
}

function Bucket({ limit }: { limit: RateLimit }) {
  const ratio = limit.limit ? limit.remaining / limit.limit : 0;
  const resets = useCountdown(limit.resetsInMs);
  const tone = limit.remaining === 0 ? "negative" : ratio < 0.2 ? "warning" : "brand";

  return (
    <li className="py-2.5">
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[0.8125rem]">
        <span>
          {limit.label}
          <span className="text-muted-foreground"> / min</span>
        </span>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          <span
            className={cn(
              "text-foreground",
              tone === "negative" && "text-negative",
              tone === "warning" && "text-warning",
            )}
          >
            <RollingNumber value={compact(limit.remaining)} />
          </span>{" "}
          of {compact(limit.limit)} left
        </span>
      </div>
      <ProgressBar
        kind="meter"
        striped
        tone={tone}
        value={limit.remaining}
        max={limit.limit}
        label={`${limit.label} per minute remaining`}
        valueText={`${limit.remaining.toLocaleString("en-US")} of ${limit.limit.toLocaleString("en-US")} left, resets in ${seconds(resets)}`}
      />
      <p className="mt-1 text-xs text-muted-foreground">
        {limit.remaining === limit.limit ? (
          "Full"
        ) : (
          <>
            Resets in <RollingNumber value={seconds(resets)} />
          </>
        )}
      </p>
    </li>
  );
}

export function RateLimits({ data, onRetry, className }: RateLimitsProps) {
  const { limits, queued = [], retryAfterMs = 0 } = data;
  const retryLeft = useCountdown(retryAfterMs);
  const empty = limits.find((l) => l.remaining === 0);
  const throttled = retryAfterMs > 0 || Boolean(empty);
  const canRetry = throttled && retryLeft === 0;

  return (
    <MotionConfig reducedMotion="user">
      <Shell aria-label="Rate limits" className={cn("max-w-md", className)}>
        <ShellHeader
          icon={Gauge}
          title="Rate limits"
          subtitle={data.model && <span className="font-mono text-xs">{data.model}</span>}
          aside={
            <StatusPill
              size="sm"
              tone={throttled ? "warning" : "positive"}
              icon={throttled ? Hourglass : Check}
              iconWeight={throttled ? "fill" : "bold"}
              className="h-auto px-2 py-0.5 text-xs"
            >
              {throttled ? "Throttled" : "Healthy"}
            </StatusPill>
          }
        />

        <Panel className="px-4 py-1.5">
          <ul>
            {limits.map((l) => (
              <Bucket key={l.id} limit={l} />
            ))}
          </ul>
        </Panel>

        <AnimatePresence initial={false}>
          {throttled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{
                opacity: 1,
                height: "auto",
                transition: { height: spring, opacity: enter },
              }}
              exit={{ opacity: 0, height: 0, transition: exit }}
              className="overflow-hidden"
            >
              <div className="mt-1.5 rounded-2xl bg-warning/10 p-4">
                <div className="flex items-center gap-3">
                  <Clock
                    weight="fill"
                    className="size-4 shrink-0 text-warning"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.8125rem] font-medium">
                      {empty ? `Out of ${empty.label.toLowerCase()}` : "Rate limited"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {canRetry ? (
                        "Capacity is back — queued calls can run"
                      ) : (
                        <>
                          Retry after <RollingNumber value={seconds(retryLeft)} />
                        </>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    icon={ArrowClockwise}
                    iconWeight="bold"
                    disabled={!canRetry}
                    onClick={onRetry}
                  >
                    Retry now
                  </Button>
                </div>
                {retryAfterMs > 0 && (
                  <ProgressBar
                    size="sm"
                    striped
                    tone="warning"
                    value={retryLeft}
                    max={retryAfterMs}
                    label="Time until retry"
                    valueText={`Retry after ${seconds(retryLeft)}`}
                    className="mt-3 bg-warning/15"
                  />
                )}
                {queued.length > 0 && (
                  <>
                    <p className="mt-3 mb-1 text-xs text-muted-foreground">
                      {queued.length} {queued.length === 1 ? "call" : "calls"} waiting
                    </p>
                    <ul>
                      <AnimatePresence initial={false}>
                        {queued.map((q) => (
                          <motion.li
                            key={q.id}
                            layout="position"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              transition: enter,
                            }}
                            exit={{
                              opacity: 0,
                              x: 8,
                              transition: exit,
                            }}
                            transition={{ layout: spring }}
                            className="flex items-center gap-2 py-1 text-[0.8125rem]"
                          >
                            <span
                              className="size-1.5 shrink-0 rounded-full bg-warning"
                              aria-hidden="true"
                            />
                            <span className="min-w-0 flex-1 truncate font-mono text-xs">
                              {q.label}
                            </span>
                            {q.tokens !== undefined && (
                              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                                {compact(q.tokens)} tok
                              </span>
                            )}
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p role="status" aria-live="polite" className="sr-only">
          {throttled
            ? canRetry
              ? "Rate limit cleared"
              : `Rate limited, retry after ${seconds(retryAfterMs)}`
            : ""}
        </p>
      </Shell>
    </MotionConfig>
  );
}
