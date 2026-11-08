import "server-only";
import { redirect } from "next/navigation";
import { isEmailAllowed } from "@/lib/allowlist";
import { getSession, type Db } from "@/lib/supabase/server";

export type CurrentUser = { id: string; email: string | null };

/** Data Access Layer entry point: returns the verified user or redirects to /login. */
export async function requireUser(): Promise<{ db: Db; user: CurrentUser }> {
  const { db, user } = await getSession();
  if (!user) redirect("/login");
  if (!isEmailAllowed(user.email)) redirect("/login?error=not_allowed");
  return { db, user };
}

/**
 * Runs after a successful sign-in (magic link or code). Rejects emails not on the
 * allowlist, then creates settings + seeds on first login (idempotent in SQL).
 */
export async function finishSignIn(db: Db): Promise<{ ok: true } | { ok: false; reason: string }> {
  const { data } = await db.auth.getClaims();
  const email = (data?.claims?.email as string | undefined) ?? null;
  if (!isEmailAllowed(email)) {
    await db.auth.signOut();
    return { ok: false, reason: "not_allowed" };
  }
  const { error } = await db.rpc("bootstrap_user");
  if (error) {
    console.error("bootstrap_user failed", error);
    return { ok: false, reason: "bootstrap_failed" };
  }
  return { ok: true };
}

/** Only allow same-origin relative redirects. */
export function safeNext(next: string | null | undefined, fallback = "/today"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
