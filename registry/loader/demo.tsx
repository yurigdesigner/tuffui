"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { Spinner, Thinking } from "./loader";

const copy: Record<
  DemoLocale,
  {
    loading: string;
    thinking: string;
    history: string;
    uploading: string;
    words: string[];
    agentWords: string[];
  }
> = {
  en: {
    loading: "Loading",
    thinking: "Thinking",
    history: "Loading history",
    uploading: "Uploading 3 files",
    words: ["Thinking", "Searching the docs", "Writing"],
    agentWords: ["Reading 12 files", "Running tests", "Summarizing"],
  },
  he: {
    loading: "טוען",
    thinking: "חושב",
    history: "טוען היסטוריה",
    uploading: "מעלה 3 קבצים",
    words: ["חושב", "מחפש בתיעוד", "כותב"],
    agentWords: ["קורא 12 קבצים", "מריץ בדיקות", "מסכם"],
  },
  ar: {
    loading: "جارٍ التحميل",
    thinking: "يفكّر",
    history: "جارٍ تحميل السجل",
    uploading: "جارٍ رفع 3 ملفات",
    words: ["يفكّر", "يبحث في التوثيق", "يكتب"],
    agentWords: ["يقرأ 12 ملفًا", "يشغّل الاختبارات", "يلخّص"],
  },
};

export default function LoaderDemo({
  variant,
  locale = "en",
}: {
  variant?: string;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  if (variant === "Thinking") {
    return (
      <div className="flex flex-col items-start gap-5">
        <Thinking size="sm" label={text.thinking} />
        <Thinking label={text.thinking} />
        <Thinking size="lg" words={text.words} />
        <Thinking words={text.agentWords} />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start gap-5">
      <div className="flex items-center gap-6">
        <Spinner size="sm" label={text.loading} />
        <Spinner label={text.loading} />
        <Spinner size="lg" label={text.loading} />
      </div>
      <Spinner showLabel label={text.history} />
      <Spinner size="sm" showLabel label={text.uploading} />
    </div>
  );
}
