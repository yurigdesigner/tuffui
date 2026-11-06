import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { Kbd, KeyCombo } from "@/components/ui/key-hint";

<KeyCombo keys="mod+k" />      // ⌘ K on Mac, Ctrl K elsewhere
<KeyCombo keys="shift+enter" />
<Kbd>Esc</Kbd>`,
  props: [
    {
      name: "keys",
      type: "string",
      required: true,
      description:
        'KeyCombo: keys joined by "+". mod, shift, alt, ctrl, enter, esc, arrows and letters are mapped per platform.',
    },
    {
      name: "size",
      type: '"sm" | "md"',
      default: '"sm"',
      description: "Chip size for Kbd and KeyCombo.",
    },
    {
      name: "children",
      type: "ReactNode",
      description: "Kbd: the key label.",
    },
  ],
  types: `function formatKeys(combo: string, onMac: boolean): string[];
function useIsMac(): boolean; // false during prerender, real value after mount`,
};
