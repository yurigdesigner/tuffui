"use client";

import { useState } from "react";
import { Slider } from "./range-slider";

export default function RangeSliderDemo({ variant }: { variant?: string }) {
  const [length, setLength] = useState<[number, number]>([150, 600]);
  if (variant === "Range") {
    return (
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Slider
          label="Response length"
          value={length}
          defaultValue={length}
          onValueChange={setLength}
          min={0}
          max={1000}
          step={50}
          striped
          format={(v) => `${v} words`}
          marks={[
            { value: 0, label: "0" },
            { value: 500, label: "500" },
            { value: 1000, label: "1k" },
          ]}
        />
        <Slider
          label="Budget per run"
          defaultValue={[0.5, 2] as [number, number]}
          min={0}
          max={5}
          step={0.25}
          format={(v) => `$${v.toFixed(2)}`}
        />
      </div>
    );
  }
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <Slider
        label="Temperature"
        defaultValue={0.7}
        min={0}
        max={2}
        step={0.1}
        format={(v) => v.toFixed(1)}
        marks={[
          { value: 0, label: "Precise" },
          { value: 1, label: "Balanced" },
          { value: 2, label: "Creative" },
        ]}
      />
      <Slider label="Max steps" defaultValue={12} min={1} max={30} />
      <Slider
        label="Top-p"
        defaultValue={0.9}
        min={0}
        max={1}
        step={0.05}
        disabled
        format={(v) => v.toFixed(2)}
      />
    </div>
  );
}
