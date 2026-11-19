"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import { HexDensity, type HexDensityLabels } from "./hex-density";

// Seeded noise so the server and the client draw the same chart.
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

function gaussian(next: () => number) {
  return Math.sqrt(-2 * Math.log(next() || 1e-9)) * Math.cos(2 * Math.PI * next());
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

// Chunks from one query batch: relevant ones cluster around 0.82 similarity and
// a few hundred tokens; long chunks dilute the match and drift lower.
function chunks(count: number, seed: number): [number, number][] {
  const next = rng(seed);
  return Array.from({ length: count }, () => {
    const tokens = clamp(Math.round(260 * Math.exp(gaussian(next) * 0.55)), 20, 1500);
    const relevant = next() < 0.58;
    const base = relevant ? 0.83 : 0.63;
    const drift = -0.00004 * (tokens - 260);
    const score = base + drift + gaussian(next) * (relevant ? 0.045 : 0.07);
    return [tokens, clamp(score, 0.4, 0.99)];
  });
}

// Requests: response time grows with prompt size, plus a slow tail from
// cold caches and tool calls.
function requests(count: number, seed: number): [number, number][] {
  const next = rng(seed);
  return Array.from({ length: count }, () => {
    const tokens = clamp(Math.round(3200 * Math.exp(gaussian(next) * 0.7)), 200, 32000);
    const tail = next() < 0.08 ? 2.2 + next() * 3.5 : 0;
    const seconds = (0.7 + tokens / 9000 + tail) * Math.exp(gaussian(next) * 0.22);
    return [tokens, clamp(seconds, 0.2, 11.8)];
  });
}

const tok = (v: number) =>
  v >= 1000 ? `${+(v / 1000).toFixed(1)}k tok` : `${Math.round(v)} tok`;

/** Keeps a Latin name in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

type Scenario = {
  title: string;
  subtitle: string;
  x: string;
  y: string;
  threshold: string;
  above: string;
  below: string;
  unit: string;
  count?: HexDensityLabels["count"];
};

/** Arabic counted noun: 1, 2, 3–10 and 11+ take different forms. */
const arabic =
  (one: string, two: string, few: string, many: string) => (n: number, f: string) =>
    n === 1
      ? one
      : n === 2
        ? two
        : n % 100 >= 3 && n % 100 <= 10
          ? `${f} ${few}`
          : `${f} ${many}`;

/** Index and agent names stay Latin; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  {
    latency: Scenario;
    retrieval: Scenario;
    intl: string;
    labels?: Partial<HexDensityLabels>;
  }
> = {
  en: {
    latency: {
      title: "Response time by prompt size",
      subtitle: "support-agent · last 24 h · SLO 4 s",
      x: "Prompt tokens",
      y: "Response time",
      threshold: "SLO 4 s",
      above: "over SLO",
      below: "within SLO",
      unit: "requests",
    },
    retrieval: {
      title: "Retrieval chunks",
      subtitle: "docs-index · 300 queries · top-k 8",
      x: "Chunk length",
      y: "Similarity",
      threshold: "0.75 cut-off",
      above: "retrieved",
      below: "dropped",
      unit: "chunks",
    },
    intl: "en-US",
  },
  he: {
    latency: {
      title: "זמן תגובה לפי גודל הפרומפט",
      subtitle: `${ltr("support-agent")} · יממה אחרונה · ${ltr("SLO 4 s")}`,
      x: "טוקנים בפרומפט",
      y: "זמן תגובה",
      threshold: "SLO 4 s",
      above: `מעל ה־${ltr("SLO")}`,
      below: `בתוך ה־${ltr("SLO")}`,
      unit: "בקשות",
      count: (n, f) => (n === 1 ? "בקשה אחת" : `${f} בקשות`),
    },
    retrieval: {
      title: "מקטעי אחזור",
      subtitle: `${ltr("docs-index")} · 300 שאילתות · ${ltr("top-k 8")}`,
      x: "אורך מקטע",
      y: "דמיון",
      threshold: "סף 0.75",
      above: "אוחזרו",
      below: "נפסלו",
      unit: "מקטעים",
      count: (n, f) => (n === 1 ? "מקטע אחד" : `${f} מקטעים`),
    },
    intl: "he-IL",
    labels: {
      above: "מעל",
      below: "מתחת",
      bin: "תא",
      densest: "התא הצפוף ביותר",
      fewer: "פחות",
      more: "יותר",
      binsPeak: (bins) => `${bins} תאים · שיא`,
      instructions: (title) => `${title}. אפשר לעבור בין התאים עם מקשי החיצים.`,
      summary: (total, bins, densest, split) =>
        `${total} ב־${bins} תאים${densest ? `, בתא הצפוף ביותר ${densest}` : ""}${
          split ? `, ${split.above} ו־${split.below}, ${split.label}` : ""
        }`,
      reading: (side, x, y, count) =>
        `${side}: ${x[0]} עד ${x[1]}, ${y[0]} עד ${y[1]}, ${count}`,
    },
  },
  ar: {
    latency: {
      title: "زمن الاستجابة حسب حجم الطلب",
      subtitle: `${ltr("support-agent")} · آخر 24 ساعة · ${ltr("SLO 4 s")}`,
      x: "رموز الطلب",
      y: "زمن الاستجابة",
      threshold: "SLO 4 s",
      above: `تتجاوز ${ltr("SLO")}`,
      below: `ضمن ${ltr("SLO")}`,
      unit: "طلبات",
      count: arabic("طلب واحد", "طلبان", "طلبات", "طلبًا"),
    },
    retrieval: {
      title: "مقاطع الاسترجاع",
      subtitle: `${ltr("docs-index")} · 300 استعلام · ${ltr("top-k 8")}`,
      x: "طول المقطع",
      y: "التشابه",
      threshold: "حد 0.75",
      above: "مُسترجَعة",
      below: "مُستبعَدة",
      unit: "مقاطع",
      count: arabic("مقطع واحد", "مقطعان", "مقاطع", "مقطعًا"),
    },
    intl: "ar",
    labels: {
      above: "فوق",
      below: "تحت",
      bin: "خلية",
      densest: "الخلية الأكثر كثافة",
      fewer: "أقل",
      more: "أكثر",
      binsPeak: (bins) => `${bins} خلية · الذروة`,
      instructions: (title) => `${title}. استخدم مفاتيح الأسهم للتنقل بين الخلايا.`,
      summary: (total, bins, densest, split) =>
        `${total} في ${bins} خلية${densest ? `، أكثفها ${densest}` : ""}${
          split ? `، ${split.above} و${split.below}، ${split.label}` : ""
        }`,
      reading: (side, x, y, count) =>
        `${side}: من ${x[0]} إلى ${x[1]}، من ${y[0]} إلى ${y[1]}، ${count}`,
    },
  },
};

type State = { count: number };

// New batches land every couple of seconds, like a live eval run.
const script: MockStep<State>[] = [1, 2, 3].map(() => ({
  delay: 1800,
  apply: (s) => ({ count: s.count + 1 }),
}));

const BATCH = { Retrieval: chunks(2400, 5), Latency: requests(1800, 9) };

export default function HexDensityDemo({
  variant = "Retrieval",
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const { state } = useMockRun<State>(
    { count: autoplay ? 1 : 4 },
    autoplay ? script : [],
    {
      autoplay,
    },
  );
  const share = state.count / 4;
  const scenario = variant === "Latency" ? text.latency : text.retrieval;
  const labels = scenario.count ? { ...text.labels, count: scenario.count } : text.labels;

  if (variant === "Latency") {
    const points = BATCH.Latency.slice(0, Math.round(BATCH.Latency.length * share));
    return (
      <HexDensity
        title={scenario.title}
        subtitle={scenario.subtitle}
        points={points}
        x={{ label: scenario.x, min: 200, max: 32000, format: tok }}
        y={{
          label: scenario.y,
          min: 0,
          max: 12,
          format: (v) => `${+v.toFixed(1)}s`,
        }}
        threshold={{
          value: 4,
          label: scenario.threshold,
          above: scenario.above,
          below: scenario.below,
        }}
        tone="var(--brand)"
        unit={scenario.unit}
        labels={labels}
        locale={text.intl}
      />
    );
  }

  const points = BATCH.Retrieval.slice(0, Math.round(BATCH.Retrieval.length * share));
  return (
    <HexDensity
      title={scenario.title}
      subtitle={scenario.subtitle}
      points={points}
      x={{ label: scenario.x, min: 20, max: 1500, format: tok }}
      y={{ label: scenario.y, min: 0.4, max: 1, format: (v) => v.toFixed(2) }}
      threshold={{
        value: 0.75,
        label: scenario.threshold,
        above: scenario.above,
        below: scenario.below,
      }}
      unit={scenario.unit}
      labels={labels}
      locale={text.intl}
    />
  );
}
