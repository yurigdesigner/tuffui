import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { EvalResults } from "@/components/ui/eval-results";

export function EvalRun({ run }: { run: EvalRun }) {
  return (
    <EvalResults
      data={{
        suite: run.suite,
        label: \`\${run.candidate} vs \${run.baseline}\`,
        // status: "pending" | "running" | "pass" | "fail" | "regressed" | "improved"
        cases: run.cases,
        baselinePassRate: run.baselinePassRate,
        metrics: [
          { id: "acc", label: "Accuracy", baseline: 0.85, candidate: 0.88, better: "higher" },
          { id: "p50", label: "Latency p50", baseline: 1840, candidate: 1320, better: "lower" },
        ],
      }}
      onSelectCase={(c) => console.log(c.id)}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "{ suite: string; label?: string; cases: EvalCase[]; baselinePassRate?: number; metrics?: EvalMetric[] }",
      required: true,
      description:
        "The suite, its cases in run order and, for the delta and the compare view, the baseline pass rate and metrics.",
    },
    {
      name: "view",
      type: '"grid" | "compare"',
      default: '"grid"',
      description:
        "A square per case, or baseline vs candidate bars per metric plus the regressed cases.",
    },
    {
      name: "filter",
      type: '"all" | "failed" | "regressed" | "improved"',
      description:
        "Controlled filter. Non-matching cases dim instead of disappearing, so the grid stays put.",
    },
    {
      name: "onFilterChange",
      type: "(filter) => void",
      description: "Called when a filter pill is picked.",
    },
    {
      name: "selectedId",
      type: "string | null",
      description:
        "Controlled selection. The selected case shows its input, expected and actual output below.",
    },
    {
      name: "onSelectCase",
      type: "(testCase: EvalCase) => void",
      description:
        "Called on click or Enter. Arrow keys, Home and End move between cases.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type EvalCase = {
  id: string;
  name: string;
  status: "pending" | "running" | "pass" | "fail" | "regressed" | "improved";
  score?: number; // 0–1
  input?: string;
  expected?: string;
  actual?: string;
  reason?: string;
};

type EvalMetric = {
  id: string;
  label: string;
  baseline: number;
  candidate: number;
  better: "higher" | "lower";
  format?: (value: number) => string;
};`,
};
