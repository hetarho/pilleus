import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost/placeholder",
});

export const db = drizzle(pool, { schema });

export type Database = typeof db;

export { eq, and, or, desc, asc, inArray, sql as rawSql } from "drizzle-orm";
