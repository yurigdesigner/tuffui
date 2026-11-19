"use client";

import { BellSimple, PencilSimpleLine } from "@phosphor-icons/react";
import { useState } from "react";
import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  RenewalRings,
  type RenewalAction,
  type RenewalContract,
  type RenewalRingsLabels,
} from "./renewal-rings";

// Fixed, so the server and the client draw the same clock face.
const TODAY = "2026-11-04";

const CONTRACTS: RenewalContract[] = [
  {
    id: "kestrel",
    name: "Kestrel",
    endDate: "2026-11-20",
    noticeDays: 30,
    value: 84_000,
    autoRenew: true,
  },
  {
    id: "northvale",
    name: "Northvale",
    endDate: "2026-12-08",
    noticeDays: 30,
    value: 280_000,
    autoRenew: true,
  },
  {
    id: "halden",
    name: "Halden",
    endDate: "2026-12-26",
    noticeDays: 30,
    value: 126_000,
    autoRenew: true,
  },
  {
    id: "orrery",
    name: "Orrery",
    endDate: "2027-01-14",
    noticeDays: 60,
    value: 480_000,
    autoRenew: false,
  },
  {
    id: "brightwell",
    name: "Brightwell",
    endDate: "2027-01-31",
    noticeDays: 30,
    value: 58_000,
    autoRenew: true,
  },
  {
    id: "cobalt",
    name: "Cobalt Bay",
    endDate: "2027-04-03",
    noticeDays: 90,
    value: 190_000,
    autoRenew: true,
  },
  {
    id: "marlow",
    name: "Marlow",
    endDate: "2027-06-27",
    noticeDays: 60,
    value: 72_000,
    autoRenew: false,
  },
  {
    id: "tessel",
    name: "Tessel",
    endDate: "2027-07-24",
    noticeDays: 30,
    value: 44_000,
    autoRenew: true,
  },
  {
    id: "quillon",
    name: "Quillon",
    endDate: "2027-08-31",
    noticeDays: 60,
    value: 132_000,
    autoRenew: true,
  },
  {
    id: "fenwick",
    name: "Fenwick",
    endDate: "2027-10-01",
    noticeDays: 30,
    value: 66_000,
    autoRenew: false,
  },
  {
    id: "ashgrove",
    name: "Ashgrove",
    endDate: "2027-10-22",
    noticeDays: 90,
    value: 210_000,
    autoRenew: true,
  },
];

/** Synced from the CRM mid-answer. */
const LARKSPUR: RenewalContract = {
  id: "larkspur",
  name: "Larkspur",
  endDate: "2027-01-05",
  noticeDays: 45,
  value: 96_000,
  autoRenew: true,
};

/** Agent notes on the contracts that have one, and the action labels. */
type Copy = {
  notes: Record<"kestrel" | "northvale" | "orrery" | "larkspur", string>;
  draft: string;
  remind: string;
  locale?: string;
  formatMonth?: (date: Date) => string;
  labels?: Partial<RenewalRingsLabels>;
};

/** Arabic count of days: 1, 2, 3–10, 11+. */
const arDays = (d: number) =>
  d === 1
    ? "يوم واحد"
    : d === 2
      ? "يومان"
      : d % 100 >= 3 && d % 100 <= 10
        ? `${d} أيام`
        : `${d} يومًا`;
const heDays = (d: number) => (d === 1 ? "יום אחד" : `${d} ימים`);

const heMonth = new Intl.DateTimeFormat("he-IL", { month: "long", timeZone: "UTC" });

const copy: Record<DemoLocale, Copy> = {
  en: {
    notes: {
      kestrel:
        "Notice window already closed, so it renews on Nov 20 at the current rate.",
      northvale:
        "First deadline: notice by Nov 8 or it auto-renews for a year. Seats in use fell 31% this quarter, worth renegotiating.",
      orrery: "Largest renewal in the window. Procurement wants a decision by Nov 15.",
      larkspur:
        "Just synced from the CRM: the pilot converts to an annual plan unless you give notice by Nov 21.",
    },
    draft: "Draft notice",
    remind: "Remind me",
  },
  he: {
    notes: {
      kestrel: "חלון ההודעה כבר נסגר, אז החוזה מתחדש ב־20 בנובמבר במחיר הנוכחי.",
      northvale:
        "המועד הראשון: הודעה עד 8 בנובמבר, אחרת החוזה מתחדש אוטומטית לשנה. השימוש במושבים ירד ב־31% ברבעון הזה, שווה לפתוח את התנאים מחדש.",
      orrery: "החידוש הגדול ביותר בחלון. הרכש מבקש החלטה עד 15 בנובמבר.",
      larkspur:
        "סונכרן הרגע מה־CRM: הפיילוט הופך לתוכנית שנתית אם לא תישלח הודעה עד 21 בנובמבר.",
    },
    draft: "ניסוח הודעה",
    remind: "תזכורת",
    locale: "he-IL",
    // Hebrew has no narrow month names: the first letter of each month.
    formatMonth: (d) => heMonth.format(d).charAt(0),
    labels: {
      title: "חידושים",
      heading: "יתרת תקופה",
      subtitle: (m) => `${m} החודשים הקרובים · מהיום`,
      pill: (c, d) => `${c} ב־${d} ימים`,
      shown: (s, t) => `${s} מתוך ${t} מוצגים`,
      today: "היום",
      daysLeft: (d) => (d === 1 ? "יום נותר" : "ימים נותרו"),
      inDays: (d) => `ב־${d} הימים הקרובים`,
      term: "תקופה",
      notice: "הודעה",
      windowDays: (d) => `${d} ימים`,
      dLeft: (d) => `נותרו ${heDays(d)}`,
      ends: "סיום",
      acv: "ערך שנתי",
      autoRenew: "חידוש אוטומטי",
      yes: "כן",
      no: "לא",
      noticeDue: "מועד הודעה",
      noNotice: "אין",
      noticeAt: (date, d) =>
        d < 0 ? `${date}, עבר` : d === 0 ? `${date}, היום` : `${date}, בעוד ${heDays(d)}`,
      hint: "הצביעו על טבעת, או עברו אליה ב־Tab, כדי לראות את החוזה.",
      empty: "אין חידושים בחלון הזה.",
      noticeUnit: (d) => `ב־${d} ימים`,
      autoRenewUnit: (t) => `מתוך ${t}`,
      upForRenewal: "לחידוש",
      chart: (h) => `${h}. החיצים עוברים בין החוזים, Enter בוחר.`,
      contract: (c) =>
        `${c.name}: מסתיים ב־${c.ends}, נותרו ${heDays(c.days)}, ערך שנתי ${c.value}, ${c.autoRenew ? "מתחדש אוטומטית" : "לא מתחדש אוטומטית"}, הודעה: ${c.notice}.`,
      summary: (h, t, m, w, d) =>
        `${h}: ${t} חוזים מסתיימים ב־${m} החודשים הקרובים, ${w} מהם בתוך ${d} ימים.`,
    },
  },
  ar: {
    notes: {
      kestrel: "انتهت مهلة الإشعار، لذا يتجدد العقد في 20 نوفمبر بالسعر الحالي.",
      northvale:
        "أول موعد نهائي: الإشعار قبل 8 نوفمبر وإلا يتجدد العقد تلقائيًا لعام كامل. انخفضت المقاعد المستخدمة 31% هذا الربع، ما يستحق إعادة التفاوض.",
      orrery: "أكبر تجديد في هذه الفترة. يريد قسم المشتريات قرارًا قبل 15 نوفمبر.",
      larkspur:
        "تمت مزامنته للتو من CRM: تتحول التجربة إلى خطة سنوية ما لم ترسل إشعارًا قبل 21 نوفمبر.",
    },
    draft: "صياغة إشعار",
    remind: "ذكّرني",
    locale: "ar",
    labels: {
      title: "التجديدات",
      heading: "المدة المتبقية",
      subtitle: (m) => `الأشهر الـ${m} القادمة · من اليوم`,
      pill: (c, d) => `${c} خلال ${d} يومًا`,
      shown: (s, t) => `${s} من ${t} معروضة`,
      today: "اليوم",
      daysLeft: (d) =>
        d === 1
          ? "يوم متبقٍ"
          : d === 2
            ? "يومان متبقيان"
            : d % 100 >= 3 && d % 100 <= 10
              ? "أيام متبقية"
              : "يومًا متبقيًا",
      inDays: (d) => `خلال ${d} يومًا`,
      term: "المدة",
      notice: "الإشعار",
      windowDays: (d) => `${d} يومًا`,
      dLeft: (d) => `متبقٍ ${arDays(d)}`,
      ends: "ينتهي",
      acv: "القيمة السنوية",
      autoRenew: "تجديد تلقائي",
      yes: "نعم",
      no: "لا",
      noticeDue: "موعد الإشعار",
      noNotice: "لا يوجد",
      noticeAt: (date, d) =>
        d < 0
          ? `${date}، انقضى`
          : d === 0
            ? `${date}، اليوم`
            : `${date}، بعد ${arDays(d)}`,
      hint: "أشر إلى حلقة أو انتقل إليها بـ Tab لعرض العقد.",
      empty: "لا تجديدات في هذه الفترة.",
      noticeUnit: (d) => `خلال ${d} يومًا`,
      autoRenewUnit: (t) => `من ${t}`,
      upForRenewal: "للتجديد",
      chart: (h) => `${h}. تنقّل بين العقود بالأسهم، واضغط Enter للتحديد.`,
      contract: (c) =>
        `${c.name}: ينتهي في ${c.ends}، متبقٍ ${arDays(c.days)}، القيمة السنوية ${c.value}، ${c.autoRenew ? "يتجدد تلقائيًا" : "لا يتجدد تلقائيًا"}، الإشعار: ${c.notice}.`,
      summary: (h, t, m, w, d) =>
        `${h}: ${t} عقدًا تنتهي خلال الأشهر الـ${m} القادمة، منها ${w} خلال ${d} يومًا.`,
    },
  },
};

const withNotes = (contracts: RenewalContract[], c: Copy) =>
  contracts.map((contract) =>
    contract.id in c.notes
      ? { ...contract, note: c.notes[contract.id as keyof Copy["notes"]] }
      : contract,
  );

const actions = (c: Copy): RenewalAction[] => [
  {
    label: c.draft,
    icon: PencilSimpleLine,
    onSelect: () => {},
    hidden: (contract) => !contract.noticeDays || contract.id === "kestrel",
  },
  { label: c.remind, icon: BellSimple, onSelect: () => {} },
];

type State = { added: boolean; selected: string | null };

export default function RenewalRingsDemo({
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
  // Rings sweep in, the agent points at the first notice deadline, then a new
  // contract syncs in and takes its place among the rings.
  const steps: MockStep<State>[] = autoplay
    ? [
        wait(1500),
        { delay: 0, apply: (s) => ({ ...s, selected: "northvale" }) },
        { delay: 2600, apply: (s) => ({ ...s, added: true }) },
        { delay: 1400, apply: (s) => ({ ...s, selected: "larkspur" }) },
      ]
    : [];
  const { state } = useMockRun<State>(
    autoplay ? { added: false, selected: null } : { added: true, selected: "northvale" },
    steps,
    { autoplay },
  );
  // Once someone picks a ring, the script stops steering the selection.
  const [picked, setPicked] = useState<string | null | undefined>(undefined);

  return (
    <RenewalRings
      contracts={withNotes(state.added ? [...CONTRACTS, LARKSPUR] : CONTRACTS, c)}
      today={TODAY}
      maxRings={7}
      selectedId={picked !== undefined ? picked : state.selected}
      onSelectedChange={setPicked}
      actions={actions(c)}
      locale={c.locale}
      formatMonth={c.formatMonth}
      labels={c.labels}
      details={!thumbnail}
      intro={autoplay}
    />
  );
}
