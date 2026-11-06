import { Heart } from "lucide-react";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { buildStars } from "@/lib/github-stars";
import { CommandMenu } from "./command-menu";
import { GitHubStars } from "./github-stars";
import { GitHubIcon } from "./icons";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";

export async function SiteHeader() {
  const stars = await buildStars();
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto grid h-14 max-w-[90rem] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <MobileNav />
          <Logo />
          <a
            href={siteConfig.author.url}
            target="_blank"
            rel="noreferrer"
            className="hidden gap-1 rounded-full px-2 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground lg:inline-flex"
          >
            Created by <span className="text-foreground">{siteConfig.author.name}</span>
          </a>
          <nav aria-label="Main" className="hidden items-center gap-1 text-sm md:flex">
            <HeaderLink href="/docs/installation">Docs</HeaderLink>
          </nav>
        </div>
        <CommandMenu className="w-9 justify-center px-0 sm:w-72 sm:justify-start sm:pr-1.5 sm:pl-2.5 [&>span]:hidden sm:[&>span]:block" />
        <div className="flex items-center justify-end gap-1.5">
          <a
            href={siteConfig.donate}
            target="_blank"
            rel="noreferrer"
            aria-label="Donate on Ko-fi"
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-2 text-sm text-muted-foreground transition-[color,background-color,scale] duration-150 ease-ui-out hover:bg-foreground/[0.06] hover:text-foreground active:scale-[0.97] sm:px-3"
          >
            <Heart className="size-4 text-[#ff375f]" aria-hidden="true" />
            <span className="hidden lg:inline">Donate</span>
          </a>
          <a
            href={siteConfig.github}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
            className="inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-full px-2 text-sm text-muted-foreground transition-[color,background-color,scale] duration-150 ease-ui-out hover:bg-foreground/[0.06] hover:text-foreground active:scale-[0.97]"
          >
            <GitHubIcon className="size-4" />
            <GitHubStars
              initial={stars}
              className="hidden font-mono text-xs tabular-nums sm:inline"
            />
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
    >
      {children}
    </Link>
  );
}
