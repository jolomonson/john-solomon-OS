import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/env";
import { isEmailAllowed } from "@/lib/allowlist";
import type { Database } from "./database.types";

const PUBLIC_PATHS = ["/login", "/auth"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Refreshes the Supabase session cookie on every request and gates the app:
 *  - signed out → /login
 *  - signed in but not on the allowlist → signed out, /login?error=not_allowed
 *  - signed in and visiting /login → /today
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
      },
    },
  });

  // Do not put code between createServerClient and getClaims(): it refreshes the session.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const { pathname, search } = request.nextUrl;

  const redirectTo = (path: string, params?: Record<string, string>) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v);
    const res = NextResponse.redirect(url);
    // carry refreshed/cleared auth cookies over to the redirect
    for (const c of response.cookies.getAll()) res.cookies.set(c);
    return res;
  };

  if (!claims) {
    if (isPublic(pathname)) return response;
    return redirectTo("/login", pathname === "/" ? {} : { next: pathname + search });
  }

  if (!isEmailAllowed(claims.email as string | undefined)) {
    await supabase.auth.signOut();
    if (pathname === "/login") return response;
    return redirectTo("/login", { error: "not_allowed" });
  }

  if (pathname === "/login" || pathname === "/") {
    return redirectTo("/today");
  }

  return response;
}
