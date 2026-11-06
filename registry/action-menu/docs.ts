import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { Menu, ContextMenu, type MenuGroup } from "@/components/ui/action-menu";

const groups: MenuGroup[] = [
  {
    items: [
      { id: "copy", label: "Copy", icon: Copy, shortcut: "⌘C", onSelect: copy },
      { id: "regen", type: "submenu", label: "Regenerate with", items: [
        { id: "model", type: "radio", value: model, onValueChange: setModel,
          options: [{ value: "opus", label: "opus-5.5" }, { value: "sonnet", label: "sonnet-5.5" }] },
      ] },
    ],
  },
  { label: "View", items: [
    { id: "reasoning", type: "checkbox", label: "Show reasoning", checked, onCheckedChange: setChecked },
  ] },
  { items: [{ id: "delete", label: "Delete", icon: Trash, destructive: true, onSelect: remove }] },
];

<Menu groups={groups} trigger={<IconButton icon={DotsThree} label="Actions" />} />

<ContextMenu groups={groups}>
  <div tabIndex={0}>Right-click me</div>
</ContextMenu>`,
  props: [
    {
      name: "groups",
      type: "MenuGroup[]",
      required: true,
      description: "Item groups, separated by spacing and an optional small label.",
    },
    {
      name: "trigger",
      type: "ReactElement",
      required: true,
      description: "Menu only. A button-like element that opens it.",
    },
    {
      name: "children",
      type: "ReactElement",
      required: true,
      description:
        "ContextMenu only. The area that opens it on right-click, long-press or the context-menu key.",
    },
    {
      name: "side / align",
      type: '"top" | "right" | "bottom" | "left" / "start" | "center" | "end"',
      default: '"bottom" / "start"',
      description:
        "Menu only. Placement against the trigger; flips when there's no room.",
    },
    {
      name: "open / onOpenChange",
      type: "boolean / (open: boolean) => void",
      description: "Optional control of the open state.",
    },
  ],
  types: `type MenuGroup = { id?: string; label?: string; items: MenuItem[] };

type MenuItem =
  | { type?: "item"; id: string; label: ReactNode; icon?: Icon; shortcut?: string;
      description?: ReactNode; destructive?: boolean; disabled?: boolean; onSelect?: () => void }
  | { type: "checkbox"; id: string; label: ReactNode; icon?: Icon;
      checked: boolean; onCheckedChange: (checked: boolean) => void }
  | { type: "radio"; id: string; value: string; onValueChange: (value: string) => void;
      options: { value: string; label: ReactNode; icon?: Icon; disabled?: boolean }[] }
  | { type: "submenu"; id: string; label: ReactNode; icon?: Icon; items: MenuItem[] };`,
};
