"use client";

import { X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useState } from "react";
import { IconButton } from "@/components/ui/action-button";
import { EASE_OUT, instant } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

// Radix's `asChild`, passed as a spread: the shadcn CLI rewrites a literal
// `asChild` attribute into Base UI's `render` prop for base-* styles, which
// would break these Radix parts after install.
const slot = { asChild: true } as const;

export type PopoverProps = {
  /** A single button-like element that toggles the panel. */
  trigger: React.ReactElement;
  children: React.ReactNode;
  /** Optional heading; also names the dialog for screen readers. */
  title?: React.ReactNode;
  /** Shows a close button in the header. */
  showClose?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

/**
 * A panel anchored to its trigger. It grows from the trigger, closes on
 * outside click or Esc, and keeps focus inside while open.
 */
export function Popover({
  trigger,
  children,
  title,
  showClose = false,
  side = "bottom",
  align = "center",
  open: openProp,
  onOpenChange,
  className,
}: PopoverProps) {
  const reduce = useReducedMotion();
  const [openState, setOpenState] = useState(false);
  // Opened with Enter/Space: appear instantly, the user is moving fast.
  const [viaKeyboard, setViaKeyboard] = useState(false);
  const open = openProp ?? openState;
  const still = viaKeyboard || !!reduce;

  const setOpen = (next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        {...slot}
        onPointerDown={() => setViaKeyboard(false)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") setViaKeyboard(true);
        }}
      >
        {trigger}
      </PopoverPrimitive.Trigger>
      <AnimatePresence>
        {open && (
          <PopoverPrimitive.Portal forceMount>
            <PopoverPrimitive.Content
              forceMount
              {...slot}
              side={side}
              align={align}
              sideOffset={8}
              collisionPadding={12}
              aria-label={typeof title === "string" ? title : undefined}
            >
              <motion.div
                initial={{ opacity: 0, scale: reduce ? 1 : 0.97 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: still ? instant : { duration: 0.18, ease: EASE_OUT },
                }}
                exit={{
                  opacity: 0,
                  scale: reduce ? 1 : 0.98,
                  transition: still ? instant : { duration: 0.12, ease: EASE_OUT },
                }}
                style={{
                  transformOrigin: "var(--radix-popover-content-transform-origin)",
                }}
                className={cn(
                  "z-50 w-72 rounded-[1.25rem] bg-surface-inset p-3 text-sm text-foreground shadow-[0_12px_32px_-12px_rgb(0_0_0/0.28)] outline-none dark:bg-surface-raised dark:shadow-[0_16px_40px_-12px_rgb(0_0_0/0.7)]",
                  className,
                )}
              >
                {(title || showClose) && (
                  <div className="mb-2 flex items-center gap-2 pl-1">
                    {title && (
                      <p className="flex-1 text-[0.9375rem] font-medium">{title}</p>
                    )}
                    {showClose && (
                      <PopoverPrimitive.Close {...slot}>
                        <IconButton
                          icon={X}
                          iconWeight="bold"
                          label="Close"
                          className="-my-1 ml-auto"
                        />
                      </PopoverPrimitive.Close>
                    )}
                  </div>
                )}
                {children}
              </motion.div>
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        )}
      </AnimatePresence>
    </PopoverPrimitive.Root>
  );
}

/** Closes the popover it's inside of, e.g. around a Save button. */
export const PopoverClose = PopoverPrimitive.Close;
