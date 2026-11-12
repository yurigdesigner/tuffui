"use client";

import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  ClausePlaybook,
  marketPercentile,
  type ClauseBucket,
  type ClauseSetting,
  type ClauseThresholds,
  type ClauseValue,
} from "./clause-playbook";

/**
 * Signed MSAs by liability cap in months of fees, in half-month steps:
 * clusters at 6, 12, 18 and 24, with round numbers drawing the most deals.
 */
const SHAPE = [
  6, 8, 14, 26, 34, 40, 72, 58, 52, 50, 56, 66, 120, 88, 74, 64, 58, 54, 84, 44, 34, 26,
  20, 16, 48,
];
// Seeded so the server and the client draw the same columns.
let seed = 11;
const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 0.3 + 0.85;
const HALVES = SHAPE.flatMap((n, i) =>
  i < SHAPE.length - 1 ? [n, ((n + SHAPE[i + 1]) / 2) * 0.62 * noise()] : [n],
);
const RAW = HALVES.reduce((a, b) => a + b, 0);
const COUNTS = HALVES.map((n) => Math.round((n / RAW) * 2140));
COUNTS[24] += 2140 - COUNTS.reduce((a, b) => a + b, 0);
const MARKET: ClauseBucket[] = COUNTS.map((count, i) => ({ value: i / 2, count }));
const SIGNED = COUNTS.reduce((a, b) => a + b, 0).toLocaleString("en-US");

const BASELINE: ClauseThresholds = { fallback: 6, preferred: 12 };
const PROPOSED: ClauseThresholds = { fallback: 6, preferred: 15 };

function settings(t: ClauseThresholds): ClauseSetting[] {
  return [
    {
      kind: "stepper",
      id: "superCap",
      label: "Data-breach super-cap",
      description: "Multiple of the general cap",
      defaultValue: 2,
      min: 1,
      max: 5,
      format: (v) => `${v}×`,
    },
    {
      kind: "select",
      id: "escalate",
      label: "Escalate to",
      description: "Who the agent pings before it concedes",
      defaultValue: "finance",
      options: [
        { value: "legal", label: "Legal", hint: "always" },
        { value: "finance", label: "Finance", hint: `below ${t.preferred} mo` },
        { value: "security", label: "Security", hint: "data breach" },
        { value: "gc", label: "General counsel", hint: "walk-away" },
      ],
    },
    {
      kind: "toggle",
      id: "autoAccept",
      label: "Auto-accept within fallback",
      description: (t) => `Agent signs off ${t.fallback}–${t.preferred} mo on its own`,
      defaultValue: true,
    },
    {
      kind: "toggle",
      id: "marketWording",
      label: "Suggest market wording",
      description: `From ${SIGNED} signed MSAs`,
      defaultValue: true,
    },
    {
      kind: "toggle",
      id: "block",
      label: "Block below walk-away",
      description: "Needs General counsel to unblock",
      defaultValue: false,
    },
  ];
}

const suggestion = (t: ClauseThresholds) =>
  `Agent suggests ${t.preferred} mo preferred · p${marketPercentile(MARKET, t.preferred)} of market. Counterparties above 12 mo rarely push back.`;

type State = {
  thresholds: ClauseThresholds;
  values: Record<string, ClauseValue>;
  note: string;
};

const START: State = {
  thresholds: BASELINE,
  values: {},
  note: `Comparing your playbook with ${SIGNED} signed MSAs…`,
};
const PROPOSAL: State = {
  thresholds: PROPOSED,
  values: { escalate: "legal" },
  note: suggestion(PROPOSED),
};

export default function ClausePlaybookDemo({
  autoplay = true,
  thumbnail = false,
}: {
  variant?: string;
  autoplay?: boolean;
  thumbnail?: boolean;
}) {
  // The agent reads the market, moves the preferred handle, then routes escalations to Legal.
  const steps: MockStep<State>[] = autoplay
    ? [
        wait(1400),
        {
          delay: 0,
          apply: (s) => ({ ...s, thresholds: PROPOSED, note: suggestion(PROPOSED) }),
        },
        {
          delay: 900,
          apply: (s) => ({ ...s, values: { ...s.values, escalate: "legal" } }),
        },
      ]
    : [];
  const { state, setState } = useMockRun<State>(autoplay ? START : PROPOSAL, steps, {
    autoplay,
  });
  const all = settings(state.thresholds);

  return (
    <ClausePlaybook
      number="9.2"
      clause="Liability cap"
      subtitle="Negotiation playbook · Corvane MSA"
      distribution={MARKET}
      domain={[0, 24]}
      unit="mo"
      defaultThresholds={BASELINE}
      thresholds={state.thresholds}
      onThresholdsChange={(thresholds) => setState((s) => ({ ...s, thresholds }))}
      settings={thumbnail ? all.slice(0, 3) : all}
      values={state.values}
      onValuesChange={(values) => setState((s) => ({ ...s, values }))}
      note={state.note}
      sampleNoun="MSAs"
      onApply={(t) =>
        setState((s) => ({
          ...s,
          note: `Applied. The agent now opens at ${t.preferred} mo.`,
        }))
      }
      onDiscard={() =>
        setState((s) => ({ ...s, note: "Discarded. Back to your playbook." }))
      }
    />
  );
}
