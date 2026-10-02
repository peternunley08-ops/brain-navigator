// A stand-in for the online database while "Show someone the app" is on.
// It answers the same queries the stores make (select, insert, update,
// upsert, delete, with eq / in / gte / order / limit / single…) from tables
// kept in memory, so the app works fully with a made-up student's data and
// nothing is read from or written to the real database. Tables are filled
// by `fillSampleDb` when showing starts and dropped when it ends.

type Row = Record<string, unknown>;
type Result = { data: unknown; error: { message: string } | null; count: number | null };

let tables: Record<string, Row[]> = {};

export function fillSampleDb(next: Record<string, Row[]>) {
  tables = JSON.parse(JSON.stringify(next));
}

export function clearSampleDb() {
  tables = {};
}

const DEFAULTS: Record<string, Row> = {
  cognitive_state: { in_trove: false, notion_page_id: null, image_url: null, notes: null },
  tasks: { completed: false, completed_at: null, notion_page_id: null, time_budget_minutes: null },
  habits: { archived: false, target_per_week: null },
  daily_checkins: { notion_page_id: null, notes: null },
};

function uuid() {
  return 'sample-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

function cmp(a: unknown, b: unknown) {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

class SampleQuery implements PromiseLike<Result> {
  private filters: ((r: Row) => boolean)[] = [];
  private sorts: { col: string; asc: boolean }[] = [];
  private max: number | null = null;
  private skip = 0;
  private mode: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private payload: Row | Row[] | null = null;
  private one: 'single' | 'maybe' | null = null;
  private returning = false;
  private conflict = 'id';

  constructor(private table: string) {}

  select(_cols?: string, _opts?: unknown) {
    if (this.mode !== 'select') this.returning = true;
    return this;
  }
  insert(v: Row | Row[]) {
    this.mode = 'insert';
    this.payload = v;
    return this;
  }
  update(v: Row) {
    this.mode = 'update';
    this.payload = v;
    return this;
  }
  upsert(v: Row | Row[], opts?: { onConflict?: string }) {
    this.mode = 'upsert';
    this.payload = v;
    if (opts?.onConflict) this.conflict = opts.onConflict;
    return this;
  }
  delete() {
    this.mode = 'delete';
    return this;
  }
  eq(c: string, v: unknown) {
    this.filters.push((r) => r[c] === v);
    return this;
  }
  neq(c: string, v: unknown) {
    this.filters.push((r) => r[c] !== v);
    return this;
  }
  is(c: string, v: unknown) {
    this.filters.push((r) => (r[c] ?? null) === v);
    return this;
  }
  in(c: string, vs: unknown[]) {
    this.filters.push((r) => vs.includes(r[c]));
    return this;
  }
  gte(c: string, v: unknown) {
    this.filters.push((r) => cmp(r[c], v) >= 0);
    return this;
  }
  gt(c: string, v: unknown) {
    this.filters.push((r) => cmp(r[c], v) > 0);
    return this;
  }
  lte(c: string, v: unknown) {
    this.filters.push((r) => cmp(r[c], v) <= 0);
    return this;
  }
  lt(c: string, v: unknown) {
    this.filters.push((r) => cmp(r[c], v) < 0);
    return this;
  }
  ilike(c: string, pattern: string) {
    const re = new RegExp('^' + pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*') + '$', 'i');
    this.filters.push((r) => re.test(String(r[c] ?? '')));
    return this;
  }
  match(obj: Row) {
    this.filters.push((r) => Object.entries(obj).every(([k, v]) => r[k] === v));
    return this;
  }
  filter(c: string, op: string, v: unknown) {
    const f: Record<string, (r: Row) => boolean> = {
      eq: (r) => r[c] === v,
      neq: (r) => r[c] !== v,
      gte: (r) => cmp(r[c], v) >= 0,
      lte: (r) => cmp(r[c], v) <= 0,
      gt: (r) => cmp(r[c], v) > 0,
      lt: (r) => cmp(r[c], v) < 0,
    };
    if (f[op]) this.filters.push(f[op]);
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.sorts.push({ col, asc: opts?.ascending ?? true });
    return this;
  }
  limit(n: number) {
    this.max = n;
    return this;
  }
  range(from: number, to: number) {
    this.skip = from;
    this.max = to - from + 1;
    return this;
  }
  single() {
    this.one = 'single';
    return this;
  }
  maybeSingle() {
    this.one = 'maybe';
    return this;
  }

  then<A = Result, B = never>(ok?: ((v: Result) => A | PromiseLike<A>) | null, bad?: ((e: unknown) => B | PromiseLike<B>) | null): PromiseLike<A | B> {
    return Promise.resolve().then(() => this.run()).then(ok, bad);
  }

  private matches(r: Row) {
    return this.filters.every((f) => f(r));
  }

  private shape(rows: Row[]): Result {
    let out = rows;
    for (const s of [...this.sorts].reverse()) out = [...out].sort((a, b) => (s.asc ? 1 : -1) * cmp(a[s.col], b[s.col]));
    if (this.skip || this.max != null) out = out.slice(this.skip, this.max != null ? this.skip + this.max : undefined);
    out = clone(out);
    if (this.one) {
      if (!out.length) return { data: null, error: this.one === 'single' ? { message: 'No rows' } : null, count: 0 };
      return { data: out[0], error: null, count: 1 };
    }
    return { data: out, error: null, count: out.length };
  }

  private run(): Result {
    const t = (tables[this.table] ??= []);
    const now = new Date().toISOString();
    if (this.mode === 'select') return this.shape(t.filter((r) => this.matches(r)));
    if (this.mode === 'delete') {
      tables[this.table] = t.filter((r) => !this.matches(r));
      return { data: null, error: null, count: null };
    }
    if (this.mode === 'update') {
      const hit = t.filter((r) => this.matches(r));
      for (const r of hit) Object.assign(r, this.payload);
      return this.returning ? this.shape(hit) : { data: null, error: null, count: null };
    }
    const list = (Array.isArray(this.payload) ? this.payload : [this.payload ?? {}]) as Row[];
    const written: Row[] = [];
    for (const p of list) {
      const existing = this.mode === 'upsert' ? t.find((r) => r[this.conflict] === p[this.conflict]) : undefined;
      if (existing) {
        Object.assign(existing, p);
        written.push(existing);
      } else {
        const row = { id: uuid(), created_at: now, ...(DEFAULTS[this.table] ?? {}), ...p };
        t.push(row);
        written.push(row);
      }
    }
    return this.returning ? this.shape(written) : { data: null, error: null, count: null };
  }
}

export function sampleFrom(table: string) {
  return new SampleQuery(table);
}

/** Realtime does nothing while showing. */
export const sampleChannel = {
  on() {
    return sampleChannel;
  },
  subscribe() {
    return sampleChannel;
  },
  unsubscribe: async () => 'ok' as const,
};
