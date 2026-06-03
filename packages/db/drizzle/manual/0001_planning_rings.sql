-- Planning rings migration (manual, data-preserving).
--
-- Moves the product overview's array columns into first-class rows and turns the
-- PRD's positional benefit_index into a stable benefit_id FK, then adds the
-- reference (import graph) table.
--
-- HOW TO APPLY
--   Dev (seed data is disposable, reseeded on `pnpm dev`):
--     pnpm --filter @pilleus/db db:push   # sync schema; then restart `pnpm dev`
--   Preserving real data:
--     psql "$DATABASE_URL" -f packages/db/drizzle/manual/0001_planning_rings.sql
--
-- Requires gen_random_uuid() (Postgres 13+, or: CREATE EXTENSION IF NOT EXISTS pgcrypto;).

BEGIN;

-- 1. New tables --------------------------------------------------------------
CREATE TABLE "benefit" (
  "id" text PRIMARY KEY NOT NULL,
  "product_id" text NOT NULL REFERENCES "product"("id") ON DELETE cascade,
  "label" text NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX "benefit_product_id_idx" ON "benefit" ("product_id");

CREATE TABLE "persona" (
  "id" text PRIMARY KEY NOT NULL,
  "product_id" text NOT NULL REFERENCES "product"("id") ON DELETE cascade,
  "label" text NOT NULL,
  "description" text,
  "position" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX "persona_product_id_idx" ON "persona" ("product_id");

CREATE TABLE "reference" (
  "id" text PRIMARY KEY NOT NULL,
  "product_id" text NOT NULL REFERENCES "product"("id") ON DELETE cascade,
  "source_kind" text NOT NULL,
  "source_id" text NOT NULL,
  "target_kind" text NOT NULL,
  "target_id" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "reference_edge_unique" ON "reference" ("source_kind","source_id","target_kind","target_id");
CREATE INDEX "reference_source_idx" ON "reference" ("source_kind","source_id");
CREATE INDEX "reference_target_idx" ON "reference" ("product_id","target_kind","target_id");

-- 2. Migrate array data into rows (position is 0-based) ----------------------
INSERT INTO "benefit" ("id","product_id","label","position")
SELECT gen_random_uuid(), p.id, b.label, (b.ord - 1)::int
FROM "product" p, LATERAL unnest(p.benefits) WITH ORDINALITY AS b(label, ord);

INSERT INTO "persona" ("id","product_id","label","position")
SELECT gen_random_uuid(), p.id, a.label, (a.ord - 1)::int
FROM "product" p, LATERAL unnest(p.actors) WITH ORDINALITY AS a(label, ord);

-- principles become product-category policies (the Principles ring)
INSERT INTO "policy" ("id","product_id","category","section","title","body","position")
SELECT gen_random_uuid(), p.id, 'product', NULL, pr.title, '', (pr.ord - 1)::int
FROM "product" p, LATERAL unnest(p.principles) WITH ORDINALITY AS pr(title, ord);

-- 3. PRD benefit_index (int) -> benefit_id (text FK) ------------------------
ALTER TABLE "prd" ADD COLUMN "benefit_id" text;
ALTER TABLE "prd_version" ADD COLUMN "benefit_id" text;

UPDATE "prd" SET "benefit_id" = b.id
FROM "benefit" b
WHERE b.product_id = "prd".product_id AND b.position = "prd".benefit_index;

UPDATE "prd_version" v SET "benefit_id" = b.id
FROM "prd" pr JOIN "benefit" b ON b.product_id = pr.product_id
WHERE v.prd_id = pr.id AND b.position = v.benefit_index;

ALTER TABLE "prd" DROP COLUMN "benefit_index";
ALTER TABLE "prd_version" DROP COLUMN "benefit_index";
ALTER TABLE "prd" ADD CONSTRAINT "prd_benefit_id_benefit_id_fk"
  FOREIGN KEY ("benefit_id") REFERENCES "benefit"("id") ON DELETE set null;

-- 4. Drop the old product array columns -------------------------------------
ALTER TABLE "product" DROP COLUMN "benefits";
ALTER TABLE "product" DROP COLUMN "principles";
ALTER TABLE "product" DROP COLUMN "actors";

COMMIT;
