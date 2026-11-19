"use client";

import type { DemoLocale } from "@/components/docs/demo";
import {
  DivergingBars,
  type DivergingBarsLabels,
  type DivergingSeries,
} from "./diverging-bars";

// Seeded noise so the server and the client draw the same chart.
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

/** 30 days ending Oct 11, labelled "Sep 12" … "Oct 11". */
const dayLabels = (intl: string) =>
  Array.from({ length: 30 }, (_, i) =>
    new Date(Date.UTC(2026, 8, 12 + i)).toLocaleDateString(intl, {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }),
  );
const days = dayLabels("en-US");

/** Daily counts around a base, quieter on weekends, with an optional spike. */
function daily(base: number, seed: number, spike?: { day: number; boost: number }) {
  const next = rng(seed);
  return days.map((_, i) => {
    const weekend = i % 7 === 1 || i % 7 === 2 ? 0.55 : 1;
    const boost = spike && i === spike.day ? spike.boost : 1;
    return Math.round(base * weekend * boost * (0.75 + next() * 0.5));
  });
}

const sources: DivergingSeries[] = [
  { id: "identity", label: "Identity", values: daily(560, 1, { day: 20, boost: 1.5 }) },
  { id: "endpoint", label: "Endpoint", values: daily(310, 2) },
  { id: "cloud", label: "Cloud", values: daily(190, 3) },
  { id: "email", label: "Email", values: daily(150, 4, { day: 20, boost: 5.5 }) },
  { id: "network", label: "Network", values: daily(90, 5) },
  { id: "saas", label: "SaaS", values: daily(70, 6) },
];
const escalated: DivergingSeries = {
  id: "escalated",
  label: "Escalated",
  values: daily(8, 7, { day: 20, boost: 2.6 }),
};

const channels: DivergingSeries[] = [
  { id: "chat", label: "Chat", values: daily(420, 11) },
  { id: "email", label: "Email", values: daily(260, 12) },
  { id: "voice", label: "Voice", values: daily(90, 13) },
  { id: "slack", label: "Slack", values: daily(60, 14, { day: 9, boost: 2.4 }) },
];
const handedOff: DivergingSeries = {
  id: "handed-off",
  label: "Handed off",
  values: daily(58, 15, { day: 9, boost: 1.9 }),
};

/** Product names stay Latin; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  {
    intl: string;
    /** Series labels by id; missing ids keep their English label. */
    names: Record<string, string>;
    alerts: { title: string; subtitle: string; caption: string; aside: string };
    support: { title: string; subtitle: string; caption: string; aside: string };
    strings?: Partial<DivergingBarsLabels>;
  }
> = {
  en: {
    intl: "en-US",
    names: {},
    alerts: {
      title: "Alerts by source",
      subtitle: "Security agent · last 30 days",
      caption: "alerts triaged in 30 days",
      aside: "closed without a human",
    },
    support: {
      title: "Tickets by channel",
      subtitle: "Support agent · last 30 days",
      caption: "tickets solved by the agent",
      aside: "resolution rate",
    },
  },
  he: {
    intl: "he-IL",
    names: {
      identity: "זהויות",
      endpoint: "תחנות קצה",
      cloud: "ענן",
      email: "אימייל",
      network: "רשת",
      escalated: "הוסלמו",
      chat: "צ׳אט",
      voice: "טלפון",
      "handed-off": "הועברו לנציג",
    },
    alerts: {
      title: "התראות לפי מקור",
      subtitle: "סוכן אבטחה · 30 הימים האחרונים",
      caption: "התראות טופלו ב־30 יום",
      aside: "נסגרו בלי מגע אדם",
    },
    support: {
      title: "פניות לפי ערוץ",
      subtitle: "סוכן תמיכה · 30 הימים האחרונים",
      caption: "פניות נפתרו על ידי הסוכן",
      aside: "שיעור פתרון",
    },
    strings: {
      series: "סדרות",
      label: "תאריך",
      total: "סה״כ",
      instructions: (title) => `${title}. אפשר לעבור בין העמודות עם מקשי החיצים.`,
      summary: (series, below, from, to, total) =>
        `עמודות מוערמות של ${series.join(", ")}${below ? `, ו־${below} מתחת לקו` : ""}, ${from} עד ${to}, ${total} בסך הכול`,
      columnTotal: (total) => `סה״כ ${total}`,
    },
  },
  ar: {
    intl: "ar",
    names: {
      identity: "الهوية",
      endpoint: "الأجهزة الطرفية",
      cloud: "السحابة",
      email: "البريد",
      network: "الشبكة",
      escalated: "مُصعَّدة",
      chat: "الدردشة",
      voice: "الهاتف",
      "handed-off": "أُحيلت إلى موظف",
    },
    alerts: {
      title: "التنبيهات حسب المصدر",
      subtitle: "وكيل الأمان · آخر 30 يومًا",
      caption: "تنبيهًا فُرز خلال 30 يومًا",
      aside: "أُغلقت دون تدخل بشري",
    },
    support: {
      title: "التذاكر حسب القناة",
      subtitle: "وكيل الدعم · آخر 30 يومًا",
      caption: "تذكرة حلّها الوكيل",
      aside: "معدل الحل",
    },
    strings: {
      series: "السلاسل",
      label: "التاريخ",
      total: "الإجمالي",
      instructions: (title) => `${title}. استخدم مفاتيح الأسهم لقراءة الأعمدة.`,
      summary: (series, below, from, to, total) =>
        `أعمدة مكدّسة لـ${series.join("، ")}${below ? `، مع ${below} أسفل الخط` : ""}، من ${from} إلى ${to}، والإجمالي ${total}`,
      columnTotal: (total) => `الإجمالي ${total}`,
    },
  },
};

const sum = (values: number[]) => values.reduce((n, v) => n + v, 0);
const grand = (series: DivergingSeries[]) => sum(series.map((s) => sum(s.values)));

export default function DivergingBarsDemo({
  variant = "Alerts",
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const labels = locale === "en" ? days : dayLabels(text.intl);
  const named = (s: DivergingSeries) => ({ ...s, label: text.names[s.id] ?? s.label });
  const percent = (value: number) => (
    <span dir="ltr" className="text-foreground tabular-nums">
      {(value * 100).toFixed(1)}%
    </span>
  );

  if (variant === "Support") {
    const solved = grand(channels);
    const all = solved + sum(handedOff.values);
    return (
      <DivergingBars
        title={text.support.title}
        subtitle={text.support.subtitle}
        labels={labels}
        series={channels.map(named)}
        below={named(handedOff)}
        headline={{
          value: solved.toLocaleString(text.intl),
          caption: text.support.caption,
        }}
        aside={
          <>
            {percent(solved / all)} {text.support.aside}
          </>
        }
        strings={text.strings}
      />
    );
  }

  const triaged = grand(sources);
  const closed = 1 - sum(escalated.values) / triaged;
  return (
    <DivergingBars
      title={text.alerts.title}
      subtitle={text.alerts.subtitle}
      labels={labels}
      series={sources.map(named)}
      below={named(escalated)}
      headline={{
        value: triaged.toLocaleString(text.intl),
        caption: text.alerts.caption,
      }}
      aside={
        <>
          {percent(closed)} {text.alerts.aside}
        </>
      }
      strings={text.strings}
    />
  );
}
