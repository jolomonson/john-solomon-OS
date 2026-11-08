import type { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { toDataError } from "./errors";

/**
 * Typed CRUD for one table. Every write is validated with the table's Zod
 * schema (the same schema the form uses), and the schema's output type is
 * checked at compile time against the generated Insert/Update types, so the
 * schemas cannot drift from the database.
 *
 * Every function takes the Supabase client explicitly. Server code passes the
 * request-scoped client (RLS = the signed-in user); tests pass their own.
 */

export type Db = SupabaseClient<Database>;
type PublicSchema = Database["public"];
export type TableName = keyof PublicSchema["Tables"];
export type ViewName = keyof PublicSchema["Views"];
export type Row<T extends TableName> = PublicSchema["Tables"][T]["Row"];
export type InsertRow<T extends TableName> = PublicSchema["Tables"][T]["Insert"];
export type UpdateRow<T extends TableName> = PublicSchema["Tables"][T]["Update"];
export type ViewRow<V extends ViewName> = PublicSchema["Views"][V]["Row"];

export type FilterOp = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "is" | "ilike";
export type Filter<R> = { column: keyof R & string; op: FilterOp; value: unknown };
export type Order<R> = { column: keyof R & string; ascending?: boolean; nullsFirst?: boolean };

export type ListOptions<R> = {
  filters?: Filter<R>[];
  order?: Order<R>[];
  /** Case-insensitive substring search across the repo's searchColumns. */
  search?: string;
  limit?: number;
  offset?: number;
};

// Minimal structural type for the query builder; keeps the generic factory simple.
type AnyQuery = {
  select: (cols?: string, opts?: { count?: "exact"; head?: boolean }) => AnyQuery;
  insert: (v: unknown) => AnyQuery;
  update: (v: unknown) => AnyQuery;
  upsert: (v: unknown, o?: { onConflict?: string; ignoreDuplicates?: boolean }) => AnyQuery;
  delete: () => AnyQuery;
  eq: (c: string, v: unknown) => AnyQuery;
  order: (c: string, o?: { ascending?: boolean; nullsFirst?: boolean }) => AnyQuery;
  range: (from: number, to: number) => AnyQuery;
  limit: (n: number) => AnyQuery;
  or: (f: string) => AnyQuery;
  filter: (c: string, op: string, v: unknown) => AnyQuery;
  in: (c: string, v: unknown[]) => AnyQuery;
  is: (c: string, v: unknown) => AnyQuery;
  single: () => PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }>;
  maybeSingle: () => PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }>;
} & PromiseLike<{ data: unknown; error: { message: string; code?: string } | null; count?: number | null }>;

function builder(db: Db, relation: string): AnyQuery {
  return (db as unknown as { from: (t: string) => AnyQuery }).from(relation);
}

function escapeSearch(term: string) {
  // PostgREST or() syntax: commas and parentheses are separators.
  return term.replace(/[%_]/g, "\\$&").replace(/[,()]/g, " ");
}

export function applyListOptions<R>(q: AnyQuery, opts: ListOptions<R>, searchColumns: string[]): AnyQuery {
  for (const f of opts.filters ?? []) {
    if (f.op === "in") q = q.in(f.column, f.value as unknown[]);
    else if (f.op === "is") q = q.is(f.column, f.value);
    else q = q.filter(f.column, f.op, f.value);
  }
  const term = opts.search?.trim();
  if (term && searchColumns.length) {
    const t = escapeSearch(term);
    q = q.or(searchColumns.map((c) => `${c}.ilike.%${t}%`).join(","));
  }
  for (const o of opts.order ?? []) q = q.order(o.column, { ascending: o.ascending ?? true, nullsFirst: o.nullsFirst });
  if (opts.limit !== undefined) {
    const from = opts.offset ?? 0;
    q = q.range(from, from + opts.limit - 1);
  }
  return q;
}

export function createRepo<
  T extends TableName,
  C extends z.ZodType<InsertRow<T>, unknown>,
  U extends z.ZodType<UpdateRow<T>, unknown>,
>(
  table: T,
  config: {
    create: C;
    update: U;
    defaultOrder?: Order<Row<T>>[];
    searchColumns?: (keyof Row<T> & string)[];
  },
) {
  type R = Row<T>;
  const searchColumns = config.searchColumns ?? [];

  return {
    table,
    schemas: { create: config.create, update: config.update },

    async list(db: Db, opts: ListOptions<R> = {}): Promise<R[]> {
      const q = applyListOptions(builder(db, table).select("*"), { order: config.defaultOrder, ...opts }, searchColumns);
      const { data, error } = await q;
      if (error) throw toDataError(error);
      return (data ?? []) as R[];
    },

    async count(db: Db, opts: Pick<ListOptions<R>, "filters" | "search"> = {}): Promise<number> {
      const q = applyListOptions(builder(db, table).select("*", { count: "exact", head: true }), opts, searchColumns);
      const { error, count } = await q;
      if (error) throw toDataError(error);
      return count ?? 0;
    },

    async get(db: Db, id: string): Promise<R | null> {
      const { data, error } = await builder(db, table).select("*").eq("id", id).maybeSingle();
      if (error) throw toDataError(error);
      return (data ?? null) as R | null;
    },

    /** Validates with the create schema, inserts, returns the stored row (with trigger-computed fields). */
    async create(db: Db, input: z.input<C>): Promise<R> {
      const values = config.create.parse(input);
      const { data, error } = await builder(db, table).insert(values).select("*").single();
      if (error) throw toDataError(error);
      return data as R;
    },

    /** Validates with the update schema (partial), updates by id, returns the stored row. */
    async update(db: Db, id: string, input: z.input<U>): Promise<R> {
      const values = config.update.parse(input);
      const { data, error } = await builder(db, table).update(values).eq("id", id).select("*").single();
      if (error) throw toDataError(error);
      return data as R;
    },

    /** Deletes by id and returns the deleted row (so the UI can offer undo via restore()). */
    async remove(db: Db, id: string): Promise<R | null> {
      const { data, error } = await builder(db, table).delete().eq("id", id).select("*").maybeSingle();
      if (error) throw toDataError(error);
      return (data ?? null) as R | null;
    },

    /**
     * Re-inserts a row returned by remove() (same id). Rows removed by ON DELETE
     * CASCADE are not restored — for parents with cascading children the UI
     * defers the delete for the undo window instead.
     */
    async restore(db: Db, row: R): Promise<R> {
      const { data, error } = await builder(db, table).insert(row).select("*").single();
      if (error) throw toDataError(error);
      return data as R;
    },
  };
}

/** Read helper for the SQL views (read-only). */
export async function listView<V extends ViewName>(
  db: Db,
  view: V,
  opts: ListOptions<ViewRow<V>> = {},
): Promise<ViewRow<V>[]> {
  const q = applyListOptions(builder(db, view).select("*"), opts, []);
  const { data, error } = await q;
  if (error) throw toDataError(error);
  return (data ?? []) as ViewRow<V>[];
}
