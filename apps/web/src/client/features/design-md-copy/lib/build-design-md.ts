import type { Shade } from "@/entities/palette";
import { TOKEN_GROUPS, TOKEN_GROUP_LABELS, type TokenGroup } from "@/entities/design-token";

export interface PaletteForMd {
  name: string;
  seedHex: string;
  shades: Shade[];
}

export interface TokenForMd {
  group: TokenGroup;
  name: string;
  /** Color tokens. */
  paletteName: string | null;
  paletteStep: number | null;
  hex: string | null;
  /** Non-color tokens. */
  rawValue: string | null;
}

/** Compose the design.md body. Groups are emitted in TOKEN_GROUPS order so
 * the document layout is stable across products. Output is portable
 * Markdown — no HTML, no front-matter — so it pastes cleanly into any spec
 * viewer. */
export function buildDesignMd(input: {
  productName: string;
  palettes: PaletteForMd[];
  tokens: TokenForMd[];
}): string {
  const { productName, palettes, tokens } = input;
  const lines: string[] = [];

  lines.push(`# Design — ${productName}`, "");

  // ── Palettes ──────────────────────────────────────────────
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

  // ── Tokens (one section per group) ────────────────────────
  for (const group of TOKEN_GROUPS) {
    const inGroup = tokens.filter((t) => t.group === group);
    lines.push(`## ${TOKEN_GROUP_LABELS[group]}`, "");
    if (inGroup.length === 0) {
      lines.push("_None defined yet._", "");
      continue;
    }
    if (group === "color") {
      lines.push("| name | reference | hex |", "| ---- | --------- | --- |");
      for (const t of inGroup) {
        const ref = t.paletteName !== null && t.paletteStep !== null
          ? `${t.paletteName}.${t.paletteStep}`
          : "_(broken — palette deleted)_";
        const hex = t.hex !== null ? `\`${t.hex}\`` : "—";
        lines.push(`| ${t.name} | ${ref} | ${hex} |`);
      }
    } else {
      lines.push("| name | value |", "| ---- | ----- |");
      for (const t of inGroup) {
        const v = t.rawValue !== null ? `\`${t.rawValue}\`` : "—";
        lines.push(`| ${t.name} | ${v} |`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}
