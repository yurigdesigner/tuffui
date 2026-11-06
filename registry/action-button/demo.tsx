"use client";

import { ArrowClockwise, Check, PaperPlaneTilt, Trash, X } from "@phosphor-icons/react";
import { Button, IconButton } from "@/components/ui/action-button";

export default function ActionButtonDemo({ variant }: { variant?: string }) {
  if (variant === "States") {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="primary" loading>
            Applying
          </Button>
          <Button variant="secondary" disabled>
            Disabled
          </Button>
          <Button variant="primary" size="md" icon={Check} iconWeight="bold">
            Approve
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <IconButton
            icon={ArrowClockwise}
            iconWeight="bold"
            label="Retry"
            variant="secondary"
          />
          <IconButton icon={Trash} label="Delete" variant="danger" />
          <IconButton icon={X} iconWeight="bold" label="Dismiss" />
          <IconButton icon={PaperPlaneTilt} label="Send" variant="primary" size="md" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="primary">Approve</Button>
        <Button variant="secondary">Deny</Button>
        <Button variant="quiet">Cancel</Button>
        <Button variant="danger" icon={Trash}>
          Discard
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="primary" size="md" icon={PaperPlaneTilt}>
          Send
        </Button>
        <Button variant="secondary" size="md">
          Secondary md
        </Button>
      </div>
    </div>
  );
}
