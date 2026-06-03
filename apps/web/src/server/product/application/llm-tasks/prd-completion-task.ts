import { ValidationError } from "../../../shared/errors/domain-error";
import type { LlmPrompt, LlmTask } from "../../../shared/llm";
import type { Prd } from "../../domain/entities/prd";
import type { ProductPromptContext } from "../product-prompt-context";
import { PRD_SECTION_COUNT } from "@/kernel/prd-boilerplate";
import { PRD_SECTIONS, type PrdSection, extractAnswers } from "@/kernel/prd-sections";

/* PRD-completion task.
 *
 * Drives the "user writes draft → LLM completes" loop. The same task
 * powers both the manual flow (FE copies prompt → user pastes response →
 * BE parses) and the future automatic flow (BE runs the LLM directly).
 *
 * Split rationale:
 *   - system: methodology + output contract. Static across PRDs, so it
 *     could be cached or reused across providers.
 *   - user:   the actual PRD + product data this run is about.
 *
 * Parsing rationale:
 *   The wrapper tells the LLM to return a single ```markdown … ``` block.
 *   parseResponse extracts that block. If the LLM omitted the fence (a
 *   common imperfection), we fall back to the trimmed full text — the
 *   user can still edit the result downstream. We only hard-fail when
 *   the response is empty.
 */

export interface PrdCompletionInput {
  prd: Prd;
  context: ProductPromptContext;
}

export interface PrdCompletionParsed {
  /** Completed PRD body (markdown). Status transition + persistence is
   * the caller's responsibility — the task only shapes the value. */
  content: string;
}

export const prdCompletionTask: LlmTask<PrdCompletionInput, PrdCompletionParsed> = {
  id: "prd.completion",

  buildPrompt({ prd, context }): LlmPrompt {
    return {
      system: SYSTEM_PROMPT,
      user: buildUserPrompt(prd, context),
    };
  },

  parseResponse(rawResponse): PrdCompletionParsed {
    const trimmed = rawResponse.trim();
    if (trimmed.length === 0) {
      throw new ValidationError("LLM 응답이 비어 있습니다. 다시 시도해주세요.");
    }
    const block = extractMarkdownBlock(trimmed);
    const content = (block ?? trimmed).trim();
    if (content.length === 0) {
      throw new ValidationError("LLM 응답에서 markdown 본문을 찾지 못했습니다.");
    }
    return { content };
  },
};

/* ─── prompt building ────────────────────────────────────────────────── */

const SYSTEM_PROMPT = `당신은 사용자가 form에 입력한 PRD 초안을 페이즈 단위 질문으로 보강해 완성하는 어시스턴트입니다.

## 작업 방식

이 PRD는 사용자가 form에 입력한 초안입니다. **한 번에 완성하려 하지 마세요.** 다음 절차를 따라주세요.

### 1단계 — 빈틈 식별
user prompt의 각 섹션을 검토해 빈 곳·모호한 부분·서로 어긋나는 부분을 모두 찾아 내부적으로 정리해주세요. (사용자에게 보여줄 필요는 없습니다.)

### 2단계 — 페이즈 단위 질문
빈틈을 메우는 질문을 **페이즈 단위**로 던집니다.

- 한 페이즈는 **최대 5개의 질문**으로 구성하고, 한 페이즈 안의 질문들은 서로 연관된 주제로 묶어주세요.
- **각 질문에는 최소 3개의 선택지**와 **"직접 입력"** 옵션을 함께 제시해 사용자가 선택하거나 자유 작성으로 답할 수 있게 해주세요.
- 사용자가 한 페이즈의 답변을 모두 마치면, 그 답을 반영해 다음 페이즈를 시작합니다. **빈틈이 모두 사라질 때까지 페이즈를 반복**합니다.

질문 형식 예시:

> **Q1. 이 기능을 사용하는 주요 페르소나는 누구인가요?**
> A) PM
> B) 엔지니어
> C) AI 어시스턴트
> D) 직접 입력: ___

### 3단계 — 최종 markdown 반환
모든 모호한 사항이 마무리됐다고 판단되는 시점에서만, 전체 PRD를 **단일 markdown 코드블록**(\`\`\`markdown … \`\`\`)으로 완성해 **반드시 반환**해주세요. 그 전에는 코드블록을 출력하지 마세요. 빈틈이 남아있다면 코드블록 대신 다음 페이즈 질문을 던지세요.

### 추가 규칙
- 페르소나는 user prompt의 Product 컨텍스트에 정의된 페르소나 목록에서만 사용해주세요. 새로 만들지 말고, 부족하면 동작 흐름 본문 안에 "추가 페르소나 필요: ..." 형태로 메모해주세요.
- 섹션 번호와 제목은 그대로 유지하고, 1번부터 ${PRD_SECTION_COUNT}번까지 모두 채워주세요.
- 사용자 입력은 별도의 인용 표시 없이 자연스럽게 흡수해 통합 본문으로 다듬어주세요.
`;

function buildUserPrompt(prd: Prd, context: ProductPromptContext): string {
  const productBlock = renderProductContext(context);
  const titleValue = prd.title.value.trim();
  const titleBlock = titleValue.length > 0 ? `## PRD 제목\n\n${titleValue}\n` : "";
  const answers = extractAnswers(prd.content);
  const sectionsBlock = PRD_SECTIONS.map((sec, i) =>
    renderSection(sec, answers[i] ?? ""),
  ).join("\n\n---\n\n");

  return `아래는 사용자가 form에 입력한 PRD 초안입니다. 다음 컨텍스트를 읽고 system prompt의 작업 방식에 따라 PRD를 완성해주세요.

${productBlock}
${titleBlock}
---

${sectionsBlock}
`;
}

function renderSection(sec: PrdSection, answer: string): string {
  const hasAnswer = answer.trim().length > 0;
  const userBlock = hasAnswer
    ? `아래는 사용자가 작성한 "${sec.titleWithoutNumber}" 내용입니다.\n\n${answer.trim()}`
    : `사용자가 "${sec.titleWithoutNumber}" 섹션을 아직 작성하지 않았습니다.`;
  const aiBlock = sec.aiInstructionDisplay
    ? hasAnswer
      ? `위 내용을 바탕으로 ${sec.aiInstructionDisplay}`
      : `사용자에게 적절한 질문을 던져 내용을 채운 후, ${sec.aiInstructionDisplay}`
    : null;
  const parts = [sec.headingLine, "", userBlock];
  if (aiBlock) parts.push("", aiBlock);
  return parts.join("\n");
}

function renderProductContext(context: ProductPromptContext): string {
  const lines: string[] = [
    "## Product 컨텍스트",
    "",
    "다음은 이 PRD가 속한 product의 핵심 정보입니다. PRD 본문을 보강할 때 product의 미션·혜택·원칙과 일관되게 다듬어주세요.",
    "",
    `**이름**: ${context.name}`,
  ];
  if (context.description) lines.push(`**설명**: ${context.description}`);
  if (context.mission) lines.push(`**미션**: ${context.mission}`);

  if (context.benefits.length > 0) {
    lines.push("", "**혜택**:");
    lines.push(...context.benefits.map((b) => `- ${b}`));
  }
  if (context.principles.length > 0) {
    lines.push("", "**원칙**:");
    lines.push(...context.principles.map((p) => `- ${p}`));
  }

  lines.push("");
  if (context.personas.length > 0) {
    lines.push(
      "**페르소나 목록** (시나리오에서 새 페르소나를 만들지 말고 이 목록만 사용; 부족하면 동작 흐름 본문 안에 \"추가 페르소나 필요: ...\" 형태로 메모):",
    );
    lines.push(...context.personas.map((p) => `- ${p}`));
  } else {
    lines.push(
      "**페르소나 목록**: 정의되지 않음. 페르소나가 필요한 자리는 새로 만들지 말고 동작 흐름 본문 안에 \"추가 페르소나 필요: ...\" 형태로 메모해주세요.",
    );
  }
  lines.push("");
  return lines.join("\n");
}

/* ─── response parsing ───────────────────────────────────────────────── */

/* Pull the completed PRD out of the response. The LLM may emit several fenced
 * blocks (reasoning, examples, a trailing question) around the real PRD, so we
 * prefer the LAST block that actually looks like the PRD — i.e. carries the
 * boilerplate's "## N." numbered headings — and only fall back to the last
 * block of any kind when none match. Accepts any info-string (markdown/md/""). */
const PRD_HEADING_RE = /^##\s*\d+\./m;

function extractMarkdownBlock(text: string): string | null {
  const re = /```(?:[^\n`]*)\n([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match[1] != null) blocks.push(match[1]);
  }
  if (blocks.length === 0) return null;
  const prdBlocks = blocks.filter((b) => PRD_HEADING_RE.test(b));
  return (prdBlocks.length > 0 ? prdBlocks : blocks).at(-1) ?? null;
}
