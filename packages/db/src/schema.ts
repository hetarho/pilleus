import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
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

export const product = pgTable("product", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  /** The single biggest goal — why the product exists. */
  mission: text("mission"),
  /** Distinct value propositions the product delivers (ordered list). */
  benefits: text("benefits")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  /** Non-negotiable rules to follow while building the product. */
  principles: text("principles")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  /** Actors that interact with this product (end user, admin, scheduler, ...).
   * Defined product-wide so PRDs can reference a stable list. */
  actors: text("actors")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Product Requirements Document — markdown-authored spec belonging to a product.
 * benefitIndex (nullable) links the PRD to a specific entry in product.benefits[]
 * by position; null means "not tied to any single benefit".
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
  benefitIndex: integer("benefit_index"),
  content: text("content").notNull().default(""),
  status: text("status").notNull().default("draft"),
  /** AI-revised body, populated when entering ai_reviewed status. Null in
   * draft / published. */
  aiReviewedContent: text("ai_reviewed_content"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

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
  benefitIndex: integer("benefit_index"),
  content: text("content").notNull(),
  status: text("status").notNull(),
  aiReviewedContent: text("ai_reviewed_content"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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
});

// ── OAuth Provider tables ───────────────────────────────────────────

export const oauthApplication = pgTable("oauth_application", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon"),
  metadata: text("metadata"),
  clientId: text("client_id").notNull().unique(),
  clientSecret: text("client_secret").notNull(),
  redirectURLs: text("redirect_urls").notNull(),
  type: text("type").notNull(),
  disabled: boolean("disabled").notNull().default(false),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const oauthAccessToken = pgTable("oauth_access_token", {
  id: text("id").primaryKey(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at").notNull(),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scopes: text("scopes").notNull(),
  clientId: text("client_id")
    .notNull()
    .references(() => oauthApplication.clientId),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const oauthConsent = pgTable("oauth_consent", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => oauthApplication.clientId),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  scopes: text("scopes").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const oauthAuthorizationCode = pgTable("oauth_authorization_code", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  clientId: text("client_id")
    .notNull()
    .references(() => oauthApplication.clientId),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  scopes: text("scopes").notNull(),
  redirectURI: text("redirect_uri").notNull(),
  codeChallenge: text("code_challenge"),
  codeChallengeMethod: text("code_challenge_method"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
