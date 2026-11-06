import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    // Raw source JSON and registry files are for tools, not search results.
    rules: { userAgent: "*", allow: "/", disallow: ["/source/", "/r/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
