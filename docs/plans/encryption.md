# Local-First Encryption — Plan (Phase 6.3)

Not implemented this session, deliberately. Encryption is the kind of feature
where a rushed, unverified implementation is worse than not having it —  it
creates a false sense of security. This is a plan for a session where it can
get proper design attention, not a stopgap.

## Current state (be honest about this)

- Row Level Security is enabled on all four tables, but every policy is
  `using (true) with check (true)` on the anon key — i.e., anyone who has the
  Supabase URL and the publishable key (which lives in `.env`, itself
  git-ignored but present in plaintext on disk) can read and write every row.
  This was an explicit, documented single-user MVP tradeoff from Phase 2.1,
  not an oversight — but it means "encryption" without first addressing
  **access control** wouldn't actually protect much, since the app itself
  already has a wide-open key.
- There is no Supabase Auth in this project yet. No user identity exists to
  scope a key to.

## What "local-first encryption" would actually require here

1. **Auth first.** Client-side encryption without narrowing who can even hit
   the API first only protects the field contents from someone reading the
   Postgres table directly (e.g. a Supabase dashboard compromise) — it does
   nothing against the current wide-open RLS policies. Real Supabase Auth
   (even a single-user email/magic-link setup) should land before or
   alongside encryption, with RLS policies scoped to `auth.uid()` instead of
   `using (true)`.
2. **Decide what's actually sensitive.** Not every column needs encrypting.
   `mood`, `notes`, `catalysts.description`, `entities.name`, and
   `resolutions.description` are the personally sensitive free-text fields.
   `state`, `intensity`, `created_at`, `in_trove` are low-sensitivity
   metadata useful for querying (filtering by state, sorting by date) — encrypting
   those would break the app's own filtering/sorting without real benefit.
3. **Where does the key live?** For a genuinely single-user, single-device
   app, a device-generated key stored in `expo-secure-store` (iOS
   Keychain/Android Keystore) is the simplest honest answer. The moment this
   needs to sync across the user's own multiple devices (explicitly part of
   the original multi-device vision), that key needs to travel too — e.g.
   derived from a passphrase the user enters once per device, never sent to
   Supabase. That's a real UX decision (recovery if the passphrase is lost =
   permanent data loss) that deserves to be surfaced to the user directly,
   not decided silently by an autonomous session.
4. **Where does encryption/decryption happen?** Client-side only — encrypt the
   sensitive fields before the `supabase.from(...).insert(...)` calls already
   in `core/store.ts`, decrypt after every `fetchHistory()` read. This keeps
   Supabase storing ciphertext it can never read, which is the actual point
   of "local-first."
5. **Library choice** (research, don't guess): `expo-crypto` gives primitives
   but not a full envelope; something like `tweetnacl` (small, audited,
   works in RN) for symmetric encryption is a reasonable starting point to
   evaluate — not a final decision, just where to start looking.

## Recommended order for a future session

1. Add real Supabase Auth (even single-user) and narrow RLS policies.
2. Design the key-storage/recovery UX with the user directly — this is a
   product decision with real data-loss stakes, not a pure engineering call.
3. Then implement field-level encryption on the sensitive columns listed
   above, with tests that write and read back through the real encrypt/decrypt
   path against the live Supabase project (same verification discipline used
   throughout this project).
