import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { Toaster, toast } from "@/components/ui/toast-stack";

// Once, near the root of the app:
<Toaster />

// Anywhere:
toast.success("Link copied");
toast.error("Couldn't send", { description: "Check your connection." });
toast("Chat archived", { action: { label: "Undo", onClick: restore } });
toast.promise(exportChat(), {
  loading: "Exporting…",
  success: "Exported to Markdown",
  error: "Export failed",
});`,
  props: [
    {
      name: "visible",
      type: "number",
      default: "3",
      description:
        "Toaster. Toasts shown in the collapsed stack; hover fans them all out.",
    },
    {
      name: "position",
      type: '"bottom-right" | "bottom-center"',
      default: '"bottom-right"',
      description: "Toaster. Where the stack sits.",
    },
    {
      name: "toast(title, options?)",
      type: "(title: ReactNode, options?: ToastOptions) => string",
      description:
        "Shows a toast and returns its id. Also .success, .error, .loading, .promise and .dismiss(id).",
    },
  ],
  types: `type ToastOptions = {
  id?: string;           // reuse an id to update a toast in place
  description?: ReactNode;
  action?: { label: string; onClick: () => void };
  duration?: number;     // ms; default 4000, errors 6000, loading until updated
};`,
};
