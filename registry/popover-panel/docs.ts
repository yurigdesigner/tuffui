import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { Popover, PopoverClose } from "@/components/ui/popover-panel";

<Popover title="Rename chat" showClose trigger={<Button>Rename</Button>}>
  <form onSubmit={save}>
    <TextField name="title" label="Title" defaultValue={title} />
    <PopoverClose asChild>
      <Button type="submit" variant="primary">Save</Button>
    </PopoverClose>
  </form>
</Popover>`,
  props: [
    {
      name: "trigger",
      type: "ReactElement",
      required: true,
      description: "A button-like element that toggles the panel.",
    },
    {
      name: "children",
      type: "ReactNode",
      required: true,
      description: "Panel content.",
    },
    {
      name: "title",
      type: "ReactNode",
      description:
        "Heading at the top; a string title also names the panel for screen readers.",
    },
    {
      name: "showClose",
      type: "boolean",
      default: "false",
      description: "Adds a close button to the header.",
    },
    {
      name: "side / align",
      type: '"top" | "right" | "bottom" | "left" / "start" | "center" | "end"',
      default: '"bottom" / "center"',
      description:
        "Placement; the panel grows from the trigger's side and flips when there's no room.",
    },
    {
      name: "open / onOpenChange",
      type: "boolean / (open: boolean) => void",
      description: "Optional control of the open state.",
    },
    {
      name: "className",
      type: "string",
      description: "Classes for the panel, e.g. a different width.",
    },
  ],
};
