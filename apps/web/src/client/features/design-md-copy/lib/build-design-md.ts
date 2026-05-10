import type { Shade } from "@/entities/palette";

export interface PaletteForMd {
  name: string;
  seedHex: string;
  shades: Shade[];
}

/** Compose the design.md body. Currently emits the Palettes section only;
 * Tokens / Typography / Spacing arrive in later iterations. The output is
 * portable Markdown — no HTML, no front-matter — so it pastes cleanly into
 * any spec viewer. */
export function buildDesignMd(input: {
  productName: string;
  palettes: PaletteForMd[];
}): string {
  const { productName, palettes } = input;
  const lines: string[] = [];

  lines.push(`# Design — ${productName}`, "");

  lines.push("## Palettes", "");
  if (palettes.length === 0) {
    lines.push("_No palettes defined yet._", "");
  } else {
    for (const p of palettes) {
      lines.push(`### ${p.name} (seed: \`${p.seedHex}\`, generator: oklch)`, "");
      lines.push("| step | hex |", "| ---- | --- |");
      for (const s of p.shades) {
        lines.push(`| ${s.step} | \`${s.hex}\` |`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}
