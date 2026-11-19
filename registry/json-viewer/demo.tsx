"use client";

import type { DemoLocale } from "@/components/docs/demo";
import { JsonViewer, type JsonValue, type JsonViewerLabels } from "./json-viewer";

const order: JsonValue = {
  id: "ord_7Kq2",
  status: "requires_review",
  customer: { name: "Mira Hoffmann", email: "mira@example.com", locale: "de-DE" },
  items: [
    { sku: "PLAN-TEAM", name: "Team plan", quantity: 5, price: 18 },
    { sku: "ADDON-SSO", name: "SSO add-on", quantity: 1, price: 40 },
    { sku: "ADDON-AUDIT", name: "Audit log", quantity: 1, price: 25 },
  ],
  totals: { subtotal: 155, tax: 29.45, currency: "EUR" },
  flags: { trial: false, coupon: null },
};

/** Keeps arrow keys and paths in reading order inside RTL text. */
const ltr = (text: string) => `⁦${text}⁩`;

/** The tool output stays as JSON; only the viewer's own strings change. */
const labels: Record<DemoLocale, Partial<JsonViewerLabels> | undefined> = {
  en: undefined,
  he: {
    summary: (values, branches) => `${values} ערכים · ${branches} אובייקטים ומערכים`,
    copyJson: "העתקת ה־JSON",
    copied: "הועתק",
    expandAll: "פתיחת הכול",
    collapseAll: "סגירת הכול",
    search: "חיפוש מפתחות וערכים",
    clearSearch: "ניקוי החיפוש",
    copyPath: (path) => `העתקת הנתיב ${ltr(path)}`,
    copyValue: (path) => `העתקת הערך של ${ltr(path)}`,
    pathCopied: "הנתיב הועתק",
    noMatch: (query) => `אין תוצאות עבור „${query}”.`,
    matches: (count) => (count === 1 ? "תוצאה אחת" : `${count} תוצאות`),
    hint: `לחיצה על מפתח מעתיקה את הנתיב · ${ltr("↑↓")} למעבר, ${ltr("→ ←")} לפתיחה וסגירה`,
    copiedPathStatus: (path) => `הועתק ${ltr(path)}`,
    valueCopied: "הערך הועתק",
  },
  ar: {
    summary: (values, branches) => `${values} قيمة · ${branches} كائنات ومصفوفات`,
    copyJson: "نسخ JSON",
    copied: "تم النسخ",
    expandAll: "توسيع الكل",
    collapseAll: "طي الكل",
    search: "ابحث في المفاتيح والقيم",
    clearSearch: "مسح البحث",
    copyPath: (path) => `نسخ المسار ${ltr(path)}`,
    copyValue: (path) => `نسخ قيمة ${ltr(path)}`,
    pathCopied: "تم نسخ المسار",
    noMatch: (query) => `لا شيء يطابق «${query}».`,
    matches: (count) =>
      count === 1
        ? "نتيجة واحدة"
        : count === 2
          ? "نتيجتان"
          : count % 100 >= 3 && count % 100 <= 10
            ? `${count} نتائج`
            : `${count} نتيجة`,
    hint: `انقر على مفتاح لنسخ مساره · ${ltr("↑↓")} للتنقل، ${ltr("→ ←")} للفتح والإغلاق`,
    copiedPathStatus: (path) => `تم نسخ ${ltr(path)}`,
    valueCopied: "تم نسخ القيمة",
  },
};

export default function JsonViewerDemo({
  variant,
  locale = "en",
}: {
  variant?: string;
  locale?: DemoLocale;
}) {
  return (
    <JsonViewer
      title="get_order"
      data={order}
      view={variant === "Raw" ? "raw" : "tree"}
      defaultDepth={2}
      labels={labels[locale]}
    />
  );
}
