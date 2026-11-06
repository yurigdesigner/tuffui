/**
 * Writes out/_headers for Cloudflare (Workers static assets or Pages). The static
 * export emits OG images and the Code tab's source JSON without file extensions,
 * so their content types are set here; everything else is inferred from the file.
 */
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = "out";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const rules: string[] = [
  "/_next/static/*",
  "  Cache-Control: public, max-age=31536000, immutable",
  "",
  "/r/*",
  "  Access-Control-Allow-Origin: *",
  "",
];

// Cloudflare caps _headers at 100 rules, so per-page paths collapse into
// placeholder rules: one per OG image shape, one for all source JSON.
const og = new Set<string>();
for (const file of walk(root)) {
  const url = `/${relative(root, file)}`;
  if (/\/opengraph-image(-\w+)?$/.test(url))
    og.add(url.replace(/^\/(components|screens)\/[^/]+\//, "/$1/:slug/"));
}
for (const url of og) rules.push(url, "  Content-Type: image/png", "");
rules.push("/source/*", "  Content-Type: application/json; charset=utf-8", "");

writeFileSync(join(root, "_headers"), rules.join("\n"));
console.log(`Wrote ${root}/_headers`);
