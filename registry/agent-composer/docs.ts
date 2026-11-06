import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { useEffect, useState } from "react";
import {
  AgentComposer,
  type ComposerFile,
  type ComposerQueued,
} from "@/components/ui/agent-composer";

export function Composer({ files }: { files: ComposerFile[] }) {
  const { status, send, stop } = useAgentRun(); // your runtime
  const [queue, setQueue] = useState<ComposerQueued[]>([]);

  // When a run ends, send the next queued follow-up.
  useEffect(() => {
    if (status !== "idle" || !queue.length) return;
    send({ text: queue[0].text });
    setQueue(queue.slice(1));
  }, [status, queue]);

  return (
    <AgentComposer
      status={status}
      files={files} // @ mention candidates: { id, path, tokens }
      queue={queue}
      onQueueChange={setQueue}
      onSubmit={({ text, mode, context, model }) => send({ text, mode, context, model })}
      onStop={stop}
      models={[
        { id: "opus-5.5", name: "Claude Opus 5.5" },
        { id: "sonnet-5.5", name: "Claude Sonnet 5.5" },
      ]}
      commands={[{ name: "review", description: "Review the current diff" }]}
    />
  );
}`,
  props: [
    {
      name: "onSubmit",
      type: "(message: ComposerMessage) => void",
      description:
        "Called on Enter or Send when the agent is idle, with the text, mode, context items and model. The context tray clears afterwards.",
    },
    {
      name: "status",
      type: '"idle" | "streaming"',
      default: '"idle"',
      description:
        "While streaming, Enter queues the message instead of sending, and a Stop button appears.",
    },
    {
      name: "queue / onQueueChange",
      type: "ComposerQueued[]",
      description:
        "Messages written while the agent works, shown above the input with remove buttons. Send the next one when a run ends.",
    },
    { name: "onStop", type: "() => void", description: "Called by the Stop button." },
    {
      name: "mode / onModeChange",
      type: '"ask" | "plan" | "act"',
      default: '"act"',
      description:
        "The Ask / Plan / Act switch in the header, with a hint for the active mode. Act sends with the brand color.",
    },
    {
      name: "showModes",
      type: "boolean",
      default: "true",
      description: "Hide the mode switch; messages are then sent as act.",
    },
    {
      name: "context / onContextChange",
      type: "ComposerContextItem[]",
      description:
        "Files and attachments in the context tray, each with a token count and a running total.",
    },
    {
      name: "files",
      type: "ComposerFile[]",
      description: "Candidates for the @ mention menu. Picking one adds it to the tray.",
    },
    {
      name: "commands",
      type: "ComposerCommand[]",
      description: "Slash commands. Typing / at the start opens a filterable menu.",
    },
    {
      name: "models / model / onModelChange",
      type: "ComposerModel[] · string",
      description:
        "Shown as the model id in the header; clicking switches to the next model.",
    },
    {
      name: "value / onValueChange",
      type: "string",
      description:
        "Control the text. Uncontrolled when omitted, like mode, context and queue.",
    },
    {
      name: "allowAttachments",
      type: "boolean",
      default: "true",
      description:
        "Shows Add context, which opens a file picker (tokens estimated at 4 bytes each).",
    },
    { name: "placeholder", type: "string", description: "Textarea placeholder." },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type ComposerMode = "ask" | "plan" | "act";
type ComposerContextItem = { id: string; name: string; tokens: number };
type ComposerFile = { id: string; path: string; tokens: number };
type ComposerQueued = { id: string; text: string };
type ComposerModel = { id: string; name: string; description?: string };
type ComposerCommand = { name: string; description: string };
type ComposerMessage = {
  text: string;
  mode: ComposerMode;
  context: ComposerContextItem[];
  model?: string;
};`,
};
