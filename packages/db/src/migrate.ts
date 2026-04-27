import { existsSync } from "fs";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const migrationsFolder = new URL("../drizzle", import.meta.url).pathname;

if (!existsSync(migrationsFolder)) {
  console.log("No migrations folder found, skipping.");
  process.exit(0);
}

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  console.log("Running migrations...");
  await migrate(db, { migrationsFolder });
  console.log("Migrations complete.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
