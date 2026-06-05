/**
 * LLM task abstraction.
 *
 * One "LLM task" is a bounded, well-typed unit of LLM work:
 *   input → prompt → raw response → parsed output → side effect
 *
 * The task definition itself only knows how to (a) shape a prompt from
 * input and (b) parse a raw response back into a domain-shaped value.
 * Persistence is NOT the task's job — that's the surrounding use case.
 *
 * Today we drive each task in two halves from the FE (copy-prompt and
 * submit-response). When we add an API key, the same task can be driven
 * fully server-side via `LlmProvider`. Splitting build/parse means we
 * don't rewrite either side when we flip the switch.
 */

/** System + user pair that gets sent (or copied) to the LLM. */
export interface LlmPrompt {
  /** Methodology, output format, persona — the "how" the LLM should work. */
  system: string;
  /** Data, request, references — the "what" the user is asking about. */
  user: string;
}

/**
 * Pure definition of one LLM task. No I/O, no repositories.
 *
 * @typeParam TInput  - pre-fetched domain shape needed by build + parse.
 *                      The surrounding use case is responsible for loading
 *                      the relevant entities and passing them in.
 * @typeParam TParsed - shape the raw response is parsed into. The use case
 *                      then maps this to a persistence call.
 */
export interface LlmTask<TInput, TParsed> {
  /** Stable id for telemetry / future routing. e.g. "prd.completion". */
  readonly id: string;
  buildPrompt(input: TInput): LlmPrompt;
  parseResponse(rawResponse: string, input: TInput): TParsed;
}

/* `LlmProvider` (the outbound port a server-side run calls) now lives in
 * `./provider`, alongside the model-ref / options / credential types it
 * needs. Kept separate from the task so a task definition never imports
 * anything about providers — prompts stay pure data. */
