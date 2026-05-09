import { db, desc, eq, inArray, rawSql } from "@pilleus/db";
import { prdVersion as prdVersionTable } from "@pilleus/db/schema";
import type { PrdStatus } from "../../domain/entities/prd";
import type {
  PrdVersionRepository,
  PrdVersionSnapshot,
} from "../../domain/repositories/prd-version-repository";

const VALID_STATUSES: readonly PrdStatus[] = ["draft", "published", "ai_reviewed"];

const normalizeStatus = (s: string): PrdStatus =>
  (VALID_STATUSES as readonly string[]).includes(s) ? (s as PrdStatus) : "draft";

const toSnapshot = (row: typeof prdVersionTable.$inferSelect): PrdVersionSnapshot => ({
  id: row.id,
  prdId: row.prdId,
  version: row.version,
  title: row.title,
  benefitIndex: row.benefitIndex,
  content: row.content,
  status: normalizeStatus(row.status),
  aiReviewedContent: row.aiReviewedContent,
  createdAt: row.createdAt,
});

export class DrizzlePrdVersionRepository implements PrdVersionRepository {
  async findByPrdId(prdId: string): Promise<PrdVersionSnapshot[]> {
    const rows = await db
      .select()
      .from(prdVersionTable)
      .where(eq(prdVersionTable.prdId, prdId))
      .orderBy(desc(prdVersionTable.version));
    return rows.map(toSnapshot);
  }

  async findById(id: string): Promise<PrdVersionSnapshot | null> {
    const [row] = await db
      .select()
      .from(prdVersionTable)
      .where(eq(prdVersionTable.id, id))
      .limit(1);
    return row ? toSnapshot(row) : null;
  }

  async latestVersionNumber(prdId: string): Promise<number> {
    /* MAX(version) — Postgres returns null when no rows match. We use the
     * raw sql template here rather than aggregate helpers because the latter
     * aren't re-exported from @pilleus/db and pulling another import path
     * just for one COALESCE feels heavier than this one-liner. */
    const rows = await db
      .select({ max: rawSql<number | null>`max(${prdVersionTable.version})` })
      .from(prdVersionTable)
      .where(eq(prdVersionTable.prdId, prdId));
    return rows[0]?.max ?? 0;
  }

  async latestVersionNumbersByPrdIds(
    prdIds: readonly string[],
  ): Promise<Record<string, number>> {
    if (prdIds.length === 0) return {};
    const rows = await db
      .select({
        prdId: prdVersionTable.prdId,
        max: rawSql<number>`max(${prdVersionTable.version})`,
      })
      .from(prdVersionTable)
      .where(inArray(prdVersionTable.prdId, [...prdIds]))
      .groupBy(prdVersionTable.prdId);
    return Object.fromEntries(rows.map((r) => [r.prdId, r.max] as const));
  }

  async save(
    snapshot: Omit<PrdVersionSnapshot, "id" | "createdAt">,
  ): Promise<PrdVersionSnapshot> {
    const id = crypto.randomUUID();
    const createdAt = new Date();
    await db.insert(prdVersionTable).values({
      id,
      prdId: snapshot.prdId,
      version: snapshot.version,
      title: snapshot.title,
      benefitIndex: snapshot.benefitIndex,
      content: snapshot.content,
      status: snapshot.status,
      aiReviewedContent: snapshot.aiReviewedContent,
      createdAt,
    });
    return { ...snapshot, id, createdAt };
  }
}
