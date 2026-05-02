import { extractAnswers, PRD_SECTIONS } from "@/entities/prd";
import { PRD_SECTION_COUNT } from "@/server/product/domain/prd-boilerplate";

export interface PrdCompletionContext {
  /** Parent product. Surfaced at the top of the wrapper so the LLM has
   * the full product framing (mission / benefits / principles / actors)
   * when elaborating the PRD body. */
  product: {
    name: string;
    description: string | null;
    mission: string | null;
    benefits: readonly string[];
    principles: readonly string[];
    actors: readonly string[];
  };
  /** PRD title (stored on prd.title, not embedded in the markdown body). */
  title: string;
}

/**
 * Build the full prompt that the user pastes into an external LLM.
 *
 * Structure:
 *   1. Product 컨텍스트  (name / description / mission / benefits / principles / actors)
 *   2. PRD 제목
 *   3. 작업 방식 — iterative Q&A loop, return final markdown only when no gaps remain
 *   4. Per-section blocks: "사용자가 작성한 [섹션]: …" + "위 내용을 바탕으로 [AI brief]"
 *
 * The per-section blocks are derived from `extractAnswers(content)` rather
 * than embedded as raw boilerplate markdown — the user-facing ✏️ guides
 * are dropped from the prompt body since they're redundant once the user
 * has filled in via the form. The 🤖 brief becomes a "위 내용을 바탕으로 …"
 * direction tied to the specific user input.
 */
export function buildPrdCompletionPrompt(prdBody: string, ctx: PrdCompletionContext): string {
  const productBlock = renderProductContext(ctx.product);
  const titleBlock = ctx.title.trim().length > 0
    ? `## PRD 제목\n\n${ctx.title.trim()}\n`
    : "";

  const answers = extractAnswers(prdBody);
  const sectionsBlock = PRD_SECTIONS.map((sec, i) => renderSection(sec, answers[i] ?? "")).join(
    "\n\n---\n\n",
  );

  return `아래는 사용자가 form에 입력한 PRD 초안입니다. 다음 컨텍스트를 읽고 작업 방식에 따라 PRD를 완성해주세요.

${productBlock}
${titleBlock}
## 작업 방식

이 PRD는 사용자가 form에 입력한 초안입니다. **한 번에 완성하려 하지 마세요.** 다음 절차를 따라주세요:

1. 아래 각 섹션을 검토해 빈 곳·모호한 부분·서로 어긋나는 부분을 찾아주세요.
2. 한 번에 **한 가지 질문씩** 사용자에게 던져주세요. 여러 질문을 묶지 말고, 가장 핵심적이고 답을 받기 쉬운 질문부터 차례로.
3. 답을 받으면 다음 빈틈으로 넘어가세요. **빈틈이 모두 사라질 때까지 반복**합니다.
4. 모든 빈틈이 채워졌다고 판단되는 시점에 한해, 그제야 전체 PRD를 **단일 markdown 코드블록**(\\\`\\\`\\\`markdown … \\\`\\\`\\\`)으로 완성해 반환해주세요. 그 전에는 코드블록을 출력하지 마세요.

추가 규칙:
- Actor는 위 Product 컨텍스트의 Actor 목록에서만 사용해주세요. 새로 만들지 말고, 부족하면 동작 흐름 본문 안에 "추가 actor 필요: ..." 형태로 메모해주세요.
- 섹션 번호와 제목은 그대로 유지하고, 1번부터 ${PRD_SECTION_COUNT}번까지 모두 채워주세요.
- 사용자 입력은 별도의 인용 표시 없이 자연스럽게 흡수해 통합 본문으로 다듬어주세요.

---

${sectionsBlock}
`;
}

function renderSection(
  sec: { titleWithoutNumber: string; headingLine: string; aiInstructionDisplay: string | null },
  answer: string,
): string {
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

function renderProductContext(product: PrdCompletionContext["product"]): string {
  const lines: string[] = [
    "## Product 컨텍스트",
    "",
    "다음은 이 PRD가 속한 product의 핵심 정보입니다. PRD 본문을 보강할 때 product의 미션·혜택·원칙과 일관되게 다듬어주세요.",
    "",
    `**이름**: ${product.name}`,
  ];
  if (product.description) lines.push(`**설명**: ${product.description}`);
  if (product.mission) lines.push(`**미션**: ${product.mission}`);

  if (product.benefits.length > 0) {
    lines.push("", "**혜택**:");
    lines.push(...product.benefits.map((b) => `- ${b}`));
  }
  if (product.principles.length > 0) {
    lines.push("", "**원칙**:");
    lines.push(...product.principles.map((p) => `- ${p}`));
  }

  lines.push("");
  if (product.actors.length > 0) {
    lines.push(
      "**Actor 목록** (시나리오에서 새 actor를 만들지 말고 이 목록만 사용; 부족하면 동작 흐름 본문 안에 \"추가 actor 필요: ...\" 형태로 메모):",
    );
    lines.push(...product.actors.map((a) => `- ${a}`));
  } else {
    lines.push(
      "**Actor 목록**: 정의되지 않음. Actor가 필요한 자리는 새로 만들지 말고 동작 흐름 본문 안에 \"추가 actor 필요: ...\" 형태로 메모해주세요.",
    );
  }
  lines.push("");
  return lines.join("\n");
}
