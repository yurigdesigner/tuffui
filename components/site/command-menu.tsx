"use client";

import { Search } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Dialog, VisuallyHidden } from "radix-ui";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// cmdk and the result list load only when the palette first opens.
const CommandPalette = dynamic(() =>
  import("./command-palette").then((m) => m.CommandPalette),
);

export function CommandMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Search components"
          aria-keyshortcuts="Meta+K"
          className={cn(
            "group flex h-8 items-center gap-2 rounded-full bg-foreground/[0.05] pr-1.5 pl-3 text-sm text-muted-foreground transition-[color,background-color,scale] duration-150 ease-ui-out hover:bg-foreground/[0.08] hover:text-foreground active:scale-[0.97]",
            className,
          )}
        >
          <Search className="size-3.5" aria-hidden="true" />
          <span className="flex-1 text-left">Search components…</span>
          <kbd className="hidden rounded-full bg-surface-raised px-2 font-mono text-[0.6875rem] leading-5 sm:inline-block">
            ⌘K
          </kbd>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/60 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed top-[14vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-[1.375rem] bg-surface p-1.5"
          aria-describedby={undefined}
        >
          <VisuallyHidden.Root>
            <Dialog.Title>Search</Dialog.Title>
          </VisuallyHidden.Root>
          <CommandPalette onSelect={go} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
