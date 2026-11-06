import { catalog, getCategory, getEntry } from "@/lib/catalog";
import { ogImage, ogSize } from "@/lib/og/card";

export const dynamic = "force-static";

export const alt = "Component preview card";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return catalog.map((entry) => ({ slug: entry.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const entry = getEntry((await params).slug)!;
  return ogImage({
    eyebrow: getCategory(entry.category).name,
    title: entry.name,
    description: entry.description,
  });
}
