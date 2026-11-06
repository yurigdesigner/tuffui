import { llmsFull } from "@/lib/llms";

// Prerendered at build time so the site can ship as a static export.
export const dynamic = "force-static";

export function GET() {
  return new Response(llmsFull(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
