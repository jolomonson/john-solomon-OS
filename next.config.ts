import path from "node:path";
import type { NextConfig } from "next";

/** First non-empty value among the given env names. */
const firstEnv = (...names: string[]) => names.map((n) => process.env[n]?.trim()).find(Boolean);

/**
 * Accept the alternative names Supabase's dashboard, the Vercel↔Supabase
 * integration or a pasted .env might use, and expose them under the names the
 * app reads. Only public values (URL, publishable/anon key) go here, because
 * these get inlined into the browser bundle.
 */
const publicEnv = Object.fromEntries(
  Object.entries({
    NEXT_PUBLIC_SUPABASE_URL: firstEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL", "PROJECT_URL"),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: firstEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_PUBLISHABLE_KEY",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_ANON_KEY",
    ),
  }).filter((entry): entry is [string, string] => Boolean(entry[1])),
);

const nextConfig: NextConfig = {
  env: publicEnv,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // A stray package-lock.json in the user folder made Turbopack guess the wrong root.
    root: path.join(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
