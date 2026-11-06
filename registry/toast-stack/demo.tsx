"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/action-button";
import { Toaster, toast } from "@/components/ui/toast-stack";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ToastStackDemo({
  variant,
  autoplay = true,
}: {
  variant?: string;
  autoplay?: boolean;
}) {
  const actions = variant === "Actions";

  // Play a few toasts so the stack is visible without clicking.
  useEffect(() => {
    if (!autoplay) return;
    const timers = [
      setTimeout(() => toast.success("Link copied"), 400),
      setTimeout(
        () =>
          actions
            ? toast("Chat archived", {
                description: "German onboarding emails",
                action: { label: "Undo", onClick: () => toast("Restored") },
              })
            : toast.promise(wait(1800), {
                loading: "Exporting conversation…",
                success: "Exported to Markdown",
                error: "Export failed",
              }),
        1200,
      ),
      setTimeout(
        () =>
          actions
            ? toast.error("Couldn't reach linear", {
                description: "The MCP server timed out.",
              })
            : toast("Memory updated", { description: "Prefers PRs opened as drafts" }),
        2200,
      ),
    ];
    return () => timers.forEach(clearTimeout);
  }, [autoplay, actions]);

  return (
    <div className="relative flex min-h-80 w-full max-w-xl items-start justify-center pt-6">
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => toast.success("Link copied")}>Success</Button>
        <Button
          onClick={() =>
            toast.error("Couldn't send", { description: "Check your connection." })
          }
        >
          Error
        </Button>
        <Button
          onClick={() =>
            toast.promise(wait(1500), {
              loading: "Saving…",
              success: "Saved",
              error: "Failed",
            })
          }
        >
          Promise
        </Button>
        <Button
          onClick={() =>
            toast("Message deleted", {
              action: { label: "Undo", onClick: () => toast("Restored") },
            })
          }
        >
          With action
        </Button>
      </div>
      {/* Contained to the preview here; in an app it sits fixed to the viewport. */}
      <Toaster className="absolute right-0 bottom-0 w-[min(22rem,100%)]" />
    </div>
  );
}
