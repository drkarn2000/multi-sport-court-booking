import path from "node:path";
import { AppError } from "./http";

/**
 * Determines whether the application is running in safe Local Development / Testing / Preview mode.
 *
 * Returns FALSE immediately if:
 * - PLAYCOURT_ENV is explicitly set to "production"
 * - DATABASE_URL points to a network database (postgres://, postgresql://, mysql://)
 */
export function isLocalDevEnvironment(): boolean {
  if (process.env.PLAYCOURT_DEMO_MODE === "true") {
    return true;
  }

  const playcourtEnv = (process.env.PLAYCOURT_ENV || "local").toLowerCase();
  if (playcourtEnv === "production") {
    return false;
  }

  const dbUrl = (process.env.DATABASE_URL || "").trim().toLowerCase();
  if (
    dbUrl.startsWith("postgres://") ||
    dbUrl.startsWith("postgresql://") ||
    dbUrl.startsWith("mysql://")
  ) {
    return false;
  }

  return true;
}

/**
 * Throws a 403 error if called when not in local development mode.
 */
export function assertLocalDevEnvironment(featureName: string): void {
  if (!isLocalDevEnvironment()) {
    throw new AppError(
      "FORBIDDEN_ROLE",
      `${featureName} is strictly restricted to local development / preview mode and disabled in production.`,
      403
    );
  }
}

/**
 * Resolves the absolute filesystem path for the SQLite database file.
 * Supports PLAYCOURT_DB_PATH override so automated test suites can run against
 * an isolated test database (e.g., prisma/playcourt.test.db) without touching
 * the developer's manual testing database (prisma/playcourt.db).
 */
export function resolveSqliteDbPath(): string {
  const explicitTestPath = process.env.PLAYCOURT_DB_PATH?.trim();
  if (explicitTestPath) {
    return path.isAbsolute(explicitTestPath)
      ? explicitTestPath
      : path.join(process.cwd(), explicitTestPath);
  }

  // On Vercel / serverless environments, only /tmp is writable
  if (process.env.VERCEL || process.env.AWS_EXECUTION_ENV) {
    return path.join("/tmp", "playcourt.db");
  }

  const dbUrl = (process.env.DATABASE_URL || "").trim();
  if (dbUrl.startsWith("file:")) {
    const rel = dbUrl.slice("file:".length).replace(/^\.\//, "");
    if (rel && rel !== "dev.db") {
      return path.isAbsolute(rel) ? rel : path.join(process.cwd(), rel);
    }
  }

  return path.join(process.cwd(), "prisma", "playcourt.db");
}
