import type { DesignToken } from "../entities/design-token";

export interface DesignTokenRepository {
  findById(id: string): Promise<DesignToken | null>;
  findByProductId(productId: string): Promise<DesignToken[]>;
  save(token: DesignToken): Promise<void>;
  delete(id: string): Promise<void>;
}
