"use client";

import { useState } from "react";
import type { DemoLocale } from "@/components/docs/demo";
import { Slider, type SliderLabels } from "./range-slider";

/** Keeps a Latin amount in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

const copy: Record<
  DemoLocale,
  {
    length: string;
    words: (v: number) => string;
    budget: string;
    money: (v: string) => string;
    temperature: string;
    precise: string;
    balanced: string;
    creative: string;
    steps: string;
    labels?: Partial<SliderLabels>;
  }
> = {
  en: {
    length: "Response length",
    words: (v) => `${v} words`,
    budget: "Budget per run",
    money: (v) => v,
    temperature: "Temperature",
    precise: "Precise",
    balanced: "Balanced",
    creative: "Creative",
    steps: "Max steps",
  },
  he: {
    length: "אורך התשובה",
    words: (v) => `${v} מילים`,
    budget: "תקציב להרצה",
    money: ltr,
    temperature: "טמפרטורה",
    precise: "מדויק",
    balanced: "מאוזן",
    creative: "יצירתי",
    steps: "מספר צעדים מרבי",
    labels: { minimum: "מינימום", maximum: "מקסימום" },
  },
  ar: {
    length: "طول الإجابة",
    // Every step is a multiple of 50, so the singular counted form fits throughout.
    words: (v) => `${v} كلمة`,
    budget: "الميزانية لكل تشغيل",
    money: ltr,
    temperature: "درجة الحرارة",
    precise: "دقيق",
    balanced: "متوازن",
    creative: "إبداعي",
    steps: "الحد الأقصى للخطوات",
    labels: { minimum: "الحد الأدنى", maximum: "الحد الأقصى" },
  },
};

export default function RangeSliderDemo({
  variant,
  locale = "en",
}: {
  variant?: string;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const [length, setLength] = useState<[number, number]>([150, 600]);
  if (variant === "Range") {
    return (
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Slider
          label={text.length}
          value={length}
          defaultValue={length}
          onValueChange={setLength}
          min={0}
          max={1000}
          step={50}
          striped
          format={text.words}
          labels={text.labels}
          marks={[
            { value: 0, label: "0" },
            { value: 500, label: "500" },
            { value: 1000, label: "1k" },
          ]}
        />
        <Slider
          label={text.budget}
          defaultValue={[0.5, 2] as [number, number]}
          min={0}
          max={5}
          step={0.25}
          format={(v) => text.money(`$${v.toFixed(2)}`)}
          labels={text.labels}
        />
      </div>
    );
  }
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <Slider
        label={text.temperature}
        defaultValue={0.7}
        min={0}
        max={2}
        step={0.1}
        format={(v) => v.toFixed(1)}
        marks={[
          { value: 0, label: text.precise },
          { value: 1, label: text.balanced },
          { value: 2, label: text.creative },
        ]}
      />
      <Slider label={text.steps} defaultValue={12} min={1} max={30} />
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
