"use client";

import { useState } from "react";
import type { DemoLocale } from "@/components/docs/demo";
import {
  SearchField,
  TextArea,
  TextField,
  type SearchFieldLabels,
} from "@/components/ui/text-field";

const copy: Record<
  DemoLocale,
  {
    query: string;
    apiKey: string;
    tooShort: string;
    disabled: string;
    searchMemories: string;
    agentName: string;
    agentHint: string;
    instructions: string;
    instructionsHint: string;
    labels?: Partial<SearchFieldLabels>;
  }
> = {
  en: {
    query: "glossary",
    apiKey: "API key",
    tooShort: "That key is too short.",
    disabled: "Disabled",
    searchMemories: "Search memories",
    agentName: "Agent name",
    agentHint: "Shown in traces and approvals.",
    instructions: "Instructions",
    instructionsHint: "Keep product names in English…",
  },
  he: {
    query: "מילון מונחים",
    apiKey: "מפתח API",
    tooShort: "המפתח הזה קצר מדי.",
    disabled: "מושבת",
    searchMemories: "חיפוש בזיכרונות",
    agentName: "שם הסוכן",
    agentHint: "מוצג במעקב ובבקשות אישור.",
    instructions: "הנחיות",
    instructionsHint: "להשאיר שמות מוצרים באנגלית…",
    labels: { clear: "ניקוי החיפוש" },
  },
  ar: {
    query: "مسرد المصطلحات",
    apiKey: "مفتاح API",
    tooShort: "هذا المفتاح قصير جدًا.",
    disabled: "معطّل",
    searchMemories: "ابحث في الذاكرة",
    agentName: "اسم الوكيل",
    agentHint: "يظهر في سجلات التتبّع وطلبات الموافقة.",
    instructions: "التعليمات",
    instructionsHint: "أبقِ أسماء المنتجات بالإنجليزية…",
    labels: { clear: "مسح البحث" },
  },
};

export default function TextFieldDemo({
  variant,
  locale = "en",
}: {
  variant?: string;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const [query, setQuery] = useState(text.query);

  if (variant === "States") {
    return (
      <div className="flex w-full max-w-sm flex-col gap-4">
        <TextField label={text.apiKey} defaultValue="sk-live-12" error={text.tooShort} />
        <TextField label={text.disabled} defaultValue="opus-5.5" disabled />
      </div>
    );
  }
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <SearchField
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={() => setQuery("")}
        placeholder={text.searchMemories}
        labels={text.labels}
      />
      <TextField
        label={text.agentName}
        placeholder="release-notes"
        description={text.agentHint}
      />
      <TextArea label={text.instructions} placeholder={text.instructionsHint} />
    </div>
  );
}
