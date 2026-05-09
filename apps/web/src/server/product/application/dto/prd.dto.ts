import type { Prd, PrdStatus } from "../../domain/entities/prd";

export interface PrdDTO {
  id: string;
  productId: string;
  title: string;
  benefitIndex: number | null;
  content: string;
  status: PrdStatus;
  aiReviewedContent: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Lightweight DTO for list views — omits the (potentially large) content/aiReviewedContent. */
export interface PrdListItemDTO {
  id: string;
  productId: string;
  title: string;
  benefitIndex: number | null;
  status: PrdStatus;
  /** Latest version number for this PRD (null when no snapshots yet). */
  latestVersion: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export const toPrdDTO = (prd: Prd): PrdDTO => ({
  id: prd.id,
  productId: prd.productId,
  title: prd.title.value,
  benefitIndex: prd.benefitIndex,
  content: prd.content,
  status: prd.status,
  aiReviewedContent: prd.aiReviewedContent,
  createdAt: prd.createdAt,
  updatedAt: prd.updatedAt,
});

export const toPrdListItemDTO = (prd: Prd, latestVersion: number | null = null): PrdListItemDTO => ({
  id: prd.id,
  productId: prd.productId,
  title: prd.title.value,
  benefitIndex: prd.benefitIndex,
  status: prd.status,
  latestVersion,
  createdAt: prd.createdAt,
  updatedAt: prd.updatedAt,
});
