import { ogImage, ogSize } from "@/lib/og/card";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

export const alt = siteConfig.name;
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage({
    eyebrow: "Free · MIT · shadcn registry",
    title: "Free components for AI interfaces.",
    description:
      "Chats, tool calls, approvals, traces and usage for agents built on Claude, OpenAI and agent SDKs.",
  });
}
