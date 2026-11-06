import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/code-block";
import { DocsPage, DocsSection } from "@/components/site/docs-page";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { tokensCss } from "@/lib/theme-tokens";
import { readFile } from "node:fs/promises";
import path from "node:path";

async function getTokensCss() {
  return tokensCss(await readFile(path.join(process.cwd(), "app/globals.css"), "utf8"));
}

export const metadata: Metadata = pageMetadata({
  title: "Installation",
  description: `Install ${siteConfig.name} components with the shadcn CLI: set up theme tokens, the cn helper and motion once, then add any component to your React or Next.js app.`,
  path: "/docs/installation",
});

const toc = [
  { id: "requirements", title: "Requirements" },
  { id: "shadcn", title: "Initialize shadcn" },
  { id: "add", title: "Add a component" },
  { id: "tokens", title: "Theme tokens" },
  { id: "manual", title: "Manual setup" },
  { id: "motion", title: "Motion" },
];

const r = (name: string) => `${siteConfig.url}/r/${name}.json`;

const utils = `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`;

export default async function InstallationPage() {
  return (
    <DocsPage
      eyebrow="Getting started"
      title="Installation"
      description="Components are copied into your project with the shadcn CLI, so you own every line. Set up the shared pieces once, then add what you need."
      toc={toc}
      prev={{ href: "/components", name: "Introduction" }}
    >
      <DocsSection id="requirements" title="Requirements">
        <p className="text-sm leading-6 text-muted-foreground">
          React 19, Tailwind CSS v4 and TypeScript. Works anywhere the shadcn CLI does —
          Next.js, Vite, React Router, TanStack Start.
        </p>
      </DocsSection>
      <DocsSection
        id="shadcn"
        title="Initialize shadcn"
        description="Skip this if your project already has a components.json."
      >
        <CodeBlock lang="bash" code="pnpm dlx shadcn@latest init" />
      </DocsSection>
      <DocsSection
        id="add"
        title="Add a component"
        description="Each component pulls in its npm dependencies, the cn helper and the theme tokens."
      >
        <CodeBlock
          lang="bash"
          code={`pnpm dlx shadcn@latest add ${r("tool-approval-queue")}`}
        />
      </DocsSection>
      <DocsSection
        id="tokens"
        title="Theme tokens"
        description={
          <>
            Components use your existing <code className="font-mono">background</code>,{" "}
            <code className="font-mono">foreground</code> and{" "}
            <code className="font-mono">muted-foreground</code>, plus a few additive
            tokens. They install automatically; to add them on their own:
          </>
        }
      >
        <CodeBlock lang="bash" code={`pnpm dlx shadcn@latest add ${r("theme")}`} />
      </DocsSection>
      <DocsSection
        id="manual"
        title="Manual setup"
        description="Not using the CLI? Install the dependencies, add the tokens to your global CSS and create the cn helper."
      >
        <div className="flex flex-col gap-4">
          <CodeBlock
            lang="bash"
            code="pnpm add motion lucide-react clsx tailwind-merge"
          />
          <CodeBlock lang="css" title="app/globals.css" code={await getTokensCss()} />
          <CodeBlock lang="ts" title="lib/utils.ts" code={utils} />
        </div>
      </DocsSection>
      <DocsSection
        id="motion"
        title="Motion"
        description='Animations use motion (formerly Framer Motion) with spring physics. Every component wraps itself in MotionConfig reducedMotion="user", so transforms and layout animations turn off when the OS asks for reduced motion — opacity changes stay so state is still visible.'
      >
        <CodeBlock
          lang="bash"
          code={`# Demos and previews are driven by a scripted run — handy for your own tests too.\npnpm dlx shadcn@latest add ${r("use-mock-run")}`}
        />
      </DocsSection>
    </DocsPage>
  );
}
