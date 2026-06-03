import { ValidationError } from "../../../shared/errors/domain-error";
import type { LlmPrompt, LlmTask } from "../../../shared/llm";
import type { Product } from "../../../product/domain/entities/product";
import type { TokenGroup } from "@/kernel/design-token";
import { SHADE_STEPS } from "@/kernel/palette";

/* Design-token generation task.
 *
 * Drives the "Overview → token set" loop. The same task powers the manual
 * flow (FE copies prompt → user runs LLM → BE parses) and a future
 * automatic flow (BE calls provider).
 *
 * Output shape is intentionally narrow — name/value/description — so the
 * server can validate and persist row-by-row without inventing new domain
 * paths. The task itself does NOT touch repos; the surrounding use case
 * does the per-group ownership/palette checks and the inserts.
 */

export type TokenGenerationDensity = "minimal" | "balanced" | "comprehensive";

export interface PaletteOption {
  id: string;
  name: string;
  /** All 11 shade steps with their resolved hex — included so the LLM can
   * pick step values that visually fit a token's semantic role. */
  shades: ReadonlyArray<{ step: number; hex: string }>;
}

export interface TokenGenerationInput {
  product: Product;
  group: TokenGroup;
  density: TokenGenerationDensity;
  /** Required when group === "color". Empty array otherwise. */
  palettes: ReadonlyArray<PaletteOption>;
  /** Names already in this group — the LLM is asked to avoid colliding
   * so the result can be appended cleanly. */
  existingNames: ReadonlyArray<string>;
}

/** One generated token. Discriminated by which value fields are present:
 *   color → a palette ref (paletteId + paletteStep)
 *   other → a rawValue
 * Modeling it as a union (instead of all-optional fields) means consumers
 * must narrow before reading, so an impossible mix can't slip through. */
export type GeneratedToken =
  | { name: string; description: string; paletteId: string; paletteStep: number }
  | { name: string; description: string; rawValue: string };

export interface TokenGenerationParsed {
  tokens: GeneratedToken[];
}

export const tokenGenerationTask: LlmTask<TokenGenerationInput, TokenGenerationParsed> = {
  id: "design.token-generation",

  buildPrompt(input): LlmPrompt {
    return {
      system: buildSystemPrompt(input.group, input.density),
      user: buildUserPrompt(input),
    };
  },

  parseResponse(rawResponse, input): TokenGenerationParsed {
    const trimmed = rawResponse.trim();
    if (trimmed.length === 0) {
      throw new ValidationError("LLM 응답이 비어 있습니다.");
    }
    const json = extractJsonBlock(trimmed);
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      throw new ValidationError(
        `LLM 응답에서 JSON을 파싱하지 못했습니다: ${e instanceof Error ? e.message : "unknown"}`,
      );
    }
    const tokens = coerceTokens(parsed, input);
    if (tokens.length === 0) {
      throw new ValidationError("LLM이 토큰을 한 개도 반환하지 않았습니다.");
    }
    return { tokens };
  },
};

/* ─── prompts ────────────────────────────────────────────────────────── */

const DENSITY_HINTS: Record<TokenGenerationDensity, string> = {
  minimal: "필수만 — 3~5개 정도. 누가 봐도 빠뜨릴 수 없는 핵심 역할만.",
  balanced: "일반적인 product에 충분 — 6~10개 정도. 자주 쓰는 변형까지 포함.",
  comprehensive: "포괄적으로 — 12~20개 정도. 다양한 맥락·강조·상태까지 커버.",
};

const GROUP_GUIDES: Record<TokenGroup, string> = {
  color: `색상 토큰은 팔레트의 step을 가리키는 의미별 별칭입니다.
- **paletteId는 user prompt에 나열된 팔레트 id 중 하나만 사용**합니다. 새 팔레트 id를 만들거나, hex 값을 직접 적거나, rawValue를 넣지 마세요. 목록에 없는 id는 서버에서 거부됩니다.
- **paletteStep은 정확히 [${SHADE_STEPS.join(", ")}] 중 하나**여야 합니다. 다른 숫자는 서버에서 거부됩니다.
- 각 토큰은 정확히 하나의 (paletteId, paletteStep)을 지정합니다.
- name은 의미 기반(예: primary, surface, surface-muted, border, danger, success). 색상명(red-500 등)을 그대로 쓰지 마세요.
- step 선택 가이드: 텍스트는 700~900, 보더는 200~300, 배경은 50~100, 핵심 액센트는 500~600 근처.
- 팔레트가 여러 개 있으면 역할에 맞는 팔레트를 골라 쓰세요 (brand vs neutral 등).
- user prompt에 팔레트가 한 개도 없으면 color 토큰을 **하나도 만들지 말고** 사용자에게 팔레트를 먼저 만들어달라고 안내하세요 (질문 페이즈로 처리, JSON 코드블록은 출력하지 않음).`,
  typography: `타이포 토큰은 폰트/사이즈/굵기 등을 자유 입력 값으로 가집니다.
- name은 의도 기반(text-body, text-display, text-caption, weight-emphasis 같이).
- rawValue는 CSS 그대로 들어갈 문자열. 폰트면 "Inter, system-ui, sans-serif" 형태, 사이즈는 "16px" / "1rem" 등.`,
  spacing: `간격 토큰. name은 스케일 또는 의도 기반(sm, md, lg, gutter, section-y, ...).
- rawValue는 단위 포함 CSS 값: "4px", "0.5rem", "12px" 등.`,
  radius: `모서리 반경 토큰. name 예: sm, md, lg, full.
- rawValue 예: "4px", "8px", "9999px".`,
  shadow: `그림자 토큰. name 예: sm, md, lg, focus.
- rawValue는 CSS box-shadow 문자열 그대로: "0 1px 2px rgb(0 0 0 / 0.05)".`,
};

function buildSystemPrompt(group: TokenGroup, density: TokenGenerationDensity): string {
  return `당신은 디자인 시스템 토큰을 product 맥락에 맞게 생성하는 어시스턴트입니다.

## 작업 방식

이번 작업은 **${group}** 그룹 토큰을 생성하는 일입니다. 다음 절차를 따라주세요.

### 1단계 — Product 맥락 흡수
user prompt의 Product 컨텍스트(미션·혜택·원칙·actor)를 읽고, 이 product의 톤·강도·중요한 역할을 파악합니다. (사용자에게 보여줄 필요 없음.)

### 2단계 — 필요하면 질문
빈틈이나 모호한 부분이 있으면 페이즈 단위로 최대 5개 질문을 던지세요. 각 질문에는 3개 이상의 선택지와 "직접 입력" 옵션을 함께 제시합니다. 빈틈이 모두 사라질 때까지 페이즈를 반복합니다.
빈틈이 없으면 바로 3단계로 넘어가세요.

### 3단계 — 토큰 생성

**갯수 기준**: ${DENSITY_HINTS[density]}

**${group} 그룹 규칙**:
${GROUP_GUIDES[group]}

**공통 규칙**:
- 각 토큰에는 **description**을 반드시 포함합니다. description은 "**언제 이 토큰을 쓸지**"에 대한 1~2문장의 짧은 지침입니다. 단순히 값을 설명하지 말고, *예: "주요 CTA·강조 헤더 같이 product를 대표하는 자리에만 사용"* 처럼 사용 맥락을 적습니다.
- user prompt의 "이미 존재하는 이름" 목록과 겹치지 않도록 합니다. 같은 의미를 다른 이름으로 만들지 마세요(중복 회피).
- 이름은 kebab-case 또는 단어 1개. 80자 이내.

### 4단계 — JSON 반환

빈틈이 모두 사라졌다고 판단되면, 결과를 **단일 JSON 코드블록**(\`\`\`json … \`\`\`)으로만 반환합니다. 그 전에는 코드블록을 출력하지 마세요.

JSON 스키마:

\`\`\`
${group === "color"
  ? `[
  { "name": "primary", "paletteId": "<user prompt에 나열된 palette id 중 하나>", "paletteStep": 500, "description": "..." },
  ...
]`
  : `[
  { "name": "sm", "rawValue": "8px", "description": "..." },
  ...
]`}
\`\`\`

JSON 외 다른 텍스트(서론, 결론, 설명)는 코드블록 밖에 절대 출력하지 마세요. 후속 처리는 코드블록 한 개만 추출합니다.`;
}

function buildUserPrompt(input: TokenGenerationInput): string {
  const lines: string[] = [
    "## Product 컨텍스트",
    "",
    `**이름**: ${input.product.name.value}`,
  ];
  if (input.product.description) lines.push(`**설명**: ${input.product.description}`);
  if (input.product.mission) lines.push(`**미션**: ${input.product.mission}`);

  if (input.product.benefits.length > 0) {
    lines.push("", "**혜택**:");
    lines.push(...input.product.benefits.map((b) => `- ${b}`));
  }
  if (input.product.principles.length > 0) {
    lines.push("", "**원칙**:");
    lines.push(...input.product.principles.map((p) => `- ${p}`));
  }
  if (input.product.actors.length > 0) {
    lines.push("", "**Actor**:");
    lines.push(...input.product.actors.map((a) => `- ${a}`));
  }

  lines.push("", "---", "", `## 생성 대상 그룹: ${input.group}`, "");

  if (input.group === "color") {
    lines.push("**사용 가능한 팔레트** (paletteId와 paletteStep을 이 안에서만 고르세요):");
    lines.push("");
    if (input.palettes.length === 0) {
      lines.push("- (없음) — 색상 토큰을 만들려면 먼저 팔레트가 필요합니다. 빈 배열만 반환하지 마시고, 사용자에게 팔레트 생성을 안내하세요.");
    } else {
      for (const p of input.palettes) {
        lines.push(`- **${p.name}** (paletteId: \`${p.id}\`)`);
        const sample = p.shades
          .filter((s) => [50, 100, 300, 500, 700, 900].includes(s.step))
          .map((s) => `${s.step}=${s.hex}`)
          .join(", ");
        if (sample) lines.push(`  - 주요 step: ${sample}`);
      }
    }
    lines.push("");
  }

  lines.push(
    "**이미 존재하는 이름** (이 그룹의 기존 토큰명 — 겹치지 마세요):",
    input.existingNames.length === 0
      ? "(없음)"
      : input.existingNames.map((n) => `- ${n}`).join("\n"),
    "",
    "---",
    "",
    "위 컨텍스트에 맞게 토큰을 설계하고, 빈틈이 없다면 system prompt가 지시한 JSON 형식으로 반환해주세요.",
  );

  return lines.join("\n");
}

/* ─── parsing ────────────────────────────────────────────────────────── */

/** Pull the LAST fenced JSON block. Accept ```json or just ``` with any
 * info string — LLMs commonly drop the language tag. */
function extractJsonBlock(text: string): string {
  const re = /```(?:[^\n`]*)\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  let last: string | null = null;
  while ((match = re.exec(text)) !== null) {
    last = match[1] ?? null;
  }
  /* Fallback: if there's no fenced block at all, try to treat the whole
   * trimmed text as JSON (LLM forgot the fence). */
  return (last ?? text).trim();
}

const ALLOWED_STEPS = new Set<number>(SHADE_STEPS as readonly number[]);

function coerceTokens(parsed: unknown, input: TokenGenerationInput): GeneratedToken[] {
  if (!Array.isArray(parsed)) {
    throw new ValidationError("JSON 루트는 배열이어야 합니다.");
  }
  const allowedPaletteIds = new Set(input.palettes.map((p) => p.id));
  const out: GeneratedToken[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const row = parsed[i];
    if (!isRecord(row)) {
      throw new ValidationError(`항목 ${i}이 객체가 아닙니다.`);
    }
    const name = strField(row, "name", `${i}`);
    const description = strField(row, "description", `${i}`);
    if (input.group === "color") {
      const paletteId = strField(row, "paletteId", `${i}`);
      const paletteStep = numField(row, "paletteStep", `${i}`);
      if (!allowedPaletteIds.has(paletteId)) {
        throw new ValidationError(
          `항목 ${i}의 paletteId "${paletteId}"가 product의 팔레트 목록에 없습니다. ` +
            `허용 id: ${input.palettes.length === 0 ? "(없음)" : input.palettes.map((p) => p.id).join(", ")}`,
        );
      }
      if (!ALLOWED_STEPS.has(paletteStep)) {
        throw new ValidationError(
          `항목 ${i}의 paletteStep ${paletteStep}이 허용 step 목록에 없습니다. ` +
            `허용: ${SHADE_STEPS.join(", ")}`,
        );
      }
      out.push({ name, description, paletteId, paletteStep });
    } else {
      const rawValue = strField(row, "rawValue", `${i}`);
      out.push({ name, description, rawValue });
    }
  }
  return out;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function strField(row: Record<string, unknown>, key: string, label: string): string {
  const v = row[key];
  if (typeof v !== "string" || v.trim().length === 0) {
    throw new ValidationError(`항목 ${label}의 "${key}"가 비어있거나 문자열이 아닙니다.`);
  }
  return v.trim();
}

function numField(row: Record<string, unknown>, key: string, label: string): number {
  const v = row[key];
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new ValidationError(`항목 ${label}의 "${key}"가 숫자가 아닙니다.`);
  }
  return v;
}
