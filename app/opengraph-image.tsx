import { ogImage, ogSize } from "@/lib/og/card";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

export const alt = siteConfig.name;
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage({
    eyebrow: "Components for agent interfaces",
    title: "The UI layer for agent products",
    description: siteConfig.description,
  });
}
