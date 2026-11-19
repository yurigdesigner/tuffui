import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { Dialog, DialogClose, Sheet } from "@/components/ui/modal-sheet";

<Dialog
  title="Share chat"
  description="Anyone with the link can read it."
  trigger={<Button>Share</Button>}
  footer={
    <>
      <DialogClose asChild><Button variant="quiet">Cancel</Button></DialogClose>
      <Button variant="primary" onClick={copyLink}>Copy link</Button>
    </>
  }
>
  <TextField label="Link" readOnly value={url} />
</Dialog>

<Sheet side="left" title="Chats" open={open} onOpenChange={setOpen}>
  <ConversationList data={chats} />
</Sheet>`,
  props: [
    {
      name: "title",
      type: "ReactNode",
      required: true,
      description: "Heading; also the accessible name.",
    },
    {
      name: "description",
      type: "ReactNode",
      description: "Secondary line under the title.",
    },
    {
      name: "children",
      type: "ReactNode",
      description: "Body, placed in an inset panel.",
    },
    { name: "footer", type: "ReactNode", description: "Actions row, end-aligned." },
    {
      name: "trigger",
      type: "ReactElement",
      description: "Optional element that opens it; otherwise control open yourself.",
    },
    {
      name: "open / onOpenChange",
      type: "boolean / (open: boolean) => void",
      description: "Optional control of the open state.",
    },
    {
      name: "size",
      type: '"sm" | "md" | "lg"',
      default: '"md"',
      description: "Dialog only. Max width.",
    },
    {
      name: "side",
      type: '"start" | "end" | "left" | "right" | "bottom"',
      default: '"start"',
      description:
        "Sheet only. The edge it slides in from; start and end follow the reading direction.",
    },
    {
      name: "labels",
      type: "Partial<ModalLabels>",
      description:
        'Your own UI strings (the close button), for translating. Right-to-left works under `dir="rtl"`: the panel takes the direction even though it renders in a portal.',
    },
  ],
};
