/**
 * Integration tests against a real Supabase (local: `supabase start`).
 * Creates two throwaway users, checks the seed, RLS isolation and every
 * DB-enforced rule, then deletes both users (cascade removes their rows).
 *
 * Run: npm run test:db   (needs .env.local with SUPABASE_SERVICE_ROLE_KEY)
 */
import { existsSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { todayInTimeZone } from "@/lib/dates";

// Always the LOCAL stack: this suite creates and deletes auth users.
if (existsSync(".env.test.local")) process.loadEnvFile(".env.test.local");

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(URL);
if (URL && !isLocal && process.env.ALLOW_REMOTE_DB_TESTS !== "1") {
  throw new Error(`Refusing to run DB tests against non-local Supabase (${URL}). Use .env.test.local.`);
}
const enabled = Boolean(URL && KEY && SERVICE);

type Db = SupabaseClient<Database>;

const TABLES = [
  "settings", "option_sets", "goals", "assets", "goal_assets", "kpis", "kpi_readings", "projects",
  "tasks", "quarterly_objectives", "monthly_plans", "weekly_plans", "weekly_priorities", "reviews",
  "income_entries", "expense_entries", "monthly_snapshots", "investments", "equity_stakes",
  "contacts", "learning_items", "countries", "journal_entries", "decisions", "ideas",
] as const;
const VIEWS = ["v_goal_progress", "v_kpi_latest", "v_capital_monthly", "v_asset_focus"] as const;

const admin = enabled ? createClient<Database>(URL, SERVICE, { auth: { persistSession: false } }) : (null as never);
const run = Date.now().toString(36);
const users: { id: string; db: Db }[] = [];

async function makeUser(tag: string) {
  const email = `rls-${tag}-${run}@test.local`;
  const password = `pw-${run}-${tag}-Aa1!`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  const db = createClient<Database>(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: e2 } = await db.auth.signInWithPassword({ email, password });
  if (e2) throw e2;
  users.push({ id: data.user.id, db });
  return { id: data.user.id, db };
}

async function count(db: Db, table: (typeof TABLES)[number]) {
  const { count, error } = await db.from(table).select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

async function counts(db: Db) {
  const out: Record<string, number> = {};
  for (const t of TABLES) out[t] = await count(db, t);
  return out;
}

describe.skipIf(!enabled)("database: seed, RLS and rules", () => {
  let A: { id: string; db: Db }; // plays John
  let B: { id: string; db: Db }; // second test user

  beforeAll(async () => {
    A = await makeUser("a");
    B = await makeUser("b");
  });

  afterAll(async () => {
    for (const u of users) await admin.auth.admin.deleteUser(u.id);
  });

  // ---------------------------------------------------------------- seed
  describe("first-login seed", () => {
    it("bootstrap creates settings and seeds exactly the spec data", async () => {
      const { data, error } = await A.db.rpc("bootstrap_user");
      expect(error).toBeNull();
      expect(data).toEqual({ seeded_now: true });

      const c = await counts(A.db);
      expect(c.settings).toBe(1);
      expect(c.goals).toBe(24);
      expect(c.assets).toBe(26);
      expect(c.option_sets).toBe(47);
      expect(c.goal_assets).toBe(3);
      expect(c.income_entries).toBe(1);
      expect(c.monthly_snapshots).toBe(1);
      expect(c.countries).toBe(2);
      expect(c.tasks).toBe(0);
    }, 90_000); // first call warms PostgREST + plpgsql caches; ~1s in psql

    it("settings defaults", async () => {
      const { data } = await A.db.from("settings").select("*").single();
      expect(data).toMatchObject({
        owner_name: "John Solomon",
        start_date: "2026-10-16",
        end_date: "2027-10-16",
        timezone: "Africa/Lagos",
        max_active_assets: 5,
        week_starts_on: 0,
      });
      expect(Number(data!.fx_ngn_per_usd)).toBe(1450);
      expect(data!.seeded_at).not.toBeNull();
    });

    it("is idempotent: bootstrap and seed again create no duplicates", async () => {
      const before = await counts(A.db);
      expect((await A.db.rpc("bootstrap_user")).data).toEqual({ seeded_now: false });
      expect((await A.db.rpc("seed_user_data")).error).toBeNull();
      expect((await A.db.rpc("seed_user_data")).error).toBeNull();
      expect(await counts(A.db)).toEqual(before);
    });

    it("respects max 5 active: the 6th seeded 'active' asset lands in maintenance with a note", async () => {
      const { data } = await A.db.from("assets").select("name, attention, notes").eq("attention", "active");
      expect(data!.map((a) => a.name).sort()).toEqual(
        ["Ednitio Management Technologies", "Mailnitio", "Mispar Technologies", "NatureFusion Enterprise", "Smart Attendance"].sort(),
      );
      const { data: nf } = await A.db.from("assets").select("attention, notes").eq("name", "NatureFusion Livestock Marketplace").single();
      expect(nf!.attention).toBe("maintenance");
      expect(nf!.notes).toMatch(/max_active_assets/);
    });

    it("links parents and money", async () => {
      const { data: rows } = await A.db.from("assets").select("id, name, parent_id");
      const byName = new Map(rows!.map((r) => [r.name, r]));
      expect(byName.get("Smart Attendance")!.parent_id).toBe(byName.get("Mispar Technologies")!.id);
      expect(byName.get("RoomCraft Marketplace")!.parent_id).toBe(byName.get("OptiForge Limited")!.id);
      expect(byName.get("Mispar Technologies")!.parent_id).toBeNull();

      const { data: inc } = await A.db.from("income_entries").select("*").single();
      expect(inc).toMatchObject({ entry_date: "2026-10-20", engine: "other", currency: "NGN", description: "DineroSteppers competition prize" });
      expect(Number(inc!.amount_ngn)).toBe(27000);
      expect(inc!.asset_id).toBe(byName.get("DineroSteppers")!.id);
    });
  });

  // ---------------------------------------------------------------- RLS
  describe("row level security", () => {
    it("user B (with their own seed) sees none of A's rows in any table or view", async () => {
      await B.db.rpc("bootstrap_user");
      for (const t of TABLES) {
        const { data, error } = await B.db.from(t).select("user_id").eq("user_id", A.id);
        expect(error, t).toBeNull();
        expect(data, t).toEqual([]);
        const { data: all } = await B.db.from(t).select("user_id");
        expect(all!.every((r) => r.user_id === B.id), t).toBe(true);
      }
      for (const v of VIEWS) {
        const { data, error } = await B.db.from(v).select("user_id");
        expect(error, v).toBeNull();
        expect(data!.every((r) => r.user_id === B.id), v).toBe(true);
      }
    });

    it("B cannot update, delete or impersonate A", async () => {
      const { data: aAsset } = await A.db.from("assets").select("id, name").eq("name", "Mispar Technologies").single();

      const { data: read } = await B.db.from("assets").select("*").eq("id", aAsset!.id);
      expect(read).toEqual([]);

      const { data: upd } = await B.db.from("assets").update({ name: "pwned" }).eq("id", aAsset!.id).select();
      expect(upd).toEqual([]);

      const { data: del } = await B.db.from("assets").delete().eq("id", aAsset!.id).select();
      expect(del).toEqual([]);

      const { error: ins } = await B.db.from("ideas").insert({ title: "x", user_id: A.id });
      expect(ins?.code).toBe("42501");

      // FK pointing at A's asset is rejected even though FK checks bypass RLS
      const { error: fk } = await B.db.from("tasks").insert({ title: "x", task_date: "2026-11-07", asset_id: aAsset!.id });
      expect(fk?.code).toBe("23503");

      const { data: still } = await A.db.from("assets").select("name").eq("id", aAsset!.id).single();
      expect(still!.name).toBe("Mispar Technologies");
    });

    it("B cannot kill A's asset via the function", async () => {
      const { data: aAsset } = await A.db.from("assets").select("id").eq("name", "Chessprint Coach").single();
      const { error } = await B.db.rpc("kill_asset", { p_asset_id: aAsset!.id, p_reasoning: "nope" });
      expect(error).not.toBeNull();
    });

    it("anonymous clients see nothing", async () => {
      const anon = createClient<Database>(URL, KEY, { auth: { persistSession: false } });
      const { data } = await anon.from("assets").select("id");
      expect(data ?? []).toEqual([]);
    });
  });

  // ---------------------------------------------------------------- rules
  describe("rules", () => {
    it("blocks a 6th active asset, reading the limit from settings", async () => {
      const { data: parked } = await A.db.from("assets").select("id").eq("name", "Chessprint Coach").single();
      const { error } = await A.db.from("assets").update({ attention: "active" }).eq("id", parked!.id);
      expect(error?.message).toBe("MAX_ACTIVE_ASSETS");
      expect(error?.details).toMatch(/Mispar Technologies/);

      await A.db.from("settings").update({ max_active_assets: 6 }).eq("user_id", A.id);
      const ok = await A.db.from("assets").update({ attention: "active" }).eq("id", parked!.id);
      expect(ok.error).toBeNull();
      await A.db.from("assets").update({ attention: "parked" }).eq("id", parked!.id);
      await A.db.from("settings").update({ max_active_assets: 5 }).eq("user_id", A.id);
    });

    it("killing requires kill_asset() (decision + kill in one go)", async () => {
      const { data: asset } = await A.db.from("assets").select("id").eq("name", "Chessprint Coach").single();

      const direct = await A.db.from("assets").update({ attention: "killed" }).eq("id", asset!.id);
      expect(direct.error?.message).toBe("KILL_REQUIRES_DECISION");

      const noReason = await A.db.rpc("kill_asset", { p_asset_id: asset!.id, p_reasoning: "  " });
      expect(noReason.error?.message).toBe("KILL_REASONING_REQUIRED");

      const { data: decisionId, error } = await A.db.rpc("kill_asset", {
        p_asset_id: asset!.id,
        p_reasoning: "No distribution channel; chess coaching is crowded.",
      });
      expect(error).toBeNull();
      const { data: d } = await A.db.from("decisions").select("*").eq("id", decisionId!).single();
      expect(d).toMatchObject({ asset_id: asset!.id, title: "Killed: Chessprint Coach", outcome: "killed" });
      const { data: after } = await A.db.from("assets").select("attention").eq("id", asset!.id).single();
      expect(after!.attention).toBe("killed");
    });

    it("task kind defaults from the asset and one tap overrides it", async () => {
      const ids = Object.fromEntries(
        ((await A.db.from("assets").select("id, name")).data ?? []).map((r) => [r.name, r.id]),
      );
      const ins = async (title: string, asset_id: string | null) =>
        (await A.db.from("tasks").insert({ title, task_date: "2026-11-07", asset_id }).select().single()).data!;

      expect((await ins("active", ids["Mispar Technologies"])).kind).toBe("signal");
      expect((await ins("maint", ids["Mispar School"])).kind).toBe("noise");
      expect((await ins("partner", ids["RevEd Technologies"])).kind).toBe("noise");
      expect((await ins("work", ids["OptiForge Limited"])).kind).toBe("noise");
      const none = await ins("none", null);
      expect(none.kind).toBe("signal");

      const flipped = (await A.db.from("tasks").update({ kind: "noise" }).eq("id", none.id).select().single()).data!;
      expect(flipped).toMatchObject({ kind: "noise", kind_overridden: true });

      const reset = (await A.db.from("tasks").update({ kind_overridden: false }).eq("id", none.id).select().single()).data!;
      expect(reset).toMatchObject({ kind: "signal", kind_overridden: false });

      const done = (await A.db.from("tasks").update({ status: "done" }).eq("id", none.id).select().single()).data!;
      expect(done.done_at).not.toBeNull();
      const undone = (await A.db.from("tasks").update({ status: "todo" }).eq("id", none.id).select().single()).data!;
      expect(undone.done_at).toBeNull();
    });

    it("import_key is unique per user but nullable", async () => {
      const a = await A.db.from("tasks").insert({ title: "i1", task_date: "2026-11-02", import_key: "sheet:1" });
      expect(a.error).toBeNull();
      const dup = await A.db.from("tasks").insert({ title: "i1b", task_date: "2026-11-02", import_key: "sheet:1" });
      expect(dup.error?.code).toBe("23505");
      const other = await B.db.from("tasks").insert({ title: "i1", task_date: "2026-11-02", import_key: "sheet:1" });
      expect(other.error).toBeNull();
    });

    it("money: amount_ngn uses the FX in effect; GBP needs a rate", async () => {
      const usd = (await A.db.from("income_entries").insert({ entry_date: "2026-11-05", engine: "consulting", amount: 100, currency: "USD" }).select().single()).data!;
      expect(Number(usd.fx_used)).toBe(1450);
      expect(Number(usd.amount_ngn)).toBe(145000);

      const gbp = await A.db.from("income_entries").insert({ entry_date: "2026-11-05", engine: "consulting", amount: 100, currency: "GBP" });
      expect(gbp.error?.code).toBe("23502");
      await A.db.from("income_entries").delete().eq("id", usd.id);
    });
  });

  // ---------------------------------------------------------------- views & dates
  describe("views and dates", () => {
    it("v_capital_monthly: 13 months Oct 2026 → Oct 2027, Oct = ₦27,000 ≈ $18.62", async () => {
      const { data } = await A.db.from("v_capital_monthly").select("*").order("month");
      expect(data).toHaveLength(13);
      expect(data![0].month).toBe("2026-10-01");
      expect(data![12].month).toBe("2027-10-01");
      expect(data![0]).toMatchObject({ quarter: "Q1", has_snapshot: true, is_carried_forward: false });
      expect(Number(data![0].liquid_capital_ngn)).toBe(27000);
      expect(Number(data![0].liquid_capital_usd)).toBeCloseTo(18.62, 2);
      expect(Number(data![0].income_ngn)).toBe(27000);
      expect(data![0].income_by_engine).toEqual({ other: 27000 });

      const quarters = data!.map((m) => m.quarter);
      expect(quarters).toEqual(["Q1", "Q1", "Q1", "Q2", "Q2", "Q2", "Q3", "Q3", "Q3", "Q4", "Q4", "Q4", "Q4"]);

      const today = todayInTimeZone("Africa/Lagos");
      for (const m of data!.slice(1)) {
        if (m.month! <= today) expect(m.is_carried_forward, m.month!).toBe(true);
        else expect(m.liquid_capital_ngn, m.month!).toBeNull();
      }
    });

    it("v_goal_progress and v_asset_focus", async () => {
      const { data: g } = await A.db.from("v_goal_progress").select("number, progress").in("number", [1, 2, 5]).order("number");
      expect(g).toEqual([
        { number: 1, progress: 0 },
        { number: 2, progress: null },
        { number: 5, progress: 0 },
      ]);
      const { data: f } = await A.db.from("v_asset_focus").select("name, attention, missing_one_thing").eq("attention", "active");
      expect(f).toHaveLength(5);
      // no quarterly objectives yet → all five show the red badge (while the programme is running)
      if (f![0] && (await A.db.rpc("app_today")).data! <= "2027-10-16") {
        expect(f!.every((r) => r.missing_one_thing)).toBe(true);
      }
      const { data: chess } = await A.db.from("v_asset_focus").select("name").eq("name", "Chessprint Coach");
      expect(chess).toEqual([]); // killed assets hidden
    });

    it("SQL quarter and today match lib/dates.ts", async () => {
      const q = async (d: string) =>
        (await A.db.rpc("program_quarter", { p_date: d, p_start: "2026-10-16", p_end: "2027-10-16" })).data;
      expect(await q("2026-10-16")).toBe("Q1");
      expect(await q("2026-12-31")).toBe("Q1");
      expect(await q("2027-01-01")).toBe("Q2");
      expect(await q("2027-07-01")).toBe("Q4");
      expect(await q("2027-10-16")).toBe("Q4");
      expect(await q("2026-10-15")).toBeNull();

      const { data: today } = await A.db.rpc("app_today");
      expect(today).toBe(todayInTimeZone("Africa/Lagos"));
    });
  });
});
