import {
  PRD_AI_MARKER,
  PRD_BOILERPLATE,
  PRD_HUMAN_MARKER,
} from "./prd-boilerplate";

/* PRD section parsing — pure helpers that operate on the boilerplate format
 * (`## N. 제목` headings with ✏️ human + 🤖 AI paragraphs).
 *
 * Lives in the domain layer because (1) it has zero framework deps and
 * (2) both the server-side LLM task (buildPrompt / parseResponse) and the
 * client form view need to read the same parser. The client re-exports
 * these from `@/entities/prd` so FE code keeps its existing import path. */

/* Use the   escape rather than a literal NBSP — see prd-boilerplate.ts
 * for the rationale (accidental rewrites silently downgrade NBSP → space). */
const NBSP = " ";
const HEADING_RE = /^## (\d+)\./;

export interface PrdSection {
  index: number;
  /** Full heading line, e.g. "## 5. 동작 흐름 (Behavior)". */
  headingLine: string;
  /** Heading with the leading "## " stripped — "5. 동작 흐름 (Behavior)". */
  title: string;
  /** Title without the leading number — "동작 흐름 (Behavior)". */
  titleWithoutNumber: string;
  /** ✏️ instruction paragraph as written in the boilerplate (raw). */
  humanInstruction: string;
  /** Same with the leading "✏️ " marker stripped (for form view labels). */
  humanInstructionDisplay: string;
  /** 🤖 instruction paragraph, or null for sections without one. */
  aiInstruction: string | null;
  /** Same with the leading "🤖 " marker stripped (for the LLM prompt body). */
  aiInstructionDisplay: string | null;
}

interface SectionBlock {
  headingLine: string;
  body: string;
}

/** Split a markdown document into per-section blocks based on `## N.` headings. */
function splitIntoBlocks(md: string): SectionBlock[] {
  const blocks: SectionBlock[] = [];
  const lines = md.split("\n");
  let current: SectionBlock | null = null;
  for (const line of lines) {
    if (HEADING_RE.test(line)) {
      if (current) blocks.push(current);
      current = { headingLine: line, body: "" };
    } else if (current) {
      current.body += line + "\n";
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

/** Split a body into trimmed paragraphs (paragraph = block separated by blank line). */
function paragraphs(body: string): string[] {
  return body.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 0);
}

const stripMarker = (text: string, marker: string): string =>
  text.replace(new RegExp(`^${marker}\\s*`), "");

/** Parse the canonical boilerplate template once into a section list. Cached
 * via a module-level constant since the boilerplate is itself a constant. */
export const PRD_SECTIONS: readonly PrdSection[] = (() => {
  const blocks = splitIntoBlocks(PRD_BOILERPLATE);
  return blocks.map((block) => {
    const m = block.headingLine.match(HEADING_RE);
    const index = m ? Number(m[1]) : 0;
    const title = block.headingLine.replace(/^## /, "");
    const titleWithoutNumber = title.replace(/^\d+\.\s*/, "");
    const paras = paragraphs(block.body);
    const human = paras.find((p) => p.startsWith(PRD_HUMAN_MARKER)) ?? "";
    const ai = paras.find((p) => p.startsWith(PRD_AI_MARKER)) ?? null;
    return {
      index,
      headingLine: block.headingLine,
      title,
      titleWithoutNumber,
      humanInstruction: human,
      humanInstructionDisplay: stripMarker(human, PRD_HUMAN_MARKER),
      aiInstruction: ai,
      aiInstructionDisplay: ai ? stripMarker(ai, PRD_AI_MARKER) : null,
    };
  });
})();

/** Pull the user's answer for each section out of saved markdown. The answer
 * is whatever paragraphs sit between the ✏️ paragraph and the 🤖 paragraph
 * (or end of section), excluding NBSP spacers. */
export function extractAnswers(content: string): string[] {
  const blocks = splitIntoBlocks(content);
  return PRD_SECTIONS.map((sec) => {
    const block = blocks.find((b) => {
      const m = b.headingLine.match(HEADING_RE);
      return m && Number(m[1]) === sec.index;
    });
    if (!block) return "";
    const paras = paragraphs(block.body);
    const humanIdx = paras.findIndex((p) => p.startsWith(PRD_HUMAN_MARKER));
    const aiIdx = paras.findIndex((p) => p.startsWith(PRD_AI_MARKER));
    const start = humanIdx >= 0 ? humanIdx + 1 : 0;
    const end = aiIdx >= 0 ? aiIdx : paras.length;
    return paras
      .slice(start, end)
      .filter((p) => p !== NBSP)
      .join("\n\n");
  });
}

/** Reconstruct full PRD markdown from per-section answers, mirroring the
 * boilerplate's NBSP-spaced layout so a save/load round-trip is stable. */
export function composeContent(answers: readonly string[]): string {
  const out: string[] = ["# PRD 제목", ""];
  PRD_SECTIONS.forEach((sec, i) => {
    out.push(sec.headingLine, "");
    out.push(sec.humanInstruction, "");
    out.push(NBSP, "");
    const answer = answers[i]?.trim() ?? "";
    if (answer.length > 0) {
      out.push(answer, "");
      out.push(NBSP, "");
    }
    if (sec.aiInstruction) {
      out.push(sec.aiInstruction, "");
    }
    if (i < PRD_SECTIONS.length - 1) {
      out.push(NBSP, "");
    }
  });
  return out.join("\n");
}
