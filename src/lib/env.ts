import { z } from "zod";

/**
 * Public env (inlined at build time, safe in the browser).
 * Supabase's newer "publishable" key and the legacy "anon" key are both accepted.
 * `next.config.ts` maps common alternative names (SUPABASE_URL, PROJECT_URL, the
 * Vercel↔Supabase integration's names) onto these two, so they're always set here
 * when any of them is.
 */
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check each variable on its own so every problem is reported in one build.
const problems: string[] = [];
const url = z.url().safeParse(rawUrl);
if (!url.success) {
  problems.push(rawUrl ? `NEXT_PUBLIC_SUPABASE_URL is not a valid URL` : `NEXT_PUBLIC_SUPABASE_URL is not set`);
}
if (!rawKey) problems.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) is not set");

if (problems.length) {
  const where = process.env.VERCEL_ENV ? ` (Vercel environment: ${process.env.VERCEL_ENV})` : "";
  throw new Error(
    `Missing Supabase environment variables${where}:\n${problems.map((p) => `  - ${p}`).join("\n")}\n` +
      "Local: put them in .env.local. Vercel: Settings → Environment Variables, tick the environment above, " +
      "then Redeploy. Vercel only applies variable changes to NEW deployments.",
  );
}

export const SUPABASE_URL = url.data as string;
export const SUPABASE_KEY = rawKey as string;
