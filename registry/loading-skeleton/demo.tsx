"use client";

import {
  CardSkeleton,
  MessageSkeleton,
  Skeleton,
  SkeletonGroup,
} from "@/components/ui/loading-skeleton";

export default function LoadingSkeletonDemo({ variant }: { variant?: string }) {
  if (variant === "Cards") {
    return (
      <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <SkeletonGroup label="Loading message" className="flex justify-end">
        <Skeleton className="h-9 w-48 rounded-2xl" />
      </SkeletonGroup>
      <MessageSkeleton />
    </div>
  );
}
