import type { Metadata } from "next";
import { ComponentCard } from "@/components/site/component-card";
import { Badge, DocsPage, DocsSection } from "@/components/site/docs-page";
import { catalog, entriesByCategory } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "AI chat and agent UI components for React",
  description: `${catalog.length} free, open-source React components for AI chat and agent interfaces — chat, tool calls, approvals, charts, tables, traces and usage. Install with the shadcn CLI.`,
  path: "/components",
});

const groups = entriesByCategory();

export default function ComponentsIndex() {
  return (
    <DocsPage
      eyebrow="Components"
      title="The UI layer for agent products"
      description="Copy-paste React components for agent chats, tool calls, approvals, plans, traces and usage. Every one is MIT licensed and installs with the shadcn CLI."
      meta={
        <>
          <Badge>{catalog.length} components</Badge>
          <Badge>MIT</Badge>
          <Badge>shadcn registry</Badge>
        </>
      }
      toc={groups.map((group) => ({ id: group.id, title: group.name }))}
      next={{ href: "/docs/installation", name: "Installation" }}
    >
      {groups.map((group) => (
        <DocsSection key={group.id} id={group.id} title={group.name}>
          <div className="grid gap-4 sm:grid-cols-2">
            {group.entries.map((entry) => (
              <ComponentCard key={entry.slug} entry={entry} />
            ))}
          </div>
        </DocsSection>
      ))}
    </DocsPage>
  );
}
