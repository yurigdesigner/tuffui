import { transformerStyleToClass } from "@shikijs/transformers";
import { createHighlighter, type Highlighter } from "shiki";

let highlighter: Promise<Highlighter> | undefined;

function getHighlighter() {
  highlighter ??= createHighlighter({
    themes: ["github-light-default", "github-dark-default"],
    langs: ["tsx", "ts", "bash", "json", "css"],
  });
  return highlighter;
}

/**
 * Highlights once per input at build time; colors switch with the theme via CSS
 * vars. Inline token styles become shared classes, which keeps long sources (and
 * the RSC payload that repeats them) several times smaller.
 */
export async function highlight(code: string, lang = "tsx") {
  const shiki = await getHighlighter();
  const toClass = transformerStyleToClass({ classPrefix: "sh-" });
  const html = shiki.codeToHtml(code, {
    lang,
    themes: { light: "github-light-default", dark: "github-dark-default" },
    defaultColor: false,
    transformers: [toClass],
  });
  return `<style>${toClass.getCSS()}</style>${html}`;
}
