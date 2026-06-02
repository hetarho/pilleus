import { ValidationError } from "../../../shared/errors/domain-error";
import type { LlmPrompt, LlmTask } from "../../../shared/llm";
import type { Product } from "../../../product/domain/entities/product";
import { TOKEN_GROUPS, type TokenGroup } from "@/kernel/design-token";
import { SHADE_STEPS } from "@/kernel/palette";
import type {
  GeneratedToken,
  PaletteOption,
  TokenGenerationDensity,
} from "./token-generation-task";

/* All-groups token generation.
 *
 * One LLM round trip produces tokens for every group (color, typography,
 * spacing, radius, shadow). Same task abstraction as the single-group
 * variant — buildPrompt + parseResponse only, no I/O.
 *
 * The response is a JSON object keyed by group name (not a flat array)
 * so the LLM can't drop the group attribution by accident. The parser
 * accepts both forms defensively.
 */

export interface AllTokensGenerationInput {
  product: Product;
  density: TokenGenerationDensity;
  palettes: ReadonlyArray<PaletteOption>;
  /** Existing token names, grouped — passed so the LLM can avoid
   * colliding with what's already in the DB. */
  existingNamesByGroup: Readonly<Record<TokenGroup, ReadonlyArray<string>>>;
}

export interface GeneratedTokenWithGroup extends GeneratedToken {
  group: TokenGroup;
}

export interface AllTokensGenerationParsed {
  tokens: GeneratedTokenWithGroup[];
}

export const allTokensGenerationTask: LlmTask<
  AllTokensGenerationInput,
  AllTokensGenerationParsed
> = {
  id: "design.all-tokens-generation",

  buildPrompt(input): LlmPrompt {
    return {
      system: buildSystemPrompt(input.density),
      user: buildUserPrompt(input),
    };
  },

  parseResponse(rawResponse, input): AllTokensGenerationParsed {
    const trimmed = rawResponse.trim();
    if (trimmed.length === 0) throw new ValidationError("LLM 응답이 비어 있습니다.");

    const jsonText = extractJsonBlock(trimmed);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      throw new ValidationError(
        `JSON 파싱 실패: ${e instanceof Error ? e.message : "unknown"}`,
      );
    }
    const tokens = coerceAllTokens(parsed, input);
    if (tokens.length === 0) throw new ValidationError("LLM이 토큰을 한 개도 반환하지 않았습니다.");
    return { tokens };
  },
};

/* ─── prompts ────────────────────────────────────────────────────────── */

const DENSITY_HINTS: Record<TokenGenerationDensity, string> = {
  minimal: "각 그룹당 필수만 — 3~5개 정도.",
  balanced: "각 그룹당 6~10개 정도. 일반 product에 충분.",
  comprehensive: "각 그룹당 12~20개 정도. 다양한 맥락까지 커버.",
};

function buildSystemPrompt(density: TokenGenerationDensity): string {
  return `당신은 디자인 시스템의 토큰 세트를 product 맥락에 맞게 한 번에 생성하는 어시스턴트입니다.

## 작업 방식

이번 작업은 **5개 그룹(color, typography, spacing, radius, shadow)의 토큰을 모두** 한 번의 응답으로 생성하는 일입니다.

### 1단계 — Product 맥락 흡수
user prompt의 Product 컨텍스트(미션·혜택·원칙·actor)를 읽고, 톤·강도·중요한 역할을 파악합니다.

### 2단계 — 필요하면 질문
빈틈이 있으면 페이즈 단위로 최대 5개 질문을 던지세요. 각 질문에는 3개 이상의 선택지와 "직접 입력"을 함께 제시합니다. 빈틈이 사라질 때까지 반복.
빈틈이 없으면 바로 3단계로 넘어가세요.

### 3단계 — 5개 그룹 토큰 동시 생성

**갯수 기준**: ${DENSITY_HINTS[density]}

**그룹별 규칙**:
- **color**: 팔레트의 step을 가리키는 의미별 별칭.
  - **paletteId는 user prompt에 나열된 팔레트 id 중 하나만 사용**. 새 id를 만들거나 hex 값을 직접 적으면 서버에서 거부됩니다.
  - **paletteStep은 정확히 [${SHADE_STEPS.join(", ")}] 중 하나**여야 합니다.
  - 각 토큰은 (paletteId, paletteStep) 한 쌍. 이름은 의미 기반(primary, surface, border, danger 등). 텍스트=700~900, 보더=200~300, 배경=50~100, 액센트=500~600 근처.
  - **user prompt에 팔레트가 한 개도 없으면 color 배열을 빈 배열(\`[]\`)로 두세요.** 절대 hex나 가짜 id로 만들지 마세요.
- **typography**: 폰트/사이즈/굵기를 자유 입력 값으로. 이름은 의도 기반(text-body, text-display, weight-emphasis 등). rawValue는 CSS 값.
- **spacing**: 간격 스케일. 이름은 sm/md/lg 또는 의도(gutter, section-y 등). rawValue는 "8px", "1rem" 등.
- **radius**: 모서리 반경. 이름 예: sm, md, lg, full. rawValue는 "4px", "9999px" 등.
- **shadow**: 그림자. 이름 예: sm, md, lg, focus. rawValue는 CSS box-shadow 그대로.

**공통 규칙**:
- 각 토큰에는 **description**(언제 사용해야 하는지 1~2문장 가이드)을 반드시 포함합니다. 단순히 값을 설명하지 말고 사용 맥락을 적습니다.
- user prompt의 "이미 존재하는 이름" 목록과 겹치지 않게 합니다.
- 이름은 kebab-case 또는 단어 1개. 80자 이내.

### 4단계 — 단일 JSON 반환

빈틈이 사라지면 **단일 JSON 코드블록**(\`\`\`json … \`\`\`)으로만 응답하세요. 그 전에는 코드블록 출력 금지.

JSON 스키마 (그룹별 키, 토큰 객체 배열):

\`\`\`
{
  "color": [
    { "name": "primary", "paletteId": "<user prompt의 palette id>", "paletteStep": 500, "description": "..." }
  ],
  "typography": [
    { "name": "text-body", "rawValue": "16px / 24px Inter, system-ui, sans-serif", "description": "..." }
  ],
  "spacing": [
    { "name": "sm", "rawValue": "8px", "description": "..." }
  ],
  "radius": [
    { "name": "md", "rawValue": "6px", "description": "..." }
  ],
  "shadow": [
    { "name": "sm", "rawValue": "0 1px 2px rgb(0 0 0 / 0.05)", "description": "..." }
  ]
}
\`\`\`

JSON 외 텍스트(서론·결론·설명)는 코드블록 밖에 절대 출력하지 마세요. 후속 처리는 코드블록 한 개만 추출합니다.`;
}

function buildUserPrompt(input: AllTokensGenerationInput): string {
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

  lines.push("", "---", "", "## 사용 가능한 팔레트 (color 토큰 전용)", "");
  if (input.palettes.length === 0) {
    lines.push(
      "(없음) — color 토큰을 만들 수 없습니다. JSON의 `color` 키는 빈 배열(`[]`)로 두세요. hex나 가짜 id로 채우면 서버에서 전체 응답이 거부됩니다.",
    );
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

  lines.push("", "---", "", "## 이미 존재하는 이름 (그룹별 — 겹치지 마세요)", "");
  for (const g of TOKEN_GROUPS) {
    const names = input.existingNamesByGroup[g] ?? [];
    lines.push(`- **${g}**: ${names.length === 0 ? "(없음)" : names.join(", ")}`);
  }

  lines.push(
    "",
    "---",
    "",
    "위 컨텍스트에 맞춰 5개 그룹의 토큰을 모두 설계한 뒤, system prompt가 지시한 JSON 형식으로 반환해주세요.",
  );

  return lines.join("\n");
}

/* ─── parsing ────────────────────────────────────────────────────────── */

function extractJsonBlock(text: string): string {
  const re = /```(?:[^\n`]*)\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  let last: string | null = null;
  while ((match = re.exec(text)) !== null) {
    last = match[1] ?? null;
  }
  return (last ?? text).trim();
}

function coerceAllTokens(
  parsed: unknown,
  input: AllTokensGenerationInput,
): GeneratedTokenWithGroup[] {
  if (!isRecord(parsed)) {
    /* Defensive: accept the flat-array form too — some LLMs ignore the
     * keyed-object instruction and emit `[{ "group": "color", ... }]`. */
    if (Array.isArray(parsed)) return coerceFlatArray(parsed, input);
    throw new ValidationError("JSON 루트는 그룹 키를 갖는 객체여야 합니다.");
  }
  const allowedPaletteIds = new Set(input.palettes.map((p) => p.id));
  const out: GeneratedTokenWithGroup[] = [];
  for (const group of TOKEN_GROUPS) {
    const list = parsed[group];
    if (list === undefined) continue;
    if (!Array.isArray(list)) {
      throw new ValidationError(`"${group}" 값이 배열이 아닙니다.`);
    }
    for (let i = 0; i < list.length; i++) {
      out.push(coerceRow(list[i], group, i, allowedPaletteIds));
    }
  }
  return out;
}

function coerceFlatArray(
  arr: unknown[],
  input: AllTokensGenerationInput,
): GeneratedTokenWithGroup[] {
  const allowedPaletteIds = new Set(input.palettes.map((p) => p.id));
  return arr.map((row, i) => {
    if (!isRecord(row)) throw new ValidationError(`항목 ${i}이 객체가 아닙니다.`);
    const g = row.group;
    if (typeof g !== "string" || !(TOKEN_GROUPS as readonly string[]).includes(g)) {
      throw new ValidationError(`항목 ${i}의 group이 올바르지 않습니다.`);
    }
    return coerceRow(row, g as TokenGroup, i, allowedPaletteIds);
  });
}

const ALLOWED_STEPS = new Set<number>(SHADE_STEPS as readonly number[]);

function coerceRow(
  row: unknown,
  group: TokenGroup,
  i: number,
  allowedPaletteIds: Set<string>,
): GeneratedTokenWithGroup {
  if (!isRecord(row)) {
    throw new ValidationError(`${group}[${i}]가 객체가 아닙니다.`);
  }
  const name = strField(row, "name", `${group}[${i}]`);
  const description = strField(row, "description", `${group}[${i}]`);
  if (group === "color") {
    const paletteId = strField(row, "paletteId", `${group}[${i}]`);
    const paletteStep = numField(row, "paletteStep", `${group}[${i}]`);
    if (!allowedPaletteIds.has(paletteId)) {
      const allowed = allowedPaletteIds.size === 0
        ? "(없음 — 팔레트가 하나도 없으므로 color 배열은 빈 배열이어야 합니다)"
        : [...allowedPaletteIds].join(", ");
      throw new ValidationError(
        `${group}[${i}]의 paletteId "${paletteId}"가 product 팔레트 목록에 없습니다. 허용 id: ${allowed}`,
      );
    }
    if (!ALLOWED_STEPS.has(paletteStep)) {
      throw new ValidationError(
        `${group}[${i}]의 paletteStep ${paletteStep}이 허용 step 목록에 없습니다. ` +
          `허용: ${SHADE_STEPS.join(", ")}`,
      );
    }
    return { group, name, description, paletteId, paletteStep };
  }
  const rawValue = strField(row, "rawValue", `${group}[${i}]`);
  return { group, name, description, rawValue };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function strField(row: Record<string, unknown>, key: string, label: string): string {
  const v = row[key];
  if (typeof v !== "string" || v.trim().length === 0) {
    throw new ValidationError(`${label}의 "${key}"가 비어있거나 문자열이 아닙니다.`);
  }
  return v.trim();
}

function numField(row: Record<string, unknown>, key: string, label: string): number {
  const v = row[key];
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new ValidationError(`${label}의 "${key}"가 숫자가 아닙니다.`);
  }
  return v;
}
