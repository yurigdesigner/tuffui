"use client";

import { ChartBar, EnvelopeSimple, Globe, MagnifyingGlass } from "@phosphor-icons/react";
import { useState } from "react";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { PromptSuggestions, type PromptSuggestion } from "./prompt-suggestions";

const starters: PromptSuggestion[] = [
  {
    id: "a",
    icon: Globe,
    title: "Localize the onboarding flow",
    hint: "German and Japanese, with the glossary",
  },
  {
    id: "b",
    icon: ChartBar,
    title: "Chart last month's signups",
    hint: "By plan and by country",
  },
  {
    id: "c",
    icon: EnvelopeSimple,
    title: "Draft the 2.4 release email",
    hint: "From the merged pull requests",
  },
  {
    id: "d",
    icon: MagnifyingGlass,
    title: "Find unused feature flags",
    hint: "Across web and api",
  },
];

const followUps: PromptSuggestion[][] = [
  [
    { id: "f1", title: "Send test emails to me" },
    { id: "f2", title: "Add Japanese next" },
    { id: "f3", title: "Show the German subject lines" },
  ],
  [
    { id: "f4", title: "Compare open rates by locale" },
    { id: "f5", title: "Schedule for Monday 9:00" },
    { id: "f6", title: "Review the plan names" },
  ],
];

type State = { set: number; refreshing: boolean };

const script: MockStep<State>[] = [
  wait(2600),
  { delay: 0, apply: (s) => ({ ...s, refreshing: true }) },
  { delay: 700, apply: () => ({ set: 1, refreshing: false }) },
];

export default function PromptSuggestionsDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const { state, setState } = useMockRun<State>({ set: 0, refreshing: false }, script, {
    autoplay,
  });
  const [sent, setSent] = useState<string | null>(null);

  if (variant !== "Chips")
    return (
      <PromptSuggestions
        heading="What should we work on?"
        data={starters}
        onSelect={(_, prompt) => setSent(prompt)}
        className={sent ? "opacity-60" : undefined}
      />
    );

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <p className="text-sm leading-relaxed">
        All four onboarding emails now have German versions, with product names kept in
        English.
      </p>
      <PromptSuggestions
        variant="chips"
        data={followUps[state.set]}
        refreshing={state.refreshing}
        onSelect={(_, prompt) => setSent(prompt)}
        onRefresh={() => {
          setState((s) => ({ ...s, refreshing: true }));
          setTimeout(
            () => setState((s) => ({ set: (s.set + 1) % 2, refreshing: false })),
            700,
          );
        }}
      />
      {sent && <p className="text-xs text-muted-foreground">Sent: {sent}</p>}
    </div>
  );
}
