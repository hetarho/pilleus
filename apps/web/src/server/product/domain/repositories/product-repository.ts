import type { Product } from "../entities/product";

export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  findByUserId(userId: string): Promise<Product[]>;
  save(product: Product): Promise<void>;
  delete(id: string): Promise<void>;
}
