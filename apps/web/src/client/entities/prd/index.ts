/* Pure parsing helpers live on the server domain side so the server LLM
 * task can import them too. Re-exporting here keeps the FE import surface
 * (`@/entities/prd`) unchanged. */
export {
  PRD_SECTIONS,
  composeContent,
  extractAnswers,
  type PrdSection,
} from "@/server/product/domain/prd-sections";
