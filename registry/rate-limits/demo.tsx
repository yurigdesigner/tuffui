"use client";

import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { RateLimits, type QueuedCall, type RateLimit } from "./rate-limits";

type State = { limits: RateLimit[]; queued: QueuedCall[]; retryAfterMs: number };

const full: RateLimit[] = [
  { id: "req", label: "Requests", limit: 4_000, remaining: 4_000, resetsInMs: 0 },
  {
    id: "in",
    label: "Input tokens",
    limit: 2_000_000,
    remaining: 2_000_000,
    resetsInMs: 0,
  },
  {
    id: "out",
    label: "Output tokens",
    limit: 400_000,
    remaining: 400_000,
    resetsInMs: 0,
  },
];

/** One API call: spends from every bucket and starts the reset timers. */
const call = (input: number, output: number, delay = 700): MockStep<State> => ({
  delay,
  apply: (s) => ({
    ...s,
    limits: s.limits.map((l) => {
      const spent = l.id === "req" ? 180 : l.id === "in" ? input : output;
      return {
        ...l,
        remaining: Math.max(0, l.remaining - spent),
        resetsInMs: l.resetsInMs || 12_000,
      };
    }),
  }),
});

const refill = (ids: string[]): MockStep<State> => ({
  delay: 0,
  apply: (s) => ({
    ...s,
    limits: s.limits.map((l) =>
      ids.includes(l.id) ? { ...l, remaining: l.limit, resetsInMs: 0 } : l,
    ),
  }),
});

const healthy: MockStep<State>[] = [
  wait(600),
  call(180_000, 38_000),
  call(240_000, 52_000),
  call(120_000, 21_000),
  call(310_000, 64_000),
  call(90_000, 18_000),
  wait(2_400),
  refill(["req", "in", "out"]),
  call(150_000, 30_000, 900),
];

const queue: QueuedCall[] = [
  { id: "q1", label: "summarize release notes", tokens: 42_000 },
  { id: "q2", label: "draft changelog section", tokens: 28_000 },
  { id: "q3", label: "translate announcement", tokens: 19_000 },
];

const throttled: MockStep<State>[] = [
  wait(700),
  call(380_000, 140_000),
  call(420_000, 160_000),
  call(300_000, 100_000),
  { delay: 400, apply: (s) => ({ ...s, queued: queue, retryAfterMs: 8_000 }) },
  wait(8_200),
  refill(["out"]),
  { delay: 0, apply: (s) => ({ ...s, retryAfterMs: 0 }) },
  ...queue.map((q) => ({
    delay: 700,
    apply: (s: State) => ({
      ...s,
      queued: s.queued.filter((x) => x.id !== q.id),
      limits: s.limits.map((l) =>
        l.id === "out"
          ? { ...l, remaining: l.remaining - (q.tokens ?? 0), resetsInMs: 12_000 }
          : l,
      ),
    }),
  })),
];

export default function RateLimitsDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const isThrottled = variant === "Throttled";
  const { state, setState } = useMockRun<State>(
    { limits: full, queued: [], retryAfterMs: 0 },
    isThrottled ? throttled : healthy,
    { autoplay },
  );

  return (
    <RateLimits
      data={{ model: "opus-5.5 · Tier 3", ...state }}
      onRetry={() =>
        setState((s) => ({
          ...s,
          retryAfterMs: 0,
          limits: s.limits.map((l) => ({ ...l, remaining: l.limit, resetsInMs: 0 })),
        }))
      }
    />
  );
}
