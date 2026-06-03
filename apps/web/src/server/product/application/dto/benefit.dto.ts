import type { Benefit } from "../../domain/entities/benefit";

export interface BenefitDTO {
  id: string;
  productId: string;
  label: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export const toBenefitDTO = (benefit: Benefit): BenefitDTO => ({
  id: benefit.id,
  productId: benefit.productId,
  label: benefit.label,
  position: benefit.position,
  createdAt: benefit.createdAt,
  updatedAt: benefit.updatedAt,
});
