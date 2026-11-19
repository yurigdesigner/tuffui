"use client";

import { useEffect, useRef } from "react";
import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  ToneRewrite,
  type ToneRewriteFollowUp,
  type ToneRewriteLabels,
  type ToneRewriteStatus,
  type ToneValue,
} from "./tone-rewrite";

type RewriteId = "first" | "shorter" | "numbers" | "formal";

type Copy = {
  source: string;
  prompt: string;
  memo: string;
  hints: [string, string, string];
  lengths: [string, string, string];
  followUps: [string, string, string];
  rewrites: Record<RewriteId, string[]>;
  locale?: string;
  labels?: Partial<ToneRewriteLabels>;
};

/** Arabic count of words: 1, 2, 3–10, 11+. */
const arWords = (n: number) =>
  n === 1
    ? "كلمة واحدة"
    : n === 2
      ? "كلمتان"
      : n % 100 >= 3 && n % 100 <= 10
        ? `${n} كلمات`
        : `${n} كلمة`;

/** The same Q3 rewrite in each language; model names and "Docs" stay as they are. */
const copy: Record<DemoLocale, Copy> = {
  en: {
    source:
      "Churn rose 4% in Q3, mostly in self-serve. Expansion revenue from 18 accounts offset it, net retention held at 112%.",
    prompt: "Turn this into 3 bullets for the investor update",
    memo: "Q3 board memo",
    hints: ["fastest", "best writing", "cheapest"],
    lengths: ["Concise", "Balanced", "Thorough"],
    followUps: ["Shorter", "Add numbers", "More formal"],
    rewrites: {
      first: [
        "Net retention held at 112% despite churn rising 4% in Q3, mostly in self-serve.",
        "Expansion revenue from 18 accounts more than covered the self-serve losses.",
        "Next: fix onboarding for self-serve, where most churn starts, and keep expanding accounts that convert.",
      ],
      shorter: [
        "Net retention held at 112% despite churn up 4%.",
        "Expansion from 18 accounts covered self-serve losses.",
        "Next: fix self-serve onboarding.",
      ],
      numbers: [
        "Net retention: 112%, with gross churn up 4 points in Q3.",
        "Expansion: 18 accounts offset the self-serve churn in full.",
        "Next: cut self-serve churn from 4% to 2% by fixing onboarding in Q4.",
      ],
      formal: [
        "Net revenue retention remained at 112% notwithstanding a 4% increase in churn.",
        "Expansion revenue across 18 accounts fully offset attrition in self-serve.",
        "We will prioritize self-serve onboarding improvements in the coming quarter.",
      ],
    },
  },
  he: {
    source:
      "הנטישה עלתה ב־4% ברבעון השלישי, בעיקר בשירות העצמי. הכנסות ההרחבה מ־18 לקוחות קיזזו אותה, ושימור ההכנסות נטו נשאר על 112%.",
    prompt: "תהפוך את זה ל־3 נקודות לעדכון המשקיעים",
    memo: "מזכר דירקטוריון, רבעון שלישי",
    hints: ["הכי מהיר", "הכתיבה הטובה ביותר", "הכי זול"],
    lengths: ["תמציתי", "מאוזן", "מעמיק"],
    followUps: ["קצר יותר", "להוסיף מספרים", "רשמי יותר"],
    rewrites: {
      first: [
        "שימור ההכנסות נטו נשאר על 112%, למרות עלייה של 4% בנטישה ברבעון השלישי, בעיקר בשירות העצמי.",
        "הכנסות ההרחבה מ־18 לקוחות כיסו יותר מאת ההפסדים בשירות העצמי.",
        "הצעד הבא: לתקן את תהליך ההצטרפות בשירות העצמי, שם מתחילה רוב הנטישה, ולהמשיך להרחיב לקוחות שממירים.",
      ],
      shorter: [
        "שימור נטו נשאר על 112% למרות עלייה של 4% בנטישה.",
        "הרחבה מ־18 לקוחות כיסתה את ההפסדים בשירות העצמי.",
        "הצעד הבא: לתקן את ההצטרפות בשירות העצמי.",
      ],
      numbers: [
        "שימור הכנסות נטו: 112%, עם עלייה של 4 נקודות בנטישה ברבעון השלישי.",
        "הרחבה: 18 לקוחות קיזזו במלואה את הנטישה בשירות העצמי.",
        "הצעד הבא: להוריד את הנטישה בשירות העצמי מ־4% ל־2% בעזרת תיקון ההצטרפות ברבעון הרביעי.",
      ],
      formal: [
        "שיעור שימור ההכנסות נטו נותר ברמה של 112%, חרף עלייה של 4% בשיעור הנטישה.",
        "הכנסות ההרחבה מ־18 לקוחות קיזזו במלואה את השחיקה במסלול השירות העצמי.",
        "ברבעון הקרוב נעניק עדיפות לשיפור תהליך ההצטרפות במסלול השירות העצמי.",
      ],
    },
    locale: "he-IL",
    labels: {
      formal: "רשמי",
      casual: "קליל",
      brief: "תמציתי",
      detailed: "מפורט",
      register: (x) =>
        x <= -0.6
          ? "רשמי"
          : x <= -0.2
            ? "די רשמי"
            : x < 0.2
              ? "ניטרלי"
              : x < 0.6
                ? "די קליל"
                : "קליל",
      tone: "טון",
      aboutWords: (n) => `כ־${n} מילים`,
      estimate: (count) => <>≈ {count} מילים</>,
      words: (n) => `${n} מילים`,
      remove: (name) => `הסרת ${name}`,
      from: (origin) => `מתוך ${origin}`,
      instructions: "הנחיות לשכתוב",
      placeholder: "כתבו למודל איך לשכתב את הטקסט",
      addContext: "הוספת הקשר",
      model: "מודל",
      length: "אורך",
      dictate: "הכתבה",
      rewrite: "שכתוב",
      stop: "עצירה",
      stopWriting: "עצירת הכתיבה",
      writing: "כותב",
      done: "הושלם",
      ready: "מוכן",
      progress: (current, total) => (
        <>
          {current} מתוך {total}
        </>
      ),
      replace: "החלפת הבחירה",
      insert: "הוספה מתחת",
      copy: "העתקה",
      copyRewrite: "העתקת השכתוב",
      copied: "הועתק",
      followUps: "המשך",
      then: "ואז",
      rewriteReady: (n) => `השכתוב מוכן, ${n} מילים`,
      padHelp: ({ formal, casual, brief, detailed }) =>
        `החיצים ימינה ושמאלה נעים בין ${formal} ל${casual}, למעלה ולמטה בין ${brief} ל${detailed}. Home מאפס לניטרלי.`,
    },
  },
  ar: {
    source:
      "ارتفع معدل التسرّب 4% في الربع الثالث، معظمه في الخدمة الذاتية. وعوّضته إيرادات التوسّع من 18 حسابًا، فبقي صافي الاحتفاظ عند 112%.",
    prompt: "حوّل هذا إلى 3 نقاط لتحديث المستثمرين",
    memo: "مذكرة مجلس الإدارة للربع الثالث",
    hints: ["الأسرع", "أفضل كتابة", "الأرخص"],
    lengths: ["موجز", "متوازن", "مفصّل"],
    followUps: ["أقصر", "أضف أرقامًا", "أكثر رسمية"],
    rewrites: {
      first: [
        "بقي صافي الاحتفاظ بالإيرادات عند 112% رغم ارتفاع التسرّب 4% في الربع الثالث، ومعظمه في الخدمة الذاتية.",
        "غطّت إيرادات التوسّع من 18 حسابًا خسائر الخدمة الذاتية وزيادة.",
        "الخطوة التالية: إصلاح تجربة الانضمام في الخدمة الذاتية، حيث يبدأ معظم التسرّب، ومواصلة توسيع الحسابات التي تتحوّل.",
      ],
      shorter: [
        "بقي صافي الاحتفاظ عند 112% رغم ارتفاع التسرّب 4%.",
        "غطّى التوسّع من 18 حسابًا خسائر الخدمة الذاتية.",
        "الخطوة التالية: إصلاح الانضمام في الخدمة الذاتية.",
      ],
      numbers: [
        "صافي الاحتفاظ: 112%، مع ارتفاع إجمالي التسرّب 4 نقاط في الربع الثالث.",
        "التوسّع: 18 حسابًا عوّضت تسرّب الخدمة الذاتية بالكامل.",
        "الخطوة التالية: خفض تسرّب الخدمة الذاتية من 4% إلى 2% بإصلاح الانضمام في الربع الرابع.",
      ],
      formal: [
        "حافظ صافي الاحتفاظ بالإيرادات على مستوى 112% على الرغم من ارتفاع معدل التسرّب بنسبة 4%.",
        "عوّضت إيرادات التوسّع عبر 18 حسابًا التآكل في الخدمة الذاتية تعويضًا كاملًا.",
        "سنمنح الأولوية لتحسين تجربة الانضمام في الخدمة الذاتية خلال الربع المقبل.",
      ],
    },
    locale: "ar",
    labels: {
      formal: "رسمي",
      casual: "ودّي",
      brief: "موجز",
      detailed: "مفصّل",
      register: (x) =>
        x <= -0.6
          ? "رسمي"
          : x <= -0.2
            ? "رسمي إلى حدّ ما"
            : x < 0.2
              ? "محايد"
              : x < 0.6
                ? "ودّي إلى حدّ ما"
                : "ودّي",
      tone: "النبرة",
      aboutWords: (n) => `نحو ${arWords(n)}`,
      estimate: (count, n) => (
        <>
          ≈ {count} {n % 100 >= 3 && n % 100 <= 10 ? "كلمات" : "كلمة"}
        </>
      ),
      words: (n) => `${n} كلمة`,
      remove: (name) => `إزالة ${name}`,
      from: (origin) => `من ${origin}`,
      instructions: "تعليمات إعادة الصياغة",
      placeholder: "أخبر النموذج كيف يعيد صياغة النص",
      addContext: "إضافة سياق",
      model: "النموذج",
      length: "الطول",
      dictate: "إملاء صوتي",
      rewrite: "إعادة الصياغة",
      stop: "إيقاف",
      stopWriting: "إيقاف الكتابة",
      writing: "جارٍ الكتابة",
      done: "تم",
      ready: "جاهز",
      progress: (current, total) => (
        <>
          {current} من {total}
        </>
      ),
      replace: "استبدال التحديد",
      insert: "إدراج أسفله",
      copy: "نسخ",
      copyRewrite: "نسخ النص الجديد",
      copied: "تم النسخ",
      followUps: "متابعات",
      then: "ثم",
      rewriteReady: (n) => `النص الجديد جاهز، ${arWords(n)}`,
      padHelp: ({ formal, casual, brief, detailed }) =>
        `تنقل الأسهم يمينًا ويسارًا بين ${formal} و${casual}، وأعلى وأسفل بين ${brief} و${detailed}. يعيد Home الضبط إلى محايد.`,
    },
  },
};

const MODELS = ["chord-fast", "chord-pro", "chord-mini"] as const;
const MODEL_NAMES = ["Chord Fast", "Chord Pro", "Chord Mini"];
const LENGTHS = ["concise", "balanced", "thorough"] as const;
const FOLLOW_UPS: { id: RewriteId; nudge?: Partial<ToneValue> }[] = [
  { id: "shorter", nudge: { y: -0.3 } },
  { id: "numbers" },
  { id: "formal", nudge: { x: -0.3 } },
];

const START: ToneValue = { x: 0, y: 0 };
const TARGET: ToneValue = { x: -0.55, y: -0.5 };

/**
 * Text lives in `copy`; the state only counts characters and words, so the
 * language can switch mid-run and the scene carries on.
 */
type State = {
  /** Characters of the scripted prompt typed so far, or what someone typed. */
  typed: number;
  custom: string | null;
  tone: ToneValue;
  status: ToneRewriteStatus;
  rewrite: RewriteId;
  /** Bullet being written and its word count. Zero words: nothing yet; Infinity: all of it. */
  bullet: number;
  words: number;
};

const settled: State = {
  typed: Infinity,
  custom: null,
  tone: TARGET,
  status: "done",
  rewrite: "first",
  bullet: 2,
  words: Infinity,
};

/** One step per word: the bullet being written grows, earlier ones stay. */
function streamSteps(bullets: string[]): MockStep<State>[] {
  const steps: MockStep<State>[] = [];
  bullets.forEach((bullet, b) => {
    const words = bullet.split(" ");
    words.forEach((_, w) => {
      steps.push({
        delay: (w === 0 && b > 0 ? 260 : 0) + 55 + ((w * 7919 + b) % 4) * 14,
        apply: (s) => ({ ...s, bullet: b, words: w + 1 }),
      });
    });
  });
  // Finished: the last bullet shows in full, whatever language is on screen now.
  steps.push({ delay: 220, apply: (s) => ({ ...s, status: "done", words: Infinity }) });
  return steps;
}

function script(c: Copy): MockStep<State>[] {
  const typing: MockStep<State>[] = Array.from(c.prompt, (_, i) => ({
    delay: 26 + ((i * 31) % 5) * 9,
    apply: (s) => ({ ...s, typed: i + 1 }),
  }));
  // The handle travels in two glides: toward Formal first, then up toward Brief.
  const glide: MockStep<State>[] = [
    { delay: 450, apply: (s) => ({ ...s, tone: { x: -0.3, y: -0.15 } }) },
    { delay: 320, apply: (s) => ({ ...s, tone: { x: -0.5, y: -0.4 } }) },
    { delay: 300, apply: (s) => ({ ...s, tone: TARGET }) },
  ];
  return [
    wait(700),
    ...typing,
    ...glide,
    {
      delay: 750,
      apply: (s) => ({ ...s, status: "writing", rewrite: "first", bullet: 0, words: 0 }),
    },
    wait(420),
    ...streamSteps(c.rewrites.first),
  ];
}

/** The bullets on screen: finished ones in full, the current one up to its word count. */
function visible(s: State, c: Copy): string[] {
  const bullets = c.rewrites[s.rewrite];
  if (!s.words) return bullets.slice(0, s.bullet);
  const partial = bullets[s.bullet]?.split(" ").slice(0, s.words).join(" ") ?? "";
  return [...bullets.slice(0, s.bullet), partial];
}

export default function ToneRewriteDemo({
  autoplay = true,
  thumbnail = false,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  thumbnail?: boolean;
  locale?: DemoLocale;
}) {
  const c = copy[locale];
  const { state, setState } = useMockRun<State>(
    autoplay
      ? {
          typed: 0,
          custom: null,
          tone: START,
          status: "idle",
          rewrite: "first",
          bullet: 0,
          words: 0,
        }
      : settled,
    autoplay ? script(c) : [],
    { autoplay },
  );

  // Reruns after the script: Send and the follow-up chips stream a new version.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const stop = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const run = (rewrite: RewriteId) => {
    stop();
    setState((s) => ({ ...s, status: "writing", rewrite, bullet: 0, words: 0 }));
    let at = 380;
    for (const step of streamSteps(c.rewrites[rewrite])) {
      at += step.delay;
      timers.current.push(setTimeout(() => setState(step.apply), at));
    }
  };

  const output = state.status === "idle" && !state.words ? [] : visible(state, c);
  const followUps: ToneRewriteFollowUp[] = FOLLOW_UPS.map((f, i) => ({
    ...f,
    label: c.followUps[i],
  }));
  return (
    <ToneRewrite
      attachment={thumbnail ? undefined : { name: c.memo, words: 142, origin: "Docs" }}
      onRemoveAttachment={() => {}}
      sourceWords={142}
      source={c.source}
      prompt={state.custom ?? c.prompt.slice(0, state.typed)}
      onPromptChange={(custom) => setState((s) => ({ ...s, custom }))}
      models={MODELS.map((value, i) => ({
        value,
        label: MODEL_NAMES[i],
        hint: c.hints[i],
      }))}
      lengths={LENGTHS.map((value, i) => ({ value, label: c.lengths[i] }))}
      tone={state.tone}
      onToneChange={(tone) => setState((s) => ({ ...s, tone }))}
      status={state.status}
      output={output}
      progress={
        state.status === "idle"
          ? undefined
          : { current: Math.max(output.length, 1), total: 3 }
      }
      onAttach={() => {}}
      onVoice={() => {}}
      onSend={() => run("first")}
      onStop={() => {
        stop();
        setState((s) => ({ ...s, status: "done" }));
      }}
      onReplace={() => {}}
      onInsert={() => {}}
      followUps={thumbnail ? [] : followUps}
      onFollowUp={(f) => run(f.id as RewriteId)}
      locale={c.locale}
      labels={c.labels}
    />
  );
}
