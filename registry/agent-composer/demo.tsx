"use client";

import { useEffect, useState } from "react";
import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  AgentComposer,
  type AgentComposerLabels,
  type ComposerContextItem,
  type ComposerMode,
  type ComposerQueued,
} from "./agent-composer";

/** Keeps a Latin name or locale code in reading order inside RTL text. */
const ltr = (text: string) => `\u2066${text}\u2069`;

type Copy = {
  models: [string, string, string];
  commands: [string, string, string];
  prompt: string;
  queued: [string, string];
  question: string;
  followUp: string;
  placeholder: string;
  labels?: Partial<AgentComposerLabels>;
};

/** The same session in each demo language; file paths and model names stay Latin. */
const copy: Record<DemoLocale, Copy> = {
  en: {
    models: [
      "Deepest reasoning, long tasks",
      "Fast and capable",
      "Quick edits and lookups",
    ],
    commands: [
      "Review the current diff",
      "Run the tests for changed files",
      "Explain a file or symbol",
    ],
    prompt: "Add German to the onboarding flow",
    queued: [
      "Then update the onboarding screenshots",
      "Run the e2e suite with locale de-DE",
    ],
    question: "Why does the welcome step render twice?",
    followUp: "And how do I fix it?",
    placeholder: "Message the agent…",
  },
  he: {
    models: ["החשיבה הכי עמוקה, משימות ארוכות", "מהיר ומוכשר", "עריכות ובדיקות מהירות"],
    commands: [
      "סקירת השינויים הנוכחיים",
      "הרצת הבדיקות לקבצים שהשתנו",
      "הסבר על קובץ או סמל",
    ],
    prompt: "תוסיף גרמנית לתהליך ההצטרפות",
    queued: [
      "אחר כך תעדכן את צילומי המסך של ההצטרפות",
      `תריץ את בדיקות ה־${ltr("e2e")} עם השפה ${ltr("de-DE")}`,
    ],
    question: "למה שלב הפתיחה מתרנדר פעמיים?",
    followUp: "ואיך מתקנים את זה?",
    placeholder: "הודעה לסוכן…",
    labels: {
      modes: {
        ask: { label: "שאלה", hint: "עונה על שאלות, לא משנה כלום" },
        plan: { label: "תכנון", hint: "מכין תוכנית לאישור שלך" },
        act: { label: "ביצוע", hint: "יכול לערוך קבצים ולהריץ פקודות" },
      },
      mode: "מצב",
      placeholder: "תארו את השינוי, @ להוספת קבצים, / לפקודות",
      followUp: "הוסיפו המשך — הוא ירוץ כשהסוכן יסיים",
      message: "הודעה",
      commands: "פקודות",
      files: "קבצים",
      switchModel: (model) => `מודל: ${model}. החלפת מודל`,
      tokens: (count) => `${ltr(count)} טוקנים`,
      totalTokens: (count) => `+ ${ltr(count)} טוקנים`,
      queued: (count) => `בתור · ${count}`,
      queuedMessages: "הודעות בתור",
      removeQueued: (text) => `הסרת ההודעה מהתור: ${text}`,
      context: "הקשר",
      remove: (name) => `הסרת ${name}`,
      add: "הוספה",
      addContext: "הוספת הקשר",
      agentWorking: "הסוכן עובד",
      working: "עובד · הודעות חדשות ייכנסו לתור",
      shortcuts: "קבצים · / פקודות",
      stop: "עצירה",
      queue: "לתור",
      send: "שליחה",
      workingStatus: (queued) => `הסוכן עובד${queued ? `, ${queued} בתור` : ""}`,
    },
  },
  ar: {
    models: ["أعمق استدلال للمهام الطويلة", "سريع وقادر", "تعديلات وبحث سريع"],
    commands: [
      "مراجعة التغييرات الحالية",
      "تشغيل اختبارات الملفات المعدّلة",
      "شرح ملف أو رمز",
    ],
    prompt: "أضف الألمانية إلى مسار التسجيل",
    queued: [
      "بعدها حدّث لقطات شاشة التسجيل",
      `شغّل اختبارات ${ltr("e2e")} باللغة ${ltr("de-DE")}`,
    ],
    question: "لماذا تُعرض خطوة الترحيب مرتين؟",
    followUp: "وكيف أصلح ذلك؟",
    placeholder: "اكتب رسالة إلى الوكيل…",
    labels: {
      modes: {
        ask: { label: "سؤال", hint: "يجيب عن الأسئلة ولا يغيّر شيئًا" },
        plan: { label: "تخطيط", hint: "يُعدّ خطة لتوافق عليها" },
        act: { label: "تنفيذ", hint: "يستطيع تعديل الملفات وتشغيل الأوامر" },
      },
      mode: "الوضع",
      placeholder: "صِف التغيير، @ لإضافة ملفات، / للأوامر",
      followUp: "أضف متابعة، وستُنفَّذ عندما ينتهي الوكيل",
      message: "الرسالة",
      commands: "الأوامر",
      files: "الملفات",
      switchModel: (model) => `النموذج: ${model}. تبديل النموذج`,
      tokens: (count) => `${ltr(count)} رمز`,
      totalTokens: (count) => `+ ${ltr(count)} رمز`,
      queued: (count) => `في الانتظار · ${count}`,
      queuedMessages: "الرسائل المنتظرة",
      removeQueued: (text) => `إزالة الرسالة المنتظرة: ${text}`,
      context: "السياق",
      remove: (name) => `إزالة ${name}`,
      add: "إضافة",
      addContext: "إضافة سياق",
      agentWorking: "الوكيل يعمل",
      working: "يعمل · الرسائل الجديدة تنتظر دورها",
      shortcuts: "الملفات · / الأوامر",
      stop: "إيقاف",
      queue: "إلى الانتظار",
      send: "إرسال",
      workingStatus: (queued) => `الوكيل يعمل${queued ? `، ${queued} في الانتظار` : ""}`,
    },
  },
};

const modelsFor = (text: Copy) => [
  { id: "opus-5.5", name: "Claude Opus 5.5", description: text.models[0] },
  { id: "sonnet-5.5", name: "Claude Sonnet 5.5", description: text.models[1] },
  { id: "haiku-5.5", name: "Claude Haiku 5.5", description: text.models[2] },
];

const commandsFor = (text: Copy) => [
  { name: "review", description: text.commands[0] },
  { name: "test", description: text.commands[1] },
  { name: "explain", description: text.commands[2] },
];

const files = [
  { id: "i18n", path: "src/i18n.ts", tokens: 1_840 },
  { id: "en", path: "src/i18n/locales/en.json", tokens: 6_210 },
  { id: "steps", path: "src/onboarding/steps.tsx", tokens: 3_420 },
  { id: "welcome", path: "src/onboarding/welcome.tsx", tokens: 2_130 },
  { id: "e2e", path: "e2e/onboarding.spec.ts", tokens: 2_960 },
];

type State = {
  value: string;
  mode: ComposerMode;
  status: "idle" | "streaming";
  context: ComposerContextItem[];
  queue: ComposerQueued[];
};

const type = (text: string, from = ""): MockStep<State>[] =>
  Array.from(text, (_, i) => ({
    delay: 50 + ((i * 7) % 4) * 12,
    apply: (s: State) => ({ ...s, value: from + text.slice(0, i + 1) }),
  }));

const mention = (fileId: string): MockStep<State> => ({
  delay: 700,
  apply: (s) => {
    const f = files.find((x) => x.id === fileId)!;
    return {
      ...s,
      value: s.value.replace(/@\S*$/, ""),
      context: [...s.context, { id: f.id, name: f.path, tokens: f.tokens }],
    };
  },
});

const queue = (text: string): MockStep<State>[] => [
  ...type(text),
  wait(300),
  {
    delay: 0,
    apply: (s) => ({ ...s, value: "", queue: [...s.queue, { id: text, text }] }),
  },
];

const script = (text: Copy): MockStep<State>[] => [
  wait(500),
  ...type("@i18n"),
  mention("i18n"),
  ...type("@steps"),
  mention("steps"),
  ...type(text.prompt),
  wait(500),
  { delay: 0, apply: (s) => ({ ...s, value: "", context: [], status: "streaming" }) },
  wait(900),
  ...queue(text.queued[0]),
  wait(600),
  ...queue(text.queued[1]),
  wait(2600),
  { delay: 0, apply: (s) => ({ ...s, queue: s.queue.slice(1) }) },
  wait(3200),
  { delay: 0, apply: (s) => ({ ...s, queue: s.queue.slice(1) }) },
  wait(3000),
  { delay: 0, apply: (s) => ({ ...s, status: "idle" }) },
];

const minimalScript = (text: Copy): MockStep<State>[] => [
  wait(500),
  ...type(text.question),
  wait(500),
  { delay: 0, apply: (s) => ({ ...s, value: "", status: "streaming" }) },
  wait(1200),
  ...queue(text.followUp),
  wait(2600),
  { delay: 0, apply: (s) => ({ ...s, queue: [] }) },
  wait(2800),
  { delay: 0, apply: (s) => ({ ...s, status: "idle" }) },
];

export default function AgentComposerDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const minimal = variant === "Minimal";
  const { state, setState } = useMockRun<State>(
    {
      value: "",
      mode: "act",
      status: "idle",
      context: minimal
        ? []
        : [{ id: "en", name: "src/i18n/locales/en.json", tokens: 6_210 }],
      queue: [],
    },
    minimal ? minimalScript(text) : script(text),
    { autoplay },
  );
  const [model, setModel] = useState("opus-5.5");
  const [manual, setManual] = useState(false);

  // Runs started by the viewer work for a few seconds, then take the next queued message.
  useEffect(() => {
    if (!manual || state.status !== "streaming") return;
    const timer = setTimeout(
      () =>
        setState((s) =>
          s.queue.length ? { ...s, queue: s.queue.slice(1) } : { ...s, status: "idle" },
        ),
      3000,
    );
    return () => clearTimeout(timer);
  }, [manual, state.status, state.queue.length, setState]);

  return (
    // Room above for the menus; the paused thumbnail has none, so no spacer.
    <div
      className={`flex w-full max-w-xl flex-col justify-end ${autoplay ? "pt-36" : ""}`}
    >
      <AgentComposer
        value={state.value}
        onValueChange={(value) => setState((s) => ({ ...s, value }))}
        mode={state.mode}
        onModeChange={(mode) => setState((s) => ({ ...s, mode }))}
        showModes={!minimal}
        context={state.context}
        onContextChange={(context) => setState((s) => ({ ...s, context }))}
        files={files}
        commands={commandsFor(text)}
        models={minimal ? [] : modelsFor(text)}
        model={model}
        onModelChange={setModel}
        status={state.status}
        queue={state.queue}
        onQueueChange={(queue) => setState((s) => ({ ...s, queue }))}
        onSubmit={() => {
          setState((s) => ({ ...s, status: "streaming" }));
          setManual(true);
        }}
        onStop={() => setState((s) => ({ ...s, status: "idle", queue: [] }))}
        allowAttachments={!minimal}
        placeholder={minimal ? text.placeholder : undefined}
        labels={text.labels}
      />
    </div>
  );
}
