import type { PolicyCategory } from "@/kernel/policy";
import type { Policy } from "../../domain/entities/policy";

export interface PolicyDTO {
  id: string;
  productId: string;
  category: PolicyCategory;
  section: string | null;
  title: string;
  body: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export const toPolicyDTO = (policy: Policy): PolicyDTO => ({
  id: policy.id,
  productId: policy.productId,
  category: policy.category,
  section: policy.section,
  title: policy.title,
  body: policy.body,
  position: policy.position,
  createdAt: policy.createdAt,
  updatedAt: policy.updatedAt,
});
