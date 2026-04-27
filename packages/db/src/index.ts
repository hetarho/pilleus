import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export const db = drizzle(process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost/placeholder", { schema });

export type Database = typeof db;

export { eq, and, or, desc, asc, sql as rawSql } from "drizzle-orm";
