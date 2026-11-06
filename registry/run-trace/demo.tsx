"use client";

import { useMockRun, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { RunTrace, type TraceSpan } from "./run-trace";

// A release-notes agent; the demo reveals the run over time.
const plan: (TraceSpan & { endMs: number })[] = [
  { id: "run", name: "release-notes", kind: "agent", startMs: 0, endMs: 8400 },
  { id: "log", parentId: "run", name: "git.log", kind: "tool", startMs: 100, endMs: 900 },
  {
    id: "issues",
    parentId: "run",
    name: "linear.search",
    kind: "tool",
    startMs: 150,
    endMs: 1300,
  },
  {
    id: "past",
    parentId: "run",
    name: "changelog.search",
    kind: "retrieval",
    startMs: 950,
    endMs: 1350,
  },
  {
    id: "summary",
    parentId: "run",
    name: "summarize",
    kind: "llm",
    model: "claude-sonnet-5-5",
    startMs: 1400,
    endMs: 3000,
    tokens: { input: 18_400, output: 1_120 },
    costUsd: 0.0721,
  },
  {
    id: "drafter",
    parentId: "run",
    name: "drafter",
    kind: "agent",
    startMs: 3100,
    endMs: 7200,
  },
  {
    id: "features",
    parentId: "drafter",
    name: "draft.features",
    kind: "llm",
    model: "claude-haiku-5-5",
    startMs: 3200,
    endMs: 4700,
    tokens: { input: 6_200, output: 940 },
    costUsd: 0.0109,
  },
  {
    id: "fixes",
    parentId: "drafter",
    name: "draft.fixes",
    kind: "llm",
    model: "claude-haiku-5-5",
    startMs: 3250,
    endMs: 4400,
    tokens: { input: 4_800, output: 610 },
    costUsd: 0.0078,
  },
  {
    id: "people-1",
    parentId: "drafter",
    name: "github.contributors",
    kind: "tool",
    startMs: 4500,
    endMs: 5400,
    status: "error",
  },
  {
    id: "people-2",
    parentId: "drafter",
    name: "github.contributors",
    kind: "tool",
    startMs: 5500,
    endMs: 6100,
  },
  {
    id: "polish",
    parentId: "drafter",
    name: "polish",
    kind: "llm",
    model: "claude-sonnet-5-5",
    startMs: 6150,
    endMs: 7100,
    tokens: { input: 3_900, output: 1_480 },
    costUsd: 0.0339,
  },
  {
    id: "post",
    parentId: "run",
    name: "slack.post",
    kind: "tool",
    startMs: 7300,
    endMs: 8000,
  },
];

type State = { spans: TraceSpan[]; elapsedMs: number };

/** Snapshot of the run at time `t`: started spans only, unfinished ones still open. */
function at(t: number): State {
  return {
    elapsedMs: Math.min(t, plan[0].endMs),
    spans: plan
      .filter((s) => s.startMs <= t)
      .map((s) =>
        s.endMs <= t
          ? s
          : {
              ...s,
              endMs: undefined,
              tokens: undefined,
              costUsd: undefined,
              status: undefined,
            },
      ),
  };
}

const TICK = 100;
const script: MockStep<State>[] = Array.from(
  { length: plan[0].endMs / TICK },
  (_, i) => ({
    delay: TICK,
    apply: () => at((i + 1) * TICK),
  }),
);

export default function RunTraceDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  // Paused thumbnails show the finished run; live previews start from zero.
  const { state } = useMockRun<State>(at(autoplay ? 0 : plan[0].endMs), script, {
    autoplay,
  });

  return <RunTrace data={state} view={variant === "Breakdown" ? "breakdown" : "flame"} />;
}
