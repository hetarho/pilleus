#!/usr/bin/env node
/**
 * Root dev wrapper.
 *
 *   pnpm dev          → start the dev server, leave the DB alone
 *   pnpm dev --seed   → wipe product+prd tables and re-seed first, then start
 *
 * The seed step used to run unconditionally on every `pnpm dev`, which was
 * fine when there was no real data to lose but is destructive once the
 * author has been writing PRDs. Gating it behind an explicit flag means
 * day-to-day dev preserves whatever's in the DB, and a deliberate
 * "fresh fixture" reset is one flag away.
 */

import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const shouldSeed = args.includes("--seed");

function run(cmd, cmdArgs) {
  return new Promise((resolve, reject) => {
    // shell: true 라야 Windows 에서 pnpm.cmd 런처를 해석한다 (없으면 spawn ENOENT)
    const child = spawn(cmd, cmdArgs, { stdio: "inherit", shell: true });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${cmdArgs.join(" ")} exited ${code}`));
    });
    child.on("error", reject);
  });
}

async function main() {
  if (shouldSeed) {
    console.log("[dev] --seed: wiping app tables and re-seeding");
    await run("pnpm", ["--filter", "@pilleus/db", "db:seed"]);
  } else {
    console.log("[dev] DB preserved (run `pnpm dev --seed` to reset to fixtures)");
  }
  await run("pnpm", ["exec", "turbo", "run", "dev"]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
