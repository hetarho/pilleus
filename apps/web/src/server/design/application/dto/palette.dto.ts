import type { Palette } from "../../domain/entities/palette";
import type { Shade } from "@/kernel/palette";

export interface PaletteDTO {
  id: string;
  productId: string;
  name: string;
  seedHex: string;
  position: number;
  /** Derived 50..950 ramp. Sent to clients so they don't redo the OKLCH
   * math themselves — same generator runs once on the server. */
  shades: Shade[];
  createdAt: Date;
  updatedAt: Date;
}

export const toPaletteDTO = (palette: Palette): PaletteDTO => ({
  id: palette.id,
  productId: palette.productId,
  name: palette.name,
  seedHex: palette.seedHex,
  position: palette.position,
  shades: palette.shades(),
  createdAt: palette.createdAt,
  updatedAt: palette.updatedAt,
});
