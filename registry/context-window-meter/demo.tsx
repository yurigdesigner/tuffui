"use client";

import { Paperclip } from "@phosphor-icons/react";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { ContextWindowMeter, type ContextSegment } from "./context-window-meter";

type State = { segments: ContextSegment[]; compacting: boolean };

const LIMIT = 200_000;

const base = (history: number, files: number): ContextSegment[] => [
  { id: "history", label: "Conversation", detail: "22 turns", tokens: history },
  { id: "files", label: "Workspace files", detail: "4 open", tokens: files },
  {
    id: "tools",
    label: "MCP tools",
    detail: "github, linear",
    tokens: 11_840,
    pinned: true,
  },
  {
    id: "system",
    label: "Instructions",
    detail: "AGENTS.md",
    tokens: 3_210,
    pinned: true,
  },
];

const set = (id: string, tokens: number) => (s: State) => ({
  ...s,
  segments: s.segments.map((seg) => (seg.id === id ? { ...seg, tokens } : seg)),
});

/** One conversation turn every ~900ms. */
const turns = (id: string, from: number, deltas: number[]): MockStep<State>[] => {
  let total = from;
  return deltas.map((d) => {
    total += d;
    return { delay: 900, apply: set(id, total) };
  });
};

const compact = (history: number): MockStep<State>[] => [
  { delay: 0, apply: (s) => ({ ...s, compacting: true }) },
  { delay: 1400, apply: (s) => ({ ...set("history", history)(s), compacting: false }) },
];

const growing: MockStep<State>[] = [
  ...turns("history", 18_400, [3_200, 5_800, 2_100, 6_400]),
  { delay: 900, apply: set("files", 31_900) },
  ...turns("history", 35_900, [4_300, 7_100, 2_600]),
];

const nearLimit: MockStep<State>[] = [
  ...turns("history", 92_000, [6_200, 9_400, 8_100, 11_300]),
  wait(1600),
  ...compact(21_600),
];

export default function ContextWindowMeterDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const near = variant === "Near limit";
  const initial: State = {
    segments: near ? base(92_000, 38_600) : base(18_400, 23_500),
    compacting: false,
  };
  const { state, setState } = useMockRun<State>(initial, near ? nearLimit : growing, {
    autoplay,
  });

  const onCompact = () => {
    setState((s) => ({ ...s, compacting: true }));
    setTimeout(
      () => setState((s) => ({ ...set("history", 21_600)(s), compacting: false })),
      1400,
    );
  };

  const meter = (
    <ContextWindowMeter
      data={{ limit: LIMIT, segments: state.segments, model: "opus-5.5" }}
      compacting={state.compacting}
      onCompact={onCompact}
      variant={variant === "Inline" ? "inline" : "card"}
    />
  );

  if (variant !== "Inline") return meter;

  // Inline sits in a composer footer.
  return (
    <div className="w-full max-w-xl rounded-[1.375rem] bg-surface p-1.5">
      <p className="rounded-2xl bg-surface-inset px-4 pt-3.5 pb-6 text-sm text-muted-foreground">
        Refactor the billing webhooks to use the new event schema…
      </p>
      <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Paperclip weight="fill" className="size-3.5" aria-hidden="true" />
          <span className="font-mono">webhooks.ts</span>
        </span>
        {meter}
      </div>
    </div>
  );
}
