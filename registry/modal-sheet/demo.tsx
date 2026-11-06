"use client";

import { ChatsCircle, Link, ShareNetwork } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/action-button";
import { Switch } from "@/components/ui/choice-controls";
import { Dialog, DialogClose, Sheet } from "@/components/ui/modal-sheet";
import { TextField } from "@/components/ui/text-field";

const chats = [
  "German onboarding emails",
  "Pricing page copy review",
  "npm license audit",
  "Migrate the CLI to commander",
  "Release notes for 2.4",
];

export default function ModalSheetDemo({ variant }: { variant?: string }) {
  const [shared, setShared] = useState(true);

  if (variant === "Sheet") {
    return (
      <Sheet
        title="Chats"
        description="Your recent conversations"
        trigger={<Button icon={ChatsCircle}>Open history</Button>}
      >
        <ul className="flex flex-col gap-0.5">
          {chats.map((chat) => (
            <li key={chat}>
              <DialogClose asChild>
                <button
                  type="button"
                  className="w-full truncate rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-foreground/[0.05]"
                >
                  {chat}
                </button>
              </DialogClose>
            </li>
          ))}
        </ul>
      </Sheet>
    );
  }

  return (
    <Dialog
      title="Share chat"
      description="Anyone with the link can read this conversation."
      trigger={<Button icon={ShareNetwork}>Share</Button>}
      footer={
        <>
          <DialogClose asChild>
            <Button variant="quiet">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="primary" icon={Link}>
              Copy link
            </Button>
          </DialogClose>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <TextField label="Link" readOnly value="https://acme.chat/s/8f3k2p" />
        <Switch
          label="Include files and tool output"
          description="Shared readers see attachments too."
          checked={shared}
          onCheckedChange={setShared}
        />
      </div>
    </Dialog>
  );
}
