// TUFFUI (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Free to use. If it helps you, you can support it: https://ko-fi.com/yurigokoryan
"use client";

import { X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { createContext, useContext, useLayoutEffect, useRef, useState } from "react";
import { IconButton } from "@/components/ui/action-button";
import { EASE_OUT } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

// Radix's `asChild`, passed as a spread: the shadcn CLI rewrites a literal
// `asChild` attribute into Base UI's `render` prop for base-* styles, which
// would break these Radix parts after install.
const slot = { asChild: true } as const;

// Drawer curve for sheets; dialogs use the regular strong ease-out.
const DRAWER = [0.32, 0.72, 0, 1] as const;

type OverlayProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Optional element that opens it; otherwise control `open` yourself. */
  trigger?: React.ReactElement;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  /** Actions row, usually Buttons. Sits at the bottom, end-aligned. */
  footer?: React.ReactNode;
  /** UI strings, for translating. */
  labels?: Partial<ModalLabels>;
  className?: string;
};

export type ModalLabels = {
  close: string;
};

const defaultLabels: ModalLabels = { close: "Close" };
const Labels = createContext(defaultLabels);

/**
 * The portal renders under <body>, outside any `dir="rtl"` wrapper, so the
 * direction is read where the component sits and set on the panel itself.
 */
function useDirection(open: boolean) {
  const marker = useRef<HTMLSpanElement>(null);
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr");
  useLayoutEffect(() => {
    const read = () =>
      marker.current && getComputedStyle(marker.current).direction === "rtl"
        ? "rtl"
        : "ltr";
    setDir(read());
  }, [open]);
  return { dir, marker: <span ref={marker} hidden /> };
}

function useOpen(open?: boolean, onOpenChange?: (open: boolean) => void) {
  const [state, setState] = useState(false);
  return [
    open ?? state,
    (next: boolean) => {
      setState(next);
      onOpenChange?.(next);
    },
  ] as const;
}

const surface =
  "bg-surface text-foreground shadow-[0_24px_64px_-16px_rgb(0_0_0/0.35)] outline-none dark:shadow-[0_24px_64px_-16px_rgb(0_0_0/0.8)]";

function Overlay() {
  return (
    <DialogPrimitive.Overlay forceMount {...slot}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.2, ease: EASE_OUT } }}
        exit={{ opacity: 0, transition: { duration: 0.15, ease: EASE_OUT } }}
        className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60"
      />
    </DialogPrimitive.Overlay>
  );
}

function Header({ title, description }: Pick<OverlayProps, "title" | "description">) {
  const labels = useContext(Labels);
  return (
    <div className="flex items-start gap-3 ps-2.5 pe-1 pt-1.5 pb-3">
      <div className="min-w-0 flex-1 pt-1">
        <DialogPrimitive.Title className="text-[0.9375rem] font-medium">
          {title}
        </DialogPrimitive.Title>
        {description ? (
          <DialogPrimitive.Description className="mt-0.5 text-[0.8125rem] text-muted-foreground">
            {description}
          </DialogPrimitive.Description>
        ) : (
          <DialogPrimitive.Description className="sr-only">
            {title}
          </DialogPrimitive.Description>
        )}
      </div>
      <DialogPrimitive.Close {...slot}>
        <IconButton icon={X} iconWeight="bold" label={labels.close} />
      </DialogPrimitive.Close>
    </div>
  );
}

const sizes = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-xl" } as const;

export type DialogProps = OverlayProps & { size?: keyof typeof sizes };

/** Centered modal. Focus is trapped, the page doesn't scroll, Esc and the backdrop close it. */
export function Dialog({
  open: openProp,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  size = "md",
  labels,
  className,
}: DialogProps) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useOpen(openProp, onOpenChange);
  const { dir, marker } = useDirection(open);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      {marker}
      {trigger && <DialogPrimitive.Trigger {...slot}>{trigger}</DialogPrimitive.Trigger>}
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <Overlay />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <DialogPrimitive.Content forceMount {...slot}>
                <motion.div
                  dir={dir}
                  initial={{ opacity: 0, scale: reduce ? 1 : 0.96 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    transition: { duration: 0.22, ease: EASE_OUT },
                  }}
                  exit={{
                    opacity: 0,
                    scale: reduce ? 1 : 0.98,
                    transition: { duration: 0.15, ease: EASE_OUT },
                  }}
                  className={cn(
                    surface,
                    "w-full rounded-[1.375rem] p-1.5",
                    sizes[size],
                    className,
                  )}
                >
                  <Labels.Provider value={{ ...defaultLabels, ...labels }}>
                    <Header title={title} description={description} />
                  </Labels.Provider>
                  {children && (
                    <div className="rounded-2xl bg-surface-inset p-4 text-sm">
                      {children}
                    </div>
                  )}
                  {footer && (
                    <div className="flex flex-wrap items-center justify-end gap-2 px-1.5 pt-3 pb-1.5">
                      {footer}
                    </div>
                  )}
                </motion.div>
              </DialogPrimitive.Content>
            </div>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

const sides = {
  left: {
    className: "inset-y-2 left-2 w-[min(22rem,calc(100vw-1rem))]",
    hidden: { x: "-105%" },
  },
  right: {
    className: "inset-y-2 right-2 w-[min(24rem,calc(100vw-1rem))]",
    hidden: { x: "105%" },
  },
  bottom: { className: "inset-x-2 bottom-2 max-h-[85vh]", hidden: { y: "105%" } },
} as const;

type Side = "start" | "end" | keyof typeof sides;

/** Start and end resolve to left or right by the reading direction. */
const physical = (side: Side, dir: "ltr" | "rtl") =>
  side === "start"
    ? dir === "rtl"
      ? "right"
      : "left"
    : side === "end"
      ? dir === "rtl"
        ? "left"
        : "right"
      : side;

export type SheetProps = OverlayProps & { side?: Side };

/** Panel that slides in from an edge — chat history on mobile, settings, details. */
export function Sheet({
  open: openProp,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  side = "start",
  labels,
  className,
}: SheetProps) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useOpen(openProp, onOpenChange);
  const { dir, marker } = useDirection(open);
  const edge = sides[physical(side, dir)];
  const hidden = reduce ? { opacity: 0 } : edge.hidden;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      {marker}
      {trigger && <DialogPrimitive.Trigger {...slot}>{trigger}</DialogPrimitive.Trigger>}
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <Overlay />
            <DialogPrimitive.Content forceMount {...slot}>
              <motion.div
                dir={dir}
                initial={hidden}
                animate={{
                  x: 0,
                  y: 0,
                  opacity: 1,
                  transition: { duration: reduce ? 0.2 : 0.4, ease: DRAWER },
                }}
                exit={{ ...hidden, transition: { duration: 0.22, ease: DRAWER } }}
                className={cn(
                  surface,
                  "fixed z-50 flex flex-col rounded-[1.375rem] p-1.5",
                  edge.className,
                  className,
                )}
              >
                <Labels.Provider value={{ ...defaultLabels, ...labels }}>
                  <Header title={title} description={description} />
                </Labels.Provider>
                {children && (
                  <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl bg-surface-inset p-2 text-sm">
                    {children}
                  </div>
                )}
                {footer && (
                  <div className="flex flex-wrap items-center justify-end gap-2 px-1.5 pt-3 pb-1.5">
                    {footer}
                  </div>
                )}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

/** Closes the dialog or sheet it's inside of, e.g. around a Cancel button. */
export const DialogClose = DialogPrimitive.Close;
