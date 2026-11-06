"use client";

import { DivergingBars, type DivergingSeries } from "./diverging-bars";

// Seeded noise so the server and the client draw the same chart.
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

/** 30 days ending Oct 11, labelled "Sep 12" … "Oct 11". */
const days = Array.from({ length: 30 }, (_, i) =>
  new Date(Date.UTC(2026, 8, 12 + i)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }),
);

/** Daily counts around a base, quieter on weekends, with an optional spike. */
function daily(base: number, seed: number, spike?: { day: number; boost: number }) {
  const next = rng(seed);
  return days.map((_, i) => {
    const weekend = i % 7 === 1 || i % 7 === 2 ? 0.55 : 1;
    const boost = spike && i === spike.day ? spike.boost : 1;
    return Math.round(base * weekend * boost * (0.75 + next() * 0.5));
  });
}

const sources: DivergingSeries[] = [
  { id: "identity", label: "Identity", values: daily(560, 1, { day: 20, boost: 1.5 }) },
  { id: "endpoint", label: "Endpoint", values: daily(310, 2) },
  { id: "cloud", label: "Cloud", values: daily(190, 3) },
  { id: "email", label: "Email", values: daily(150, 4, { day: 20, boost: 5.5 }) },
  { id: "network", label: "Network", values: daily(90, 5) },
  { id: "saas", label: "SaaS", values: daily(70, 6) },
];
const escalated: DivergingSeries = {
  id: "escalated",
  label: "Escalated",
  values: daily(8, 7, { day: 20, boost: 2.6 }),
};

const channels: DivergingSeries[] = [
  { id: "chat", label: "Chat", values: daily(420, 11) },
  { id: "email", label: "Email", values: daily(260, 12) },
  { id: "voice", label: "Voice", values: daily(90, 13) },
  { id: "slack", label: "Slack", values: daily(60, 14, { day: 9, boost: 2.4 }) },
];
const handedOff: DivergingSeries = {
  id: "handed-off",
  label: "Handed off",
  values: daily(58, 15, { day: 9, boost: 1.9 }),
};

const sum = (values: number[]) => values.reduce((n, v) => n + v, 0);
const grand = (series: DivergingSeries[]) => sum(series.map((s) => sum(s.values)));

export default function DivergingBarsDemo({
  variant = "Alerts",
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  if (variant === "Support") {
    const solved = grand(channels);
    const all = solved + sum(handedOff.values);
    return (
      <DivergingBars
        title="Tickets by channel"
        subtitle="Support agent · last 30 days"
        labels={days}
        series={channels}
        below={handedOff}
        headline={{
          value: solved.toLocaleString("en-US"),
          caption: "tickets solved by the agent",
        }}
        aside={
          <>
            <span className="text-foreground tabular-nums">
              {((solved / all) * 100).toFixed(1)}%
            </span>{" "}
            resolution rate
          </>
        }
      />
    );
  }

  const triaged = grand(sources);
  const closed = 1 - sum(escalated.values) / triaged;
  return (
    <DivergingBars
      title="Alerts by source"
      subtitle="Security agent · last 30 days"
      labels={days}
      series={sources}
      below={escalated}
      headline={{
        value: triaged.toLocaleString("en-US"),
        caption: "alerts triaged in 30 days",
      }}
      aside={
        <>
          <span className="text-foreground tabular-nums">
            {(closed * 100).toFixed(1)}%
          </span>{" "}
          closed without a human
        </>
      }
    />
  );
}
