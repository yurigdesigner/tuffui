"use client";

import { useEffect, useRef } from "react";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  ToneRewrite,
  type ToneRewriteFollowUp,
  type ToneRewriteStatus,
  type ToneValue,
} from "./tone-rewrite";

const SOURCE =
  "Churn rose 4% in Q3, mostly in self-serve. Expansion revenue from 18 accounts offset it, net retention held at 112%.";
const PROMPT = "Turn this into 3 bullets for the investor update";

const MODELS = [
  { value: "chord-fast", label: "Chord Fast", hint: "fastest" },
  { value: "chord-pro", label: "Chord Pro", hint: "best writing" },
  { value: "chord-mini", label: "Chord Mini", hint: "cheapest" },
];
const LENGTHS = [
  { value: "concise", label: "Concise" },
  { value: "balanced", label: "Balanced" },
  { value: "thorough", label: "Thorough" },
];
const FOLLOW_UPS: ToneRewriteFollowUp[] = [
  { id: "shorter", label: "Shorter", nudge: { y: -0.3 } },
  { id: "numbers", label: "Add numbers" },
  { id: "formal", label: "More formal", nudge: { x: -0.3 } },
];

const REWRITES: Record<string, string[]> = {
  first: [
    "Net retention held at 112% despite churn rising 4% in Q3, mostly in self-serve.",
    "Expansion revenue from 18 accounts more than covered the self-serve losses.",
    "Next: fix onboarding for self-serve, where most churn starts, and keep expanding accounts that convert.",
  ],
  shorter: [
    "Net retention held at 112% despite churn up 4%.",
    "Expansion from 18 accounts covered self-serve losses.",
    "Next: fix self-serve onboarding.",
  ],
  numbers: [
    "Net retention: 112%, with gross churn up 4 points in Q3.",
    "Expansion: 18 accounts offset the self-serve churn in full.",
    "Next: cut self-serve churn from 4% to 2% by fixing onboarding in Q4.",
  ],
  formal: [
    "Net revenue retention remained at 112% notwithstanding a 4% increase in churn.",
    "Expansion revenue across 18 accounts fully offset attrition in self-serve.",
    "We will prioritize self-serve onboarding improvements in the coming quarter.",
  ],
};

const START: ToneValue = { x: 0, y: 0 };
const TARGET: ToneValue = { x: -0.55, y: -0.5 };

type State = {
  prompt: string;
  tone: ToneValue;
  status: ToneRewriteStatus;
  output: string[];
};

const settled: State = {
  prompt: PROMPT,
  tone: TARGET,
  status: "done",
  output: REWRITES.first,
};

/** One step per word: the bullet being written grows, earlier ones stay. */
function streamSteps(bullets: string[]): MockStep<State>[] {
  const steps: MockStep<State>[] = [];
  bullets.forEach((bullet, b) => {
    const words = bullet.split(" ");
    words.forEach((_, w) => {
      const partial = words.slice(0, w + 1).join(" ");
      steps.push({
        delay: (w === 0 && b > 0 ? 260 : 0) + 55 + ((w * 7919 + b) % 4) * 14,
        apply: (s) => ({ ...s, output: [...bullets.slice(0, b), partial] }),
      });
    });
  });
  steps.push({ delay: 220, apply: (s) => ({ ...s, status: "done" }) });
  return steps;
}

function script(): MockStep<State>[] {
  const typing: MockStep<State>[] = Array.from(PROMPT, (_, i) => ({
    delay: 26 + ((i * 31) % 5) * 9,
    apply: (s) => ({ ...s, prompt: PROMPT.slice(0, i + 1) }),
  }));
  // The handle travels in two glides: toward Formal first, then up toward Brief.
  const glide: MockStep<State>[] = [
    { delay: 450, apply: (s) => ({ ...s, tone: { x: -0.3, y: -0.15 } }) },
    { delay: 320, apply: (s) => ({ ...s, tone: { x: -0.5, y: -0.4 } }) },
    { delay: 300, apply: (s) => ({ ...s, tone: TARGET }) },
  ];
  return [
    wait(700),
    ...typing,
    ...glide,
    { delay: 750, apply: (s) => ({ ...s, status: "writing", output: [] }) },
    wait(420),
    ...streamSteps(REWRITES.first),
  ];
}

export default function ToneRewriteDemo({
  autoplay = true,
  thumbnail = false,
}: {
  variant?: string;
  autoplay?: boolean;
  thumbnail?: boolean;
}) {
  const { state, setState } = useMockRun<State>(
    autoplay ? { prompt: "", tone: START, status: "idle", output: [] } : settled,
    autoplay ? script() : [],
    { autoplay },
  );

  // Reruns after the script: Send and the follow-up chips stream a new version.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const stop = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const run = (bullets: string[]) => {
    stop();
    setState((s) => ({ ...s, status: "writing", output: [] }));
    let at = 380;
    for (const step of streamSteps(bullets)) {
      at += step.delay;
      timers.current.push(setTimeout(() => setState(step.apply), at));
    }
  };

  const current = state.output.length;
  return (
    <ToneRewrite
      attachment={
        thumbnail ? undefined : { name: "Q3 board memo", words: 142, origin: "Docs" }
      }
      onRemoveAttachment={() => {}}
      sourceWords={142}
      source={SOURCE}
      prompt={state.prompt}
      onPromptChange={(prompt) => setState((s) => ({ ...s, prompt }))}
      models={MODELS}
      lengths={LENGTHS}
      tone={state.tone}
      onToneChange={(tone) => setState((s) => ({ ...s, tone }))}
      status={state.status}
      output={state.output}
      progress={
        state.status === "idle" ? undefined : { current: Math.max(current, 1), total: 3 }
      }
      onAttach={() => {}}
      onVoice={() => {}}
      onSend={() => run(REWRITES.first)}
      onStop={() => {
        stop();
        setState((s) => ({ ...s, status: "done" }));
      }}
      onReplace={() => {}}
      onInsert={() => {}}
      followUps={thumbnail ? [] : FOLLOW_UPS}
      onFollowUp={(f) => run(REWRITES[f.id] ?? REWRITES.first)}
    />
  );
}
