"use client";

import { ChatsCircle, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { EmptyState, type EmptyStateLabels } from "@/components/ui/empty-state";
import type { DemoLocale } from "@/components/docs/demo";

const copy: Record<
  DemoLocale,
  {
    loadFailed: string;
    loadFailedText: string;
    searchFailed: string;
    tryAgain: string;
    empty: string;
    emptyText: string;
    newChat: string;
    import: string;
    noMatches: string;
    noMatchesText: string;
    labels?: Partial<EmptyStateLabels>;
  }
> = {
  en: {
    loadFailed: "Couldn't load this conversation",
    loadFailedText:
      "The connection dropped while fetching history. Your messages are safe.",
    searchFailed: "Search failed",
    tryAgain: "Try again in a moment.",
    empty: "No conversations yet",
    emptyText: "Start a chat and it will show up here, grouped by day.",
    newChat: "New chat",
    import: "Import",
    noMatches: "No matches",
    noMatchesText: "Nothing matches “stripe”.",
  },
  he: {
    loadFailed: "לא הצלחנו לטעון את השיחה",
    loadFailedText: "החיבור נותק בזמן טעינת ההיסטוריה. ההודעות שלך שמורות.",
    searchFailed: "החיפוש נכשל",
    tryAgain: "נסו שוב בעוד רגע.",
    empty: "עדיין אין שיחות",
    emptyText: "התחילו צ׳אט והוא יופיע כאן, מקובץ לפי יום.",
    newChat: "צ׳אט חדש",
    import: "ייבוא",
    noMatches: "אין תוצאות",
    noMatchesText: 'לא נמצאה התאמה ל־"stripe".',
    labels: { retry: "ניסיון חוזר" },
  },
  ar: {
    loadFailed: "تعذّر تحميل هذه المحادثة",
    loadFailedText: "انقطع الاتصال أثناء جلب السجل. رسائلك محفوظة.",
    searchFailed: "فشل البحث",
    tryAgain: "حاول مرة أخرى بعد قليل.",
    empty: "لا توجد محادثات بعد",
    emptyText: "ابدأ محادثة وستظهر هنا مجمّعة حسب اليوم.",
    newChat: "محادثة جديدة",
    import: "استيراد",
    noMatches: "لا توجد نتائج",
    noMatchesText: "لا شيء يطابق «stripe».",
    labels: { retry: "إعادة المحاولة" },
  },
};

export default function EmptyStateDemo({
  variant,
  locale = "en",
}: {
  variant?: string;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  if (variant === "Error") {
    return (
      <div className="flex w-full max-w-md flex-col gap-3">
        <div className="rounded-2xl bg-surface-inset">
          <EmptyState
            tone="error"
            title={text.loadFailed}
            description={text.loadFailedText}
            onRetry={() => {}}
            labels={text.labels}
          />
        </div>
        <div className="rounded-2xl bg-surface-inset">
          <EmptyState
            compact
            tone="error"
            title={text.searchFailed}
            description={text.tryAgain}
            onRetry={() => {}}
            labels={text.labels}
          />
        </div>
      </div>
    );
  }
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="rounded-2xl bg-surface-inset">
        <EmptyState
          icon={ChatsCircle}
          title={text.empty}
          description={text.emptyText}
          action={{
            label: text.newChat,
            onClick: () => {},
            icon: Plus,
            iconWeight: "bold",
          }}
          secondaryAction={{ label: text.import, onClick: () => {} }}
        />
      </div>
      <div className="rounded-2xl bg-surface-inset">
        <EmptyState
          compact
          icon={MagnifyingGlass}
          title={text.noMatches}
          description={text.noMatchesText}
        />
      </div>
    </div>
  );
}
