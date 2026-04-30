/**
 * Dev-only seed script. Runs at the start of every `pnpm dev`.
 *
 * Wipes ONLY the app tables (product, prd) and reinserts a deterministic
 * fixture so every dev session starts from the same state. Auth tables
 * (user, session, account, verification) are preserved so we don't have
 * to re-sign-in every time.
 *
 * Behavior when no users exist yet: sign in once via Google OAuth, then
 * `pnpm dev` again — seed will populate products under your user.
 *
 * The script bypasses ./index.ts (which constructs `db` at module load
 * time, before dotenv has loaded) and builds its own drizzle client
 * AFTER reading the env file.
 */

import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/neon-http";
import { prd, product, user } from "./schema";

config({
  path: resolve(dirname(fileURLToPath(import.meta.url)), "../../../apps/web/.env"),
});

if (!process.env.DATABASE_URL) {
  console.error("[seed] DATABASE_URL not set in apps/web/.env — skipping");
  process.exit(0);
}

const db = drizzle(process.env.DATABASE_URL);

/* Hand-crafted valid v4 UUIDs (3rd group starts with 4, 4th with 8) so that
 * zod .uuid() accepts them on the API side. Stay deterministic so dev data
 * is stable across reseeds. */
const PRODUCT_IDS = {
  pilleus: "11111111-1111-4111-8111-111111111111",
  weather: "22222222-2222-4222-8222-222222222222",
} as const;

const PRD_IDS = {
  specLinking:  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
  aiDrafting:   "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
  consistency:  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
  hyperlocal:   "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
  severeAlerts: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
} as const;

async function main() {
  console.log("[seed] wiping product + prd ...");
  // prd has FK to product with onDelete cascade; explicit delete first
  // to keep the order obvious regardless of driver behavior.
  await db.delete(prd);
  await db.delete(product);

  const users = await db.select().from(user).limit(1);
  if (users.length === 0) {
    console.log(
      "[seed] no users in DB yet. Sign in via /sign-in then rerun `pnpm dev` to populate seed data.",
    );
    return;
  }
  const u = users[0];
  console.log(`[seed] seeding for ${u.email} (${u.id})`);

  await db.insert(product).values([
    {
      id: PRODUCT_IDS.pilleus,
      name: "Pilleus",
      description: "AI-assisted product spec workbench",
      mission: "Help PMs and engineers ship the right thing the first time",
      benefits: [
        "Single source of truth for product specs",
        "AI-assisted PRD drafting",
        "Live cross-document consistency checks",
      ],
      principles: [
        "Specs are versioned like code",
        "AI suggestions are inline, never automatic edits",
        "All exports stay portable Markdown",
      ],
      userId: u.id,
    },
    {
      id: PRODUCT_IDS.weather,
      name: "Sample Weather App",
      description: "Demo product to play with the section views",
      mission: "Tell people whether to bring an umbrella",
      benefits: [
        "Hyperlocal forecasts",
        "Severe weather alerts",
        "Privacy-first telemetry",
      ],
      principles: ["Never sell location data", "Offline-first; cache last forecast"],
      userId: u.id,
    },
  ]);

  await db.insert(prd).values([
    {
      id: PRD_IDS.specLinking,
      productId: PRODUCT_IDS.pilleus,
      title: "Spec linking and cross-references",
      benefitIndex: 0,
      content:
        "# Spec linking\n\nPRDs reference policy and data items by stable ID so a rename in one place doesn't silently break another.",
    },
    {
      id: PRD_IDS.aiDrafting,
      productId: PRODUCT_IDS.pilleus,
      title: "AI-assisted PRD drafting",
      benefitIndex: 1,
      content:
        "# AI drafting\n\nGiven a one-line goal, generate a PRD outline (problem, success criteria, non-goals, open questions). Author keeps every edit explicit.",
    },
    {
      id: PRD_IDS.consistency,
      productId: PRODUCT_IDS.pilleus,
      title: "Consistency checker",
      benefitIndex: 2,
      content:
        "# Consistency checker\n\nFlag contradictions across PRDs / policies of the same product (e.g. PRD says \"users can edit\" while policy says \"read-only\").",
    },
    {
      id: PRD_IDS.hyperlocal,
      productId: PRODUCT_IDS.weather,
      title: "Hyperlocal forecast widget",
      benefitIndex: 0,
      content: "# Hyperlocal forecast\n\nResolution: 1km grid. Update interval: 10 min.",
    },
    {
      id: PRD_IDS.severeAlerts,
      productId: PRODUCT_IDS.weather,
      title: "Severe weather alerts",
      benefitIndex: 1,
      content: "# Severe alerts\n\nPush notifications for storms, floods, heat advisories.",
    },
  ]);

  console.log("[seed] done — 2 products, 5 prds");
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
