"use client";

import { IsoBars, type IsoSeries } from "./iso-bars";

// Seeded noise so the server and the client draw the same chart.
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

const series = (
  id: string,
  label: string,
  count: number,
  shape: (i: number, noise: number) => number,
  seed: number,
): IsoSeries => {
  const next = rng(seed);
  return {
    id,
    label,
    values: Array.from({ length: count }, (_, i) => Math.round(shape(i, next()))),
  };
};

const sum = (list: IsoSeries[]) =>
  list.reduce((n, s) => n + s.values.reduce((m, v) => m + v, 0), 0);

const compact = (n: number) =>
  n >= 1_000_000
    ? `${+(n / 1_000_000).toFixed(1)}M`
    : n >= 1000
      ? `${+(n / 1000).toFixed(1)}k`
      : `${n}`;

// Tokens: two weeks of a support agent, quieter on weekends, with a model
// rollout on day 9 that briefly spiked failures.
const days = [
  "Oct 23",
  "Oct 24",
  "Oct 25",
  "Oct 26",
  "Oct 27",
  "Oct 28",
  "Oct 29",
  "Oct 30",
  "Oct 31",
  "Nov 1",
  "Nov 2",
  "Nov 3",
  "Nov 4",
  "Nov 5",
];
const weekday = (i: number) => ([2, 3, 9, 10].includes(i) ? 0.55 : 1) * (1 + i * 0.025);
const tokens = [
  series("input", "Input", 14, (i, r) => weekday(i) * (520_000 + r * 90_000), 3),
  series(
    "cached",
    "Cached",
    14,
    (i, r) => weekday(i) * (380_000 + i * 14_000 + r * 60_000),
    5,
  ),
  series("output", "Output", 14, (i, r) => weekday(i) * (210_000 + r * 50_000), 7),
  series(
    "reasoning",
    "Reasoning",
    14,
    (i, r) => weekday(i) * (i >= 8 ? 260_000 : 120_000) * (0.85 + r * 0.3),
    9,
  ),
];
const failed = [
  series(
    "failed",
    "Failed",
    14,
    (i, r) => weekday(i) * (i === 8 ? 150_000 : 26_000 + r * 22_000),
    11,
  ),
  series(
    "retried",
    "Retried",
    14,
    (i, r) => weekday(i) * (i === 8 ? 210_000 : 48_000 + r * 30_000),
    13,
  ),
];

// Pipeline: invoices through an extraction pipeline, by how they were cleared,
// with rework and scrap in front.
const weeks = [
  "Aug 18",
  "Aug 25",
  "Sep 1",
  "Sep 8",
  "Sep 15",
  "Sep 22",
  "Sep 29",
  "Oct 6",
  "Oct 13",
  "Oct 20",
];
const docs = [
  series("auto", "Auto-approved", 10, (i, r) => 620 + i * 48 + r * 90, 17),
  series("reviewed", "Human-reviewed", 10, (i, r) => 340 - i * 12 + r * 60, 19),
  series("escalated", "Escalated", 10, (i, r) => 70 + r * 40, 23),
];
const rework = [
  series("rework", "Rework", 10, (i, r) => (i === 5 ? 184 : 60 + r * 50), 29),
  series("scrap", "Scrap", 10, (i, r) => 14 + r * 22, 31),
];

export default function IsoBarsDemo({
  variant = "Tokens",
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  if (variant === "Pipeline") {
    const done = sum(docs);
    const scrap = sum(rework.slice(1));
    return (
      <IsoBars
        title="Invoices processed"
        subtitle="Extraction pipeline · last 10 weeks"
        labels={weeks}
        back={docs}
        front={rework}
        aside={{
          value: done.toLocaleString("en-US"),
          caption: "docs",
          flag: `scrap ${((scrap / done) * 100).toFixed(1)}%`,
          tone: "negative",
        }}
        format={(v) => v.toLocaleString("en-US")}
      />
    );
  }

  const used = sum(tokens);
  const lost = sum(failed.slice(0, 1));
  return (
    <IsoBars
      title="Daily tokens"
      subtitle="support-agent · last 14 days"
      labels={days}
      back={tokens}
      front={failed}
      aside={{
        value: compact(used),
        caption: "tokens",
        flag: `failed ${((lost / used) * 100).toFixed(1)}%`,
        tone: "warning",
      }}
    />
  );
}
