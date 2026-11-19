"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  ClausePlaybook,
  marketPercentile,
  type ClausePlaybookLabels,
  type ClauseBucket,
  type ClauseSetting,
  type ClauseThresholds,
  type ClauseValue,
} from "./clause-playbook";

/**
 * Signed MSAs by liability cap in months of fees, in half-month steps:
 * clusters at 6, 12, 18 and 24, with round numbers drawing the most deals.
 */
const SHAPE = [
  6, 8, 14, 26, 34, 40, 72, 58, 52, 50, 56, 66, 120, 88, 74, 64, 58, 54, 84, 44, 34, 26,
  20, 16, 48,
];
// Seeded so the server and the client draw the same columns.
let seed = 11;
const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 0.3 + 0.85;
const HALVES = SHAPE.flatMap((n, i) =>
  i < SHAPE.length - 1 ? [n, ((n + SHAPE[i + 1]) / 2) * 0.62 * noise()] : [n],
);
const RAW = HALVES.reduce((a, b) => a + b, 0);
const COUNTS = HALVES.map((n) => Math.round((n / RAW) * 2140));
COUNTS[24] += 2140 - COUNTS.reduce((a, b) => a + b, 0);
const MARKET: ClauseBucket[] = COUNTS.map((count, i) => ({ value: i / 2, count }));
const SIGNED = COUNTS.reduce((a, b) => a + b, 0).toLocaleString("en-US");

const BASELINE: ClauseThresholds = { fallback: 6, preferred: 12 };
const PROPOSED: ClauseThresholds = { fallback: 6, preferred: 15 };

/** Keeps a Latin name or a number range in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

type Copy = {
  clause: string;
  subtitle: string;
  unit: string;
  sampleNoun: string;
  superCap: [string, string];
  escalate: [string, string];
  options: Record<"legal" | "finance" | "security" | "gc", [string, string]>;
  /** Hint on Finance: below the preferred cap. */
  below: (preferred: number) => string;
  autoAccept: [string, (t: ClauseThresholds) => string];
  marketWording: [string, string];
  block: [string, string];
  comparing: string;
  suggestion: (preferred: number, percentile: number) => string;
  applied: (preferred: number) => string;
  discarded: string;
  labels?: Partial<ClausePlaybookLabels>;
};

const arCount = (n: number, one: string, two: string, few: string, many: string) =>
  n === 1
    ? one
    : n === 2
      ? two
      : n % 100 >= 3 && n % 100 <= 10
        ? `${n} ${few}`
        : `${n} ${many}`;

const copy: Record<DemoLocale, Copy> = {
  en: {
    clause: "Liability cap",
    subtitle: "Negotiation playbook · Corvane MSA",
    unit: "mo",
    sampleNoun: "MSAs",
    superCap: ["Data-breach super-cap", "Multiple of the general cap"],
    escalate: ["Escalate to", "Who the agent pings before it concedes"],
    options: {
      legal: ["Legal", "always"],
      finance: ["Finance", ""],
      security: ["Security", "data breach"],
      gc: ["General counsel", "walk-away"],
    },
    below: (p) => `below ${p} mo`,
    autoAccept: [
      "Auto-accept within fallback",
      (t) => `Agent signs off ${t.fallback}–${t.preferred} mo on its own`,
    ],
    marketWording: ["Suggest market wording", `From ${SIGNED} signed MSAs`],
    block: ["Block below walk-away", "Needs General counsel to unblock"],
    comparing: `Comparing your playbook with ${SIGNED} signed MSAs…`,
    suggestion: (p, pc) =>
      `Agent suggests ${p} mo preferred · p${pc} of market. Counterparties above 12 mo rarely push back.`,
    applied: (p) => `Applied. The agent now opens at ${p} mo.`,
    discarded: "Discarded. Back to your playbook.",
  },
  he: {
    clause: "תקרת אחריות",
    subtitle: `פלייבוק למשא ומתן · ${ltr("Corvane MSA")}`,
    unit: "חודשים",
    sampleNoun: "הסכמים",
    superCap: ["תקרת־על לדליפת מידע", "מכפיל של התקרה הכללית"],
    escalate: ["הסלמה אל", "למי הסוכן פונה לפני שהוא מוותר"],
    options: {
      legal: ["מחלקה משפטית", "תמיד"],
      finance: ["כספים", ""],
      security: ["אבטחת מידע", "דליפת מידע"],
      gc: ["היועץ המשפטי", "קו אדום"],
    },
    below: (p) => `מתחת ל־${p} חודשים`,
    autoAccept: [
      "אישור אוטומטי בטווח הפשרה",
      (t) => `הסוכן מאשר לבד ${ltr(`${t.fallback}–${t.preferred}`)} חודשים`,
    ],
    marketWording: ["הצעת נוסח מקובל בשוק", `מתוך ${SIGNED} הסכמים חתומים`],
    block: ["חסימה מתחת לקו האדום", "רק היועץ המשפטי יכול לשחרר"],
    comparing: `משווה את הפלייבוק שלך ל־${SIGNED} הסכמים חתומים…`,
    suggestion: (p, pc) =>
      `הסוכן מציע ${p} חודשים כיעד מועדף · ${ltr(`p${pc}`)} מהשוק. צדדים שכנגד כמעט לא מתנגדים לתקרה מעל 12 חודשים.`,
    applied: (p) => `הוחל. מעכשיו הסוכן פותח ב־${p} חודשים.`,
    discarded: "בוטל. חזרת לפלייבוק שלך.",
    labels: {
      walkAway: "קו אדום",
      fallback: "פשרה",
      preferred: "מועדף",
      edits: (n) => (n === 1 ? "עריכה" : "עריכות"),
      noEdits: "אין עריכות",
      market: "שוק",
      perDot: (n, noun) => `נקודה ≈ ${n.toLocaleString("he-IL")} ${noun}`,
      ofMarket: "מהשוק",
      chart: (total, noun, preferred, pc) =>
        `התפלגות השוק לפי ${total.toLocaleString("he-IL")} ${noun}. היעד המועדף, ${preferred}, נמצא ב־p${pc}.`,
      thresholds: (clause) => `ספים: ${clause}`,
      handle: (zone) => `תחילת ${zone}`,
      pending: "לא פעיל עד ההחלה",
      live: "פעיל בפלייבוק",
      discard: "ביטול",
      apply: "החלה",
      decrease: "הפחתה",
      increase: "הוספה",
    },
  },
  ar: {
    clause: "سقف المسؤولية",
    subtitle: `دليل التفاوض · ${ltr("Corvane MSA")}`,
    unit: "شهر",
    sampleNoun: "اتفاقيات",
    superCap: ["سقف أعلى لتسرّب البيانات", "مضاعف للسقف العام"],
    escalate: ["التصعيد إلى", "من ينبّهه الوكيل قبل أن يتنازل"],
    options: {
      legal: ["الشؤون القانونية", "دائمًا"],
      finance: ["المالية", ""],
      security: ["أمن المعلومات", "تسرّب البيانات"],
      gc: ["المستشار القانوني العام", "حدّ الانسحاب"],
    },
    below: (p) => `أقل من ${p} شهرًا`,
    autoAccept: [
      "قبول تلقائي ضمن الموقف البديل",
      (t) => `يوافق الوكيل وحده على ${ltr(`${t.fallback}–${t.preferred}`)} شهرًا`,
    ],
    marketWording: ["اقتراح صياغة السوق", `من ${SIGNED} اتفاقية موقّعة`],
    block: ["الحظر دون حدّ الانسحاب", "لا يرفعه إلا المستشار القانوني العام"],
    comparing: `جارٍ مقارنة دليلك بـ${SIGNED} اتفاقية موقّعة…`,
    suggestion: (p, pc) =>
      `يقترح الوكيل ${p} شهرًا موقفًا مفضّلًا · ${ltr(`p${pc}`)} من السوق. نادرًا ما يعترض الطرف الآخر على سقف يتجاوز 12 شهرًا.`,
    applied: (p) => `تم التطبيق. يبدأ الوكيل التفاوض الآن من ${p} شهرًا.`,
    discarded: "تم التجاهل. عدت إلى دليلك.",
    labels: {
      walkAway: "الانسحاب",
      fallback: "البديل",
      preferred: "المفضّل",
      edits: (n) =>
        n === 1 ? "تعديل" : n === 2 ? "تعديلان" : n <= 10 ? "تعديلات" : "تعديلًا",
      noEdits: "لا تعديلات",
      market: "السوق",
      perDot: (n) =>
        `نقطة ≈ ${arCount(n, "اتفاقية واحدة", "اتفاقيتان", "اتفاقيات", "اتفاقية")}`,
      ofMarket: "من السوق",
      chart: (total, _noun, preferred, pc) =>
        `توزيع السوق عبر ${total.toLocaleString("en-US")} اتفاقية. الموقف المفضّل ${preferred} عند p${pc}.`,
      thresholds: (clause) => `حدود ${clause}`,
      handle: (zone) => `بداية ${zone}`,
      pending: "غير مفعّل حتى التطبيق",
      live: "مفعّل في الدليل",
      discard: "تجاهل",
      apply: "تطبيق",
      decrease: "إنقاص",
      increase: "زيادة",
    },
  },
};

function settings(t: ClauseThresholds, c: Copy): ClauseSetting[] {
  const option = (value: keyof Copy["options"]) => ({
    value,
    label: c.options[value][0],
    hint: value === "finance" ? c.below(t.preferred) : c.options[value][1],
  });
  return [
    {
      kind: "stepper",
      id: "superCap",
      label: c.superCap[0],
      description: c.superCap[1],
      defaultValue: 2,
      min: 1,
      max: 5,
      format: (v) => `${v}×`,
    },
    {
      kind: "select",
      id: "escalate",
      label: c.escalate[0],
      description: c.escalate[1],
      defaultValue: "finance",
      options: [option("legal"), option("finance"), option("security"), option("gc")],
    },
    {
      kind: "toggle",
      id: "autoAccept",
      label: c.autoAccept[0],
      description: c.autoAccept[1],
      defaultValue: true,
    },
    {
      kind: "toggle",
      id: "marketWording",
      label: c.marketWording[0],
      description: c.marketWording[1],
      defaultValue: true,
    },
    {
      kind: "toggle",
      id: "block",
      label: c.block[0],
      description: c.block[1],
      defaultValue: false,
    },
  ];
}

type State = {
  thresholds: ClauseThresholds;
  values: Record<string, ClauseValue>;
  /** The agent's line, rendered in the current language. */
  note: { kind: "comparing" | "suggestion" | "applied" | "discarded"; preferred: number };
};

const START: State = {
  thresholds: BASELINE,
  values: {},
  note: { kind: "comparing", preferred: BASELINE.preferred },
};
const PROPOSAL: State = {
  thresholds: PROPOSED,
  values: { escalate: "legal" },
  note: { kind: "suggestion", preferred: PROPOSED.preferred },
};

function noteText(note: State["note"], c: Copy) {
  switch (note.kind) {
    case "comparing":
      return c.comparing;
    case "suggestion":
      return c.suggestion(note.preferred, marketPercentile(MARKET, note.preferred));
    case "applied":
      return c.applied(note.preferred);
    case "discarded":
      return c.discarded;
  }
}

export default function ClausePlaybookDemo({
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
  // The agent reads the market, moves the preferred handle, then routes escalations to Legal.
  const steps: MockStep<State>[] = autoplay
    ? [
        wait(1400),
        {
          delay: 0,
          apply: (s) => ({ ...s, thresholds: PROPOSED, note: PROPOSAL.note }),
        },
        {
          delay: 900,
          apply: (s) => ({ ...s, values: { ...s.values, escalate: "legal" } }),
        },
      ]
    : [];
  const { state, setState } = useMockRun<State>(autoplay ? START : PROPOSAL, steps, {
    autoplay,
  });
  const all = settings(state.thresholds, c);

  return (
    <ClausePlaybook
      number="9.2"
      clause={c.clause}
      subtitle={c.subtitle}
      distribution={MARKET}
      domain={[0, 24]}
      unit={c.unit}
      defaultThresholds={BASELINE}
      thresholds={state.thresholds}
      onThresholdsChange={(thresholds) => setState((s) => ({ ...s, thresholds }))}
      settings={thumbnail ? all.slice(0, 3) : all}
      values={state.values}
      onValuesChange={(values) => setState((s) => ({ ...s, values }))}
      note={noteText(state.note, c)}
      sampleNoun={c.sampleNoun}
      labels={c.labels}
      onApply={(t) =>
        setState((s) => ({ ...s, note: { kind: "applied", preferred: t.preferred } }))
      }
      onDiscard={() =>
        setState((s) => ({
          ...s,
          note: { kind: "discarded", preferred: s.thresholds.preferred },
        }))
      }
    />
  );
}
