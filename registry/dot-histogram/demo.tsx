"use client";

import { DotHistogram } from "./dot-histogram";

// Seeded noise so the server and the client draw the same chart.
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

function logNormal(count: number, median: number, spread: number, seed: number) {
  const next = rng(seed);
  return Array.from({ length: count }, () => {
    const g = Math.sqrt(-2 * Math.log(next() || 1e-9)) * Math.cos(2 * Math.PI * next());
    return median * Math.exp(g * spread);
  });
}

const latency = [
  ...logNormal(296, 4.2, 0.42, 7).map((v) => Math.min(v, 14.6)),
  ...logNormal(24, 15.4, 0.015, 11),
];

const tokens = logNormal(420, 1800, 0.5, 3).map(Math.round);

export default function DotHistogramDemo({ variant = "Latency" }: { variant?: string }) {
  return variant === "Tokens" ? (
    <DotHistogram
      title="Output tokens"
      subtitle="Per response · sonnet-5.5 · today"
      values={tokens}
      threshold={4096}
      thresholdLabel="hit max_tokens"
      unit="responses"
      format={(v) => (v >= 1000 ? `${+(v / 1000).toFixed(1)}k` : `${Math.round(v)}`)}
    />
  ) : (
    <DotHistogram
      title="Response time"
      subtitle="Last 320 runs · timeout 15 s"
      values={latency}
      threshold={15}
      thresholdLabel="timed out"
      unit="runs"
      format={(v) => `${+v.toFixed(1)}s`}
    />
  );
}
