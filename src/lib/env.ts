import { z } from "zod";

/**
 * Public env (inlined at build time, safe in the browser).
 * Supabase's newer "publishable" key and the legacy "anon" key are both accepted.
 */
const publicEnv = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  })
  .refine((e) => e.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || e.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    message: "Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)",
  })
  .parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

export const SUPABASE_URL = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_KEY = (publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string;
