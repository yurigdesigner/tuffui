import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { useState } from "react";
import { MessageBranches } from "@/components/ui/message-branches";

export function AssistantTurn({ turn }: { turn: Turn }) {
  const [index, setIndex] = useState(turn.versions.length - 1);

  return (
    <MessageBranches
      data={{
        turnsBefore: turn.position,
        versions: turn.versions.map((v) => ({
          id: v.id,
          kind: v.editedPrompt ? "edited" : v.parentId ? "regenerated" : "original",
          prompt: v.editedPrompt,
          meta: v.model,
          turnsAfter: v.followUps,
          content: <Markdown>{v.text}</Markdown>,
        })),
      }}
      index={index}
      onIndexChange={(next, version) => {
        setIndex(next);
        thread.checkout(version.id); // later turns follow the chosen branch
      }}
      onRegenerate={() => thread.regenerate(turn.id)}
    />
  );
}`,
  props: [
    {
      name: "data",
      type: "{ versions: MessageVersion[]; turnsBefore?: number }",
      required: true,
      description:
        "Every version of this answer, oldest first. `turnsBefore` is how many turns precede the fork, drawn as dots in the map.",
    },
    {
      name: "index",
      type: "number",
      description:
        "Controlled index of the visible version. Leave it out to let the component track it.",
    },
    {
      name: "defaultIndex",
      type: "number",
      default: "last version",
      description: "Initial version when uncontrolled.",
    },
    {
      name: "onIndexChange",
      type: "(index: number, version: MessageVersion) => void",
      description:
        "Called when the user switches with the arrows, the map or ←/→. Switch the thread to that branch here.",
    },
    {
      name: "onRegenerate",
      type: "() => void",
      description: "Shows a regenerate button next to the switcher.",
    },
    {
      name: "variant",
      type: '"inline" | "map"',
      default: '"inline"',
      description:
        "A ‹ 2 / 3 › switcher under the message, or a branch map with one row per version.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type MessageVersion = {
  id: string;
  kind: "original" | "regenerated" | "edited";
  content: ReactNode;
  label?: string;      // overrides "Original" / "Regenerated" / "Edited prompt"
  meta?: string;       // e.g. the model, "opus-5.5"
  prompt?: string;     // the edited prompt, for kind "edited"
  turnsAfter?: number; // follow-up turns on this branch, for the map
};`,
};
