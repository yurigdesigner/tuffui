import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScreenPreview } from "@/components/docs/screen-preview";
import { CodeBlock } from "@/components/docs/code-block";
import { ComponentPreview } from "@/components/docs/component-preview";
import { InstallBlock } from "@/components/docs/install-block";
import { PropsTable } from "@/components/docs/props-table";
import { Badge, DocsPage, DocsSection, Placeholder } from "@/components/site/docs-page";
import {
  catalog,
  getCategory,
  getEntry,
  getNeighbors,
  isScreen,
  type CatalogEntry,
} from "@/lib/catalog";
import { componentDocs } from "@/lib/docs";
import { absoluteUrl, componentTitle, JsonLd, pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

// Only the catalog's slugs exist; anything else is a 404 in the static export.
export const dynamicParams = false;

export function generateStaticParams() {
  return catalog.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/components/[slug]">): Promise<Metadata> {
  const entry = getEntry((await params).slug);
  if (!entry) return {};
  return pageMetadata({
    title: componentTitle(entry),
    // Search snippets cut off around 160 characters; add the pitch only if it fits.
    description:
      entry.description.length < 110
        ? `${entry.description} Free and open source, installs with the shadcn CLI.`
        : entry.description,
    path: `/components/${entry.slug}`,
  });
}

export default async function ComponentPage({ params }: PageProps<"/components/[slug]">) {
  const { slug } = await params;
  const entry = getEntry(slug);
  if (!entry) notFound();

  const docs = componentDocs[slug];
  const { prev, next } = getNeighbors(slug);
  const toLink = (e?: CatalogEntry) =>
    e && { href: `/components/${e.slug}`, name: e.name };

  const toc = [
    { id: "preview", title: "Preview" },
    { id: "installation", title: "Installation" },
    { id: "usage", title: "Usage" },
    { id: "props", title: "Props" },
  ];

  const url = absoluteUrl(`/components/${slug}`);
  const structured = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareSourceCode",
        name: `${entry.name} — ${siteConfig.name}`,
        description: entry.description,
        url,
        codeRepository: siteConfig.github,
        programmingLanguage: ["TypeScript", "React"],
        runtimePlatform: "React",
        license: "https://opensource.org/licenses/MIT",
        isAccessibleForFree: true,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Components",
            item: absoluteUrl("/components"),
          },
          { "@type": "ListItem", position: 2, name: entry.name, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={structured} />
      <DocsPage
        eyebrow={getCategory(entry.category).name}
        title={entry.name}
        description={entry.description}
        meta={
          <>
            <Badge>
              {entry.variants.length}{" "}
              {entry.variants.length === 1 ? "variant" : "variants"}
            </Badge>
            <Badge>MIT</Badge>
            {entry.status === "planned" && <Badge>In progress</Badge>}
          </>
        }
        toc={toc}
        prev={toLink(prev)}
        next={toLink(next)}
      >
        {docs ? (
          <>
            <DocsSection id="preview" title="Preview">
              {isScreen(entry) ? (
                <ScreenPreview slug={slug} variants={entry.variants} />
              ) : (
                <ComponentPreview slug={slug} variants={entry.variants} />
              )}
            </DocsSection>
            <DocsSection
              id="installation"
              title="Installation"
              description={
                isScreen(entry)
                  ? "Copies the screen into components/ and installs every component it uses, with their dependencies and theme tokens."
                  : "Copies the component into components/ui and installs its dependencies and theme tokens."
              }
            >
              <InstallBlock url={`${siteConfig.url}/r/${slug}.json`} />
            </DocsSection>
            <DocsSection
              id="usage"
              title="Usage"
              description="Pass your own data and wire the callbacks to your agent runtime."
            >
              <CodeBlock code={docs.usage} />
            </DocsSection>
            <DocsSection id="props" title="Props">
              <PropsTable props={docs.props} />
              {docs.types && <CodeBlock code={docs.types} lang="ts" className="mt-4" />}
            </DocsSection>
          </>
        ) : (
          <>
            <DocsSection id="preview" title="Preview">
              <Placeholder label="Preview / Code" className="h-[420px]" />
            </DocsSection>
            <DocsSection id="installation" title="Installation">
              <Placeholder label="pnpm · npm · yarn · bun" className="h-24" />
            </DocsSection>
            <DocsSection id="usage" title="Usage">
              <Placeholder label="Usage snippet" className="h-40" />
            </DocsSection>
            <DocsSection id="props" title="Props">
              <Placeholder label="Props table" className="h-48" />
            </DocsSection>
          </>
        )}
      </DocsPage>
    </>
  );
}
