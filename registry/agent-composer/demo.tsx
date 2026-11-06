"use client";

import { useEffect, useState } from "react";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  AgentComposer,
  type ComposerContextItem,
  type ComposerMode,
  type ComposerQueued,
} from "./agent-composer";

const models = [
  {
    id: "opus-5.5",
    name: "Claude Opus 5.5",
    description: "Deepest reasoning, long tasks",
  },
  { id: "sonnet-5.5", name: "Claude Sonnet 5.5", description: "Fast and capable" },
  { id: "haiku-5.5", name: "Claude Haiku 5.5", description: "Quick edits and lookups" },
];

const commands = [
  { name: "review", description: "Review the current diff" },
  { name: "test", description: "Run the tests for changed files" },
  { name: "explain", description: "Explain a file or symbol" },
];

const files = [
  { id: "i18n", path: "src/i18n.ts", tokens: 1_840 },
  { id: "en", path: "src/i18n/locales/en.json", tokens: 6_210 },
  { id: "steps", path: "src/onboarding/steps.tsx", tokens: 3_420 },
  { id: "welcome", path: "src/onboarding/welcome.tsx", tokens: 2_130 },
  { id: "e2e", path: "e2e/onboarding.spec.ts", tokens: 2_960 },
];

type State = {
  value: string;
  mode: ComposerMode;
  status: "idle" | "streaming";
  context: ComposerContextItem[];
  queue: ComposerQueued[];
};

const type = (text: string, from = ""): MockStep<State>[] =>
  Array.from(text, (_, i) => ({
    delay: 50 + ((i * 7) % 4) * 12,
    apply: (s: State) => ({ ...s, value: from + text.slice(0, i + 1) }),
  }));

const mention = (fileId: string): MockStep<State> => ({
  delay: 700,
  apply: (s) => {
    const f = files.find((x) => x.id === fileId)!;
    return {
      ...s,
      value: s.value.replace(/@\S*$/, ""),
      context: [...s.context, { id: f.id, name: f.path, tokens: f.tokens }],
    };
  },
});

const queue = (text: string): MockStep<State>[] => [
  ...type(text),
  wait(300),
  {
    delay: 0,
    apply: (s) => ({ ...s, value: "", queue: [...s.queue, { id: text, text }] }),
  },
];

const script: MockStep<State>[] = [
  wait(500),
  ...type("@i18n"),
  mention("i18n"),
  ...type("@steps"),
  mention("steps"),
  ...type("Add German to the onboarding flow"),
  wait(500),
  { delay: 0, apply: (s) => ({ ...s, value: "", context: [], status: "streaming" }) },
  wait(900),
  ...queue("Then update the onboarding screenshots"),
  wait(600),
  ...queue("Run the e2e suite with locale de-DE"),
  wait(2600),
  { delay: 0, apply: (s) => ({ ...s, queue: s.queue.slice(1) }) },
  wait(3200),
  { delay: 0, apply: (s) => ({ ...s, queue: s.queue.slice(1) }) },
  wait(3000),
  { delay: 0, apply: (s) => ({ ...s, status: "idle" }) },
];

const minimalScript: MockStep<State>[] = [
  wait(500),
  ...type("Why does the welcome step render twice?"),
  wait(500),
  { delay: 0, apply: (s) => ({ ...s, value: "", status: "streaming" }) },
  wait(1200),
  ...queue("And how do I fix it?"),
  wait(2600),
  { delay: 0, apply: (s) => ({ ...s, queue: [] }) },
  wait(2800),
  { delay: 0, apply: (s) => ({ ...s, status: "idle" }) },
];

export default function AgentComposerDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const minimal = variant === "Minimal";
  const { state, setState } = useMockRun<State>(
    {
      value: "",
      mode: "act",
      status: "idle",
      context: minimal
        ? []
        : [{ id: "en", name: "src/i18n/locales/en.json", tokens: 6_210 }],
      queue: [],
    },
    minimal ? minimalScript : script,
    { autoplay },
  );
  const [model, setModel] = useState("opus-5.5");
  const [manual, setManual] = useState(false);

  // Runs started by the viewer work for a few seconds, then take the next queued message.
  useEffect(() => {
    if (!manual || state.status !== "streaming") return;
    const timer = setTimeout(
      () =>
        setState((s) =>
          s.queue.length ? { ...s, queue: s.queue.slice(1) } : { ...s, status: "idle" },
        ),
      3000,
    );
    return () => clearTimeout(timer);
  }, [manual, state.status, state.queue.length, setState]);

  return (
    // Room above for the menus; the paused thumbnail has none, so no spacer.
    <div
      className={`flex w-full max-w-xl flex-col justify-end ${autoplay ? "pt-36" : ""}`}
    >
      <AgentComposer
        value={state.value}
        onValueChange={(value) => setState((s) => ({ ...s, value }))}
        mode={state.mode}
        onModeChange={(mode) => setState((s) => ({ ...s, mode }))}
        showModes={!minimal}
        context={state.context}
        onContextChange={(context) => setState((s) => ({ ...s, context }))}
        files={files}
        commands={commands}
        models={minimal ? [] : models}
        model={model}
        onModelChange={setModel}
        status={state.status}
        queue={state.queue}
        onQueueChange={(queue) => setState((s) => ({ ...s, queue }))}
        onSubmit={() => {
          setState((s) => ({ ...s, status: "streaming" }));
          setManual(true);
        }}
        onStop={() => setState((s) => ({ ...s, status: "idle", queue: [] }))}
        allowAttachments={!minimal}
        placeholder={minimal ? "Message the agent…" : undefined}
      />
    </div>
  );
}
