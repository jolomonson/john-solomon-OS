/**
 * Single-user app: only emails in ALLOWED_EMAILS (comma-separated, server-only)
 * may request a magic link or use the app. If the variable is empty, nobody can.
 */
export function allowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  return allowedEmails().includes(email.trim().toLowerCase());
}
