import { z } from "zod";
import { isoDate, optionalDate, optionalOptionValue, optionalText, optionalUuid, requiredText, toUpdateSchema } from "./common";

export const CONTACT_STRENGTH = ["cold", "warm", "strong"] as const;
export const contactSchema = z.object({
  name: requiredText(200),
  category: optionalOptionValue,
  organisation: optionalText(200),
  how_met: optionalText(500),
  strength: z.enum(CONTACT_STRENGTH).nullish().transform((v) => v ?? null),
  last_contact: optionalDate,
  next_step: optionalText(500),
  asset_id: optionalUuid,
  notes: optionalText(),
});
export const contactUpdateSchema = toUpdateSchema(contactSchema);

export const learningItemSchema = z.object({
  title: requiredText(300),
  type: optionalOptionValue,
  area: optionalText(120),
  status: z.string().trim().min(1).default("to_start"),
  started: optionalDate,
  finished: optionalDate,
  takeaway: optionalText(),
});
export const learningItemUpdateSchema = toUpdateSchema(learningItemSchema);

export const COUNTRY_STATUS = ["wishlist", "planned", "booked", "visited"] as const;
export const countrySchema = z.object({
  country: requiredText(100),
  status: z.enum(COUNTRY_STATUS).default("wishlist"),
  planned_date: optionalDate,
  visited_date: optionalDate,
  purpose: optionalText(500),
  notes: optionalText(),
});
export const countryUpdateSchema = toUpdateSchema(countrySchema);

export const journalEntrySchema = z.object({
  entry_date: isoDate,
  country_id: optionalUuid,
  title: optionalText(300),
  body: optionalText(100_000),
});
export const journalEntryUpdateSchema = toUpdateSchema(journalEntrySchema);

export const decisionSchema = z.object({
  decided_on: isoDate,
  title: requiredText(300),
  asset_id: optionalUuid,
  options: optionalText(),
  reasoning: optionalText(),
  review_on: optionalDate,
  outcome: optionalText(),
});
export const decisionUpdateSchema = toUpdateSchema(decisionSchema);

export const ideaSchema = z.object({
  title: requiredText(300),
  area: optionalText(120),
  why_parked: optionalText(2000),
  revisit_on: optionalDate,
  promoted_asset_id: optionalUuid,
});
export const ideaUpdateSchema = toUpdateSchema(ideaSchema);
