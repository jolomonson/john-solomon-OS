import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { finishSignIn, safeNext } from "@/lib/auth";

/**
 * Magic-link landing. Handles both link styles:
 *  - token_hash + type (our email template; works across browsers/devices)
 *  - code (Supabase default PKCE link; must be opened in the same browser)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  const db = await createClient();
  let error: unknown = null;

  if (tokenHash && type) {
    ({ error } = await db.auth.verifyOtp({ type, token_hash: tokenHash }));
  } else if (code) {
    ({ error } = await db.auth.exchangeCodeForSession(code));
  } else {
    error = new Error("missing token");
  }

  if (error) {
    return NextResponse.redirect(new URL("/login?error=link_invalid", origin));
  }

  const result = await finishSignIn(db);
  if (!result.ok) {
    return NextResponse.redirect(new URL(`/login?error=${result.reason}`, origin));
  }
  return NextResponse.redirect(new URL(next, origin));
}
