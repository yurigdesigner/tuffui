"use client";

import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { EvalResults, type EvalCase, type EvalStatus } from "./eval-results";

const tables = ["orders", "customers", "invoices", "events", "sessions", "products"];
const asks = [
  "Top 5 customers by revenue last quarter",
  "Daily active sessions for the past week",
  "Orders with no matching invoice",
  "Median order value by country",
  "Products never ordered",
  "Events per user, bucketed by hour",
];

// Deterministic spread: mostly passes, a few failures, regressions and wins.
const finalStatus = (i: number): EvalStatus =>
  [7, 23, 41].includes(i)
    ? "regressed"
    : [12, 35, 50, 57].includes(i)
      ? "fail"
      : [4, 29, 46].includes(i)
        ? "improved"
        : "pass";

const makeCase = (i: number): EvalCase => {
  const status = finalStatus(i);
  const table = tables[i % tables.length];
  const bad = status === "fail" || status === "regressed";
  return {
    id: `case-${i}`,
    name: `sql/${table}-${String(i + 1).padStart(2, "0")}`,
    status: "pending",
    score: bad ? 0.2 + (i % 3) * 0.1 : 0.9 + (i % 2) * 0.1,
    input: asks[i % asks.length],
    expected: `SELECT … FROM ${table} GROUP BY 1 ORDER BY 2 DESC LIMIT 5;`,
    actual: bad
      ? `SELECT … FROM ${table} ORDER BY 2 DESC;`
      : `SELECT … FROM ${table} GROUP BY 1 ORDER BY 2 DESC LIMIT 5;`,
    reason: bad
      ? "Missing GROUP BY — the query returns one row per order instead of per customer."
      : "Result set matches the reference on the fixture database.",
  };
};

const COUNT = 60;
const initial = Array.from({ length: COUNT }, (_, i) => makeCase(i));
const finished = initial.map((c, i) => ({ ...c, status: finalStatus(i) }));

type State = { cases: EvalCase[]; selected: string | null };

const setStatus = (ids: number[], status?: EvalStatus) => (s: State) => ({
  ...s,
  cases: s.cases.map((c, i) =>
    ids.includes(i) ? { ...c, status: status ?? finalStatus(i) } : c,
  ),
});

// Batches of four start running, then resolve.
const script: MockStep<State>[] = [wait(500)];
for (let i = 0; i < COUNT; i += 4) {
  const batch = [i, i + 1, i + 2, i + 3].filter((n) => n < COUNT);
  script.push({ delay: 90, apply: setStatus(batch, "running") });
  script.push({ delay: 160, apply: setStatus(batch) });
}
script.push(wait(500), { delay: 0, apply: (s) => ({ ...s, selected: "case-23" }) });

const metrics = [
  {
    id: "acc",
    label: "Exact-match accuracy",
    baseline: 0.849,
    candidate: 0.883,
    better: "higher" as const,
    format: (v: number) => `${(v * 100).toFixed(1)}%`,
  },
  {
    id: "p50",
    label: "Latency p50",
    baseline: 1840,
    candidate: 1320,
    better: "lower" as const,
    format: (v: number) => `${(v / 1000).toFixed(2)}s`,
  },
  {
    id: "cost",
    label: "Cost per case",
    baseline: 0.0042,
    candidate: 0.0051,
    better: "lower" as const,
    format: (v: number) => `$${v.toFixed(4)}`,
  },
  {
    id: "refusals",
    label: "Refusals",
    baseline: 3,
    candidate: 1,
    better: "lower" as const,
  },
];

export default function EvalResultsDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const compare = variant === "Compare";
  const { state, setState } = useMockRun<State>(
    // Thumbnails and the compare view start from a finished run.
    { cases: compare || !autoplay ? finished : initial, selected: null },
    compare || !autoplay ? [] : script,
    { autoplay },
  );

  return (
    <EvalResults
      data={{
        suite: "sql-generation",
        label: "opus-5.5 vs sonnet-5.5",
        cases: state.cases,
        baselinePassRate: 0.849,
        metrics,
      }}
      view={compare ? "compare" : "grid"}
      selectedId={state.selected}
      onSelectCase={(c) => setState((s) => ({ ...s, selected: c.id }))}
    />
  );
}
