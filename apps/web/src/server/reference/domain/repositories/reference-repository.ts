import type { Reference } from "../entities/reference";
import type { ReferenceKind } from "@/kernel/reference";

export interface ReferenceRepository {
  findById(id: string): Promise<Reference | null>;
  /** Forward edges: what a given source artifact imports. */
  findBySource(sourceKind: ReferenceKind, sourceId: string): Promise<Reference[]>;
  /** Backlinks: which artifacts in this product import a given target. */
  findByTarget(
    productId: string,
    targetKind: ReferenceKind,
    targetId: string,
  ): Promise<Reference[]>;
  save(reference: Reference): Promise<void>;
  delete(id: string): Promise<void>;
}
