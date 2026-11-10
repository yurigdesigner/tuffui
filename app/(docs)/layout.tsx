import { PromoCompact } from "@/components/site/promo";
import { SidebarNav } from "@/components/site/sidebar-nav";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {/* Below xl the Tuff card under the table of contents is hidden. */}
      <div className="mx-auto w-full max-w-[90rem] px-4 pt-4 sm:px-6 xl:hidden">
        <PromoCompact
          campaign="docs-mobile"
          className="bg-surface [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[color-mix(in_oklab,var(--surface),var(--foreground)_5%)]"
        />
      </div>
      <div className="mx-auto flex w-full max-w-[90rem] flex-1 px-4 sm:px-6">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-14 h-[calc(100dvh-3.5rem)] overflow-y-auto py-8 pr-1.5">
            <SidebarNav />
          </div>
        </aside>
        <main id="content" className="min-w-0 flex-1 py-10 lg:pl-12 xl:pl-14">
          {children}
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
