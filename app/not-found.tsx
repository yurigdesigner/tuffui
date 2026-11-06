import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main
        id="content"
        className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center"
      >
        <p className="label">404</p>
        <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
        <Link
          href="/components"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Browse components
        </Link>
      </main>
    </>
  );
}
