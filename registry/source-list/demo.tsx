"use client";

import { SourceList, type Source } from "./source-list";

const sources: Source[] = [
  {
    id: "edge",
    title: "Caching static assets at the edge",
    url: "https://developers.cloudflare.com/cache/concepts/default-cache-behavior/",
    snippet:
      "Static files are cached by default based on file extension; HTML is not cached unless a rule says so.",
    date: "Sep 2026",
  },
  {
    id: "next",
    title: "Static exports",
    url: "https://nextjs.org/docs/app/guides/static-exports",
    snippet:
      "Route Handlers render a static response at build time when marked force-static.",
    date: "Oct 2026",
  },
  {
    id: "web",
    title: "Cache-Control: immutable",
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control",
    snippet:
      "Indicates that the response will not be updated while it's fresh, so browsers skip revalidation.",
    date: "Aug 2026",
  },
  {
    id: "edge2",
    title: "Custom headers for static assets",
    url: "https://developers.cloudflare.com/workers/static-assets/headers/",
    snippet:
      "A _headers file in the assets directory attaches headers to matching paths.",
    date: "Jul 2026",
  },
];

const text =
  "Hashed build files can be cached for a year with `immutable` [3] because their names change on every deploy [2]. Cloudflare caches them by extension out of the box [1], and a `_headers` file sets the long Cache-Control for `/_next/static/*` [4, 1]. HTML stays uncached so new deploys show up at once [1].";

export default function SourceListDemo({ variant }: { variant?: string }) {
  if (variant === "Panel") {
    return (
      <SourceList
        variant="panel"
        data={{
          sources,
          claims: [
            {
              id: "c1",
              text: "Hashed files can be cached for a year",
              sourceIds: ["web", "next"],
            },
            { id: "c2", text: "Cached by extension by default", sourceIds: ["edge"] },
            {
              id: "c3",
              text: "_headers sets Cache-Control",
              sourceIds: ["edge2", "edge"],
            },
          ],
        }}
      />
    );
  }
  return <SourceList data={{ sources, text: text.replace(/`/g, "") }} />;
}
