import { catalog, getEntry, isScreen } from "@/lib/catalog";
import { ogImage, ogSize } from "@/lib/og/card";

export const dynamic = "force-static";

export const alt = "Screen preview card";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return catalog.filter(isScreen).map((entry) => ({ slug: entry.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const entry = getEntry((await params).slug)!;
  return ogImage({
    eyebrow: "Screens",
    title: entry.name,
    description: entry.description,
  });
}
