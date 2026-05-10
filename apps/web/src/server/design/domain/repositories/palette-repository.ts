import type { Palette } from "../entities/palette";

export interface PaletteRepository {
  findById(id: string): Promise<Palette | null>;
  findByProductId(productId: string): Promise<Palette[]>;
  save(palette: Palette): Promise<void>;
  delete(id: string): Promise<void>;
}
