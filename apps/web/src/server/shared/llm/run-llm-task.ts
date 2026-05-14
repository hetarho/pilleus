import type { LlmProvider, LlmTask } from "./llm-task";

/**
 * Server-side composition of an LLM task: build → call provider → parse.
 *
 * Not used by any router yet — we're on the manual (copy/paste) flow while
 * we ship under a subscription model with no server-side API key. Kept
 * here so when the key lands, the only additions are:
 *   - an `LlmProvider` infrastructure adapter (e.g. AnthropicProvider)
 *   - a new tRPC mutation that calls `runLlmTask(task, input, provider)`
 *     and then persists, replacing the two-step buildPrompt/submit flow.
 * The task definitions and parsing logic stay identical.
 */
export async function runLlmTask<TInput, TParsed>(
  task: LlmTask<TInput, TParsed>,
  input: TInput,
  provider: LlmProvider,
): Promise<TParsed> {
  const prompt = task.buildPrompt(input);
  const raw = await provider.complete(prompt);
  return task.parseResponse(raw, input);
}
