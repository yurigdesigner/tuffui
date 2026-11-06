import type { Metadata } from "next";
import type { CatalogEntry } from "@/lib/catalog";
import { siteConfig } from "@/lib/site";

export const absoluteUrl = (path = "/") => new URL(path, siteConfig.url).toString();

/**
 * Title, description, canonical URL and social cards for one page. Open Graph
 * images come from each route's opengraph-image file, so they aren't set here.
 */
export function pageMetadata({
  title,
  description,
  path,
  noindex = false,
}: {
  title?: string;
  description: string;
  path: string;
  noindex?: boolean;
}): Metadata {
  const fullTitle = title
    ? `${title} — ${siteConfig.name}`
    : `${siteConfig.name} — ${siteConfig.tagline}`;
  return {
    ...(title && { title }),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title: fullTitle,
      description,
      url: path,
    },
    twitter: { card: "summary_large_image", title: fullTitle, description },
    ...(noindex && { robots: { index: false, follow: true } }),
  };
}

/** Search snippet title for a component: what it is, for whom, in plain words. */
export function componentTitle(entry: CatalogEntry) {
  return entry.category === "screens"
    ? `${entry.name} — AI interface screen for React`
    : `${entry.name} — React component for AI agents`;
}

/** JSON-LD as a script tag. Values come from our own catalog, never from users. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
