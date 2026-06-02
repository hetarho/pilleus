/**
 * Default markdown content for a freshly created PRD.
 *
 * Format: prompt-style boilerplate. Each section has two emoji-prefixed
 * cues:
 *   ✏️  — human input. The author writes here in plain natural language.
 *   🤖  — AI completion brief. When the author copies the prompt and runs
 *         it through an external LLM, the LLM uses these to elaborate.
 *
 * Why only four sections? PRD writing is supposed to be the lowest-friction
 * step in the workflow — the author dumps the idea in natural language,
 * the LLM cleans it up at publish time, and downstream contexts (data /
 * policy / element / user-story) get extracted later. Anything beyond
 * "what / why / goals / how it flows" was structure for structure's sake.
 *
 * Instruction text is plain prose: no **bold**, no *italic*, no `code` —
 * the form view shows these as label text, not rendered markdown, so any
 * markdown markers would just appear as literal characters.
 *
 * About GAP / SECTION_GAP:
 *   Plain blank lines collapse on markdown re-serialization. To keep
 *   editing room visible (between ✏️ and 🤖, and between sections), we
 *   emit a non-breaking space on its own line. We use the   escape
 *   so the literal NBSP character isn't sitting in the source — multiple
 *   accidental rewrites of this file have silently downgraded NBSP to a
 *   regular space, which then collapses on save and breaks the layout.
 *   The escape form is invariant under re-typing.
 *
 * Lives in the shared kernel because both the server LLM task and the
 * client prompt-copy / form views must read the EXACT same constant —
 * "what the editor shows" has to match "what gets sent to the LLM".
 */

export const PRD_HUMAN_MARKER = "✏️";
export const PRD_AI_MARKER = "🤖";

/** Total numbered sections in the boilerplate. Used by the wrapper prompt
 * so the LLM is told the exact range to fill (1..N). */
export const PRD_SECTION_COUNT = 4;

/** Writing space inside a section (between ✏️ and 🤖). NBSP — survives
 * markdown re-serialization, where a bare blank line would collapse. */
const GAP = "\u00a0";
/** Visual separator between numbered sections. Same NBSP trick. */
const SECTION_GAP = "\u00a0";

export const PRD_BOILERPLATE = `# PRD 제목

## 1. 개요 (Overview)

${PRD_HUMAN_MARKER} 이 기능이 무엇인지 한두 문장으로 적어주세요. 어떤 문제를 해결하나요?

${GAP}

${PRD_AI_MARKER} 위 내용을 바탕으로 이 PRD가 다루는 범위를 3-5문장으로 풀어쓰고, product의 미션/혜택과 어떻게 연결되는지 명시해주세요.

${SECTION_GAP}

## 2. 배경 (Problem)

${PRD_HUMAN_MARKER} 왜 이 기능이 필요한가요? 사용자가 현재 어떤 불편함을 겪고 있는지, 또는 어떤 기회가 보이는지 적어주세요.

${GAP}

${PRD_AI_MARKER} 위 문제 진술을 사용자 관점 / 비즈니스 관점 / 기술 관점으로 분리해 정리하고, 해결되지 않을 경우의 영향을 보강해주세요.

${SECTION_GAP}

## 3. 목표 (Goals)

${PRD_HUMAN_MARKER} 이 기능이 달성해야 하는 핵심 목표를 자유롭게 적어주세요. 형식·길이는 신경 쓰지 말고 떠오르는 대로 — 측정 가능한 형태면 좋지만 그게 어려우면 자연어로 풀어 적어도 됩니다.

${GAP}

${PRD_AI_MARKER} 위 목표를 SMART 기준(Specific / Measurable / Achievable / Relevant / Time-bound)으로 다듬고, 정량 지표가 없는 항목엔 측정 방법을 제안해주세요.

${SECTION_GAP}

## 4. 동작 흐름 (Behavior)

${PRD_HUMAN_MARKER} 이 PRD에서 일어나는 일을 자연어로 상세하게 적어주세요. 흐름의 개수 제한은 없습니다 — 정상 흐름, 분기, 예외, 엣지 케이스 모두 풀어 써주세요. 추상적이기보다 구체적으로, 등장 actor / 화면·UI 요소 / 데이터 필드와 상태 / 적용 규칙이 한 흐름 안에서 자연스럽게 드러나도록. 예를 들어 "관리자가 대시보드에서 '신청 승인' 버튼을 클릭하면 신청서의 status가 PENDING에서 APPROVED로 바뀌고 신청자에게 안내 이메일이 발송된다. 단, 신청자가 정지된 계정이면 승인 불가하며 사유 모달이 뜬다." 처럼. 추후 이 내용에서 데이터·정책·UI 요소를 자동 추출할 예정이라 디테일이 살아있을수록 좋습니다. 등장 actor는 product overview에 정의된 actor 목록에서만 사용하고, 부족하면 본문 안에 "추가 actor 필요: ..." 형태로 메모해주세요. 흐름이 복잡하거나 분기가 많다면 mermaid 다이어그램(flowchart, sequenceDiagram, stateDiagram 등)을 \`\`\`mermaid 코드 블록으로 함께 적어두면 좋습니다 — 글과 그림을 섞어 써도 됩니다.

${GAP}

${PRD_AI_MARKER} 위 내용을 흐름 단위로 정리하고, 누락된 분기·예외·엣지 케이스를 보강해주세요. 자유로운 기획 형식의 자연어로 유지해주세요 — 구조화된 acceptance criteria나 Gherkin(Given/When/Then) 시나리오는 추후 user-story 도메인에서 다룰 예정이니 PRD 단계에서는 적용하지 마세요. 새 actor를 만들지 말고 정의된 actor만 사용해주세요.

각 주요 흐름마다 mermaid 다이어그램을 \`\`\`mermaid 코드 블록으로 적극 포함해주세요. 시각화 가이드:
- 사용자 인터랙션이 actor ↔ 시스템 ↔ 외부 서비스를 오가면 \`sequenceDiagram\`
- 분기·조건·예외 처리가 핵심이면 \`flowchart TD\` (조건은 마름모, 예외 분기는 별도 노드)
- 객체·신청서·주문 등 엔티티의 상태 전이가 있으면 \`stateDiagram-v2\`
- 본문 자연어 설명과 다이어그램은 서로 보완 관계여야 합니다 — 다이어그램이 본문을 대체하지 않고, 본문에 적힌 분기·예외가 다이어그램에도 빠짐없이 나타나야 합니다.
- 라벨은 한국어 그대로 사용하되, 따옴표로 감싸 mermaid 파서가 깨지지 않게 해주세요 (예: \`A["승인 요청 접수"] --> B{"정지 계정?"}\`).

이 항목은 추후 user-story / data / element / policy 도메인 생성의 기반이 됩니다.
`;
