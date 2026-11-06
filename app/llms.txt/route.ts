import { catalog, getCategory } from "@/lib/catalog";
import { header, installCommand } from "@/lib/llms";
import { siteConfig } from "@/lib/site";

// Prerendered at build time so the site can ship as a static export.
export const dynamic = "force-static";

export function GET() {
  const lines = [
    ...header(),
    "## Docs",
    "",
    `- [Installation](${siteConfig.url}/docs/installation): shadcn init, theme tokens, the cn helper and motion.`,
    `- [Full reference](${siteConfig.url}/llms-full.txt): every component with props, usage and types.`,
    "",
    "## Components",
    "",
    ...catalog.map(
      (entry) =>
        `- [${entry.name}](${siteConfig.url}/components/${entry.slug}): ${entry.description} (${getCategory(entry.category).name}). Install: \`${installCommand(entry.slug)}\``,
    ),
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
