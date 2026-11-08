"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isEmailAllowed } from "@/lib/allowlist";
import { finishSignIn, safeNext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type LoginState =
  | { step: "email"; error?: string; email?: string }
  | { step: "code"; email: string; error?: string; info?: string };

const emailSchema = z.object({ email: z.email("Enter a valid email").transform((e) => e.trim().toLowerCase()) });
const codeSchema = z.object({
  email: z.email(),
  token: z
    .string()
    .transform((t) => t.replace(/\s+/g, ""))
    .pipe(z.string().regex(/^\d{6,10}$/, "Enter the code from the email")),
  next: z.string().optional(),
});

export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { step: "email", error: parsed.error.issues[0]?.message };
  const { email } = parsed.data;

  // Same response whether or not the email is allowed, so the form can't be used to probe.
  const sentState: LoginState = {
    step: "code",
    email,
    info: "Check your email. Tap the link, or enter the code here.",
  };
  if (!isEmailAllowed(email)) return sentState;

  const h = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || h.get("origin") || `https://${h.get("host")}`;
  const next = safeNext(formData.get("next")?.toString());

  const db = await createClient();
  const { error } = await db.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    console.error("signInWithOtp failed", error);
    return { step: "email", email, error: error.status === 429 ? "Too many attempts. Wait a minute." : "Could not send the email. Try again." };
  }
  return sentState;
}

export async function verifyCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = codeSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
    next: formData.get("next")?.toString(),
  });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) return { step: "code", email, error: parsed.error.issues[0]?.message };

  const db = await createClient();
  const { error } = await db.auth.verifyOtp({ email: parsed.data.email, token: parsed.data.token, type: "email" });
  if (error) return { step: "code", email, error: "That code is invalid or expired." };

  const result = await finishSignIn(db);
  if (!result.ok) {
    return { step: "email", error: result.reason === "not_allowed" ? "This email can't use this app." : "Signed in, but setup failed. Reload to retry." };
  }
  redirect(safeNext(parsed.data.next));
}

export async function signOut() {
  const db = await createClient();
  await db.auth.signOut();
  redirect("/login");
}
