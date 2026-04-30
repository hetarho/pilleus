import type { Product } from "../../domain/entities/product";

export interface ProductDTO {
  id: string;
  name: string;
  description: string | null;
  mission: string | null;
  benefits: string[];
  principles: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const toProductDTO = (product: Product): ProductDTO => ({
  id: product.id,
  name: product.name.value,
  description: product.description,
  mission: product.mission,
  benefits: [...product.benefits],
  principles: [...product.principles],
  userId: product.userId,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});
