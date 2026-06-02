import type { Policy } from "../entities/policy";

export interface PolicyRepository {
  findById(id: string): Promise<Policy | null>;
  findByProductId(productId: string): Promise<Policy[]>;
  save(policy: Policy): Promise<void>;
  delete(id: string): Promise<void>;
}
