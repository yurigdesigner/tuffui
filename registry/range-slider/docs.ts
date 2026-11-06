import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { Slider } from "@/components/ui/range-slider";

<Slider
  label="Temperature"
  value={temperature}
  defaultValue={0.7}
  onValueChange={setTemperature}
  min={0}
  max={2}
  step={0.1}
  format={(v) => v.toFixed(1)}
/>

// Two thumbs: pass a [low, high] pair.
<Slider label="Response length" defaultValue={[150, 600]} max={1000} step={50} striped />`,
  props: [
    {
      name: "defaultValue",
      type: "number | [number, number]",
      required: true,
      description: "Initial value. A pair renders a range with two thumbs.",
    },
    {
      name: "value",
      type: "number | [number, number]",
      description: "Controlled value.",
    },
    {
      name: "onValueChange",
      type: "(value) => void",
      description: "Fires while dragging.",
    },
    {
      name: "onValueCommit",
      type: "(value) => void",
      description: "Fires when a drag or key press ends.",
    },
    {
      name: "min / max / step",
      type: "number",
      default: "0 / 100 / 1",
      description: "Range and snapping.",
    },
    {
      name: "marks",
      type: "{ value; label? }[]",
      description: "Labels under the track.",
    },
    {
      name: "striped",
      type: "boolean",
      default: "false",
      description: "Stripes on the fill.",
    },
    {
      name: "label",
      type: "string",
      required: true,
      description: "Accessible name, shown above.",
    },
    {
      name: "format",
      type: "(value: number) => string",
      description: "Text for the bubble, the header and aria-valuetext.",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "Dims and locks it.",
    },
  ],
};
