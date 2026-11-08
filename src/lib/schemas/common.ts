import { z } from "zod";

/**
 * Field helpers shared by every form and server action.
 * Inputs accept what HTML forms produce ("" for empty, numbers as strings);
 * outputs are exactly what Postgres columns expect (null for empty).
 */

export const requiredText = (max = 500) =>
  z.string().trim().min(1, "Required").max(max, `Max ${max} characters`);

export const optionalText = (max = 10_000) =>
  z
    .string()
    .max(max, `Max ${max} characters`)
    .nullish()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : null));

export const optionalNumber = z
  .union([z.number(), z.string()])
  .nullish()
  .transform((v, ctx) => {
    if (v === null || v === undefined || (typeof v === "string" && v.trim() === "")) return null;
    const n = typeof v === "number" ? v : Number(v.replace(/[,\s₦$]/g, ""));
    if (!Number.isFinite(n)) {
      ctx.addIssue({ code: "custom", message: "Must be a number" });
      return z.NEVER;
    }
    return n;
  });

export const requiredNumber = z.union([z.number(), z.string()]).transform((v, ctx) => {
  const n = typeof v === "number" ? v : Number(String(v).replace(/[,\s₦$]/g, ""));
  if (String(v).trim() === "" || !Number.isFinite(n)) {
    ctx.addIssue({ code: "custom", message: "Must be a number" });
    return z.NEVER;
  }
  return n;
});

export const optionalInt = (min?: number, max?: number) =>
  optionalNumber.refine((n) => n === null || Number.isInteger(n), "Must be a whole number").refine(
    (n) => n === null || ((min === undefined || n >= min) && (max === undefined || n <= max)),
    `Must be between ${min ?? "-∞"} and ${max ?? "∞"}`,
  );

export const uuid = z.uuid();

export const optionalUuid = z
  .union([z.uuid(), z.literal("")])
  .nullish()
  .transform((v) => (v ? v : null));

export const isoDate = z.iso.date("Use YYYY-MM-DD");

export const optionalDate = z
  .union([z.iso.date("Use YYYY-MM-DD"), z.literal("")])
  .nullish()
  .transform((v) => (v ? v : null));

export const quarter = z.enum(["Q1", "Q2", "Q3", "Q4"]);
export const currency = z.enum(["NGN", "USD", "GBP", "EUR"]);

/** Value from a user-editable option set (validated loosely; option_sets is the source). */
export const optionValue = z.string().trim().min(1, "Required").max(100);
export const optionalOptionValue = optionalText(100);

export const textArray = z
  .union([z.array(z.string()), z.string()])
  .nullish()
  .transform((v) =>
    (Array.isArray(v) ? v : (v ?? "").split(/\n|,/)).map((s) => s.trim()).filter(Boolean),
  );

export const idParam = z.object({ id: uuid });

type StripDefault<S> = S extends z.ZodDefault<infer Inner> ? Inner : S;
type UpdateShape<T extends z.ZodRawShape> = { [K in keyof T]: z.ZodOptional<StripDefault<T[K]>> };

/**
 * Update schema from a create schema: every field optional, and defaults
 * REMOVED. (Zod v4's .partial() still applies .default() to missing keys, so a
 * partial update of just `name` would silently reset e.g. attention/status.)
 * Missing keys stay missing → the column is left untouched.
 */
export function toUpdateSchema<T extends z.ZodRawShape>(schema: z.ZodObject<T>): z.ZodObject<UpdateShape<T>> {
  const shape: Record<string, z.ZodType> = {};
  for (const [key, field] of Object.entries(schema.shape)) {
    const inner = field instanceof z.ZodDefault ? (field.unwrap() as z.ZodType) : (field as z.ZodType);
    shape[key] = inner.optional();
  }
  return z.object(shape) as unknown as z.ZodObject<UpdateShape<T>>;
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
