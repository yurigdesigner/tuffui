/**
 * Generates registry.json from the catalog, then `shadcn build` turns it into
 * public/r/*.json. Theme tokens are read from app/globals.css so the site and
 * the installed components can never drift apart.
 *
 *   NEXT_PUBLIC_SITE_URL=https://tuffui.com node scripts/build-registry.mts
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { catalog } from "../lib/catalog.ts";
import { siteConfig } from "../lib/site.ts";
import { parseTokens } from "../lib/theme-tokens.ts";

const base = siteConfig.url.replace(/\/$/, "");

const globalsCss = readFileSync("app/globals.css", "utf8");

/**
 * npm and registry dependencies come straight from each file's imports, so a
 * component can never ship without the primitives or packages it uses.
 *   "@/components/ui/<name>" → <base>/r/<name>.json
 *   "@/lib/motion-tokens"    → <base>/r/motion-tokens.json
 *   "@/lib/utils"            → shadcn's built-in utils item
 *   any bare package         → npm dependency (react and next are assumed)
 */
const builtIn = /^(react|react-dom|next)(\/|$)/;

function dependenciesOf(path: string) {
  const source = readFileSync(path, "utf8");
  const specifiers = [...source.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]);
  const npm = new Set<string>();
  const registry = new Set<string>();
  for (const spec of specifiers) {
    const ui = spec.match(/^@\/components\/ui\/([\w-]+)$/);
    if (ui) registry.add(`${base}/r/${ui[1]}.json`);
    else if (spec === "@/lib/motion-tokens") registry.add(`${base}/r/motion-tokens.json`);
    else if (spec === "@/lib/utils") registry.add("utils");
    else if (!spec.startsWith("@/") && !spec.startsWith(".") && !builtIn.test(spec))
      npm.add(
        spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0],
      );
  }
  return { dependencies: [...npm].sort(), registryDependencies: [...registry] };
}

function merge(...lists: ReturnType<typeof dependenciesOf>[]) {
  return {
    dependencies: [...new Set(lists.flatMap((l) => l.dependencies))].sort(),
    registryDependencies: [...new Set(lists.flatMap((l) => l.registryDependencies))],
  };
}

const items = [
  {
    name: "theme",
    type: "registry:theme",
    title: "Theme tokens",
    description: "Surface, accent and status tokens shared by every component.",
    cssVars: {
      light: parseTokens(globalsCss, ":root"),
      dark: parseTokens(globalsCss, ".dark"),
    },
  },
  {
    name: "motion-tokens",
    type: "registry:lib",
    title: "Motion tokens",
    description: "Shared easing curves, springs and enter/exit transitions.",
    files: [{ path: "registry/motion-tokens/motion-tokens.ts", type: "registry:lib" }],
  },
  {
    name: "use-mock-run",
    type: "registry:hook",
    title: "useMockRun",
    description: "Plays scripted agent runs for demos and tests.",
    files: [{ path: "registry/use-mock-run/use-mock-run.ts", type: "registry:hook" }],
  },
  ...catalog
    .filter((entry) => entry.status === "ready")
    .map((entry) => {
      const path = `registry/${entry.slug}/${entry.slug}.tsx`;
      // Screens (shadcn's registry:block) install to components/ (not components/ui)
      // and pull in every component they compose through registryDependencies —
      // including the ones their demo renders as message content, so the
      // screen in the preview can be rebuilt right after install.
      const block = entry.category === "screens";
      const deps = block
        ? merge(dependenciesOf(path), dependenciesOf(`registry/${entry.slug}/demo.tsx`))
        : dependenciesOf(path);
      return {
        name: entry.slug,
        type: block ? "registry:block" : "registry:ui",
        title: entry.name,
        description: entry.description,
        categories: [entry.category],
        dependencies: deps.dependencies,
        registryDependencies: [`${base}/r/theme.json`, ...deps.registryDependencies],
        files: [{ path, type: block ? "registry:component" : "registry:ui" }],
      };
    }),
];

const registry = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: siteConfig.shortName,
  homepage: base,
  items,
};

writeFileSync("registry.json", JSON.stringify(registry, null, 2) + "\n");
console.log(`registry.json: ${items.length} items (base ${base})`);
execFileSync("node_modules/.bin/shadcn", ["build", "--output", "public/r"], {
  stdio: "inherit",
});
