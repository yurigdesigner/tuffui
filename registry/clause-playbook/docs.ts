import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import {
  ClausePlaybook,
  marketPercentile,
  type ClauseThresholds,
} from "@/components/ui/clause-playbook";

export function LiabilityCapAnswer({ proposal }: { proposal: AgentProposal }) {
  const playbook = usePlaybook("liability-cap");
  const [thresholds, setThresholds] = useState<ClauseThresholds>(proposal.thresholds);
  const [values, setValues] = useState(proposal.values); // { escalate: "legal" }

  return (
    <ClausePlaybook
      number="9.2"
      clause="Liability cap"
      unit="mo"
      domain={[0, 24]}
      // Signed contracts bucketed by cap: [{ value: 12, count: 260 }, …]
      distribution={playbook.market}
      // The live playbook is the baseline; the agent's proposal counts as edits.
      defaultThresholds={playbook.thresholds}
      thresholds={thresholds}
      onThresholdsChange={setThresholds}
      settings={[
        { kind: "stepper", id: "superCap", label: "Data-breach super-cap",
          defaultValue: playbook.superCap, min: 1, max: 5, format: (v) => \`\${v}×\` },
        { kind: "select", id: "escalate", label: "Escalate to", defaultValue: playbook.escalate,
          options: [
            { value: "legal", label: "Legal", hint: "always" },
            { value: "finance", label: "Finance", hint: \`below \${thresholds.preferred} mo\` },
          ] },
        { kind: "toggle", id: "autoAccept", label: "Auto-accept within fallback",
          description: (t) => \`Agent signs off \${t.fallback}–\${t.preferred} mo\`,
          defaultValue: playbook.autoAccept },
      ]}
      values={values}
      onValuesChange={setValues}
      note={\`Agent suggests \${thresholds.preferred} mo · p\${marketPercentile(playbook.market, thresholds.preferred)} of market\`}
      sampleNoun="MSAs"
      onApply={(t, v) => savePlaybook("liability-cap", { thresholds: t, ...v })}
      onDiscard={() => proposal.dismiss()}
    />
  );
}`,
  props: [
    {
      name: "clause",
      type: "string",
      required: true,
      description:
        'Clause name in the header, e.g. "Liability cap". Also names the handles for screen readers.',
    },
    {
      name: "number",
      type: "string",
      description: 'Clause number shown as "§ 9.2" before the name.',
    },
    {
      name: "subtitle",
      type: "ReactNode",
      description: "Line under the title, e.g. the playbook and the contract.",
    },
    {
      name: "icon",
      type: "Icon",
      default: "Scales",
      description: "Phosphor icon in the header tile.",
    },
    {
      name: "distribution",
      type: "ClauseBucket[]",
      required: true,
      description:
        "Market data, one bucket per value. Each bucket is a stack of dots; when stacks get tall one dot stands for several contracts, noted above the chart. Dots below the fallback handle are dim, the fallback zone neutral, the preferred zone accent.",
    },
    {
      name: "domain",
      type: "[number, number]",
      default: "[0, 24]",
      description: "Ends of the scale.",
    },
    {
      name: "step",
      type: "number",
      default: "1",
      description: "Handles snap to this step. Arrow keys move one step.",
    },
    {
      name: "largeStep",
      type: "number",
      default: "an eighth of the domain",
      description:
        "Shift+arrow and Page Up / Page Down move this far. Home and End jump to the ends.",
    },
    {
      name: "ticks",
      type: "number[]",
      default: "five even ticks",
      description:
        "Axis values. A tick next to a handle gives way to the handle's own value, which is emphasized.",
    },
    {
      name: "unit",
      type: "string",
      description:
        'Unit after values, e.g. "mo". Shown on the last tick and in screen-reader text.',
    },
    {
      name: "format",
      type: "(value: number) => string",
      description: "Formats a value without the unit.",
    },
    {
      name: "thresholds",
      type: "ClauseThresholds",
      description:
        "Controlled handles. Below `fallback` is walk-away, from `preferred` up is preferred. Changes made from outside, like an agent's proposal, glide into place.",
    },
    {
      name: "defaultThresholds",
      type: "ClauseThresholds",
      description:
        "Starting handles when uncontrolled, and the baseline edits are counted against. Pass the live playbook here and the proposal as `thresholds`.",
    },
    {
      name: "onThresholdsChange",
      type: "(thresholds: ClauseThresholds) => void",
      description: "Called while a handle is dragged or moved with the keyboard.",
    },
    {
      name: "minGap",
      type: "number",
      default: "step",
      description: "Smallest distance between the two handles.",
    },
    {
      name: "zoneLabels",
      type: "{ walkAway?; fallback?; preferred? }",
      default: '"Walk-away", "Fallback", "Preferred"',
      description: "Names of the three zones in the legend and on the handles.",
    },
    {
      name: "settings",
      type: "ClauseSetting[]",
      default: "[]",
      description:
        "Rows under the chart: a stepper, a select with hints, or a toggle. A row's `defaultValue` is its baseline for the edit count.",
    },
    {
      name: "values",
      type: "Record<string, ClauseValue>",
      description:
        "Controlled setting values by id. Ids left out use their `defaultValue`.",
    },
    {
      name: "onValuesChange",
      type: "(values, changedId?) => void",
      description:
        "Called with every setting value when one changes. `changedId` is empty on Discard.",
    },
    {
      name: "note",
      type: "ReactNode",
      description:
        "The agent's line above the chart, e.g. what it suggests and why. A new string slides in over the old one and is announced.",
    },
    {
      name: "sampleNoun",
      type: "string",
      default: '"contracts"',
      description: 'What the market counts, plural, for "1 dot ≈ 22 MSAs".',
    },
    {
      name: "onApply",
      type: "(thresholds, values) => void",
      description:
        "Shows Apply, enabled while there are edits. Current values become the new baseline, so the count goes back to zero.",
    },
    {
      name: "onDiscard",
      type: "() => void",
      description: "Shows Discard. Handles and settings go back to the baseline first.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra classes for the root element.",
    },
  ],
  types: `type ClauseThresholds = {
  fallback: number;   // walk-away below this
  preferred: number;  // preferred from this up
};

type ClauseBucket = { value: number; count: number };

type ClauseValue = number | string | boolean;

type ClauseSetting = {
  id: string;
  label: string;
  description?: ReactNode | ((thresholds: ClauseThresholds) => ReactNode);
} & (
  | { kind: "stepper"; defaultValue: number; min?: number; max?: number;
      step?: number; format?: (value: number) => string }
  | { kind: "select"; defaultValue: string; options: ClauseSelectOption[] }
  | { kind: "toggle"; defaultValue: boolean }
);

type ClauseSelectOption = { value: string; label: string; hint?: string };

// Share of the market below a value, ties counted half: 49 → "p49".
function marketPercentile(distribution: ClauseBucket[], value: number): number;`,
};
