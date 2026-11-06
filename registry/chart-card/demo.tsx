"use client";

import { useMockRun, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { ChartCard, type ChartSeries, type ChartType } from "./chart-card";

type Dataset = {
  title: string;
  subtitle: string;
  labels: string[];
  series: ChartSeries[];
  format?: (n: number) => string;
  total: (series: ChartSeries[]) => string;
  partialLast?: boolean;
};

const weeks = [
  "Sep 8",
  "Sep 15",
  "Sep 22",
  "Sep 29",
  "Oct 6",
  "Oct 13",
  "Oct 20",
  "Oct 27",
];
const hours = ["09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"];
const sum = (values: number[]) => values.reduce((n, v) => n + v, 0);
const money = (n: number) => `$${n >= 1000 ? `${+(n / 1000).toFixed(1)}k` : n}`;

const datasets: Record<ChartType, Dataset> = {
  bar: {
    title: "Weekly signups",
    subtitle: "Self-serve vs. sales-led · last 8 weeks",
    labels: weeks,
    series: [
      {
        id: "self",
        label: "Self-serve",
        values: [412, 468, 431, 520, 588, 610, 654, 402],
      },
      { id: "sales", label: "Sales-led", values: [96, 104, 88, 131, 120, 142, 150, 71] },
    ],
    total: (s) => Math.round(sum(s.flatMap((x) => x.values))).toLocaleString("en-US"),
    partialLast: true,
  },
  line: {
    title: "Response latency",
    subtitle: "opus-5.5 · today · latest p95",
    labels: hours,
    series: [
      {
        id: "p50",
        label: "p50",
        values: [1.2, 1.1, 1.3, 1.4, 1.2, 1.5, 1.6, 1.4, 1.3, 1.2, 1.1, 1.0],
      },
      {
        id: "p95",
        label: "p95",
        values: [3.1, 2.9, 3.4, 4.2, 3.6, 4.8, 5.1, 4.4, 3.8, 3.3, 3.0, 2.8],
      },
    ],
    format: (n) => `${+n.toFixed(1)}s`,
    total: (s) => `${s[1].values.at(-1)}s`,
  },
  area: {
    title: "Tokens per day",
    subtitle: "Input and output · October",
    labels: ["Oct 1", "Oct 5", "Oct 9", "Oct 13", "Oct 17", "Oct 21", "Oct 25", "Oct 29"],
    series: [
      {
        id: "in",
        label: "Input",
        values: [8.2, 9.1, 8.8, 11.4, 12.9, 12.1, 14.6, 15.2].map((v) => v * 1e6),
      },
      {
        id: "out",
        label: "Output",
        values: [1.9, 2.2, 2.1, 2.6, 3.1, 2.9, 3.4, 3.8].map((v) => v * 1e6),
      },
    ],
    total: (s) => `${(sum(s.flatMap((x) => x.values)) / 1e6).toFixed(1)}M`,
  },
  donut: {
    title: "Revenue by plan",
    subtitle: "October MRR",
    labels: ["Oct"],
    series: [
      { id: "team", label: "Team", values: [48_200] },
      { id: "pro", label: "Pro", values: [31_400] },
      { id: "ent", label: "Enterprise", values: [62_900] },
      { id: "hobby", label: "Hobby", values: [6_100] },
    ],
    format: money,
    total: (s) => money(sum(s.flatMap((x) => x.values))),
  },
};

// The data refreshes once so the chart shows how it animates between values.
const refresh = (type: ChartType): MockStep<ChartSeries[]>[] => [
  {
    delay: 2600,
    apply: (series) =>
      series.map((s, i) => ({
        ...s,
        values: s.values.map((v, j) =>
          type === "bar" && j === s.values.length - 1
            ? Math.round(v * 1.35)
            : i === 0
              ? v * 1.04
              : v,
        ),
      })),
  },
];

export default function ChartCardDemo({
  variant = "Bar",
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const type = variant.toLowerCase() as ChartType;
  const set = datasets[type] ?? datasets.bar;
  const { state } = useMockRun<ChartSeries[]>(set.series, refresh(type), { autoplay });

  return (
    <ChartCard
      type={type}
      title={set.title}
      subtitle={set.subtitle}
      total={set.total(state)}
      format={set.format}
      partialLast={set.partialLast}
      data={{ labels: set.labels, series: state }}
    />
  );
}
