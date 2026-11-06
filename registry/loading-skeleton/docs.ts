import type { ComponentDocs } from "@/lib/docs/types";

export const docs: ComponentDocs = {
  usage: `import { MessageSkeleton, Skeleton, SkeletonGroup } from "@/components/ui/loading-skeleton";

{loading ? <MessageSkeleton /> : <StreamingMessage data={message} />}

<SkeletonGroup label="Loading history" className="flex flex-col gap-2">
  {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-8" />)}
</SkeletonGroup>`,
  props: [
    {
      name: "Skeleton",
      type: "div props",
      description: "One block; size it with className. Hidden from assistive tech.",
    },
    {
      name: "SkeletonGroup.label",
      type: "string",
      default: '"Loading"',
      description: "Wraps skeletons in a status region announced once.",
    },
    {
      name: "MessageSkeleton.lines",
      type: "number",
      default: "3",
      description: "Text lines under the name.",
    },
    {
      name: "CardSkeleton.media",
      type: "boolean",
      default: "true",
      description: "Show the image area.",
    },
  ],
};
