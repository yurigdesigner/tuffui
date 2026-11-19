"use client";

import { useState } from "react";
import type { DemoLocale } from "@/components/docs/demo";
import { Checkbox, Radio, RadioGroup, Switch } from "@/components/ui/choice-controls";
import { Panel, Shell } from "@/components/ui/surface";

const copy: Record<
  DemoLocale,
  {
    web: string;
    webHint: string;
    remember: string;
    effort: string;
    low: string;
    lowHint: string;
    medium: string;
    high: string;
    highHint: string;
    off: string;
    on: string;
    disabled: string;
    unchecked: string;
    checked: string;
    mixed: string;
    size: string;
    small: string;
    large: string;
  }
> = {
  en: {
    web: "Web search",
    webHint: "Let the agent browse while it answers",
    remember: "Remember this choice",
    effort: "Reasoning effort",
    low: "Low",
    lowHint: "Fastest answers",
    medium: "Medium",
    high: "High",
    highHint: "Thinks longer on hard tasks",
    off: "Off",
    on: "On",
    disabled: "Disabled",
    unchecked: "Unchecked",
    checked: "Checked",
    mixed: "Mixed",
    size: "Size",
    small: "Small",
    large: "Large",
  },
  he: {
    web: "חיפוש באינטרנט",
    webHint: "הסוכן יכול לגלוש תוך כדי מענה",
    remember: "לזכור את הבחירה",
    effort: "רמת חשיבה",
    low: "נמוכה",
    lowHint: "התשובות הכי מהירות",
    medium: "בינונית",
    high: "גבוהה",
    highHint: "חושב יותר זמן על משימות קשות",
    off: "כבוי",
    on: "פועל",
    disabled: "מושבת",
    unchecked: "לא מסומן",
    checked: "מסומן",
    mixed: "מסומן חלקית",
    size: "גודל",
    small: "קטן",
    large: "גדול",
  },
  ar: {
    web: "البحث على الويب",
    webHint: "يتصفّح الوكيل الويب أثناء الإجابة",
    remember: "تذكّر هذا الاختيار",
    effort: "مستوى التفكير",
    low: "منخفض",
    lowHint: "أسرع الإجابات",
    medium: "متوسط",
    high: "مرتفع",
    highHint: "يفكّر وقتًا أطول في المهام الصعبة",
    off: "متوقف",
    on: "يعمل",
    disabled: "معطّل",
    unchecked: "غير محدد",
    checked: "محدد",
    mixed: "محدد جزئيًا",
    size: "الحجم",
    small: "صغير",
    large: "كبير",
  },
};

export default function ChoiceControlsDemo({
  variant,
  locale = "en",
}: {
  variant?: string;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const [web, setWeb] = useState(true);

  if (variant === "With labels") {
    return (
      <Shell className="max-w-sm">
        <Panel className="flex flex-col gap-4 p-4">
          <Switch
            label={text.web}
            description={text.webHint}
            checked={web}
            onCheckedChange={setWeb}
          />
          <Checkbox label={text.remember} defaultChecked />
          <RadioGroup label={text.effort} defaultValue="medium">
            <Radio value="low" label={text.low} description={text.lowHint} />
            <Radio value="medium" label={text.medium} />
            <Radio value="high" label={text.high} description={text.highHint} />
          </RadioGroup>
        </Panel>
      </Shell>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-4">
        <Switch aria-label={text.off} />
        <Switch aria-label={text.on} defaultChecked />
        <Switch aria-label={text.disabled} disabled defaultChecked />
      </div>
      <div className="flex items-center gap-4">
        <Checkbox aria-label={text.unchecked} />
        <Checkbox aria-label={text.checked} defaultChecked />
        <Checkbox aria-label={text.mixed} defaultChecked="mixed" />
        <Checkbox aria-label={text.disabled} disabled />
      </div>
      <RadioGroup label={text.size} defaultValue="m" className="flex-row gap-4">
        <Radio value="s" aria-label={text.small} />
        <Radio value="m" aria-label={text.medium} />
        <Radio value="l" aria-label={text.large} />
      </RadioGroup>
    </div>
  );
}
