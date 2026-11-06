import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { useState } from "react";
import { ConfirmationCard } from "@/components/ui/confirmation-card";

// Before an agent spends money or changes something real, show what it will do.
export function ConfirmDeploy({ plan }: { plan: DeployPlan }) {
  const [items, setItems] = useState(plan.items);
  const [status, setStatus] = useState<"review" | "confirming" | "done">("review");

  return (
    <ConfirmationCard
      data={{ title: plan.title, items, fees: plan.fees, warnings: plan.warnings, reference: plan.id }}
      status={status}
      onItemsChange={setItems}
      onConfirm={async (final) => {
        setStatus("confirming");
        await agent.approve(plan.callId, final);
        setStatus("done");
      }}
      onUndo={() => agent.revert(plan.callId)}
      onCancel={() => agent.deny(plan.callId)}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "{ title; subtitle?; items: ConfirmationItem[]; fees?; warnings?; reference?; doneAt? }",
      required: true,
      description:
        "What the agent is about to do. Totals are computed from items × quantity plus fees.",
    },
    {
      name: "status",
      type: '"review" | "confirming" | "done"',
      default: '"review"',
      description: "Review with editable items, a loading confirm, or the done summary.",
    },
    {
      name: "onItemsChange",
      type: "(items: ConfirmationItem[]) => void",
      description: "Called when a quantity changes or an item is removed.",
    },
    {
      name: "onConfirm",
      type: "(items: ConfirmationItem[]) => void",
      description: "The primary button. Its label includes the total.",
    },
    {
      name: "onEdit / onCancel",
      type: "() => void",
      description: "Show Edit and Cancel buttons next to Confirm.",
    },
    {
      name: "onUndo",
      type: "() => void",
      description: "In the done state, shows an Undo countdown for `undoSeconds`.",
    },
    {
      name: "undoSeconds",
      type: "number",
      default: "30",
      description: "Length of the undo window.",
    },
    {
      name: "currency",
      type: "string",
      default: '"USD"',
      description: "ISO currency for amounts.",
    },
    {
      name: "confirmLabel / doneLabel",
      type: "string",
      default: '"Confirm" / "Done"',
      description: 'Verbs for your domain, e.g. "Deploy" / "Deployed".',
    },
    { name: "className", type: "string", description: "Extra classes for the shell." },
  ],
  types: `type ConfirmationItem = {
  id: string;
  label: string;
  detail?: string;
  amount: number;    // one unit
  quantity?: number; // defaults to 1
  editable?: boolean;  // quantity stepper
  removable?: boolean; // remove button
};`,
};
