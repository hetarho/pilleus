import type { Benefit } from "../entities/benefit";

export interface BenefitRepository {
  findById(id: string): Promise<Benefit | null>;
  findByProductId(productId: string): Promise<Benefit[]>;
  save(benefit: Benefit): Promise<void>;
  delete(id: string): Promise<void>;
}
