import type { Prd } from "../entities/prd";

export interface PrdRepository {
  findById(id: string): Promise<Prd | null>;
  findByProductId(productId: string): Promise<Prd[]>;
  save(prd: Prd): Promise<void>;
  delete(id: string): Promise<void>;
}
