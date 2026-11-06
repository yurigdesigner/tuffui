"use client";

import { useMockRun, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { StatGrid, type Stat } from "./stat-grid";

type State = {
  mrr: number;
  active: number;
  latency: number;
  churn: number;
  tick: number;
};

const money = (n: number) => `$${(n / 1000).toFixed(1)}k`;
const trendOf = (base: number[], last: number) => [...base.slice(1), last];

const mrrTrend = [41.2, 42.0, 41.8, 43.5, 44.1, 45.9, 46.4, 47.1].map((v) => v * 1000);
const activeTrend = [980, 1012, 1005, 1060, 1101, 1094, 1150, 1188];
const latencyTrend = [1.62, 1.58, 1.55, 1.49, 1.51, 1.44, 1.41, 1.38];
const churnTrend = [2.4, 2.3, 2.5, 2.2, 2.1, 2.3, 2.0, 1.9];

const initial: State = { mrr: 47_100, active: 1188, latency: 1.38, churn: 1.9, tick: 0 };

// New data lands every couple of seconds, like a live dashboard answer.
const script: MockStep<State>[] = [
  { delay: 1600, apply: (s) => ({ ...s, mrr: 47_920, active: 1204, tick: 1 }) },
  { delay: 1800, apply: (s) => ({ ...s, latency: 1.31, churn: 1.8, tick: 2 }) },
  { delay: 1800, apply: (s) => ({ ...s, mrr: 48_260, active: 1231, tick: 3 }) },
];

export default function StatGridDemo({
  variant = "KPIs",
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const { state } = useMockRun<State>(initial, script, { autoplay });
  const sparklines = variant === "Sparklines";

  const stats: Stat[] = [
    {
      id: "mrr",
      label: "Monthly recurring revenue",
      value: money(state.mrr),
      delta: 9.6 + state.tick * 0.4,
      trend: trendOf(mrrTrend, state.mrr),
      goal: sparklines ? undefined : { ratio: state.mrr / 60_000, label: "Goal $60k" },
    },
    {
      id: "active",
      label: "Weekly active teams",
      value: state.active.toLocaleString("en-US"),
      delta: 7.9 + state.tick * 0.3,
      trend: trendOf(activeTrend, state.active),
      hint: "vs. last week",
      goal: sparklines ? undefined : { ratio: state.active / 1500, label: "Goal 1,500" },
    },
    {
      id: "latency",
      label: "Median response time",
      value: `${state.latency.toFixed(2)}s`,
      delta: -((1.62 - state.latency) / 1.62) * 100,
      higherIsBetter: false,
      trend: trendOf(latencyTrend, state.latency),
      hint: "opus-5.5",
      goal: sparklines ? undefined : { ratio: 1.2 / state.latency, label: "Target 1.2s" },
    },
    {
      id: "churn",
      label: "Logo churn",
      value: `${state.churn.toFixed(1)}%`,
      delta: -((2.4 - state.churn) / 2.4) * 100,
      higherIsBetter: false,
      trend: trendOf(churnTrend, state.churn),
      goal: sparklines ? undefined : { ratio: 1.5 / state.churn, label: "Target 1.5%" },
    },
  ];

  return (
    <StatGrid
      title="October at a glance"
      subtitle="Updated live from the billing and usage APIs"
      sparklines={sparklines}
      data={stats}
    />
  );
}
