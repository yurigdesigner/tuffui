"use client";

import { Menu, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { useState } from "react";
import { Logo } from "./logo";
import { PromoCompact } from "./promo";
import { SidebarNav } from "./sidebar-nav";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Open navigation"
          className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-[color,background-color,scale] duration-150 ease-ui-out hover:bg-foreground/[0.06] hover:text-foreground active:scale-[0.97] lg:hidden"
        >
          <Menu className="size-4" aria-hidden="true" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/70 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-2 left-2 z-50 flex w-[min(20rem,85vw)] flex-col rounded-[1.375rem] bg-surface p-1.5 data-[state=open]:animate-slide-in-left"
        >
          <div className="flex h-12 items-center justify-between pr-1 pl-3">
            <Dialog.Title asChild>
              <div>
                <Logo />
              </div>
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close navigation"
              className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-[color,background-color,scale] duration-150 ease-ui-out hover:bg-foreground/[0.06] hover:text-foreground active:scale-[0.97]"
            >
              <X className="size-4" aria-hidden="true" />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto rounded-2xl bg-surface-inset px-2 py-4">
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
          <PromoCompact campaign="mobile-nav" className="mt-1.5" />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
