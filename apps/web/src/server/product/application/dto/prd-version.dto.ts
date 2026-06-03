import type { PrdStatus } from "../../domain/entities/prd";
import type { PrdVersionSnapshot } from "../../domain/repositories/prd-version-repository";

/** List item — omits the heavy `content` / `aiReviewedContent` fields so
 * the history panel can render the timeline without pulling every snapshot
 * body. The detail route returns the full record. */
export interface PrdVersionListItemDTO {
  id: string;
  prdId: string;
  version: number;
  title: string;
  status: PrdStatus;
  createdAt: Date;
}

export interface PrdVersionDTO extends PrdVersionListItemDTO {
  benefitId: string | null;
  content: string;
  aiReviewedContent: string | null;
}

export const toPrdVersionListItemDTO = (s: PrdVersionSnapshot): PrdVersionListItemDTO => ({
  id: s.id,
  prdId: s.prdId,
  version: s.version,
  title: s.title,
  status: s.status,
  createdAt: s.createdAt,
});

export const toPrdVersionDTO = (s: PrdVersionSnapshot): PrdVersionDTO => ({
  id: s.id,
  prdId: s.prdId,
  version: s.version,
  title: s.title,
  benefitId: s.benefitId,
  content: s.content,
  status: s.status,
  aiReviewedContent: s.aiReviewedContent,
  createdAt: s.createdAt,
});
