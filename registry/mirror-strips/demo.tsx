"use client";

import { MirrorStrips, type MirrorRow } from "./mirror-strips";

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

/** Counts that cluster around a few hot spots and shrink each round. */
function strip(n: number, hot: number[], scale: number, seed: number) {
  const next = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const heat = hot.reduce((h, c) => h + Math.exp(-((i - c) ** 2) / 6), 0);
    const v = (heat * 5 + next() * 1.6 - 0.5) * scale;
    return Math.max(0, Math.round(v));
  });
}

const pages = Array.from({ length: 42 }, (_, i) => (i === 0 ? "p. 1" : `${i + 1}`));
const hot = [6, 13, 20, 27, 34];
const rounds: MirrorRow[] = [
  {
    id: "r1",
    label: "R1",
    sublabel: "Aug 4",
    up: strip(42, hot, 1, 1),
    down: strip(42, hot, 1.1, 2),
  },
  {
    id: "r2",
    label: "R2",
    sublabel: "Aug 19",
    up: strip(42, hot, 0.65, 3),
    down: strip(42, hot, 0.8, 4),
  },
  {
    id: "r3",
    label: "R3",
    sublabel: "Sep 9",
    up: strip(42, [13, 20], 0.55, 5),
    down: strip(42, [20], 0.7, 6),
  },
  {
    id: "r4",
    label: "R4",
    sublabel: "today",
    up: strip(42, [20], 0.45, 7),
    down: strip(42, [20], 0.6, 8),
    current: true,
  },
];

const weeks = ["W1", "W2", "W3", "W4"];
const dirs = [
  "api",
  "app",
  "auth",
  "billing",
  "cli",
  "db",
  "docs",
  "email",
  "jobs",
  "lib",
  "search",
  "ui",
];
const prs: MirrorRow[] = weeks.map((w, i) => ({
  id: w,
  label: w,
  sublabel: ["Oct 6", "Oct 13", "Oct 20", "Oct 27"][i],
  up: strip(12, [1, 9], 1.2 - i * 0.2, 20 + i),
  down: strip(12, [5, 9], 0.9 - i * 0.1, 40 + i),
  current: i === 3,
}));

export default function MirrorStripsDemo({ variant = "Contract" }: { variant?: string }) {
  return variant === "Pull requests" ? (
    <MirrorStrips
      title="Churn by directory"
      subtitle="Agent PRs · last 4 weeks"
      columns={dirs}
      rows={prs}
      series={{ up: { label: "Lines added" }, down: { label: "Lines removed" } }}
      marks={[{ column: 9, label: "lib", note: "lib/ — refactor still open" }]}
    />
  ) : (
    <MirrorStrips
      title="Edits by page"
      subtitle="42 pages · 4 rounds"
      columns={pages}
      rows={rounds}
      series={{ up: { label: "Their edits" }, down: { label: "Our redlines" } }}
      marks={[
        { column: 20, label: "§ 12.4", note: "§ 12.4 Indemnity — still open in R4" },
      ]}
    />
  );
}
