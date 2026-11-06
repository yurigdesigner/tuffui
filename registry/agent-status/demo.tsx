"use client";

import { useState } from "react";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { AgentStatus, type AgentStatusData, type AgentStatusStep } from "./agent-status";

type State = Omit<AgentStatusData, "startedAt">;

const files = [
  "src/site/build.ts",
  "src/site/images.ts",
  "src/site/images/sharp.ts",
  "src/site/cache.ts",
];

/** Rotates the detail line through `details`, one every `every` ms. */
const browse = (details: string[], every = 650): MockStep<State>[] =>
  details.map((detail) => ({ delay: every, apply: (s) => ({ ...s, detail }) }));

/** Finishes the current step and starts the next. */
const next = (label: string, durationMs: number, detail?: string): MockStep<State> => ({
  delay: 500,
  apply: (s) => ({
    ...s,
    steps: [
      ...(s.steps ?? []),
      { id: s.label, label: s.label, durationMs } satisfies AgentStatusStep,
    ],
    label,
    detail,
  }),
});

const script: MockStep<State>[] = [
  ...browse(files),
  next("Profiling the image pipeline", 3_100, "pressd build --profile"),
  wait(900),
  { delay: 0, apply: (s) => ({ ...s, detail: "sharp resize: 71% of 48s" }) },
  wait(800),
  next("Caching resized images", 2_200, "src/site/cache.ts"),
  ...browse(["src/site/cache.ts", "src/site/images.ts"], 1100),
  next("Running the test suite", 2_900, "vitest run site"),
  ...browse(["✓ build.spec.ts", "✓ images.spec.ts", "✓ cache.spec.ts"], 800),
  wait(600),
  next("Builds 3.8× faster: 48s → 12.6s", 3_000),
  { delay: 0, apply: (s) => ({ ...s, status: "done" }) },
];

export default function AgentStatusDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  // No clock during prerender; the timer shows 0s either way until it ticks.
  const [startedAt] = useState(() => (typeof window === "undefined" ? 0 : Date.now()));
  const { state, setState } = useMockRun<State>(
    {
      label: "Reading the build pipeline",
      detail: files[0],
      steps: [],
      status: "working",
    },
    script,
    { autoplay },
  );

  return (
    <AgentStatus
      data={{ ...state, startedAt }}
      maxSteps={variant === "Steps" ? 3 : 0}
      onStop={() => setState((s) => ({ ...s, status: "stopped" }))}
    />
  );
}
