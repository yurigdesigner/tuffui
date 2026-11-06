"use client";

import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { UsageSummary, type UsageDay, type UsageModel } from "./usage-summary";

const models: UsageModel[] = [
  { id: "opus", name: "Claude Opus 5.5" },
  { id: "sonnet", name: "Claude Sonnet 5.5" },
  { id: "haiku", name: "Claude Haiku 5.5" },
];

// Rough $ per 1k tokens, blended input/output.
const price = { opus: 0.03, sonnet: 0.008, haiku: 0.002 };

/** Deterministic, weekday-heavy usage ending on Nov 3. */
function makeDays(count: number): UsageDay[] {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.UTC(2026, 10, 3 - (count - 1 - i)));
    const weekend = [0, 6].includes(date.getUTCDay());
    const wave = 0.6 + (((i * 37) % 11) / 11) * 0.8;
    const scale = (weekend ? 0.35 : 1) * wave;
    const tokens = {
      opus: Math.round(310_000 * scale * (i % 3 === 0 ? 1.4 : 0.8)),
      sonnet: Math.round(1_150_000 * scale),
      haiku: Math.round(2_400_000 * scale * (i % 4 === 1 ? 0.5 : 1)),
    };
    return {
      date: date.toISOString().slice(0, 10),
      byModel: Object.fromEntries(
        Object.entries(tokens).map(([id, t]) => [
          id,
          { tokens: t, cost: (t / 1000) * price[id as keyof typeof price] },
        ]),
      ),
    };
  });
}

type State = { grow: number; today: number };

const script: MockStep<State>[] = [
  ...[0.25, 0.55, 0.85, 1].map((grow) => ({
    delay: 120,
    apply: (s: State) => ({ ...s, grow }),
  })),
  wait(900),
  ...[1, 2, 3, 4, 5].map(() => ({
    delay: 800,
    apply: (s: State) => ({ ...s, today: s.today + 0.18 }),
  })),
];

export default function UsageSummaryDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const month = variant === "Month";
  const { state } = useMockRun<State>({ grow: autoplay ? 0 : 1, today: 0 }, script, {
    autoplay,
  });

  const base = makeDays(month ? 30 : 7);
  const days = base.map((day, i) => {
    const last = i === base.length - 1;
    const factor = state.grow * (last ? 0.55 + state.today : 1);
    return {
      ...day,
      byModel: Object.fromEntries(
        Object.entries(day.byModel).map(([id, m]) => [
          id,
          { tokens: m.tokens * factor, cost: m.cost * factor },
        ]),
      ),
    };
  });

  return (
    <UsageSummary
      data={{
        days,
        models,
        previousCost: month ? 412 : 118,
        budget: month
          ? { limit: 600, label: "Monthly budget" }
          : { limit: 160, label: "Weekly budget" },
      }}
    />
  );
}
