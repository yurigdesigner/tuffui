"use client";

import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { MemoryPanel, type Memory } from "./memory-panel";

const initial: Memory[] = [
  {
    id: "pnpm",
    text: "Uses pnpm, never npm or yarn, in every repo.",
    scope: "user",
    source: "from chat · 3w ago",
    pinned: true,
  },
  {
    id: "tests",
    text: "Run the e2e suite in every shipped locale before calling i18n work done.",
    scope: "project",
    source: "from a correction · 4d ago",
  },
  {
    id: "glossary",
    text: "Product names stay in English; the glossary in docs/glossary.md wins over MT.",
    scope: "project",
    source: "from docs/glossary.md · 2d ago",
  },
  {
    id: "branch",
    text: "Working on feat/onboarding-de for this session.",
    scope: "session",
    source: "from git · just now",
  },
];

const added: Memory = {
  id: "tz",
  text: "Prefers PRs opened as drafts until CI is green.",
  scope: "user",
  source: "from chat · just now",
  isNew: true,
};

const script: MockStep<Memory[]>[] = [
  wait(1400),
  { delay: 0, apply: (s) => [added, ...s] },
  wait(2200),
  {
    delay: 0,
    apply: (s) =>
      s.map((m) =>
        m.id === "tests"
          ? {
              ...m,
              text: "Run the e2e suite in de-DE and ja-JP before calling i18n work done.",
              source: "edited · just now",
            }
          : m,
      ),
  },
];

export default function MemoryPanelDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const { state, setState } = useMockRun<Memory[]>(initial, script, { autoplay });

  return (
    <MemoryPanel
      data={state}
      variant={variant === "Compact" ? "compact" : "panel"}
      onEdit={(memory, text) =>
        setState((s) =>
          s.map((m) =>
            m.id === memory.id ? { ...m, text, source: "edited · just now" } : m,
          ),
        )
      }
      onForget={(memory) => setState((s) => s.filter((m) => m.id !== memory.id))}
    />
  );
}
