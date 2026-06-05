import type { LlmTask } from "./llm-task";
import type { LlmCompletionOptions, LlmProvider } from "./provider";

/**
 * Server-side composition of an LLM task: build → call provider → parse.
 *
 * This is the generic primitive for "fire and parse" tasks. Note that the
 * task-specific server runs in `product`/`design` deliberately do NOT use
 * this — they compose Build + Submit use cases instead, so the parse +
 * persist + collision-reporting path stays identical to the manual flow's
 * single write site. `runLlmTask` stays available for tasks that have no
 * persistence step (pure transforms, previews, validation runs).
 */
export async function runLlmTask<TInput, TParsed>(
  task: LlmTask<TInput, TParsed>,
  input: TInput,
  provider: LlmProvider,
  options?: LlmCompletionOptions,
): Promise<TParsed> {
  const prompt = task.buildPrompt(input);
  const result = await provider.complete(prompt, options);
  return task.parseResponse(result.text, input);
}
