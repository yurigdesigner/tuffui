import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScreenHost } from "@/components/docs/screen-host";
import { catalog, getEntry, isScreen } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";

// A screen on its own, at the real viewport size — the "Full screen" link from
// its docs page. Only catalog screens exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return catalog.filter(isScreen).map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/screens/[slug]">): Promise<Metadata> {
  const entry = getEntry((await params).slug);
  if (!entry) return {};
  // The docs page is the one to rank; this is its full-screen preview.
  return {
    ...pageMetadata({
      title: `${entry.name} — full screen`,
      description: entry.description,
      path: `/components/${entry.slug}`,
      noindex: true,
    }),
  };
}

export default async function ScreenPage({ params }: PageProps<"/screens/[slug]">) {
  const { slug } = await params;
  const entry = getEntry(slug);
  if (!entry || !isScreen(entry)) notFound();
  return <ScreenHost slug={slug} variants={entry.variants} />;
}
