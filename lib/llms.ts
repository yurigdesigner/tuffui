import { catalog, getCategory, type CatalogEntry } from "@/lib/catalog";
import { componentDocs } from "@/lib/docs";
import { siteConfig } from "@/lib/site";

export const installUrl = (slug: string) => `${siteConfig.url}/r/${slug}.json`;

export const installCommand = (slug: string) =>
  `npx shadcn@latest add ${installUrl(slug)}`;

export function header() {
  return [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    "Components are React 19 + Tailwind CSS v4 + motion, distributed as a shadcn registry. Installing copies the source into components/ui and adds theme tokens (surface, surface-raised, border-strong, brand, positive, negative, warning) on top of the standard shadcn tokens.",
    "",
  ];
}

export function componentSection(entry: CatalogEntry) {
  const docs = componentDocs[entry.slug];
  const lines = [
    `## ${entry.name}`,
    "",
    entry.description,
    "",
    `- Category: ${getCategory(entry.category).name}`,
    `- Docs: ${siteConfig.url}/components/${entry.slug}`,
    `- Install: \`${installCommand(entry.slug)}\``,
    "",
  ];
  if (!docs?.props.length) return lines;
  lines.push(
    "### Props",
    "",
    "| Prop | Type | Default | Description |",
    "| --- | --- | --- | --- |",
  );
  for (const prop of docs.props) {
    const type = prop.type.replaceAll("|", "\\|");
    lines.push(
      `| ${prop.name}${prop.required ? " (required)" : ""} | \`${type}\` | ${prop.default ? `\`${prop.default}\`` : "—"} | ${prop.description} |`,
    );
  }
  lines.push("", "### Usage", "", "```tsx", docs.usage, "```", "");
  if (docs.types) lines.push("### Types", "", "```ts", docs.types, "```", "");
  return lines;
}

export function llmsFull() {
  return [...header(), ...catalog.flatMap(componentSection)].join("\n");
}
