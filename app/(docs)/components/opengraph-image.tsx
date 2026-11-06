import { catalog } from "@/lib/catalog";
import { ogImage, ogSize } from "@/lib/og/card";

export const dynamic = "force-static";

export const alt = "All components";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage({
    eyebrow: `${catalog.length} components`,
    title: "Every component, free",
    description: "Chat, tool approvals, plans, traces, memory, usage and charts. Free, with the full source.",
  });
}
