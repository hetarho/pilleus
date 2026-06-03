CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "design_token" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"group" text NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"palette_id" text,
	"palette_step" integer,
	"raw_value" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "palette" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"name" text NOT NULL,
	"seed_hex" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"category" text NOT NULL,
	"section" text,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prd" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"title" text NOT NULL,
	"benefit_index" integer,
	"content" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"ai_reviewed_content" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prd_version" (
	"id" text PRIMARY KEY NOT NULL,
	"prd_id" text NOT NULL,
	"version" integer NOT NULL,
	"title" text NOT NULL,
	"benefit_index" integer,
	"content" text NOT NULL,
	"status" text NOT NULL,
	"ai_reviewed_content" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"mission" text,
	"benefits" text[] DEFAULT '{}'::text[] NOT NULL,
	"principles" text[] DEFAULT '{}'::text[] NOT NULL,
	"actors" text[] DEFAULT '{}'::text[] NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_token" ADD CONSTRAINT "design_token_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_token" ADD CONSTRAINT "design_token_palette_id_palette_id_fk" FOREIGN KEY ("palette_id") REFERENCES "public"."palette"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "palette" ADD CONSTRAINT "palette_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy" ADD CONSTRAINT "policy_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prd" ADD CONSTRAINT "prd_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prd_version" ADD CONSTRAINT "prd_version_prd_id_prd_id_fk" FOREIGN KEY ("prd_id") REFERENCES "public"."prd"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "design_token_product_id_idx" ON "design_token" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "design_token_palette_id_idx" ON "design_token" USING btree ("palette_id");--> statement-breakpoint
CREATE INDEX "palette_product_id_idx" ON "palette" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "policy_product_id_idx" ON "policy" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "prd_product_id_idx" ON "prd" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "prd_version_prd_id_version_unique" ON "prd_version" USING btree ("prd_id","version");--> statement-breakpoint
CREATE INDEX "product_user_id_idx" ON "product" USING btree ("user_id");