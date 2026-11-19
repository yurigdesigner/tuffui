"use client";

import { useState } from "react";
import type { DemoLocale } from "@/components/docs/demo";
import { useMockRun, wait, type MockStep } from "@/registry/use-mock-run/use-mock-run";
import {
  ConversationList,
  type Conversation,
  type ConversationListLabels,
} from "./conversation-list";

const hours = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

/** Keeps a Latin name or version in reading order inside RTL text. */
const ltr = (text: string) => `\u2066${text}\u2069`;

type Copy = {
  titles: Record<string, string>;
  newChat: string;
  labels?: Partial<ConversationListLabels>;
};

/** The same sidebar in each demo language; Hebrew and Arabic show the RTL layout. */
const copy: Record<DemoLocale, Copy> = {
  en: {
    titles: {
      glossary: "Product glossary for translators",
      de: "German onboarding emails",
      og: "OG images for the blog",
      pricing: "Pricing page copy review",
      licenses: "npm license audit",
      cli: "Migrate the CLI to commander",
      release: "Release notes for 2.4",
      invoices: "Backfill March invoices",
    },
    newChat: "New chat",
  },
  he: {
    titles: {
      glossary: "מילון מונחים למתרגמים",
      de: "מיילי הצטרפות בגרמנית",
      og: `תמונות ${ltr("OG")} לבלוג`,
      pricing: "עריכת הטקסטים בעמוד המחירים",
      licenses: `בדיקת רישיונות ${ltr("npm")}`,
      cli: `העברת ה־${ltr("CLI")} ל־${ltr("commander")}`,
      release: `הערות גרסה ל־${ltr("2.4")}`,
      invoices: "השלמת החשבוניות של מרץ",
    },
    newChat: "שיחה חדשה",
    labels: {
      chats: "שיחות",
      newChat: "שיחה חדשה",
      search: "חיפוש בשיחות",
      clearSearch: "ניקוי החיפוש",
      noResults: "לא נמצאו שיחות",
      tryAnother: "אפשר לנסות חיפוש אחר.",
      empty: "עדיין אין שיחות",
      groups: {
        pinned: "מוצמדות",
        today: "היום",
        yesterday: "אתמול",
        week: "7 הימים האחרונים",
        older: "ישנות יותר",
        recent: "אחרונות",
      },
      agentWorking: "הסוכן עובד",
      archived: (title) => `„${title}” הועברה לארכיון`,
      deleted: (title) => `„${title}” נמחקה`,
      undo: "ביטול",
      archivedStatus: (title) => `${title} הועברה לארכיון. אפשר לבטל.`,
      deletedStatus: (title) => `${title} נמחקה. אפשר לבטל.`,
      chatTitle: "שם השיחה",
      actionsFor: (title) => `פעולות עבור ${title}`,
      pin: "הצמדה",
      unpin: "ביטול הצמדה",
      rename: "שינוי שם",
      archive: "העברה לארכיון",
      delete: "מחיקה",
    },
  },
  ar: {
    titles: {
      glossary: "مسرد المنتج للمترجمين",
      de: "رسائل التسجيل بالألمانية",
      og: `صور ${ltr("OG")} للمدونة`,
      pricing: "مراجعة نصوص صفحة الأسعار",
      licenses: `تدقيق تراخيص ${ltr("npm")}`,
      cli: `نقل ${ltr("CLI")} إلى ${ltr("commander")}`,
      release: `ملاحظات إصدار ${ltr("2.4")}`,
      invoices: "استكمال فواتير مارس",
    },
    newChat: "محادثة جديدة",
    labels: {
      chats: "المحادثات",
      newChat: "محادثة جديدة",
      search: "ابحث في المحادثات",
      clearSearch: "مسح البحث",
      noResults: "لا توجد محادثات مطابقة",
      tryAnother: "جرّب بحثًا آخر.",
      empty: "لا توجد محادثات بعد",
      groups: {
        pinned: "المثبّتة",
        today: "اليوم",
        yesterday: "أمس",
        week: "آخر 7 أيام",
        older: "الأقدم",
        recent: "الأخيرة",
      },
      agentWorking: "الوكيل يعمل",
      archived: (title) => `نُقلت «${title}» إلى الأرشيف`,
      deleted: (title) => `حُذفت «${title}»`,
      undo: "تراجع",
      archivedStatus: (title) => `نُقلت ${title} إلى الأرشيف. يمكنك التراجع.`,
      deletedStatus: (title) => `حُذفت ${title}. يمكنك التراجع.`,
      chatTitle: "عنوان المحادثة",
      actionsFor: (title) => `إجراءات ${title}`,
      pin: "تثبيت",
      unpin: "إلغاء التثبيت",
      rename: "إعادة التسمية",
      archive: "أرشفة",
      delete: "حذف",
    },
  },
};

const chats = (titles: Record<string, string>): Conversation[] => [
  { id: "glossary", title: titles.glossary, updatedAt: hours(70), pinned: true },
  { id: "de", title: titles.de, updatedAt: hours(0.2), running: true },
  { id: "og", title: titles.og, updatedAt: hours(2) },
  { id: "pricing", title: titles.pricing, updatedAt: hours(5) },
  { id: "licenses", title: titles.licenses, updatedAt: hours(27) },
  { id: "cli", title: titles.cli, updatedAt: hours(30) },
  { id: "release", title: titles.release, updatedAt: hours(80) },
  { id: "invoices", title: titles.invoices, updatedAt: hours(120) },
];

type State = { chats: Conversation[]; active: string };

const script: MockStep<State>[] = [
  wait(1800),
  {
    delay: 0,
    apply: (s) => ({
      ...s,
      chats: s.chats.map((c) => (c.id === "og" ? { ...c, pinned: true } : c)),
    }),
  },
  { delay: 1600, apply: (s) => ({ ...s, active: "pricing" }) },
  {
    delay: 2200,
    apply: (s) => ({
      ...s,
      chats: s.chats.map((c) => (c.id === "de" ? { ...c, running: false } : c)),
    }),
  },
];

export default function ConversationListDemo({
  variant,
  autoplay = true,
  locale = "en",
}: {
  variant?: string;
  autoplay?: boolean;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  const { state, setState } = useMockRun<State>(
    { chats: chats(text.titles), active: "de" },
    script,
    { autoplay },
  );
  const [count, setCount] = useState(1);
  const update = (id: string, patch: Partial<Conversation>) =>
    setState((s) => ({
      ...s,
      chats: s.chats.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  const drop = (c: Conversation) =>
    setState((s) => ({ ...s, chats: s.chats.filter((x) => x.id !== c.id) }));

  return (
    <ConversationList
      data={state.chats}
      activeId={state.active}
      labels={text.labels}
      variant={variant === "Compact" ? "compact" : "sidebar"}
      onSelect={(c) => setState((s) => ({ ...s, active: c.id }))}
      onNew={() => {
        const id = `new-${count}`;
        setCount((n) => n + 1);
        setState((s) => ({
          active: id,
          chats: [
            { id, title: text.newChat, updatedAt: new Date().toISOString() },
            ...s.chats,
          ],
        }));
      }}
      onRename={(c, title) => update(c.id, { title })}
      onPin={(c, pinned) => update(c.id, { pinned })}
      onArchive={drop}
      onDelete={drop}
    />
  );
}
