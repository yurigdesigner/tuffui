import { highlight } from "@/lib/highlight";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";

export async function CodeBlock({
  code,
  lang = "tsx",
  title,
  className,
}: {
  code: string;
  lang?: string;
  title?: string;
  className?: string;
}) {
  const html = await highlight(code, lang);
  return (
    <div className={cn("group relative rounded-[1.375rem] bg-surface p-1.5", className)}>
      {title && (
        <div className="flex h-9 items-center pr-9 pl-3 font-mono text-xs text-muted-foreground">
          {title}
        </div>
      )}
      <CopyButton
        value={code}
        className={cn("absolute right-2.5 z-10", title ? "top-2.5" : "top-3")}
      />
      <div
        className="code max-h-[inherit] overflow-auto rounded-2xl bg-surface-inset"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
