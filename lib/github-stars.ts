import { siteConfig } from "@/lib/site";

const repo = new URL(siteConfig.github).pathname.slice(1);
export const starsApi = `https://api.github.com/repos/${repo}`;

// Read once per build; the page then refreshes it in the browser.
let stars: Promise<number | null> | undefined;
export function buildStars() {
  stars ??= fetch(starsApi, { headers: { Accept: "application/vnd.github+json" } })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) =>
      typeof data?.stargazers_count === "number" ? data.stargazers_count : null,
    )
    .catch(() => null);
  return stars;
}
