"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { MirrorStrips, type MirrorRow, type MirrorStripsLabels } from "./mirror-strips";

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

/** Counts that cluster around a few hot spots and shrink each round. */
function strip(n: number, hot: number[], scale: number, seed: number) {
  const next = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const heat = hot.reduce((h, c) => h + Math.exp(-((i - c) ** 2) / 6), 0);
    const v = (heat * 5 + next() * 1.6 - 0.5) * scale;
    return Math.max(0, Math.round(v));
  });
}

const pages = Array.from({ length: 42 }, (_, i) => (i === 0 ? "p. 1" : `${i + 1}`));
const hot = [6, 13, 20, 27, 34];
const rounds: MirrorRow[] = [
  {
    id: "r1",
    label: "R1",
    sublabel: "Aug 4",
    up: strip(42, hot, 1, 1),
    down: strip(42, hot, 1.1, 2),
  },
  {
    id: "r2",
    label: "R2",
    sublabel: "Aug 19",
    up: strip(42, hot, 0.65, 3),
    down: strip(42, hot, 0.8, 4),
  },
  {
    id: "r3",
    label: "R3",
    sublabel: "Sep 9",
    up: strip(42, [13, 20], 0.55, 5),
    down: strip(42, [20], 0.7, 6),
  },
  {
    id: "r4",
    label: "R4",
    sublabel: "today",
    up: strip(42, [20], 0.45, 7),
    down: strip(42, [20], 0.6, 8),
    current: true,
  },
];

const weeks = ["W1", "W2", "W3", "W4"];
const dirs = [
  "api",
  "app",
  "auth",
  "billing",
  "cli",
  "db",
  "docs",
  "email",
  "jobs",
  "lib",
  "search",
  "ui",
];
const prs: MirrorRow[] = weeks.map((w, i) => ({
  id: w,
  label: w,
  sublabel: ["Oct 6", "Oct 13", "Oct 20", "Oct 27"][i],
  up: strip(12, [1, 9], 1.2 - i * 0.2, 20 + i),
  down: strip(12, [5, 9], 0.9 - i * 0.1, 40 + i),
  current: i === 3,
}));

/** Keeps a Latin name or clause number in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

/** Directory names and round numbers stay Latin; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  {
    intl: string;
    contract: {
      title: string;
      subtitle: string;
      page: string;
      up: string;
      down: string;
      today: string;
      note: string;
    };
    prs: {
      title: string;
      subtitle: string;
      week: (n: number) => string;
      up: string;
      down: string;
      note: string;
    };
    labels?: Partial<MirrorStripsLabels>;
  }
> = {
  en: {
    intl: "en-US",
    contract: {
      title: "Edits by page",
      subtitle: "42 pages · 4 rounds",
      page: "p. 1",
      up: "Their edits",
      down: "Our redlines",
      today: "today",
      note: "§ 12.4 Indemnity — still open in R4",
    },
    prs: {
      title: "Churn by directory",
      subtitle: "Agent PRs · last 4 weeks",
      week: (n) => `W${n}`,
      up: "Lines added",
      down: "Lines removed",
      note: "lib/ — refactor still open",
    },
  },
  he: {
    intl: "he-IL",
    contract: {
      title: "עריכות לפי עמוד",
      subtitle: "42 עמודים · 4 סבבים",
      page: "עמ׳ 1",
      up: "העריכות שלהם",
      down: "ההערות שלנו",
      today: "היום",
      note: `${ltr("§ 12.4")} שיפוי — עדיין פתוח ב־${ltr("R4")}`,
    },
    prs: {
      title: "שינויים לפי תיקייה",
      subtitle: "בקשות מיזוג של הסוכן · 4 השבועות האחרונים",
      week: (n) => `שבוע ${n}`,
      up: "שורות שנוספו",
      down: "שורות שנמחקו",
      note: `${ltr("lib/")} — הריפקטור עדיין פתוח`,
    },
    labels: {
      perDot: (count) => `נקודה = ${count}`,
      instructions: (title) => `${title}. אפשר לעבור בין העמודות עם מקשי החיצים.`,
    },
  },
  ar: {
    intl: "ar",
    contract: {
      title: "التعديلات حسب الصفحة",
      subtitle: "42 صفحة · 4 جولات",
      page: "ص 1",
      up: "تعديلاتهم",
      down: "ملاحظاتنا",
      today: "اليوم",
      note: `${ltr("§ 12.4")} التعويض — لا يزال مفتوحًا في ${ltr("R4")}`,
    },
    prs: {
      title: "التغييرات حسب المجلد",
      subtitle: "طلبات الدمج من الوكيل · آخر 4 أسابيع",
      week: (n) => `أسبوع ${n}`,
      up: "أسطر مضافة",
      down: "أسطر محذوفة",
      note: `${ltr("lib/")} — إعادة الهيكلة لا تزال مفتوحة`,
    },
    labels: {
      perDot: (count) => `النقطة = ${count}`,
      instructions: (title) => `${title}. استخدم مفاتيح الأسهم لقراءة الأعمدة.`,
    },
  },
};

/** Date labels from the English ones ("Aug 4"), in the demo's language. */
const localDay = (label: string, intl: string) =>
  new Date(`${label}, 2026 12:00`).toLocaleDateString(intl, {
    month: "short",
    day: "numeric",
  });

export default function MirrorStripsDemo({
  variant = "Contract",
  locale = "en",
}: {
  variant?: string;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const day = (label: string) =>
    locale === "en"
      ? label
      : label === "today"
        ? text.contract.today
        : localDay(label, text.intl);

  return variant === "Pull requests" ? (
    <MirrorStrips
      title={text.prs.title}
      subtitle={text.prs.subtitle}
      columns={dirs}
      rows={prs.map((row, i) => ({
        ...row,
        label: text.prs.week(i + 1),
        sublabel: row.sublabel && day(row.sublabel),
      }))}
      series={{ up: { label: text.prs.up }, down: { label: text.prs.down } }}
      marks={[{ column: 9, label: "lib", note: text.prs.note }]}
      labels={text.labels}
      locale={text.intl}
    />
  ) : (
    <MirrorStrips
      title={text.contract.title}
      subtitle={text.contract.subtitle}
      columns={[text.contract.page, ...pages.slice(1)]}
      rows={rounds.map((row) => ({
        ...row,
        sublabel: row.sublabel && day(row.sublabel),
      }))}
      series={{ up: { label: text.contract.up }, down: { label: text.contract.down } }}
      marks={[{ column: 20, label: "§ 12.4", note: text.contract.note }]}
      labels={text.labels}
      locale={text.intl}
    />
  );
}
