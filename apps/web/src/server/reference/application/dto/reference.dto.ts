import type { ReferenceKind } from "@/kernel/reference";
import type { Reference } from "../../domain/entities/reference";

export interface ReferenceDTO {
  id: string;
  productId: string;
  sourceKind: ReferenceKind;
  sourceId: string;
  targetKind: ReferenceKind;
  targetId: string;
  createdAt: Date;
}

export const toReferenceDTO = (reference: Reference): ReferenceDTO => ({
  id: reference.id,
  productId: reference.productId,
  sourceKind: reference.sourceKind,
  sourceId: reference.sourceId,
  targetKind: reference.targetKind,
  targetId: reference.targetId,
  createdAt: reference.createdAt,
});
