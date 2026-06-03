import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ── Better Auth tables ──────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── App tables ──────────────────────────────────────────────────────

/** A product is the root of the "Intent" ring. Its identity (why/who/what) is
 * held by:
 *   mission   — the single biggest goal (scalar, on this row)
 *   benefit   — value propositions, promoted to their own rows (see `benefit`)
 *   persona   — who we build for, promoted to their own rows (see `persona`)
 * Benefits/personas were once text[] columns here; they became first-class rows
 * so downstream artifacts (PRD, references) can point at a STABLE id instead of
 * a fragile array position. */
export const product = pgTable("product", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  /** The single biggest goal — why the product exists. */
  mission: text("mission"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [index("product_user_id_idx").on(t.userId)]);

/** Benefit — a distinct value proposition the product delivers. Lives in the
 * Intent ring. `position` is a per-product 0-based display order. */
export const benefit = pgTable("benefit", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [index("benefit_product_id_idx").on(t.productId)]);

/** Persona — who the product is built for (replaces the old "actors" list).
 * Lives in the Intent ring. `description` is optional so a persona can grow
 * from a bare label into a richer archetype later. */
export const persona = pgTable("persona", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  description: text("description"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [index("persona_product_id_idx").on(t.productId)]);

/** Product Requirements Document — markdown-authored spec belonging to a product.
 * benefitId (nullable) links the PRD to a specific benefit row; null means "not
 * tied to any single benefit". Set to NULL if the benefit is deleted, so the PRD
 * surfaces as "benefit removed" rather than silently breaking.
 *
 * Lifecycle (status):
 *   draft        — author is filling the form (PrdFormView, free-form Korean answers)
 *   published    — markdown is frozen for direct editing (MarkdownEditor view)
 *   ai_reviewed  — diff view: `content` is the published version (left, read-only),
 *                  `aiReviewedContent` is the AI's revision (right, editable)
 */
export const prd = pgTable("prd", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  benefitId: text("benefit_id").references(() => benefit.id, {
    onDelete: "set null",
  }),
  content: text("content").notNull().default(""),
  status: text("status").notNull().default("draft"),
  /** AI-revised body, populated when entering ai_reviewed status. Null in
   * draft / published. */
  aiReviewedContent: text("ai_reviewed_content"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [index("prd_product_id_idx").on(t.productId)]);

/** Append-only history of PRD snapshots. One row is written after every
 * Create / Update use case execution (full state, not diff). The `version`
 * column is per-PRD sequential — version 1 is the state right after creation.
 *
 * Storing full content (rather than diffs) keeps lookups trivial; the cost
 * is fine at PRD-sized markdown blobs. Optimize later if it actually grows. */
export const prdVersion = pgTable("prd_version", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  prdId: text("prd_id")
    .notNull()
    .references(() => prd.id, { onDelete: "cascade" }),
  /** 1-based, monotonic per `prdId`. */
  version: integer("version").notNull(),
  title: text("title").notNull(),
  /** Snapshot of the PRD's benefit link at write time. Plain text (no FK) so a
   * later benefit deletion never rewrites history. */
  benefitId: text("benefit_id"),
  content: text("content").notNull(),
  status: text("status").notNull(),
  aiReviewedContent: text("ai_reviewed_content"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("prd_version_prd_id_version_unique").on(t.prdId, t.version),
]);

/** Color palette belonging to a product. The seed is the only persisted
 * color value — the 50..950 Tailwind-style shade scale is derived from it
 * on read by lightness-interpolating in OKLCH space, so changing the seed
 * automatically refreshes every dependent design token without a write.
 *
 * `position` is a per-product display order (0-based) so palettes appear in
 * a stable layout. Names are user-defined ("red", "neutral", "brand", ...) —
 * design tokens reference palettes by id, not by name. */
export const palette = pgTable("palette", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  /** Seed color, lowercase 7-char hex (e.g. "#4f46e5"). Domain layer is the
   * source of truth for the format; column is just text. */
  seedHex: text("seed_hex").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [index("palette_product_id_idx").on(t.productId)]);

/** Design tokens — semantic aliases that downstream UI reads from.
 *
 * `group` discriminates the value shape:
 *   color       → (paletteId, paletteStep) MUST be set, rawValue null.
 *   non-color   → rawValue is the source of truth; palette fields null.
 *
 * The constraint is enforced in the domain layer (DesignToken entity), not
 * by Postgres CHECK constraints — keeping schema dialect-portable and the
 * invariant in one place. `position` is a per-(productId, group) display
 * order. */
export const designToken = pgTable("design_token", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),
  group: text("group").notNull(),
  name: text("name").notNull(),
  position: integer("position").notNull().default(0),
  /* Color tokens reference a palette step (e.g. brand.500). Set to NULL
   * when palette is deleted so the token surfaces as broken in the UI
   * rather than silently disappearing. */
  paletteId: text("palette_id").references(() => palette.id, {
    onDelete: "set null",
  }),
  paletteStep: integer("palette_step"),
  /** Free-form value for non-color tokens (e.g. "16px", "Inter, system-ui",
   * "0 1px 2px rgb(0 0 0 / 0.05)"). */
  rawValue: text("raw_value"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("design_token_product_id_idx").on(t.productId),
  index("design_token_palette_id_idx").on(t.paletteId),
]);

/** Product policies — non-token rules that shape how design / UX / other
 * concerns play out. Three categories today (design, ux, etc):
 *   design — higher-level design guidance that tokens can't express:
 *     visual-theme, component, dos-donts, responsive.
 *   ux     — behavior-level guidance: navigation, forms, feedback,
 *     accessibility, motion, content.
 *   etc    — free-form, no preset section (auth, data retention, etc.).
 *
 * `section` is nullable so the etc category can omit it. The category /
 * section vocabulary + validity rules live in `@/kernel/policy`. */
export const policy = pgTable("policy", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  section: text("section"),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [index("policy_product_id_idx").on(t.productId)]);

/** Reference — a directed "import" edge in a product's concept graph. A source
 * artifact in an OUTER ring imports a target concept in an INNER (more stable)
 * ring: e.g. a PRD (Spec) imports a benefit / persona (Intent) or a policy
 * (Principles). The forward edge is the import; querying by (targetKind,
 * targetId) yields the backlinks ("referenced by").
 *
 * `*Kind` is a value from `@/kernel/reference` (prd, benefit, persona, policy,
 * token, ...). There is intentionally NO cross-table FK on source/target ids —
 * a generic edge can't FK into many tables — so the ring-order rule and
 * existence are enforced in the application layer, and a deleted target shows
 * up as a broken reference in the UI (consistent with how color tokens behave
 * when their palette is removed). productId scopes every edge and cascades on
 * product deletion. */
export const reference = pgTable("reference", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),
  sourceKind: text("source_kind").notNull(),
  sourceId: text("source_id").notNull(),
  targetKind: text("target_kind").notNull(),
  targetId: text("target_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("reference_edge_unique").on(
    t.sourceKind, t.sourceId, t.targetKind, t.targetId,
  ),
  index("reference_source_idx").on(t.sourceKind, t.sourceId),
  index("reference_target_idx").on(t.productId, t.targetKind, t.targetId),
]);
