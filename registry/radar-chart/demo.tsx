"use client";

import { RadarChart, type RadarMember } from "./radar-chart";

const skills = [
  "Craft",
  "Systems thinking",
  "Product sense",
  "Collaboration",
  "Communication",
  "Leadership",
];

// Design team review, scored 0–4 against the senior rubric.
const team: RadarMember[] = [
  { id: "jr", label: "JR", name: "Jae Rhee", values: [4, 4, 3, 3, 3, 4] },
  { id: "mk", label: "MK", name: "Mira Kovac", values: [4, 4, 4, 2, 3, 3] },
  { id: "lw", label: "LW", name: "Leo Wright", values: [4, 4, 3, 2, 3, 3] },
  { id: "as", label: "AS", name: "Ana Soto", values: [3, 3, 3, 3, 2, 2] },
];

const average = (members: RadarMember[], axes: number) =>
  Array.from(
    { length: axes },
    (_, i) =>
      Math.round(
        (members.reduce((sum, m) => sum + (m.values[i] ?? 0), 0) / members.length) * 10,
      ) / 10,
  );

const evals = [
  "Reasoning",
  "Coding",
  "Tool use",
  "Long context",
  "Instruction following",
  "Safety",
  "Latency",
];

// Internal eval suite, 0–100. Latency is scored, so faster is higher.
const models: RadarMember[] = [
  { id: "lg", label: "LG", name: "large-2", values: [91, 88, 84, 86, 90, 93, 52] },
  { id: "md", label: "MD", name: "medium-2", values: [82, 80, 79, 78, 86, 90, 74] },
  { id: "sm", label: "SM", name: "small-2", values: [66, 63, 71, 58, 78, 87, 95] },
  { id: "ft", label: "FT", name: "support-ft", values: [74, 61, 92, 70, 93, 91, 88] },
];

export default function RadarChartDemo({
  variant = "Team skills",
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  if (variant === "Model eval") {
    const router = average(models, evals.length);
    return (
      <RadarChart
        title="Model eval"
        subtitle="Support agent · eval suite v14 · 1,200 cases"
        axes={evals}
        max={100}
        series={{ id: "router", label: "Routed mix", values: router }}
        baseline={{ label: "Ship bar", values: [75, 70, 80, 70, 85, 90, 70] }}
        members={models}
        headline={{
          value: `${Math.round(router.reduce((a, b) => a + b, 0) / router.length)}`,
          caption: "bar 77",
        }}
        format={(v) => `${Math.round(v)}`}
      />
    );
  }
  const avg = average(team, skills.length);
  return (
    <RadarChart
      title="Team skills"
      subtitle="Design · Q3 review · 4 people"
      axes={skills}
      max={4}
      series={{ id: "avg", label: "Team average", values: avg }}
      baseline={{ label: "Senior bar", values: [3.5, 3, 3, 3, 3, 3] }}
      members={team}
      headline={{
        value: (avg.reduce((a, b) => a + b, 0) / avg.length).toFixed(1),
        caption: "bar 3.1",
      }}
    />
  );
}
