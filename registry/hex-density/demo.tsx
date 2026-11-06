"use client";

import { useMockRun, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { HexDensity } from "./hex-density";

// Seeded noise so the server and the client draw the same chart.
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

function gaussian(next: () => number) {
  return Math.sqrt(-2 * Math.log(next() || 1e-9)) * Math.cos(2 * Math.PI * next());
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

// Chunks from one query batch: relevant ones cluster around 0.82 similarity and
// a few hundred tokens; long chunks dilute the match and drift lower.
function chunks(count: number, seed: number): [number, number][] {
  const next = rng(seed);
  return Array.from({ length: count }, () => {
    const tokens = clamp(Math.round(260 * Math.exp(gaussian(next) * 0.55)), 20, 1500);
    const relevant = next() < 0.58;
    const base = relevant ? 0.83 : 0.63;
    const drift = -0.00004 * (tokens - 260);
    const score = base + drift + gaussian(next) * (relevant ? 0.045 : 0.07);
    return [tokens, clamp(score, 0.4, 0.99)];
  });
}

// Requests: response time grows with prompt size, plus a slow tail from
// cold caches and tool calls.
function requests(count: number, seed: number): [number, number][] {
  const next = rng(seed);
  return Array.from({ length: count }, () => {
    const tokens = clamp(Math.round(3200 * Math.exp(gaussian(next) * 0.7)), 200, 32000);
    const tail = next() < 0.08 ? 2.2 + next() * 3.5 : 0;
    const seconds = (0.7 + tokens / 9000 + tail) * Math.exp(gaussian(next) * 0.22);
    return [tokens, clamp(seconds, 0.2, 11.8)];
  });
}

const tok = (v: number) =>
  v >= 1000 ? `${+(v / 1000).toFixed(1)}k tok` : `${Math.round(v)} tok`;

type State = { count: number };

// New batches land every couple of seconds, like a live eval run.
const script: MockStep<State>[] = [1, 2, 3].map(() => ({
  delay: 1800,
  apply: (s) => ({ count: s.count + 1 }),
}));

const BATCH = { Retrieval: chunks(2400, 5), Latency: requests(1800, 9) };

export default function HexDensityDemo({
  variant = "Retrieval",
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const { state } = useMockRun<State>(
    { count: autoplay ? 1 : 4 },
    autoplay ? script : [],
    {
      autoplay,
    },
  );
  const share = state.count / 4;

  if (variant === "Latency") {
    const points = BATCH.Latency.slice(0, Math.round(BATCH.Latency.length * share));
    return (
      <HexDensity
        title="Response time by prompt size"
        subtitle="support-agent · last 24 h · SLO 4 s"
        points={points}
        x={{ label: "Prompt tokens", min: 200, max: 32000, format: tok }}
        y={{
          label: "Response time",
          min: 0,
          max: 12,
          format: (v) => `${+v.toFixed(1)}s`,
        }}
        threshold={{ value: 4, label: "SLO 4 s", above: "over SLO", below: "within SLO" }}
        tone="var(--brand)"
        unit="requests"
      />
    );
  }

  const points = BATCH.Retrieval.slice(0, Math.round(BATCH.Retrieval.length * share));
  return (
    <HexDensity
      title="Retrieval chunks"
      subtitle="docs-index · 300 queries · top-k 8"
      points={points}
      x={{ label: "Chunk length", min: 20, max: 1500, format: tok }}
      y={{ label: "Similarity", min: 0.4, max: 1, format: (v) => v.toFixed(2) }}
      threshold={{
        value: 0.75,
        label: "0.75 cut-off",
        above: "retrieved",
        below: "dropped",
      }}
      unit="chunks"
    />
  );
}
