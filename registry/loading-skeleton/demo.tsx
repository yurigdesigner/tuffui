"use client";

import {
  CardSkeleton,
  MessageSkeleton,
  Skeleton,
  SkeletonGroup,
} from "@/components/ui/loading-skeleton";
import type { DemoLocale } from "@/components/docs/demo";

const copy: Record<DemoLocale, { message: string; card: string }> = {
  en: { message: "Loading message", card: "Loading card" },
  he: { message: "טוען הודעה", card: "טוען כרטיס" },
  ar: { message: "جارٍ تحميل الرسالة", card: "جارٍ تحميل البطاقة" },
};

export default function LoadingSkeletonDemo({
  variant,
  locale = "en",
}: {
  variant?: string;
  locale?: DemoLocale;
}) {
  const text = copy[locale];
  if (variant === "Cards") {
    return (
      <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
        <CardSkeleton label={text.card} />
        <CardSkeleton label={text.card} />
        <CardSkeleton label={text.card} />
      </div>
    );
  }
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <SkeletonGroup label={text.message} className="flex justify-end">
        <Skeleton className="h-9 w-48 rounded-2xl" />
      </SkeletonGroup>
      <MessageSkeleton label={text.message} />
    </div>
  );
}
