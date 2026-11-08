import type { PostgrestError } from "@supabase/supabase-js";

/**
 * A database error translated into something the UI can show.
 * `code` is a stable app code (e.g. MAX_ACTIVE_ASSETS) the UI can branch on,
 * e.g. to open the "Move another asset out of Active first" dialog.
 */
export class DataError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly detail?: string,
    public readonly hint?: string,
  ) {
    super(message);
    this.name = "DataError";
  }
}

export function toDataError(error: PostgrestError | { message: string; code?: string; details?: string; hint?: string }): DataError {
  const msg = error.message ?? "Database error";
  const details = "details" in error ? (error.details ?? undefined) : undefined;
  const hint = "hint" in error ? (error.hint ?? undefined) : undefined;

  // Raised by our triggers / functions (message = app code)
  switch (msg) {
    case "MAX_ACTIVE_ASSETS":
      return new DataError("Move another asset out of Active first", "MAX_ACTIVE_ASSETS", details, hint);
    case "KILL_REQUIRES_DECISION":
      return new DataError("Killing an asset needs a Decision Log entry", "KILL_REQUIRES_DECISION", details, hint);
    case "KILL_REASONING_REQUIRED":
      return new DataError("Record what was learned before killing this asset", "KILL_REASONING_REQUIRED", details, hint);
  }

  switch (error.code) {
    case "23505":
      return new DataError("That already exists", "DUPLICATE", details);
    case "23503":
      return new DataError("A linked record doesn't exist", "FOREIGN_KEY", details ?? msg);
    case "23514":
      return new DataError("A value is out of the allowed range", "CHECK_VIOLATION", details ?? msg);
    case "23502":
      return new DataError(msg, "NOT_NULL", details);
    case "42501":
      return new DataError("Not allowed", "FORBIDDEN", details);
    case "PGRST116":
      return new DataError("Not found", "NOT_FOUND", details);
  }
  return new DataError(msg, error.code ?? "UNKNOWN", details, hint);
}
