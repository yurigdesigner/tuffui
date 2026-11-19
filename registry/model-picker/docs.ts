import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { ModelPicker } from "@/components/ui/model-picker";

// In the composer's bottom row, next to Attach and Send.
export function ComposerModel({ chat, catalog }: Props) {
  return (
    <ModelPicker
      models={catalog.map((m) => ({
        id: m.id,
        name: m.displayName, // "Vela"
        provider: m.vendor, // "Meridian" → monogram "M"
        speed: m.tokensPerSecond,
        price: { input: m.usdPer1MIn, output: m.usdPer1MOut },
        context: m.contextWindow,
        capabilities: m.capabilities, // ["vision", "tools"]
      }))}
      value={chat.model}
      onValueChange={chat.setModel}
      // Tokens so far: each row prices this conversation on that model.
      usage={{ input: chat.usage.inputTokens, output: chat.usage.outputTokens }}
      // From your router: the best fit for what's in the chat.
      recommended={{ id: "vela", reason: "reads screenshots, ¼ the cost" }}
      requires={
        chat.images.length
          ? [{ capability: "vision", reason: \`can't read the \${chat.images.length} images\` }]
          : []
      }
    />
  );
}`,
  props: [
    {
      name: "models",
      type: "PickerModel[]",
      required: true,
      description:
        "Every model, grouped by `provider` in the order given. Speed is drawn on a linear scale, price (input and output blended 3:1) and context on log scales, each as five segments across all models.",
    },
    {
      name: "value",
      type: "string",
      description:
        "Controlled selected model id. Shown in the pill with a check in the list.",
    },
    {
      name: "defaultValue",
      type: "string",
      default: "models[0].id",
      description: "Starting model when uncontrolled.",
    },
    {
      name: "onValueChange",
      type: "(id: string) => void",
      description: "Called when a row is clicked or picked with Enter. The panel closes.",
    },
    {
      name: "open",
      type: "boolean",
      description:
        "Controlled open state. Opening from the pill focuses search; opening from props doesn't steal focus.",
    },
    {
      name: "defaultOpen",
      type: "boolean",
      default: "false",
      description: "Starting open state when uncontrolled.",
    },
    {
      name: "onOpenChange",
      type: "(open: boolean) => void",
      description: "Called on the pill, Escape, a pick, or a press outside.",
    },
    {
      name: "highlighted",
      type: "string | null",
      description:
        "Controlled highlighted row: the one the cost preview and details are for. Hover and ↑ ↓ move it.",
    },
    {
      name: "onHighlightChange",
      type: "(id: string | null) => void",
      description: "Called when the highlight moves.",
    },
    {
      name: "recommended",
      type: "{ id: string; reason: string }",
      description:
        'Pinned at the top under "Recommended for this task", tinted, with the reason.',
    },
    {
      name: "usage",
      type: "{ input: number; output: number }",
      description:
        'Tokens this conversation has used. Shows "This chat: $1.15 → $0.27 −76%" for the highlighted model, rolling as the highlight moves. Omit to hide the footer.',
    },
    {
      name: "requires",
      type: "ModelRequirement[]",
      default: "[]",
      description:
        "What this chat needs, e.g. vision for attached images. Rows without it show a struck warning badge, and the footer says why.",
    },
    {
      name: "side",
      type: '"top" | "bottom"',
      default: '"top"',
      description:
        "Where the panel opens. It renders inline (no portal), sized to the nearest container, up to 29rem.",
    },
    {
      name: "formatCost",
      type: "(usd: number) => string",
      default: '"$0.27"',
      description: "Formats the conversation cost.",
    },
    {
      name: "labels",
      type: "Partial<ModelPickerLabels>",
      description:
        'Your own UI strings: capability names, column heads, search, cost line and screen-reader text. Right-to-left works under `dir="rtl"`; the panel opens from the start edge.',
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type ModelCapability = "vision" | "tools" | "reasoning";

type PickerModel = {
  id: string;
  name: string;                 // "Vela"
  provider: string;             // "Meridian"; first letter is the monogram
  speed: number;                // output tokens per second
  price: { input: number; output: number }; // USD per 1M tokens
  context: number;              // context window in tokens
  capabilities?: ModelCapability[];
};

type ModelRequirement = {
  capability: ModelCapability;
  reason: string;               // "can't read the 3 screenshots in this chat"
};`,
};
