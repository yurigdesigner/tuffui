import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static: every page, the registry JSON and llms.txt are files on a CDN.
  output: "export",
  turbopack: {
    root: import.meta.dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
