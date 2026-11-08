import "server-only";
import { cache } from "react";
import { requireUser } from "@/lib/auth";
import { settingsUpdateSchema } from "@/lib/schemas/core";
import type { z } from "zod";
import { toDataError } from "./errors";
import type { Db, Row } from "./repo";

export type Settings = Row<"settings">;

/** Data access for public.settings (one row per user, keyed by user_id). */
export const settingsRepo = {
  async get(db: Db): Promise<Settings | null> {
    const { data, error } = await db.from("settings").select("*").maybeSingle();
    if (error) throw toDataError(error);
    return data;
  },

  async update(db: Db, userId: string, input: z.input<typeof settingsUpdateSchema>): Promise<Settings> {
    const values = settingsUpdateSchema.parse(input);
    const { data, error } = await db.from("settings").update(values).eq("user_id", userId).select("*").single();
    if (error) throw toDataError(error);
    return data;
  },

  /** Creates settings + seeds on first login. Safe to call any number of times. */
  async bootstrap(db: Db): Promise<{ seeded_now: boolean }> {
    const { data, error } = await db.rpc("bootstrap_user");
    if (error) throw toDataError(error);
    return data as { seeded_now: boolean };
  },
};

/**
 * Signed-in user's settings for this request. If the row is missing (e.g. the
 * first-login bootstrap was interrupted), bootstraps and re-reads.
 */
export const getSettings = cache(async (): Promise<Settings> => {
  const { db } = await requireUser();
  let settings = await settingsRepo.get(db);
  if (!settings) {
    await settingsRepo.bootstrap(db);
    settings = await settingsRepo.get(db);
  }
  if (!settings) throw new Error("Settings row could not be created");
  return settings;
});
