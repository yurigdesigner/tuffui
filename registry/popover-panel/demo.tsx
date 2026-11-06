"use client";

import { Info, PencilSimple } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/action-button";
import { Popover, PopoverClose } from "@/components/ui/popover-panel";
import { TextField } from "@/components/ui/text-field";

export default function PopoverPanelDemo({ variant }: { variant?: string }) {
  const [title, setTitle] = useState("German onboarding emails");

  if (variant === "Form") {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm">{title}</p>
        <Popover
          title="Rename chat"
          showClose
          trigger={<Button icon={PencilSimple}>Rename</Button>}
        >
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const value = new FormData(event.currentTarget).get("title");
              if (typeof value === "string" && value.trim()) setTitle(value.trim());
            }}
          >
            <TextField name="title" label="Title" defaultValue={title} autoFocus />
            <div className="flex justify-end gap-2">
              <PopoverClose asChild>
                <Button variant="quiet">Cancel</Button>
              </PopoverClose>
              <Button type="submit" variant="primary">
                Save
              </Button>
            </div>
          </form>
        </Popover>
      </div>
    );
  }

  return (
    <Popover title="opus-5.5" trigger={<Button icon={Info}>Model details</Button>}>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 px-1 text-[0.8125rem]">
        <dt className="text-muted-foreground">Context</dt>
        <dd className="font-mono">200k tokens</dd>
        <dt className="text-muted-foreground">Output</dt>
        <dd className="font-mono">64k tokens</dd>
        <dt className="text-muted-foreground">Best for</dt>
        <dd>Long agentic tasks, careful edits</dd>
      </dl>
    </Popover>
  );
}
