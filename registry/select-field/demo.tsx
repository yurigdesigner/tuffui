"use client";

import { Brain, Cpu, Lightning, Robot } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import type { DemoLocale } from "@/components/docs/demo";
import {
  Combobox,
  Select,
  type ComboboxLabels,
  type SelectOption,
} from "@/components/ui/select-field";

const copy: Record<
  DemoLocale,
  {
    builtIn: string;
    tool: string;
    toolHint: string;
    searchTools: string;
    noTool: string;
    model: string;
    deep: string;
    fast: string;
    quick: string;
    local: string;
    language: string;
    chooseLanguage: string;
    languageError: string;
    languages: [string, string, string];
    labels?: Partial<ComboboxLabels>;
  }
> = {
  en: {
    builtIn: "Built-in",
    tool: "Tool",
    toolHint: "Searches every connected MCP server.",
    searchTools: "Search tools…",
    noTool: "No tool matches",
    model: "Model",
    deep: "Deep reasoning",
    fast: "Fast and capable",
    quick: "Quick edits",
    local: "Local",
    language: "Reply language",
    chooseLanguage: "Choose a language",
    languageError: "Pick a language before sending.",
    languages: ["English", "German", "Japanese"],
  },
  he: {
    builtIn: "מובנה",
    tool: "כלי",
    toolHint: "חיפוש בכל שרתי ה־MCP המחוברים.",
    searchTools: "חיפוש כלים…",
    noTool: "לא נמצא כלי מתאים",
    model: "מודל",
    deep: "חשיבה מעמיקה",
    fast: "מהיר ומוכשר",
    quick: "עריכות קטנות",
    local: "מקומי",
    language: "שפת התשובה",
    chooseLanguage: "בחירת שפה",
    languageError: "צריך לבחור שפה לפני השליחה.",
    languages: ["אנגלית", "גרמנית", "יפנית"],
    labels: { searching: "מחפש", searchingList: "מחפש…" },
  },
  ar: {
    builtIn: "مدمج",
    tool: "الأداة",
    toolHint: "يبحث في كل خوادم MCP المتصلة.",
    searchTools: "ابحث عن أداة…",
    noTool: "لا توجد أداة مطابقة",
    model: "النموذج",
    deep: "تفكير عميق",
    fast: "سريع وقادر",
    quick: "تعديلات سريعة",
    local: "محلي",
    language: "لغة الرد",
    chooseLanguage: "اختر لغة",
    languageError: "اختر لغة قبل الإرسال.",
    languages: ["الإنجليزية", "الألمانية", "اليابانية"],
    labels: { searching: "جارٍ البحث", searchingList: "جارٍ البحث…" },
  },
};

const toolsFor = (builtIn: string): SelectOption[] => [
  { value: "github", label: "github.create_pull_request", description: "GitHub" },
  { value: "issues", label: "github.list_issues", description: "GitHub" },
  { value: "linear", label: "linear.create_issue", description: "Linear" },
  { value: "search", label: "web.search", description: builtIn },
  { value: "fetch", label: "web.fetch", description: builtIn },
  { value: "query", label: "postgres.query", description: "postgres-analytics" },
  { value: "read", label: "fs.read", description: "filesystem" },
  { value: "write", label: "fs.write", description: "filesystem", disabled: true },
];

export default function SelectFieldDemo({
  variant,
  locale = "en",
}: {
  variant?: string;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const tools = toolsFor(text.builtIn);
  const [model, setModel] = useState("opus");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  // Pretend the tool search runs on a server: results arrive after a short delay.
  const [results, setResults] = useState(tools);

  useEffect(() => {
    if (variant !== "Combobox") return;
    const timer = setTimeout(() => {
      setResults(
        toolsFor(text.builtIn).filter((t) => t.label.includes(query.toLowerCase())),
      );
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, variant, text.builtIn]);

  if (variant === "Combobox") {
    return (
      <div className="flex w-full max-w-xs flex-col gap-4">
        <Combobox
          label={text.tool}
          description={text.toolHint}
          placeholder={text.searchTools}
          options={results}
          loading={loading}
          onQueryChange={(q) => {
            setQuery(q);
            setLoading(true);
          }}
          emptyText={text.noTool}
          labels={text.labels}
        />
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      <Select
        label={text.model}
        value={model}
        onValueChange={setModel}
        options={[
          {
            label: "Anthropic",
            options: [
              {
                value: "opus",
                label: "opus-5.5",
                icon: Brain,
                description: text.deep,
              },
              {
                value: "sonnet",
                label: "sonnet-5.5",
                icon: Cpu,
                description: text.fast,
              },
              {
                value: "haiku",
                label: "haiku-5.5",
                icon: Lightning,
                description: text.quick,
              },
            ],
          },
          {
            label: text.local,
            options: [
              { value: "local", label: "llama-local", icon: Robot, disabled: true },
            ],
          },
        ]}
      />
      <Select
        label={text.language}
        placeholder={text.chooseLanguage}
        error={text.languageError}
        options={[
          { value: "en", label: text.languages[0] },
          { value: "de", label: text.languages[1] },
          { value: "ja", label: text.languages[2] },
        ]}
      />
    </div>
  );
}
