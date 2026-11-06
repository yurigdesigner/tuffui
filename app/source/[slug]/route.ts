import { catalog, getEntry } from "@/lib/catalog";
import { highlight } from "@/lib/highlight";
import { readRegistryFile } from "@/lib/source";

// Prerendered at build time so the site can ship as a static export.
export const dynamic = "force-static";
export const dynamicParams = false;

// The Code tab fetches this on demand, which keeps long sources out of the
// docs page's HTML and RSC payload.
export function generateStaticParams() {
  return catalog.map((entry) => ({ slug: entry.slug }));
}

async function getSource(slug: string) {
  if (!getEntry(slug)) return null;
  const code = await readRegistryFile(`${slug}/${slug}.tsx`);
  return { code, html: await highlight(code) };
}

export async function GET(_request: Request, { params }: RouteContext<"/source/[slug]">) {
  const source = await getSource((await params).slug);
  return source ? Response.json(source) : new Response("Not found", { status: 404 });
}
