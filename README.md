# 24 @ 24 — Personal OS

John Solomon's personal operating system, 16 Oct 2026 → 16 Oct 2027.
24 goals, a business portfolio and a $24M liquid-capital target, with the daily **Signal vs Noise** view at the centre.

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript strict · Tailwind 4 · shadcn/ui (Radix) · Supabase (Postgres, Auth magic link/OTP, RLS) · Zod · react-hook-form · Recharts · date-fns · PWA.

## Quick start (local)

Requirements: Node 20+, Docker Desktop running, Supabase CLI.

```bash
npm install
npm run db:start          # supabase start — applies supabase/migrations/*
cp .env.example .env.local   # then paste the keys printed by `supabase status`
npm run dev               # http://localhost:3000
```

Sign in with an email in `ALLOWED_EMAILS`. Locally, emails land in Mailpit at http://127.0.0.1:54324.
Tap the link **or** type the 6-digit code. The code is what you use inside the installed iOS PWA, because a PWA doesn't share cookies with Safari.
First sign-in creates your `settings` row and seeds option sets, 24 goals, 26 assets, the opening money entries and 2 countries. Seeding is idempotent.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm test` | Unit tests: dates/timezone, rules, money, formatting, schemas |
| `npm run test:db` | Integration tests against LOCAL Supabase (reads `.env.test.local`, refuses hosted URLs): seed, idempotency, RLS isolation between two users, all triggers/rules, views |
| `npm run typecheck` | Route typegen + `tsc --noEmit` |
| `npm run db:reset` | Recreate the local DB from migrations |
| `npm run db:types` | Regenerate `src/lib/supabase/database.types.ts` from the local schema |
| `npm run icons` | Re-render PWA PNG icons from `public/icons/*.svg` |

## Layout

```
supabase/migrations/   schema · RLS · rules + seed · views
src/proxy.ts           session refresh + auth gate + allowlist (Next 16 "proxy" = old middleware)
src/lib/dates.ts       today / day X / days left / quarter / week — all in settings.timezone
src/lib/rules.ts       signal/noise default, liquid capital, net worth, FX, goal progress
src/lib/schemas/*      Zod schemas shared by forms and server actions
src/lib/data/*         one typed data-access module per table (repo.ts = generic CRUD)
src/app/(app)/*        Today · Week · Portfolio · Goals · Money · More
```

## Rules enforced in the database

- **Max active assets** = `settings.max_active_assets`. A trigger raises `MAX_ACTIVE_ASSETS`, and the error lists the current active assets.
- **Kill = decision.** `attention='killed'` is only possible through `kill_asset(...)`, which writes the Decision Log row in the same transaction.
- **Signal/noise default.** Tasks on an active asset default to signal. Tasks on any other asset default to noise. Tasks with no asset default to signal. Changing `kind` marks the task overridden, and `kind_overridden=false` resets it. When an asset's attention changes, open tasks from today onward are re-derived.
- **Money.** `amount_ngn = amount × fx_used`. USD defaults to the settings rate at entry time. GBP and EUR need an explicit rate.
- **One thing.** The current quarter's `quarterly_objectives` row for an asset is its one thing. `v_asset_focus.missing_one_thing` drives the red badge.
- **Quarters** follow calendar months: Q1 = 16 Oct–31 Dec 2026, Q2 = Jan–Mar, Q3 = Apr–Jun, Q4 = 1 Jul–16 Oct 2027.
- **RLS** on every table: `user_id = auth.uid()`. Foreign keys pointing at another user's rows are rejected.

## Deploy (Vercel + Supabase)

Production: **https://jolomonson.mispartechnologies.com**, project `lugxigvcfkbkxzqevdtz`.

1. Push the schema: `supabase db push --db-url "$SESSION_POOLER"` (the session-pooler URI from Dashboard → Connect).
2. Auth → URL Configuration:
   - Site URL: `https://jolomonson.mispartechnologies.com`
   - Redirect URLs: `https://jolomonson.mispartechnologies.com/**` and `http://localhost:3000/**`
3. Auth → Emails → SMTP Settings (Resend):
   - host `smtp.resend.com`, port `465`, username `resend`, password = your Resend API key
   - sender `no-reply@mispartechnologies.com`, name `24 @ 24`
   - Then raise Auth → Rate Limits → emails per hour (the default is very low).
4. Auth → Emails → Templates. Paste `supabase/templates/magic_link.html` into **Magic Link** and `confirmation.html` into **Confirm signup**. The link is built from `{{ .RedirectTo }}`, so it comes back to whichever origin asked for it (localhost or production). Allow that origin under Redirect URLs.
5. Vercel → Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `ALLOWED_EMAILS`, and `NEXT_PUBLIC_SITE_URL=https://jolomonson.mispartechnologies.com`.
6. Vercel → Domains: add `jolomonson.mispartechnologies.com`, then create the DNS record Vercel shows (a `CNAME` for `jolomonson`) where mispartechnologies.com's DNS is managed.
