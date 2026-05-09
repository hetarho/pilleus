import type { PrdStatus } from "../entities/prd";

/** Immutable snapshot of a PRD at a point in time. We don't model this as
 * a domain entity because there's no behavior — it's pure history data. */
export interface PrdVersionSnapshot {
  id: string;
  prdId: string;
  version: number;
  title: string;
  benefitIndex: number | null;
  content: string;
  status: PrdStatus;
  aiReviewedContent: string | null;
  createdAt: Date;
}

export interface PrdVersionRepository {
  findByPrdId(prdId: string): Promise<PrdVersionSnapshot[]>;
  findById(id: string): Promise<PrdVersionSnapshot | null>;
  /** Returns the most recently appended version, used for sequence calc. */
  latestVersionNumber(prdId: string): Promise<number>;
  /** Batch variant — one query for many PRDs, used by list views. Returns
   * a map keyed by prdId; missing entries (no versions yet) are omitted. */
  latestVersionNumbersByPrdIds(prdIds: readonly string[]): Promise<Record<string, number>>;
  save(snapshot: Omit<PrdVersionSnapshot, "id" | "createdAt">): Promise<PrdVersionSnapshot>;
}
