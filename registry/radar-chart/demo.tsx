"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { RadarChart, type RadarChartLabels, type RadarMember } from "./radar-chart";

const skills = [
  "Craft",
  "Systems thinking",
  "Product sense",
  "Collaboration",
  "Communication",
  "Leadership",
];

// Design team review, scored 0–4 against the senior rubric.
const team: RadarMember[] = [
  { id: "jr", label: "JR", name: "Jae Rhee", values: [4, 4, 3, 3, 3, 4] },
  { id: "mk", label: "MK", name: "Mira Kovac", values: [4, 4, 4, 2, 3, 3] },
  { id: "lw", label: "LW", name: "Leo Wright", values: [4, 4, 3, 2, 3, 3] },
  { id: "as", label: "AS", name: "Ana Soto", values: [3, 3, 3, 3, 2, 2] },
];

const average = (members: RadarMember[], axes: number) =>
  Array.from(
    { length: axes },
    (_, i) =>
      Math.round(
        (members.reduce((sum, m) => sum + (m.values[i] ?? 0), 0) / members.length) * 10,
      ) / 10,
  );

const evals = [
  "Reasoning",
  "Coding",
  "Tool use",
  "Long context",
  "Instruction following",
  "Safety",
  "Latency",
];

// Internal eval suite, 0–100. Latency is scored, so faster is higher.
const models: RadarMember[] = [
  { id: "lg", label: "LG", name: "large-2", values: [91, 88, 84, 86, 90, 93, 52] },
  { id: "md", label: "MD", name: "medium-2", values: [82, 80, 79, 78, 86, 90, 74] },
  { id: "sm", label: "SM", name: "small-2", values: [66, 63, 71, 58, 78, 87, 95] },
  { id: "ft", label: "FT", name: "support-ft", values: [74, 61, 92, 70, 93, 91, 88] },
];

/** Keeps a Latin name in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

/** People and model names stay Latin; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  {
    skills: string[];
    evals: string[];
    team: {
      title: string;
      subtitle: string;
      average: string;
      bar: string;
      caption: string;
    };
    eval: { title: string; subtitle: string; mix: string; bar: string; caption: string };
    labels?: Partial<RadarChartLabels>;
  }
> = {
  en: {
    skills,
    evals,
    team: {
      title: "Team skills",
      subtitle: "Design · Q3 review · 4 people",
      average: "Team average",
      bar: "Senior bar",
      caption: "bar 3.1",
    },
    eval: {
      title: "Model eval",
      subtitle: "Support agent · eval suite v14 · 1,200 cases",
      mix: "Routed mix",
      bar: "Ship bar",
      caption: "bar 77",
    },
  },
  he: {
    skills: [
      "מקצועיות",
      "חשיבה מערכתית",
      "חוש מוצרי",
      "שיתוף פעולה",
      "תקשורת",
      "מנהיגות",
    ],
    evals: [
      "היסק",
      "קוד",
      "שימוש בכלים",
      "הקשר ארוך",
      "ציות להנחיות",
      "בטיחות",
      "מהירות",
    ],
    team: {
      title: "כישורי הצוות",
      subtitle: `עיצוב · סקירת ${ltr("Q3")} · 4 אנשים`,
      average: "ממוצע הצוות",
      bar: "רף בכיר",
      caption: "רף 3.1",
    },
    eval: {
      title: "הערכת מודלים",
      subtitle: `סוכן תמיכה · חבילת הערכה ${ltr("v14")} · 1,200 מקרים`,
      mix: "תמהיל מנותב",
      bar: "רף לשחרור",
      caption: "רף 77",
    },
    labels: {
      axis: "ציר",
      instructions: (title) => `${title}. אפשר לעבור בין הצירים עם מקשי החיצים.`,
      summary: (title, series, values, strongest) =>
        `${title}: ${series} ${values}. החוזקה הבולטת: ${strongest}.`,
    },
  },
  ar: {
    skills: [
      "الإتقان",
      "التفكير المنظومي",
      "الحس بالمنتج",
      "التعاون",
      "التواصل",
      "القيادة",
    ],
    evals: [
      "الاستدلال",
      "البرمجة",
      "استخدام الأدوات",
      "سياق طويل",
      "اتباع التعليمات",
      "الأمان",
      "السرعة",
    ],
    team: {
      title: "مهارات الفريق",
      subtitle: `التصميم · مراجعة ${ltr("Q3")} · 4 أشخاص`,
      average: "متوسط الفريق",
      bar: "معيار الأقدمية",
      caption: "المعيار 3.1",
    },
    eval: {
      title: "تقييم النماذج",
      subtitle: `وكيل الدعم · حزمة التقييم ${ltr("v14")} · 1,200 حالة`,
      mix: "المزيج الموجَّه",
      bar: "معيار الإطلاق",
      caption: "المعيار 77",
    },
    labels: {
      axis: "المحور",
      instructions: (title) => `${title}. استخدم مفاتيح الأسهم لقراءة كل محور.`,
      summary: (title, series, values, strongest) =>
        `${title}: ${series} ${values}. الأقوى في ${strongest}.`,
    },
  },
};

export default function RadarChartDemo({
  variant = "Team skills",
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  if (variant === "Model eval") {
    const router = average(models, evals.length);
    return (
      <RadarChart
        title={text.eval.title}
        subtitle={text.eval.subtitle}
        axes={text.evals}
        max={100}
        series={{ id: "router", label: text.eval.mix, values: router }}
        baseline={{ label: text.eval.bar, values: [75, 70, 80, 70, 85, 90, 70] }}
        members={models}
        headline={{
          value: `${Math.round(router.reduce((a, b) => a + b, 0) / router.length)}`,
          caption: text.eval.caption,
        }}
        format={(v) => `${Math.round(v)}`}
        labels={text.labels}
      />
    );
  }
  const avg = average(team, skills.length);
  return (
    <RadarChart
      title={text.team.title}
      subtitle={text.team.subtitle}
      axes={text.skills}
      max={4}
      series={{ id: "avg", label: text.team.average, values: avg }}
      baseline={{ label: text.team.bar, values: [3.5, 3, 3, 3, 3, 3] }}
      members={team}
      headline={{
        value: (avg.reduce((a, b) => a + b, 0) / avg.length).toFixed(1),
        caption: text.team.caption,
      }}
      labels={text.labels}
    />
  );
}
