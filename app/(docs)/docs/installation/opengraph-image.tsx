import { ogImage, ogSize } from "@/lib/og/card";

export const dynamic = "force-static";

export const alt = "Installation";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage({
    eyebrow: "Getting started",
    title: "Installation",
    description:
      "Theme tokens, the cn helper and motion — then add components with the shadcn CLI.",
  });
}
