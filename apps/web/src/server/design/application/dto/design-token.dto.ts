import type { TokenGroup } from "../../../../client/entities/design-token";
import type { Palette } from "../../domain/entities/palette";
import type { DesignToken } from "../../domain/entities/design-token";

export interface DesignTokenDTO {
  id: string;
  productId: string;
  group: TokenGroup;
  name: string;
  position: number;
  /* Color tokens. paletteName is duplicated here for display so the client
   * doesn't need to look up the palette list to render a row. hex is
   * resolved server-side from the seed (or null if the palette ref is
   * broken — palette deleted, set null on cascade). */
  paletteId: string | null;
  paletteStep: number | null;
  paletteName: string | null;
  hex: string | null;
  /** Non-color tokens. */
  rawValue: string | null;
  /** When to use this token — short guidance. Surfaced under the token
   * row in the UI; the AI token-generation task writes this. */
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const toDesignTokenDTO = (
  token: DesignToken,
  palettesById: Map<string, Palette>,
): DesignTokenDTO => {
  let paletteName: string | null = null;
  let hex: string | null = null;

  if (token.paletteId !== null && token.paletteStep !== null) {
    const p = palettesById.get(token.paletteId);
    if (p) {
      paletteName = p.name;
      const shade = p.shades().find((s) => s.step === token.paletteStep);
      hex = shade?.hex ?? null;
    }
  }

  return {
    id: token.id,
    productId: token.productId,
    group: token.group,
    name: token.name,
    position: token.position,
    paletteId: token.paletteId,
    paletteStep: token.paletteStep,
    paletteName,
    hex,
    rawValue: token.rawValue,
    description: token.description,
    createdAt: token.createdAt,
    updatedAt: token.updatedAt,
  };
};
