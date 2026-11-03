#!/usr/bin/env node
/**
 * PlayCourt — Local SQLite Database Initialization & Safe Reseed CLI
 *
 * Commands:
 *   node scripts/db-cli.mjs init             (Initializes schema & seeds ONLY if empty; never deletes existing data)
 *   node scripts/db-cli.mjs reseed --confirm (Deliberately resets & reseeds local demo database; blocked in production)
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { registerHooks } from "node:module";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// 1. Load .env if present (do not override explicit process.env variables)
const envFile = path.join(ROOT_DIR, ".env");
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, "utf8").split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx <= 0) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

// 2. Register @/* path alias & TypeScript extension resolver for Node.js native TS execution
function tryResolveTsFile(candidateBase) {
  const candidates = [
    candidateBase,
    `${candidateBase}.ts`,
    `${candidateBase}.tsx`,
    path.join(candidateBase, "index.ts"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) {
      return pathToFileURL(c).href;
    }
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "next/server") {
      const nextServerJs = path.join(ROOT_DIR, "node_modules/next/server.js");
      if (fs.existsSync(nextServerJs)) {
        return { url: pathToFileURL(nextServerJs).href, shortCircuit: true };
      }
    }
    if (specifier.startsWith("@/")) {
      const target = path.join(ROOT_DIR, "src", specifier.slice(2));
      const resolved = tryResolveTsFile(target);
      if (resolved) {
        return { url: resolved, shortCircuit: true };
      }
    }
    if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      context.parentURL?.startsWith("file:")
    ) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL));
      const target = path.resolve(parentDir, specifier);
      const resolved = tryResolveTsFile(target);
      if (resolved) {
        return { url: resolved, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
});

async function main() {
  const args = process.argv.slice(2);
  const command = (args[0] || "init").toLowerCase();
  const hasConfirm = args.includes("--confirm");

  const { resolveSqliteDbPath, isLocalDevEnvironment } = await import(
    pathToFileURL(path.join(ROOT_DIR, "src/server/utils/env.ts")).href
  );
  const { getDb, resetAndReseedDatabase } = await import(
    pathToFileURL(path.join(ROOT_DIR, "src/server/db/index.ts")).href
  );

  const dbPath = resolveSqliteDbPath();
  const existedBefore = fs.existsSync(dbPath);

  if (command === "init") {
    const db = getDb();
    const counts = getSummaryCounts(db);
    console.log("=========================================================");
    console.log("PlayCourt Local SQLite Database — Ready");
    console.log("=========================================================");
    console.log(`  Environment : ${isLocalDevEnvironment() ? "local (dev features enabled)" : "production"}`);
    console.log(`  Database    : ${dbPath}`);
    console.log(
      `  Action      : ${
        existedBefore
          ? "Verified schema & preserved existing local data"
          : "Created database & seeded initial demo data"
      }`
    );
    printCounts(counts);
    return;
  }

  if (command === "reseed") {
    if (!isLocalDevEnvironment()) {
      console.error(
        "ERROR: Refusing to reseed database because PLAYCOURT_ENV is not in local development mode."
      );
      process.exit(1);
    }
    if (!hasConfirm) {
      console.error(
        "Refusing to overwrite local SQLite database without explicit confirmation."
      );
      console.error("Run: npm run db:reseed   (or: node scripts/db-cli.mjs reseed --confirm)");
      process.exit(1);
    }

    resetAndReseedDatabase();
    const db = getDb();
    const counts = getSummaryCounts(db);
    console.log("=========================================================");
    console.log("PlayCourt Local SQLite Database — Reseeded to Clean Demo");
    console.log("=========================================================");
    console.log(`  Database    : ${dbPath}`);
    printCounts(counts);
    return;
  }

  console.error(`Unknown command "${command}". Supported commands: init, reseed --confirm`);
  process.exit(1);
}

function getSummaryCounts(db) {
  const countOf = (table) => db.prepare(`SELECT COUNT(*) AS cnt FROM ${table}`).get().cnt;
  return {
    users: countOf("users"),
    venues: countOf("venues"),
    courts: countOf("courts"),
    membershipGroups: countOf("membership_groups"),
    groupMembers: countOf("membership_group_members"),
    bookings: countOf("bookings"),
    payments: countOf("payments"),
    openMatches: countOf("open_matches"),
    events: countOf("events"),
  };
}

function printCounts(counts) {
  console.log(
    `  Rows        : ${counts.users} users | ${counts.venues} venues | ${counts.courts} courts | ${counts.bookings} bookings`
  );
  console.log(
    `                ${counts.membershipGroups} group (${counts.groupMembers}/4 linked) | ${counts.openMatches} matches | ${counts.events} events | ${counts.payments} payments`
  );
  console.log("=========================================================");
}

main().catch((err) => {
  console.error("Database CLI failed:", err);
  process.exit(1);
});
