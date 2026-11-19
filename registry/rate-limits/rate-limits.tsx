// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import { ArrowClockwise, Check, Clock, Gauge, Hourglass } from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
  /** BCP 47 locale for counts, e.g. `he-IL`. */
  locale?: string;
  /** UI strings, for translating the card. */
  labels?: Partial<RateLimitsLabels>;
  className?: string;
};

export type RateLimitsLabels = {
  title: string;
  healthy: string;
  throttled: string;
  /** Unit after each bucket's label. */
  perMinute: string;
  /** `remaining` is the coloured, animated number. */
  left: (remaining: ReactNode, limit: string) => ReactNode;
  meter: (label: string) => string;
  meterValue: (remaining: string, limit: string, resets: string) => string;
  full: string;
  /** `time` is the animated countdown. */
  resetsIn: (time: ReactNode) => ReactNode;
  /** Seconds in text, e.g. "8s". */
  seconds: (n: number) => string;
  /** Seconds on screen; `n` is the animated number, so keep the unit outside it. */
  countdown: (n: ReactNode) => ReactNode;
  outOf: (label: string) => string;
  rateLimited: string;
  capacityBack: string;
  /** `time` is the animated countdown. */
  retryAfter: (time: ReactNode) => ReactNode;
  /** Spoken value of the retry bar. */
  retryAfterText: (time: string) => string;
  retryNow: string;
  timeUntilRetry: string;
  waiting: (count: number) => string;
  tokens: (tokens: string) => string;
  cleared: string;
  limited: (time: string) => string;
};

const defaultLabels: RateLimitsLabels = {
  title: "Rate limits",
  healthy: "Healthy",
  throttled: "Throttled",
  perMinute: "/ min",
  left: (remaining, limit) => (
    <>
      {remaining} of {limit} left
    </>
  ),
  meter: (label) => `${label} per minute remaining`,
  meterValue: (remaining, limit, resets) =>
    `${remaining} of ${limit} left, resets in ${resets}`,
  full: "Full",
  resetsIn: (time) => <>Resets in {time}</>,
  seconds: (n) => `${n}s`,
  countdown: (n) => <>{n}s</>,
  outOf: (label) => `Out of ${label.toLowerCase()}`,
  rateLimited: "Rate limited",
  capacityBack: "Capacity is back — queued calls can run",
  retryAfter: (time) => <>Retry after {time}</>,
  retryAfterText: (time) => `Retry after ${time}`,
  retryNow: "Retry now",
  timeUntilRetry: "Time until retry",
  waiting: (count) => `${count} ${count === 1 ? "call" : "calls"} waiting`,
  tokens: (tokens) => `${tokens} tok`,
  cleared: "Rate limit cleared",
  limited: (time) => `Rate limited, retry after ${time}`,
};

const Context = createContext({ labels: defaultLabels, locale: "en-US" });

const compactWith = (locale: string) => (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 10_000
      ? `${Math.round(n / 1000)}k`
      : n.toLocaleString(locale);

const whole = (ms: number) => Math.max(0, Math.ceil(ms / 1000));
const secondsWith = (labels: RateLimitsLabels) => (ms: number) =>
  labels.seconds(whole(ms));
/** The unit stays outside the rolling digits, so it lands on the correct side in RTL. */
const countdownWith = (labels: RateLimitsLabels) => (ms: number) =>
  labels.countdown(<RollingNumber value={String(whole(ms))} />);

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
  const { labels, locale } = useContext(Context);
  const compact = compactWith(locale);
  const seconds = secondsWith(labels);
  const countdown = countdownWith(labels);
  const ratio = limit.limit ? limit.remaining / limit.limit : 0;
  const resets = useCountdown(limit.resetsInMs);
  const tone = limit.remaining === 0 ? "negative" : ratio < 0.2 ? "warning" : "brand";

  return (
    <li className="py-2.5">
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[0.8125rem]">
        <span>
          {limit.label}
          <span className="text-muted-foreground"> {labels.perMinute}</span>
        </span>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {labels.left(
            <span
              className={cn(
                "text-foreground",
                tone === "negative" && "text-negative",
                tone === "warning" && "text-warning",
              )}
            >
              <RollingNumber value={compact(limit.remaining)} />
            </span>,
            compact(limit.limit),
          )}
        </span>
      </div>
      <ProgressBar
        kind="meter"
        striped
        tone={tone}
        value={limit.remaining}
        max={limit.limit}
        label={labels.meter(limit.label)}
        valueText={labels.meterValue(
          limit.remaining.toLocaleString(locale),
          limit.limit.toLocaleString(locale),
          seconds(resets),
        )}
      />
      <p className="mt-1 text-xs text-muted-foreground">
        {limit.remaining === limit.limit
          ? labels.full
          : labels.resetsIn(countdown(resets))}
      </p>
    </li>
  );
}

export function RateLimits({
  data,
  onRetry,
  locale = "en-US",
  labels: labelOverrides,
  className,
}: RateLimitsProps) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const compact = compactWith(locale);
  const seconds = secondsWith(labels);
  const countdown = countdownWith(labels);
  const list = useRef<HTMLUListElement>(null);
  // Calls leave the queue toward the end edge.
  const [rtl, setRtl] = useState(false);
  useEffect(() => {
    setRtl(!!list.current && getComputedStyle(list.current).direction === "rtl");
  }, []);
  const { limits, queued = [], retryAfterMs = 0 } = data;
  const retryLeft = useCountdown(retryAfterMs);
  const empty = limits.find((l) => l.remaining === 0);
  const throttled = retryAfterMs > 0 || Boolean(empty);
  const canRetry = throttled && retryLeft === 0;

  return (
    <Context.Provider value={{ labels, locale }}>
      <MotionConfig reducedMotion="user">
        <Shell aria-label={labels.title} className={cn("max-w-md", className)}>
          <ShellHeader
            icon={Gauge}
            title={labels.title}
            subtitle={
              data.model && <span className="font-mono text-xs">{data.model}</span>
            }
            aside={
              <StatusPill
                size="sm"
                tone={throttled ? "warning" : "positive"}
                icon={throttled ? Hourglass : Check}
                iconWeight={throttled ? "fill" : "bold"}
                className="h-auto px-2 py-0.5 text-xs"
              >
                {throttled ? labels.throttled : labels.healthy}
              </StatusPill>
            }
          />

          <Panel className="px-4 py-1.5">
            <ul ref={list}>
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
                        {empty ? labels.outOf(empty.label) : labels.rateLimited}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {canRetry
                          ? labels.capacityBack
                          : labels.retryAfter(countdown(retryLeft))}
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      icon={ArrowClockwise}
                      iconWeight="bold"
                      disabled={!canRetry}
                      onClick={onRetry}
                    >
                      {labels.retryNow}
                    </Button>
                  </div>
                  {retryAfterMs > 0 && (
                    <ProgressBar
                      size="sm"
                      striped
                      tone="warning"
                      value={retryLeft}
                      max={retryAfterMs}
                      label={labels.timeUntilRetry}
                      valueText={labels.retryAfterText(seconds(retryLeft))}
                      className="mt-3 bg-warning/15"
                    />
                  )}
                  {queued.length > 0 && (
                    <>
                      <p className="mt-3 mb-1 text-xs text-muted-foreground">
                        {labels.waiting(queued.length)}
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
                                x: rtl ? -8 : 8,
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
                                  {labels.tokens(compact(q.tokens))}
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
                ? labels.cleared
                : labels.limited(seconds(retryAfterMs))
              : ""}
          </p>
        </Shell>
      </MotionConfig>
    </Context.Provider>
  );
}
