"use client";

import { Segmented } from "@/components/ui/segmented-control";

const modes = [
  { value: "ask", label: "Ask" },
  { value: "plan", label: "Plan" },
  { value: "act", label: "Act" },
];

export default function SegmentedControlDemo({ variant }: { variant?: string }) {
  if (variant === "Sizes") {
    return (
      <div className="flex flex-col items-center gap-3">
        <Segmented
          label="Period"
          options={[
            { value: "week", label: "Week" },
            { value: "month", label: "Month" },
          ]}
        />
        <Segmented
          label="Metric"
          size="md"
          options={[
            { value: "time", label: "Time" },
            { value: "tokens", label: "Tokens" },
            { value: "cost", label: "Cost" },
            { value: "calls", label: "Calls", disabled: true },
          ]}
        />
      </div>
    );
  }
  return <Segmented label="Mode" options={modes} defaultValue="plan" />;
}
