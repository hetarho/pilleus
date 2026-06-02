/* Pure parsing helpers live in the shared kernel so both the server LLM
 * task and this FE entity can import them without crossing the FE↔BE
 * boundary. Re-exporting here keeps the `@/entities/prd` import surface. */
export {
  PRD_SECTIONS,
  composeContent,
  extractAnswers,
  type PrdSection,
} from "@/kernel/prd-sections";
