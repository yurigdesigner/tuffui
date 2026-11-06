"use client";

import { ArrowClockwise, Copy, ThumbsDown, ThumbsUp } from "@phosphor-icons/react";
import { IconButton } from "@/components/ui/action-button";
import { Tooltip } from "@/components/ui/tooltip-hint";

export default function TooltipDemo({ variant }: { variant?: string }) {
  if (variant === "Placement") {
    return (
      <div className="flex items-center gap-6">
        <Tooltip content="Opens above, from the left" align="start">
          <IconButton icon={Copy} label="Copy" variant="secondary" />
        </Tooltip>
        <Tooltip content="Opens below" side="bottom">
          <IconButton
            icon={ArrowClockwise}
            iconWeight="bold"
            label="Regenerate"
            variant="secondary"
          />
        </Tooltip>
        <Tooltip content="Opens above, from the right" align="end">
          <IconButton icon={ThumbsUp} label="Good answer" variant="secondary" />
        </Tooltip>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-1">
        <Tooltip content="Good answer">
          <IconButton icon={ThumbsUp} label="Good answer" />
        </Tooltip>
        <Tooltip content="Bad answer">
          <IconButton icon={ThumbsDown} label="Bad answer" />
        </Tooltip>
        <Tooltip content="Copy">
          <IconButton icon={Copy} label="Copy" />
        </Tooltip>
        <Tooltip content="Regenerate">
          <IconButton icon={ArrowClockwise} iconWeight="bold" label="Regenerate" />
        </Tooltip>
      </div>
      <p className="text-[0.8125rem] text-muted-foreground">
        Hover one, then slide across — the rest open instantly.
      </p>
    </div>
  );
}
