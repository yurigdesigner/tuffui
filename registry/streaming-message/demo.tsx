"use client";

import { useState } from "react";
import {
  streamText,
  useMockRun,
  wait,
  type MockStep,
} from "@/registry/use-mock-run/use-mock-run";
import { StreamingMessage, type StreamingMessageData } from "./streaming-message";

const answer = `The 429s come from your org's **output tokens per minute** limit, not requests per minute. The batch job fires 40 parallel calls with \`max_tokens: 8192\`, so the reserved output budget spikes to ~327k even though most summaries finish under 600 tokens.

Lower \`max_tokens\` to 1024 and cap concurrency at 8. If you still get throttled, read the \`retry-after\` header and back off with jitter instead of retrying immediately.`;

const reasoning =
  "429s on a batch job — check which limit trips. 40 parallel × 8192 max_tokens = 327k reserved output tokens, well over a 160k OTPM tier. Requests per minute is only 40, so RPM isn't it. Fix: smaller max_tokens, lower concurrency, honor retry-after.";

const citations = [
  {
    id: "limits",
    title: "Rate limits — API reference",
    url: "https://docs.anthropic.com/en/api/rate-limits",
  },
  {
    id: "errors",
    title: "Errors and the retry-after header",
    url: "https://docs.anthropic.com/en/api/errors",
  },
  {
    id: "issue",
    title: "batch-runner#212: Throttled during nightly summaries",
    url: "https://github.com/northwind/batch-runner/issues/212",
    source: "github.com",
  },
];

type State = StreamingMessageData;

const interrupted =
  answer.slice(0, answer.indexOf("\n\n")) + "\n\nLower the per-request ceiling and cap ";

const opening = answer.split(" ").slice(0, 9).join(" ") + " ";
const stream = (text: string, from = "") =>
  streamText<State>(
    text.slice(from.length),
    (s, partial) => ({ ...s, content: from + partial }),
    {
      interval: 55,
    },
  );

const scripts: Record<string, { initial: State; steps: MockStep<State>[] }> = {
  Default: {
    initial: { content: opening, status: "streaming", citations },
    steps: [
      ...stream(answer, opening),
      { delay: 200, apply: (s) => ({ ...s, status: "done" }) },
    ],
  },
  Reasoning: {
    initial: {
      content: "",
      status: "streaming",
      citations,
      reasoning: { text: reasoning.slice(0, 64), streaming: true },
    },
    steps: [
      ...streamText<State>(
        reasoning.slice(64),
        (s, partial) => ({
          ...s,
          reasoning: { text: reasoning.slice(0, 64) + partial, streaming: true },
        }),
        { interval: 40 },
      ),
      {
        delay: 300,
        apply: (s) => ({
          ...s,
          reasoning: { text: reasoning, streaming: false, durationMs: 4200 },
        }),
      },
      ...stream(answer),
      { delay: 200, apply: (s) => ({ ...s, status: "done" }) },
    ],
  },
  Error: {
    initial: { content: opening, status: "streaming" },
    steps: [
      ...stream(interrupted, opening),
      wait(400),
      {
        delay: 0,
        apply: (s) => ({
          ...s,
          status: "error",
          error: "Connection reset after 260 tokens.",
        }),
      },
    ],
  },
};

function Run({
  variant,
  autoplay,
  onRetry,
}: {
  variant: string;
  autoplay: boolean;
  onRetry?: () => void;
}) {
  const script = scripts[variant] ?? scripts.Default;
  const { state, replay } = useMockRun<State>(script.initial, script.steps, { autoplay });
  return (
    <StreamingMessage data={state} model="Claude Opus 5.5" onRetry={onRetry ?? replay} />
  );
}

export default function StreamingMessageDemo({
  variant = "Default",
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  // Error variant: the first attempt fails, Retry streams a clean answer.
  const [attempt, setAttempt] = useState(0);
  if (variant === "Error" && attempt > 0)
    return <Run key={attempt} variant="Default" autoplay />;
  return (
    <Run
      variant={variant}
      autoplay={autoplay}
      onRetry={variant === "Error" ? () => setAttempt((n) => n + 1) : undefined}
    />
  );
}
