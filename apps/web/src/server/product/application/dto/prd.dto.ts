import type { Prd } from "../../domain/entities/prd";

export interface PrdDTO {
  id: string;
  productId: string;
  title: string;
  benefitIndex: number | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Lightweight DTO for list views — omits the (potentially large) content. */
export interface PrdListItemDTO {
  id: string;
  productId: string;
  title: string;
  benefitIndex: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export const toPrdDTO = (prd: Prd): PrdDTO => ({
  id: prd.id,
  productId: prd.productId,
  title: prd.title.value,
  benefitIndex: prd.benefitIndex,
  content: prd.content,
  createdAt: prd.createdAt,
  updatedAt: prd.updatedAt,
});

export const toPrdListItemDTO = (prd: Prd): PrdListItemDTO => ({
  id: prd.id,
  productId: prd.productId,
  title: prd.title.value,
  benefitIndex: prd.benefitIndex,
  createdAt: prd.createdAt,
  updatedAt: prd.updatedAt,
});
