"use client";

import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { CheckpointTimeline, type Checkpoint } from "./checkpoint-timeline";

const f = (path: string, additions: number, deletions: number) => ({
  path,
  additions,
  deletions,
});

const checkpoints: Checkpoint[] = [
  { id: "c1", label: "Read the yargs setup in src/cli.ts", at: "18m ago", files: [] },
  {
    id: "c2",
    label: "Add commander and remove yargs from package.json",
    at: "16m ago",
    files: [f("package.json", 1, 2), f("pnpm-lock.yaml", 24, 61)],
  },
  {
    id: "c3",
    label: "Rewrite the entry point with a Command program",
    at: "14m ago",
    files: [f("src/cli.ts", 18, 27)],
  },
  {
    id: "c4",
    label: "Port the build command and its flags",
    at: "11m ago",
    files: [f("src/commands/build.ts", 22, 15), f("src/cli.ts", 3, 1)],
  },
  {
    id: "c5",
    label: "Port the watch command",
    at: "9m ago",
    files: [f("src/commands/watch.ts", 31, 0), f("src/cli.ts", 2, 0)],
  },
  {
    id: "c6",
    label: "Delete the legacy argument parser",
    at: "7m ago",
    files: [f("src/legacy/args.ts", 0, 88), f("src/cli.ts", 0, 4)],
  },
  {
    id: "c7",
    label: "Change --out-dir to resolve from cwd",
    at: "4m ago",
    files: [f("src/commands/build.ts", 6, 3), f("test/cli.spec.ts", 12, 2)],
  },
  {
    id: "c8",
    label: "Update snapshots after the flag change",
    at: "1m ago",
    files: [f("test/__snapshots__/cli.spec.ts.snap", 40, 38)],
  },
];

type State = { data: Checkpoint[]; selected?: string; confirming: boolean };

const select = (id: string, delay: number): MockStep<State> => ({
  delay,
  apply: (s) => ({ ...s, selected: id }),
});

const script: MockStep<State>[] = [
  wait(1200),
  select("c7", 0),
  select("c6", 700),
  select("c5", 700),
  { delay: 1400, apply: (s) => ({ ...s, confirming: true }) },
  {
    delay: 1800,
    apply: (s) => ({
      data: s.data.slice(0, s.data.findIndex((c) => c.id === "c5") + 1),
      selected: undefined,
      confirming: false,
    }),
  },
];

export default function CheckpointTimelineDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const { state, setState } = useMockRun<State>(
    { data: checkpoints, confirming: false },
    script,
    { autoplay },
  );

  return (
    <CheckpointTimeline
      data={state.data}
      variant={variant === "Compact" ? "compact" : "timeline"}
      selectedId={state.selected}
      onSelect={(c) => setState((s) => ({ ...s, selected: c.id }))}
      confirming={state.confirming}
      onConfirmingChange={(confirming) => setState((s) => ({ ...s, confirming }))}
      onRestore={(c) =>
        setState((s) => ({
          data: s.data.slice(0, s.data.indexOf(c) + 1),
          selected: undefined,
          confirming: false,
        }))
      }
    />
  );
}
