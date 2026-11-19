"use client";

import { ArrowUp, Image as ImageIcon, Plus } from "@phosphor-icons/react";
import { IconButton } from "@/components/ui/action-button";
import { Panel, Shell } from "@/components/ui/surface";
import type { DemoLocale } from "@/components/docs/demo";
import { cn } from "@/lib/utils";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { ModelPicker, type ModelPickerLabels, type PickerModel } from "./model-picker";

const MODELS: PickerModel[] = [
  {
    id: "halo-3",
    name: "Halo 3",
    provider: "Northwind",
    speed: 64,
    price: { input: 5, output: 25 },
    context: 400_000,
    capabilities: ["vision", "tools", "reasoning"],
  },
  {
    id: "halo-3-mini",
    name: "Halo 3 Mini",
    provider: "Northwind",
    speed: 210,
    price: { input: 0.4, output: 1.6 },
    context: 200_000,
    capabilities: ["vision", "tools"],
  },
  {
    id: "vela",
    name: "Vela",
    provider: "Meridian",
    speed: 140,
    price: { input: 1.25, output: 5 },
    context: 256_000,
    capabilities: ["vision", "tools"],
  },
  {
    id: "vela-code",
    name: "Vela Code",
    provider: "Meridian",
    speed: 118,
    price: { input: 1.5, output: 6 },
    context: 256_000,
    capabilities: ["tools", "reasoning"],
  },
  {
    id: "flint-2",
    name: "Flint 2",
    provider: "Quarry",
    speed: 92,
    price: { input: 2, output: 8 },
    context: 1_000_000,
    capabilities: ["tools", "reasoning"],
  },
  {
    id: "flint-2-lite",
    name: "Flint 2 Lite",
    provider: "Quarry",
    speed: 340,
    price: { input: 0.1, output: 0.4 },
    context: 128_000,
    capabilities: ["tools"],
  },
  {
    id: "hollow-70b",
    name: "Hollow 70B",
    provider: "Hollow Labs",
    speed: 185,
    price: { input: 0.6, output: 0.6 },
    context: 64_000,
    capabilities: ["tools"],
  },
];

/** Keeps a Latin name, price or size in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

/** Model names stay as they are; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  {
    prompt: string;
    requires: string;
    recommended: string;
    attach: string;
    send: string;
    labels?: Partial<ModelPickerLabels>;
  }
> = {
  en: {
    prompt:
      "Review the checkout flow in these screenshots and file an issue for anything broken.",
    requires: "can't read the 3 screenshots in this chat",
    recommended: "reads screenshots, ¼ the cost of Halo 3",
    attach: "Attach",
    send: "Send",
  },
  he: {
    prompt: "תעבור על תהליך התשלום בצילומי המסך האלה ותפתח באג על כל דבר שלא עובד.",
    requires: "לא יכול לקרוא את 3 צילומי המסך בשיחה הזו",
    recommended: "קורא צילומי מסך, ברבע מהעלות של Halo 3",
    attach: "צירוף קובץ",
    send: "שליחה",
    labels: {
      capabilities: { vision: "ראייה", tools: "כלים", reasoning: "חשיבה" },
      lacks: (capability) => `בלי ${capability}`,
      choose: "בחירת מודל",
      trigger: (model) => `מודל: ${model ?? "לא נבחר"}. החלפת מודל`,
      search: "חיפוש מודלים",
      searchPlaceholder: "חיפוש לפי מודל או יכולת",
      models: "מודלים",
      count: (count) => (count === 1 ? "מודל אחד" : `${count} מודלים`),
      recommended: "מומלץ למשימה הזו",
      noMatch: (query) => `אין מודלים שתואמים ל־${query}.`,
      columns: { speed: "מהירות", price: "מחיר", context: "הקשר" },
      columnsShort: { speed: "מהירות", price: "מחיר", context: "הקשר" },
      thisChat: "השיחה הזו",
      usage: (input, output) => `קלט ${input} · פלט ${output}`,
      summary: (m) =>
        `${ltr(m.name)} · ${m.speed} טוקנים לשנייה · ${ltr(m.input)} / ${ltr(m.output)} למיליון · הקשר ${ltr(m.context)}`,
      pick: "בחרו מודל להשוואה.",
      wouldCost: (next, current) => `השיחה הזו תעלה ${next} במקום ${current}.`,
      option: (m) =>
        [
          m.name,
          m.provider,
          m.reason ? `מומלץ: ${m.reason}` : "",
          `${m.speed} טוקנים לשנייה`,
          `$${m.input} לקלט, $${m.output} לפלט למיליון טוקנים`,
          `הקשר ${m.context}`,
          m.capabilities.join(", "),
          m.missing.length ? `חסר: ${m.missing.join(", ")}` : "",
        ]
          .filter(Boolean)
          .join(", "),
    },
  },
  ar: {
    prompt: "راجِع مسار الدفع في لقطات الشاشة هذه وافتح بلاغًا عن أي شيء لا يعمل.",
    requires: "لا يستطيع قراءة لقطات الشاشة الثلاث في هذه المحادثة",
    recommended: "يقرأ لقطات الشاشة بربع تكلفة Halo 3",
    attach: "إرفاق ملف",
    send: "إرسال",
    labels: {
      capabilities: { vision: "الرؤية", tools: "الأدوات", reasoning: "الاستدلال" },
      lacks: (capability) => `لا يدعم ${capability}`,
      choose: "اختر نموذجًا",
      trigger: (model) => `النموذج: ${model ?? "لا شيء"}. تغيير النموذج`,
      search: "ابحث في النماذج",
      searchPlaceholder: "ابحث عن نموذج أو قدرة",
      models: "النماذج",
      count: (count) =>
        count === 1
          ? "نموذج واحد"
          : count === 2
            ? "نموذجان"
            : count <= 10
              ? `${count} نماذج`
              : `${count} نموذجًا`,
      recommended: "موصى به لهذه المهمة",
      noMatch: (query) => `لا توجد نماذج تطابق «${query}».`,
      columns: { speed: "السرعة", price: "السعر", context: "السياق" },
      columnsShort: { speed: "السرعة", price: "السعر", context: "السياق" },
      thisChat: "هذه المحادثة",
      usage: (input, output) => `الإدخال ${input} · الإخراج ${output}`,
      summary: (m) =>
        `${ltr(m.name)} · ${m.speed} رمزًا في الثانية · ${ltr(m.input)} / ${ltr(m.output)} لكل مليون · السياق ${ltr(m.context)}`,
      pick: "اختر نموذجًا للمقارنة.",
      wouldCost: (next, current) => `ستكلّف هذه المحادثة ${next} بدلًا من ${current}.`,
      option: (m) =>
        [
          m.name,
          m.provider,
          m.reason ? `موصى به: ${m.reason}` : "",
          `${m.speed} رمزًا في الثانية`,
          `$${m.input} للإدخال و$${m.output} للإخراج لكل مليون رمز`,
          `السياق ${m.context}`,
          m.capabilities.join("، "),
          m.missing.length ? `ينقصه: ${m.missing.join("، ")}` : "",
        ]
          .filter(Boolean)
          .join("، "),
    },
  },
};

type State = { open: boolean; highlighted: string | null; value: string };

const to = (highlighted: string, delay: number): MockStep<State> => ({
  delay,
  apply: (s) => ({ ...s, highlighted }),
});

function script(): MockStep<State>[] {
  return [
    wait(700),
    { delay: 0, apply: (s) => ({ ...s, open: true, highlighted: "halo-3" }) },
    to("vela", 1000),
    to("halo-3", 1300),
    to("halo-3-mini", 800),
    to("vela", 800),
    to("vela-code", 800),
    to("flint-2", 900),
    to("vela-code", 1200),
    to("vela", 600),
    { delay: 1300, apply: (s) => ({ ...s, value: "vela", open: false }) },
  ];
}

export default function ModelPickerDemo({
  autoplay = true,
  thumbnail = false,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  thumbnail?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const { state, setState } = useMockRun<State>(
    autoplay
      ? { open: false, highlighted: null, value: "halo-3" }
      : { open: true, highlighted: "vela", value: "halo-3" },
    autoplay ? script() : [],
    { autoplay },
  );

  return (
    // Room above the composer for the panel, which opens upward.
    <div
      className={cn(
        "flex w-full max-w-xl flex-col justify-end",
        thumbnail ? "pt-[21rem]" : "pt-[19.5rem]",
      )}
    >
      <Shell>
        <Panel className="px-3.5 pt-3 pb-2.5">
          {!thumbnail && (
            <div className="mb-2.5 flex gap-1.5">
              {["checkout-1.png", "checkout-2.png", "checkout-3.png"].map((name) => (
                <span
                  key={name}
                  className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-foreground/[0.05] ps-2 pe-2.5 text-xs text-muted-foreground"
                >
                  <ImageIcon weight="fill" aria-hidden="true" className="size-3.5" />
                  {name}
                </span>
              ))}
            </div>
          )}
          <p className="text-sm">{text.prompt}</p>
          <div className="mt-3 flex items-center gap-1.5">
            <IconButton
              icon={Plus}
              iconWeight="bold"
              label={text.attach}
              className="-ms-1.5"
            />
            <ModelPicker
              models={MODELS}
              value={state.value}
              onValueChange={(value) => setState((s) => ({ ...s, value }))}
              open={state.open}
              onOpenChange={(open) => setState((s) => ({ ...s, open }))}
              highlighted={state.highlighted}
              onHighlightChange={(highlighted) =>
                setState((s) => ({ ...s, highlighted }))
              }
              recommended={{ id: "vela", reason: text.recommended }}
              requires={[{ capability: "vision", reason: text.requires }]}
              labels={text.labels}
              usage={{ input: 182_400, output: 9_350 }}
            />
            <IconButton
              icon={ArrowUp}
              iconWeight="bold"
              variant="primary"
              label={text.send}
              className="ms-auto"
            />
          </div>
        </Panel>
      </Shell>
    </div>
  );
}
