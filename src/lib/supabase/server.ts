import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/env";
import type { Database } from "./database.types";

export type { Db } from "@/lib/data/repo";

/**
 * Supabase client bound to the request's auth cookies. Reads cookies(), so with
 * Cache Components any Server Component calling it must sit inside <Suspense>.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // The proxy refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

/** Per-request memoised client + verified user (claims are checked against the JWKS / auth server). */
export const getSession = cache(async () => {
  // Session-dependent UI is always request-time (it also reads the clock in the user's timezone).
  await connection();
  const db = await createClient();
  const { data, error } = await db.auth.getClaims();
  const claims = error ? null : data?.claims ?? null;
  return {
    db,
    user: claims ? { id: claims.sub as string, email: (claims.email as string | undefined) ?? null } : null,
  };
});
