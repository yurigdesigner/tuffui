import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ComponentCard } from "@/components/site/component-card";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { catalog } from "@/lib/catalog";
import { absoluteUrl, JsonLd, pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata = pageMetadata({ description: siteConfig.description, path: "/" });

const structured = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: siteConfig.name,
      url: absoluteUrl("/"),
      description: siteConfig.description,
    },
    {
      "@type": "SoftwareSourceCode",
      name: siteConfig.name,
      description: siteConfig.description,
      url: absoluteUrl("/"),
      codeRepository: siteConfig.github,
      programmingLanguage: ["TypeScript", "React"],
      license: "https://opensource.org/licenses/MIT",
      isAccessibleForFree: true,
    },
  ],
};

export default function Home() {
  return (
    <>
      <JsonLd data={structured} />
      <SiteHeader />
      <main id="content" className="flex-1">
        <section className="relative overflow-hidden">
          <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28">
            <div className="flex flex-col items-center">
              <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Free components for AI interfaces.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-pretty text-muted-foreground">
                Chats, tool calls, approvals, traces and usage for agents built on Claude,
                OpenAI and agent SDKs. MIT-licensed with the full source, installed with the
                shadcn CLI. No Pro tier, no paywall.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/components"
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-[opacity,scale] hover:opacity-90 active:scale-[0.97]"
                >
                  Browse components
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <a
                  href={siteConfig.github}
                  className="inline-flex h-10 items-center rounded-full bg-surface-raised px-5 text-sm font-medium transition-[background-color,scale] hover:bg-[color-mix(in_oklab,var(--surface-raised),var(--foreground)_7%)] active:scale-[0.97]"
                >
                  Star on GitHub
                </a>
              </div>
            </div>
          </div>
        </section>
        <section
          aria-labelledby="all-components"
          className="mx-auto max-w-[90rem] px-4 py-16 sm:px-6"
        >
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 id="all-components" className="text-2xl font-semibold tracking-tight">
              All components
            </h2>
            <span className="font-mono text-sm text-muted-foreground tabular-nums">
              {catalog.length} components
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {catalog.map((entry) => (
              <ComponentCard key={entry.slug} entry={entry} />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
