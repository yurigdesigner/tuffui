"use client";

import {
  ArrowClockwise,
  Copy,
  DotsThree,
  GitBranch,
  PencilSimple,
  PushPin,
  Share,
  Trash,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Button, IconButton } from "@/components/ui/action-button";
import { ContextMenu, Menu, type MenuGroup } from "@/components/ui/action-menu";

function useGroups(): MenuGroup[] {
  const [reasoning, setReasoning] = useState(true);
  const [model, setModel] = useState("opus");
  return [
    {
      items: [
        { id: "copy", label: "Copy", icon: Copy, shortcut: "⌘C" },
        { id: "edit", label: "Edit prompt", icon: PencilSimple, shortcut: "E" },
        {
          id: "regenerate",
          type: "submenu",
          label: "Regenerate with",
          icon: ArrowClockwise,
          items: [
            {
              id: "model",
              type: "radio",
              value: model,
              onValueChange: setModel,
              options: [
                { value: "opus", label: "opus-5.5" },
                { value: "sonnet", label: "sonnet-5.5" },
                { value: "haiku", label: "haiku-5.5" },
              ],
            },
          ],
        },
        { id: "branch", label: "Branch from here", icon: GitBranch },
      ],
    },
    {
      label: "View",
      items: [
        {
          id: "reasoning",
          type: "checkbox",
          label: "Show reasoning",
          checked: reasoning,
          onCheckedChange: setReasoning,
        },
        {
          id: "pin",
          label: "Pin message",
          icon: PushPin,
          description: "Keeps it in context",
        },
        { id: "share", label: "Share", icon: Share, disabled: true },
      ],
    },
    {
      items: [
        { id: "delete", label: "Delete", icon: Trash, destructive: true, shortcut: "⌫" },
      ],
    },
  ];
}

export default function ActionMenuDemo({ variant }: { variant?: string }) {
  const groups = useGroups();

  if (variant === "Context") {
    return (
      <ContextMenu groups={groups}>
        <div
          tabIndex={0}
          className="w-full max-w-sm cursor-context-menu rounded-2xl bg-surface p-4 text-sm outline-none"
        >
          <p className="mb-1 text-[0.8125rem] text-muted-foreground">
            Right-click this answer
          </p>
          Cache resized images by content hash in{" "}
          <code className="font-mono">.pressd/cache</code> so repeat builds skip sharp.
        </div>
      </ContextMenu>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Menu
        groups={groups}
        trigger={
          <IconButton
            icon={DotsThree}
            iconWeight="bold"
            label="Message actions"
            variant="secondary"
          />
        }
      />
      <Menu groups={groups} align="end" trigger={<Button>Actions</Button>} />
    </div>
  );
}
