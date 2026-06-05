-- LLM credential migration (manual, additive).
--
-- Adds the BYOK credential store: one row per (user, provider) holding an
-- AES-256-GCM-encrypted API key (ciphertext + iv + auth_tag) plus a short
-- display hint. No data backfill — it's a brand-new table.
--
-- HOW TO APPLY
--   Dev (seed data is disposable, reseeded on `pnpm dev`):
--     pnpm --filter @pilleus/db db:push   # sync schema; then restart `pnpm dev`
--   Preserving real data:
--     psql "$DATABASE_URL" -f packages/db/drizzle/manual/0002_llm_credential.sql
--
-- Also set CREDENTIAL_ENCRYPTION_KEY (32 bytes; 64-char hex or base64) in
-- apps/web/.env before connecting any key — the app encrypts with it.

BEGIN;

CREATE TABLE IF NOT EXISTS "llm_credential" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "provider_id" text NOT NULL,
  "ciphertext" text NOT NULL,
  "iv" text NOT NULL,
  "auth_tag" text NOT NULL,
  "key_hint" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "llm_credential_user_provider_unique"
  ON "llm_credential" ("user_id","provider_id");

COMMIT;
