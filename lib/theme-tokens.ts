// Shared by the registry build script and the installation docs, so the tokens a
// user installs are always the ones the site renders with. No path aliases here:
// the build script imports this file directly with Node.

/** Tokens shadcn projects already define (background, foreground, border, ...) are not shipped. */
export const shippedTokens = [
  "surface",
  "surface-inset",
  "surface-raised",
  "brand",
  "brand-foreground",
  "positive",
  "negative",
  "warning",
  "button",
  "button-hover",
  "button-foreground",
  "button-edge",
  "button-shadow",
  "button-secondary",
  "button-secondary-hover",
];

export function parseTokens(css: string, selector: ":root" | ".dark") {
  const pattern = new RegExp(`(?:^|\\n)${selector.replace(".", "\\.")} \\{([^}]*)\\}`);
  const block = css.match(pattern)?.[1];
  if (!block) throw new Error(`No ${selector} block in globals.css`);
  const tokens: Record<string, string> = {};
  for (const [, name, value] of block.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    if (shippedTokens.includes(name)) tokens[name] = value.trim().replace(/\s+/g, " ");
  }
  return tokens;
}

/** The CSS a user adds by hand when not using the CLI. */
export function tokensCss(css: string) {
  const block = (selector: ":root" | ".dark") =>
    `${selector} {\n${Object.entries(parseTokens(css, selector))
      .map(([name, value]) => `  --${name}: ${value};`)
      .join("\n")}\n}`;
  const theme = shippedTokens
    .filter((name) => !name.startsWith("button"))
    .map((name) => `  --color-${name}: var(--${name});`)
    .join("\n");
  return `${block(":root")}\n\n${block(".dark")}\n\n@theme inline {\n${theme}\n}`;
}
