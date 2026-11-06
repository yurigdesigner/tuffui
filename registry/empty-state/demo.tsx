"use client";

import { ChatsCircle, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";

export default function EmptyStateDemo({ variant }: { variant?: string }) {
  if (variant === "Error") {
    return (
      <div className="flex w-full max-w-md flex-col gap-3">
        <div className="rounded-2xl bg-surface-inset">
          <EmptyState
            tone="error"
            title="Couldn't load this conversation"
            description="The connection dropped while fetching history. Your messages are safe."
            onRetry={() => {}}
          />
        </div>
        <div className="rounded-2xl bg-surface-inset">
          <EmptyState
            compact
            tone="error"
            title="Search failed"
            description="Try again in a moment."
            onRetry={() => {}}
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
          title="No conversations yet"
          description="Start a chat and it will show up here, grouped by day."
          action={{
            label: "New chat",
            onClick: () => {},
            icon: Plus,
            iconWeight: "bold",
          }}
          secondaryAction={{ label: "Import", onClick: () => {} }}
        />
      </div>
      <div className="rounded-2xl bg-surface-inset">
        <EmptyState
          compact
          icon={MagnifyingGlass}
          title="No matches"
          description="Nothing matches “stripe”."
        />
      </div>
    </div>
  );
}
