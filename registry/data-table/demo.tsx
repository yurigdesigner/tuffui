"use client";

import { Envelope, Export } from "@phosphor-icons/react";
import { Button } from "@/components/ui/action-button";
import { StatusPill } from "@/components/ui/status-pill";
import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  DataTable,
  type DataColumn,
  type DataRow,
  type DataTableLabels,
} from "./data-table";

type Customer = DataRow & {
  name: string;
  plan: string;
  seats: number;
  mrr: number;
  growth: number;
  health: string;
};

const customers: Customer[] = [
  {
    id: "c1",
    name: "Northwind Labs",
    plan: "Enterprise",
    seats: 420,
    mrr: 18_400,
    growth: 12.4,
    health: "Healthy",
  },
  {
    id: "c2",
    name: "Halcyon Health",
    plan: "Enterprise",
    seats: 310,
    mrr: 14_950,
    growth: 8.1,
    health: "Healthy",
  },
  {
    id: "c3",
    name: "Brightline Freight",
    plan: "Team",
    seats: 188,
    mrr: 9_020,
    growth: -3.2,
    health: "At risk",
  },
  {
    id: "c4",
    name: "Copperleaf Studio",
    plan: "Team",
    seats: 96,
    mrr: 4_610,
    growth: 21.7,
    health: "Healthy",
  },
  {
    id: "c5",
    name: "Ostrava Robotics",
    plan: "Enterprise",
    seats: 240,
    mrr: 12_300,
    growth: 4.9,
    health: "Watch",
  },
  {
    id: "c6",
    name: "Pinecrest Schools",
    plan: "Pro",
    seats: 64,
    mrr: 2_880,
    growth: 15.3,
    health: "Healthy",
  },
  {
    id: "c7",
    name: "Meridian Legal",
    plan: "Team",
    seats: 120,
    mrr: 5_760,
    growth: -8.6,
    health: "At risk",
  },
  {
    id: "c8",
    name: "Saltmarsh Coffee",
    plan: "Pro",
    seats: 22,
    mrr: 990,
    growth: 2.2,
    health: "Healthy",
  },
  {
    id: "c9",
    name: "Quarry & Co",
    plan: "Team",
    seats: 140,
    mrr: 6_720,
    growth: 6.4,
    health: "Watch",
  },
];

const tone = { Healthy: "positive", Watch: "warning", "At risk": "negative" } as const;

/** Keeps a range like "1–6" in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

const arabicPlural = (n: number, one: string, two: string, few: string, many: string) =>
  n === 1 ? one : n === 2 ? two : n % 100 >= 3 && n % 100 <= 10 ? few : many;

type Copy = {
  title: string;
  columns: Record<"name" | "plan" | "seats" | "mrr" | "growth" | "health", string>;
  health: Record<keyof typeof tone, string>;
  exportLabel: string;
  draft: string;
  labels?: Partial<DataTableLabels>;
};

/** Customer and plan names stay as they are; Hebrew and Arabic show the RTL layout. */
const copy: Record<DemoLocale, Copy> = {
  en: {
    title: "Top customers by MRR",
    columns: {
      name: "Customer",
      plan: "Plan",
      seats: "Seats",
      mrr: "MRR",
      growth: "30d",
      health: "Health",
    },
    health: { Healthy: "Healthy", Watch: "Watch", "At risk": "At risk" },
    exportLabel: "Export",
    draft: "Draft follow-up",
  },
  he: {
    title: "הלקוחות המובילים לפי MRR",
    columns: {
      name: "לקוח",
      plan: "חבילה",
      seats: "משתמשים",
      mrr: "MRR",
      growth: "30 יום",
      health: "מצב",
    },
    health: { Healthy: "תקין", Watch: "במעקב", "At risk": "בסיכון" },
    exportLabel: "ייצוא",
    draft: "טיוטת מעקב",
    labels: {
      rows: (count) => (count === 1 ? "שורה" : "שורות"),
      copyCsv: "העתקה כ־CSV",
      copiedCsv: "הועתק כ־CSV",
      filter: "סינון שורות",
      clearFilter: "ניקוי החיפוש",
      selected: (count) => (count === 1 ? "נבחרה" : "נבחרו"),
      clearSelection: "ניקוי",
      selectAll: "בחירת כל השורות בעמוד",
      selectRow: (name) => `בחירת ${name}`,
      noMatch: "אין שורות תואמות",
      noMatchDescription: (query) => `אין תוצאות עבור „${query}”.`,
      range: (from, to, total) => `${ltr(`${from}–${to}`)} מתוך ${total}`,
      previousPage: "העמוד הקודם",
      nextPage: "העמוד הבא",
      status: (count, sort) =>
        `${count} שורות${sort ? `, ממוינות לפי ${sort.label} בסדר ${sort.dir === "asc" ? "עולה" : "יורד"}` : ""}`,
    },
  },
  ar: {
    title: "أكبر العملاء حسب الإيراد الشهري",
    columns: {
      name: "العميل",
      plan: "الباقة",
      seats: "المقاعد",
      mrr: "الإيراد الشهري",
      growth: "30 يومًا",
      health: "الحالة",
    },
    health: { Healthy: "جيدة", Watch: "تحت المراقبة", "At risk": "معرّض للخطر" },
    exportLabel: "تصدير",
    draft: "صياغة متابعة",
    labels: {
      rows: (count) => arabicPlural(count, "صف", "صفوف", "صفوف", "صفًا"),
      copyCsv: "نسخ بصيغة CSV",
      copiedCsv: "تم النسخ بصيغة CSV",
      filter: "تصفية الصفوف",
      clearFilter: "مسح البحث",
      selected: (count) => (count === 1 ? "محدد" : "محددة"),
      clearSelection: "مسح",
      selectAll: "تحديد كل صفوف هذه الصفحة",
      selectRow: (name) => `تحديد ${name}`,
      noMatch: "لا توجد صفوف مطابقة",
      noMatchDescription: (query) => `لا شيء يطابق «${query}».`,
      range: (from, to, total) => `${ltr(`${from}–${to}`)} من ${total}`,
      previousPage: "الصفحة السابقة",
      nextPage: "الصفحة التالية",
      status: (count, sort) =>
        `${count} ${arabicPlural(count, "صف", "صفوف", "صفوف", "صفًا")}${sort ? `، مرتبة حسب ${sort.label} ${sort.dir === "asc" ? "تصاعديًا" : "تنازليًا"}` : ""}`,
    },
  },
};

const columnsFor = (text: Copy): DataColumn<Customer>[] => [
  { key: "name", label: text.columns.name, sortable: true },
  { key: "plan", label: text.columns.plan, sortable: true },
  { key: "seats", label: text.columns.seats, align: "right", sortable: true },
  {
    key: "mrr",
    label: text.columns.mrr,
    align: "right",
    sortable: true,
    format: (v) => `$${Number(v).toLocaleString("en-US")}`,
  },
  {
    key: "growth",
    label: text.columns.growth,
    align: "right",
    sortable: true,
    format: (v) => `${Number(v) > 0 ? "+" : ""}${v}%`,
  },
  {
    key: "health",
    label: text.columns.health,
    format: (v) => (
      <StatusPill size="sm" tone={tone[v as keyof typeof tone] ?? "neutral"}>
        {text.health[v as keyof typeof tone] ?? String(v)}
      </StatusPill>
    ),
  },
];

// Selectable demo picks the two at-risk accounts, as an agent would before a follow-up.
const pick: MockStep<string[]>[] = [
  { delay: 1400, apply: () => ["c3"] },
  { delay: 700, apply: (s) => [...s, "c7"] },
];

export default function DataTableDemo({
  variant = "Table",
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const selectable = variant === "Selectable";
  const { state, setState } = useMockRun<string[]>([], selectable ? pick : [], {
    autoplay,
  });

  return (
    <DataTable
      title={text.title}
      data={customers}
      columns={columnsFor(text)}
      labels={text.labels}
      selectable={selectable}
      selected={state}
      onSelectedChange={setState}
      actions={() => (
        <>
          <Button size="sm" icon={Export}>
            {text.exportLabel}
          </Button>
          <Button size="sm" variant="primary" icon={Envelope}>
            {text.draft}
          </Button>
        </>
      )}
    />
  );
}
