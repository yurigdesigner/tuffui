"use client";

import { useState } from "react";
import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  ResultCarousel,
  type ResultCarouselLabels,
  type ResultItem,
} from "./result-carousel";

const HOTELS = [
  { id: "h1", title: "Casa do Rio", rating: 4.8, tint: "#0a84ff", price: 214 },
  { id: "h2", title: "Miradouro Suites", rating: 4.6, tint: "#1a9e8c", price: 188 },
  { id: "h3", title: "Hotel Lumen Chiado", rating: 4.7, tint: "#bf5af2", price: 256 },
  { id: "h4", title: "Tagus Loft", rating: 4.4, tint: "#b8862b", price: 171 },
  { id: "h5", title: "Azulejo House", rating: 4.5, tint: "#5e5ce6", price: 149 },
  { id: "h6", title: "Bairro Studio", rating: 4.2, tint: "#40c8e0", price: 132 },
];

/** Keeps a date range or price in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

/** Hotel names stay as they are; everything around them is translated. */
const copy: Record<
  DemoLocale,
  {
    title: string;
    subtitle: string;
    booking: (hotel: string) => string;
    meta: string[];
    price: (usd: number) => string;
    badge: string;
    action: string;
    labels?: Partial<ResultCarouselLabels>;
  }
> = {
  en: {
    title: "Hotels in Lisbon",
    subtitle: "Nov 14–17 · 2 guests · under $260",
    booking: (hotel) => `Booking ${hotel}…`,
    meta: [
      "Alfama · 0.6 km from center",
      "Graça · city view terrace",
      "Chiado · 0.3 km from center",
      "Cais do Sodré · riverside",
      "Mouraria · quiet street",
      "Bairro Alto · walk-up",
    ],
    price: (usd) => `$${usd} / night`,
    badge: "Best match",
    action: "Book",
  },
  he: {
    title: "מלונות בליסבון",
    subtitle: `${ltr("14–17")} בנובמבר · 2 אורחים · עד ${ltr("$260")}`,
    booking: (hotel) => `מזמינים את ${hotel}…`,
    meta: [
      "אלפמה · 0.6 ק״מ מהמרכז",
      "גראסה · מרפסת עם נוף לעיר",
      "שיאדו · 0.3 ק״מ מהמרכז",
      "קאיש דו סודרה · על הנהר",
      "מורריה · רחוב שקט",
      "באירו אלטו · בלי מעלית",
    ],
    price: (usd) => `${ltr(`$${usd}`)} ללילה`,
    badge: "ההתאמה הטובה ביותר",
    action: "להזמנה",
    labels: {
      results: "תוצאות",
      previous: "התוצאות הקודמות",
      next: "התוצאות הבאות",
      track: (title) => `${title}, גלילה לרוחב`,
      slide: (index, total, title) => `${index} מתוך ${total}: ${title}`,
      outOfFive: "מתוך 5",
    },
  },
  ar: {
    title: "فنادق في لشبونة",
    subtitle: `${ltr("14–17")} نوفمبر · ضيفان · حتى ${ltr("$260")}`,
    booking: (hotel) => `جارٍ حجز ${hotel}…`,
    meta: [
      "ألفاما · 0.6 كم من المركز",
      "غراسا · شرفة مطلة على المدينة",
      "شيادو · 0.3 كم من المركز",
      "كايش دو سودري · على النهر",
      "موراريا · شارع هادئ",
      "بايرو ألتو · بلا مصعد",
    ],
    price: (usd) => `${ltr(`$${usd}`)} لليلة`,
    badge: "الأنسب لك",
    action: "احجز",
    labels: {
      results: "نتائج",
      previous: "النتائج السابقة",
      next: "النتائج التالية",
      track: (title) => `${title}، مرّر أفقيًا`,
      slide: (index, total, title) => `${index} من ${total}: ${title}`,
      outOfFive: "من 5",
    },
  },
};

function hotels(locale: DemoLocale): ResultItem[] {
  const text = copy[locale];
  return HOTELS.map(({ price, ...hotel }, i) => ({
    ...hotel,
    meta: text.meta[i],
    price: text.price(price),
    badge: i === 0 ? text.badge : undefined,
    action: text.action,
  }));
}

// Results stream in as the search tool returns them.
const script = (all: ResultItem[]): MockStep<ResultItem[]>[] =>
  all.slice(2).map((hotel) => ({
    delay: 450,
    apply: (s) => [...s, hotel],
  }));

export default function ResultCarouselDemo({
  variant = "Cards",
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const all = hotels(locale);
  const { state } = useMockRun<ResultItem[]>(
    autoplay ? all.slice(0, 2) : all,
    script(all),
    { autoplay },
  );
  const [picked, setPicked] = useState<string>();

  return (
    <ResultCarousel
      title={text.title}
      subtitle={picked ? text.booking(picked) : text.subtitle}
      compact={variant === "Compact"}
      data={state}
      labels={text.labels}
      onAction={(item) => setPicked(item.title)}
    />
  );
}
