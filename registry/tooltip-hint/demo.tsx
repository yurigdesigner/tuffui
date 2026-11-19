"use client";

import { ArrowClockwise, Copy, ThumbsDown, ThumbsUp } from "@phosphor-icons/react";
import { IconButton } from "@/components/ui/action-button";
import { Tooltip } from "@/components/ui/tooltip-hint";
import type { DemoLocale } from "@/components/docs/demo";

const copy: Record<
  DemoLocale,
  {
    good: string;
    bad: string;
    copy: string;
    regenerate: string;
    hint: string;
    /** `align="start"` opens toward the reading direction: right in RTL. */
    fromStart: string;
    below: string;
    fromEnd: string;
  }
> = {
  en: {
    good: "Good answer",
    bad: "Bad answer",
    copy: "Copy",
    regenerate: "Regenerate",
    hint: "Hover one, then slide across — the rest open instantly.",
    fromStart: "Opens above, from the left",
    below: "Opens below",
    fromEnd: "Opens above, from the right",
  },
  he: {
    good: "תשובה טובה",
    bad: "תשובה גרועה",
    copy: "העתקה",
    regenerate: "יצירה מחדש",
    hint: "רחפו מעל אחד והחליקו הלאה — השאר נפתחים מיד.",
    fromStart: "נפתח למעלה, מימין",
    below: "נפתח למטה",
    fromEnd: "נפתח למעלה, משמאל",
  },
  ar: {
    good: "إجابة جيدة",
    bad: "إجابة سيئة",
    copy: "نسخ",
    regenerate: "إعادة التوليد",
    hint: "مرّر المؤشر فوق أحدها ثم انتقل إلى البقية — ستظهر فورًا.",
    fromStart: "يظهر في الأعلى، من اليمين",
    below: "يظهر في الأسفل",
    fromEnd: "يظهر في الأعلى، من اليسار",
  },
};

export default function TooltipDemo({
  variant,
  locale = "en",
}: {
  variant?: string;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  if (variant === "Placement") {
    return (
      <div className="flex items-center gap-6">
        <Tooltip content={text.fromStart} align="start">
          <IconButton icon={Copy} label={text.copy} variant="secondary" />
        </Tooltip>
        <Tooltip content={text.below} side="bottom">
          <IconButton
            icon={ArrowClockwise}
            iconWeight="bold"
            label={text.regenerate}
            variant="secondary"
          />
        </Tooltip>
        <Tooltip content={text.fromEnd} align="end">
          <IconButton icon={ThumbsUp} label={text.good} variant="secondary" />
        </Tooltip>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-1">
        <Tooltip content={text.good}>
          <IconButton icon={ThumbsUp} label={text.good} />
        </Tooltip>
        <Tooltip content={text.bad}>
          <IconButton icon={ThumbsDown} label={text.bad} />
        </Tooltip>
        <Tooltip content={text.copy}>
          <IconButton icon={Copy} label={text.copy} />
        </Tooltip>
        <Tooltip content={text.regenerate}>
          <IconButton icon={ArrowClockwise} iconWeight="bold" label={text.regenerate} />
        </Tooltip>
      </div>
      <p className="text-[0.8125rem] text-muted-foreground">{text.hint}</p>
    </div>
  );
}
