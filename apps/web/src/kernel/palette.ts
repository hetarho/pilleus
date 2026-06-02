/**
 * Tailwind-style 50..950 shade scale generated from a seed color via OKLCH.
 *
 * Why OKLCH: lightness in OKLCH is perceptually uniform, so an evenly spaced
 * lightness ramp across the 11 steps yields steps that *look* evenly spaced
 * — no muddy mid-tones, no washed-out 50/100. Chroma and hue are taken from
 * the seed and held roughly constant; we taper chroma at the extremes
 * because pure-white-ish and near-black colors can't physically carry as
 * much chroma without falling out of sRGB gamut.
 *
 * The output is hex strings (sRGB), one per Tailwind step. Pure functions —
 * safe to call on the server or in seed scripts.
 */
import { converter, formatHex, parseHex } from "culori";

export const SHADE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type ShadeStep = (typeof SHADE_STEPS)[number];

/** Target OKLCH lightness per step. Values were tuned against Tailwind's own
 * palettes (red/blue/slate) so a Pilleus palette generated from Tailwind's
 * 500 hex sits visually close to the original ramp. */
const STEP_L: Record<ShadeStep, number> = {
  50: 0.97,
  100: 0.94,
  200: 0.88,
  300: 0.8,
  400: 0.7,
  500: 0.62,
  600: 0.54,
  700: 0.46,
  800: 0.38,
  900: 0.3,
  950: 0.2,
};

/** Chroma multiplier per step. Endpoints get less chroma so they don't clip
 * out of sRGB gamut. Mid-tones (400–700) carry roughly the seed's chroma. */
const STEP_C_SCALE: Record<ShadeStep, number> = {
  50: 0.25,
  100: 0.4,
  200: 0.6,
  300: 0.8,
  400: 0.95,
  500: 1.0,
  600: 1.0,
  700: 0.95,
  800: 0.85,
  900: 0.7,
  950: 0.5,
};

const toOklch = converter("oklch");

export interface Shade {
  step: ShadeStep;
  hex: string;
}

/** Normalize a hex string to lowercase 7-char form. Throws if unparseable. */
export function normalizeHex(input: string): string {
  const parsed = parseHex(input.trim());
  if (!parsed) throw new Error(`Invalid hex color: ${input}`);
  // formatHex returns 7-char "#rrggbb" form, lowercase.
  return formatHex(parsed);
}

/** Generate the 11-step Tailwind-style ramp from a seed hex. */
export function generateShades(seedHex: string): Shade[] {
  const seedColor = parseHex(seedHex);
  if (!seedColor) throw new Error(`Invalid hex color: ${seedHex}`);

  const seedOklch = toOklch(seedColor);
  if (!seedOklch) throw new Error(`Could not convert ${seedHex} to OKLCH`);

  // Achromatic seeds (grays) have undefined hue; default to 0 so the ramp
  // still produces a clean grayscale scale instead of NaN-painted values.
  const baseChroma = seedOklch.c ?? 0;
  const baseHue = seedOklch.h ?? 0;

  return SHADE_STEPS.map<Shade>((step) => {
    const oklch = {
      mode: "oklch" as const,
      l: STEP_L[step],
      c: baseChroma * STEP_C_SCALE[step],
      h: baseHue,
    };
    return { step, hex: formatHex(oklch) };
  });
}
