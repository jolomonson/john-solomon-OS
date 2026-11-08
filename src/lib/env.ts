import { z } from "zod";

/**
 * Public env (inlined at build time, safe in the browser).
 * Supabase's newer "publishable" key and the legacy "anon" key are both accepted.
 */
const parsed = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  })
  .refine((e) => e.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || e.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    message: "Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)",
  })
  .safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

if (!parsed.success) {
  const problems = parsed.error.issues.map((i) => `  - ${i.path.join(".") || "env"}: ${i.message}`).join("\n");
  throw new Error(
    `Missing or invalid Supabase environment variables:\n${problems}\n` +
      "Set them in .env.local (local) or Vercel → Settings → Environment Variables, then rebuild. " +
      "NEXT_PUBLIC_* values are inlined at build time.",
  );
}
const publicEnv = parsed.data;

export const SUPABASE_URL = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_KEY = (publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string;
