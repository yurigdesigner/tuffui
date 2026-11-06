import { siteConfig } from "@/lib/site";

const links = [
  { href: "/llms.txt", label: "llms.txt" },
  { href: "/llms-full.txt", label: "llms-full.txt" },
  { href: siteConfig.github, label: "GitHub", external: true },
];

export function SiteFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-[90rem] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-8 text-sm text-muted-foreground sm:px-6">
      <p>
        {siteConfig.name} · {siteConfig.license} licensed, free forever.
      </p>
      <nav aria-label="Footer" className="flex items-center gap-4">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            {...(link.external && { target: "_blank", rel: "noreferrer" })}
            className="transition-colors hover:text-foreground"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </footer>
  );
}
