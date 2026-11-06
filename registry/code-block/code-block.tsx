"use client";

import { Check, Copy, TextAlignLeft } from "@phosphor-icons/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { IconButton } from "@/components/ui/action-button";
import { Tag } from "@/components/ui/status-pill";
import { Panel, Shell } from "@/components/ui/surface";
import { enter, exit } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

export type CodeLanguage = "ts" | "tsx" | "js" | "json" | "bash" | "python" | "text";

export type CodeBlockData = {
  code: string;
  language?: CodeLanguage;
  filename?: string;
  /** 1-based line numbers to highlight. */
  highlight?: number[];
};

export type CodeBlockProps = {
  data: CodeBlockData;
  /** Long code collapses to this many lines with a "Show all" control. */
  collapseAfter?: number;
  showLineNumbers?: boolean;
  defaultWrap?: boolean;
  onCopy?: (code: string) => void;
  /** Only the code panel, without the shell and header — for embedding in another shell. */
  bare?: boolean;
  className?: string;
};

type TokenKind = "keyword" | "string" | "comment" | "number" | "plain" | "property";

const tokenClass: Record<TokenKind, string> = {
  keyword: "text-[#a626a4] dark:text-[#ff7ab2]",
  string: "text-[#1a7f37] dark:text-[#7ee787]",
  comment: "text-muted-foreground italic",
  number: "text-[#b45309] dark:text-[#ffb757]",
  property: "text-[#0550ae] dark:text-[#79c0ff]",
  plain: "",
};

const keywords: Record<string, string[]> = {
  js: "const let var function return if else for while import from export default async await new class extends try catch throw type interface true false null undefined of in typeof".split(
    " ",
  ),
  python:
    "def return if elif else for while import from as class try except raise with lambda None True False and or not in is pass yield async await".split(
      " ",
    ),
  bash: "if then else fi for do done case esac function export echo cd sudo".split(" "),
  json: ["true", "false", "null"],
};

// Small, line-based tokenizer: good enough for snippets in chat answers.
function tokenize(
  line: string,
  language: CodeLanguage,
): { kind: TokenKind; text: string }[] {
  if (language === "text") return [{ kind: "plain", text: line }];
  const family =
    language === "python"
      ? "python"
      : language === "bash"
        ? "bash"
        : language === "json"
          ? "json"
          : "js";
  const comment = family === "python" || family === "bash" ? "#" : "//";
  const words = new Set(keywords[family]);
  const pattern = new RegExp(
    `(${comment === "#" ? "#.*" : "\\/\\/.*"})|("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'|\`[^\`]*\`)|(\\b\\d+(?:\\.\\d+)?\\b)|([A-Za-z_$][\\w$]*)`,
    "g",
  );
  const out: { kind: TokenKind; text: string }[] = [];
  let last = 0;
  for (const m of line.matchAll(pattern)) {
    const index = m.index ?? 0;
    if (index > last) out.push({ kind: "plain", text: line.slice(last, index) });
    const [text, isComment, isString, isNumber, word] = m;
    let kind: TokenKind = "plain";
    if (isComment) kind = "comment";
    else if (isString)
      kind =
        family === "json" &&
        line
          .slice(index + text.length)
          .trimStart()
          .startsWith(":")
          ? "property"
          : "string";
    else if (isNumber) kind = "number";
    else if (word && words.has(word)) kind = "keyword";
    out.push({ kind, text });
    last = index + text.length;
  }
  if (last < line.length) out.push({ kind: "plain", text: line.slice(last) });
  return out;
}

export function CodeBlock({
  data,
  collapseAfter = 14,
  showLineNumbers = true,
  defaultWrap = false,
  onCopy,
  bare = false,
  className,
}: CodeBlockProps) {
  const { code, language = "text", filename, highlight = [] } = data;
  const lines = useMemo(() => code.replace(/\n$/, "").split("\n"), [code]);
  const tokens = useMemo(
    () => lines.map((l) => tokenize(l, language)),
    [lines, language],
  );
  // Until the reader picks, long lines wrap whenever the block is narrow.
  const [userWrap, setUserWrap] = useState<boolean | null>(null);
  const [narrow, setNarrow] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setNarrow(entry.contentRect.width < 480),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const wrap = userWrap ?? (defaultWrap || narrow);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const id = useId();
  useEffect(() => () => clearTimeout(timer.current), []);

  const collapsible = lines.length > collapseAfter + 2;
  const visible = collapsible && !expanded ? lines.slice(0, collapseAfter) : lines;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {}
    onCopy?.(code);
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <MotionConfig reducedMotion="user">
      <Frame bare={bare} className={className} label={filename ?? "Code"}>
        {!bare && (
          <div className="flex items-center gap-2 pt-0.5 pr-0.5 pb-1.5 pl-3">
            {filename && (
              <span className="min-w-0 truncate font-mono text-[0.8125rem]">
                {filename}
              </span>
            )}
            <Tag>{language}</Tag>
            <span className="flex-1" />
            <IconButton
              icon={TextAlignLeft}
              label={wrap ? "Disable line wrap" : "Wrap lines"}
              aria-pressed={wrap}
              onClick={() => setUserWrap(!wrap)}
              className={cn(wrap && "bg-foreground/[0.08] text-foreground")}
            />
            <IconButton
              icon={copied ? Check : Copy}
              iconWeight={copied ? "bold" : "fill"}
              label={copied ? "Copied" : "Copy code"}
              onClick={copy}
            />
          </div>
        )}
        <Panel ref={panel} className="relative overflow-hidden">
          <pre
            id={id}
            className={cn(
              "overflow-x-auto py-3 font-mono text-[0.8125rem] leading-6",
              wrap ? "break-words whitespace-pre-wrap" : "whitespace-pre",
            )}
          >
            <code className={cn("block", !wrap && "min-w-max")}>
              {visible.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "flex pr-4",
                    wrap && "min-w-0",
                    highlight.includes(i + 1) ? "bg-brand/10" : "",
                  )}
                >
                  {showLineNumbers && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "sticky left-0 w-10 shrink-0 bg-surface-inset pr-3 text-right text-muted-foreground/60 select-none",
                        highlight.includes(i + 1) && "bg-transparent text-brand",
                      )}
                    >
                      {i + 1}
                    </span>
                  )}
                  <span className={cn(!showLineNumbers && "pl-4", wrap && "min-w-0")}>
                    {tokens[i].map((t, j) => (
                      <span key={j} className={tokenClass[t.kind]}>
                        {t.text}
                      </span>
                    ))}
                    {"\n"}
                  </span>
                </span>
              ))}
            </code>
          </pre>
          <AnimatePresence initial={false}>
            {collapsible && !expanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: enter }}
                exit={{ opacity: 0, transition: exit }}
                className="absolute inset-x-0 bottom-0 flex h-24 items-end justify-center bg-gradient-to-t from-surface-inset via-surface-inset/80 to-transparent pb-3"
              >
                <button
                  type="button"
                  aria-controls={id}
                  aria-expanded={false}
                  onClick={() => setExpanded(true)}
                  className="h-8 rounded-full bg-surface-raised px-3.5 text-[0.8125rem] font-medium transition-[background-color,scale] duration-150 ease-out hover:bg-[color-mix(in_oklab,var(--surface-raised),var(--foreground)_7%)] active:scale-[0.97]"
                >
                  Show all {lines.length} lines
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </Panel>
        {collapsible && expanded && (
          <div className="flex justify-center pt-1.5">
            <button
              type="button"
              aria-controls={id}
              aria-expanded
              onClick={() => setExpanded(false)}
              className="h-7 rounded-full px-3 text-xs text-muted-foreground transition-[color,scale] duration-150 ease-out hover:text-foreground active:scale-[0.97]"
            >
              Collapse
            </button>
          </div>
        )}
        <p role="status" aria-live="polite" className="sr-only">
          {copied ? "Code copied" : ""}
        </p>
      </Frame>
    </MotionConfig>
  );
}

function Frame({
  bare,
  label,
  className,
  children,
}: {
  bare: boolean;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return bare ? (
    <div className={className} aria-label={label} role="group">
      {children}
    </div>
  ) : (
    <Shell className={cn("max-w-2xl", className)} aria-label={label}>
      {children}
    </Shell>
  );
}
