"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { RadialDots, type RadialDotsLabels } from "./radial-dots";

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));

// Runs by hour: scheduled jobs overnight, people during the working day.
const curve = (h: number, peak: number, width: number, height: number) =>
  height * Math.exp(-((h - peak) ** 2) / (2 * width ** 2));
const scheduled = hours.map((_, h) =>
  Math.round(curve(h, 3, 1.4, 60) + curve(h, 21, 1.2, 70) + 4),
);
const people = hours.map((_, h) => Math.round(curve(h, 13, 3, 140)));
const retries = hours.map((_, h) => Math.round(curve(h, 14, 2.5, 30) + 2));

/** Keeps a Latin name in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

/** Agent names stay Latin; Hebrew and Arabic show the RTL layout. */
const copy: Record<
  DemoLocale,
  {
    weekdays: {
      title: string;
      subtitle: string;
      days: string[];
      bot: string;
      human: string;
      caption: string;
    };
    hours: {
      title: string;
      subtitle: string;
      people: string;
      scheduled: string;
      retries: string;
      perRun: string;
      seconds: string;
    };
    intl: string;
    strings?: Partial<RadialDotsLabels>;
  }
> = {
  en: {
    weekdays: {
      title: "Conversations by weekday",
      subtitle: "Support bot · last 8 weeks",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      bot: "Solved by bot",
      human: "Handed off",
      caption: "solved by bot",
    },
    hours: {
      title: "Runs by hour",
      subtitle: "invoice-agent · last 7 days, UTC",
      people: "Started by people",
      scheduled: "Scheduled",
      retries: "Retries",
      perRun: "per run",
      seconds: "32 s",
    },
    intl: "en-US",
  },
  he: {
    weekdays: {
      title: "שיחות לפי יום בשבוע",
      subtitle: "בוט תמיכה · 8 השבועות האחרונים",
      days: ["ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳", "א׳"],
      bot: "נפתרו בבוט",
      human: "הועברו לנציג",
      caption: "נפתרו בבוט",
    },
    hours: {
      title: "ריצות לפי שעה",
      subtitle: `${ltr("invoice-agent")} · 7 הימים האחרונים, ${ltr("UTC")}`,
      people: "הופעלו ידנית",
      scheduled: "מתוזמנות",
      retries: "ניסיונות חוזרים",
      perRun: "לריצה",
      seconds: "32 שנ׳",
    },
    intl: "he-IL",
    strings: {
      instructions: (title, hourly) =>
        `${title}. אפשר לעבור בין ${hourly ? "השעות" : "המקטעים"} עם מקשי החיצים.`,
      summary: (title, label, value) =>
        `${title}: העומס הגבוה ביותר ב־${label}, ${value}`,
    },
  },
  ar: {
    weekdays: {
      title: "المحادثات حسب أيام الأسبوع",
      subtitle: "بوت الدعم · آخر 8 أسابيع",
      days: ["إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت", "أحد"],
      bot: "حلّها البوت",
      human: "أُحيلت إلى موظف",
      caption: "حلّها البوت",
    },
    hours: {
      title: "عمليات التشغيل حسب الساعة",
      subtitle: `${ltr("invoice-agent")} · آخر 7 أيام، ${ltr("UTC")}`,
      people: "بدأها مستخدمون",
      scheduled: "مجدولة",
      retries: "إعادة المحاولة",
      perRun: "لكل عملية",
      seconds: "32 ث",
    },
    intl: "ar",
    strings: {
      instructions: (title, hourly) =>
        `${title}. استخدم مفاتيح الأسهم لقراءة كل ${hourly ? "ساعة" : "قسم"}.`,
      summary: (title, label, value) => `${title}: الذروة في ${label} بعدد ${value}`,
    },
  },
};

export default function RadialDotsDemo({
  variant = "Runs by hour",
  locale = "en",
}: {
  variant?: string;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const weekdays = variant === "By weekday";
  return weekdays ? (
    <RadialDots
      title={text.weekdays.title}
      subtitle={text.weekdays.subtitle}
      labels={text.weekdays.days}
      axis={[0, 1, 2, 3, 4, 5, 6]}
      series={[
        {
          id: "bot",
          label: text.weekdays.bot,
          values: [820, 910, 880, 860, 740, 310, 260],
        },
        {
          id: "human",
          label: text.weekdays.human,
          values: [140, 160, 150, 170, 120, 40, 30],
        },
      ]}
      center={{ value: "78%", caption: text.weekdays.caption }}
      strings={text.strings}
      locale={text.intl}
    />
  ) : (
    <RadialDots
      title={text.hours.title}
      subtitle={text.hours.subtitle}
      labels={hours}
      series={[
        { id: "people", label: text.hours.people, values: people },
        { id: "scheduled", label: text.hours.scheduled, values: scheduled },
        { id: "retries", label: text.hours.retries, values: retries },
      ]}
      center={{ value: text.hours.seconds, caption: text.hours.perRun }}
      strings={text.strings}
      locale={text.intl}
    />
  );
}
