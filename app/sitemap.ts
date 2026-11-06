import type { MetadataRoute } from "next";
import { catalog } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-static";

// Every indexable page. Full-screen screen previews are left out: their
// canonical is the component page.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/components"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/docs/installation"), changeFrequency: "monthly", priority: 0.8 },
    ...catalog.map((entry) => ({
      url: absoluteUrl(`/components/${entry.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
