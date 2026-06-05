import { ValidationError } from "../../../shared/errors/domain-error";
import type {
  LlmCompletionOptions,
  LlmCompletionResult,
  LlmCredential,
  LlmPrompt,
  LlmProvider,
} from "../../../shared/llm";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MAX_TOKENS = 8192;

/** Anthropic Messages API adapter. Plain `fetch` — no SDK dependency — so
 * the abstraction stays light. Built with a credential; `complete` carries
 * only the request. */
export class AnthropicProvider implements LlmProvider {
  readonly id = "anthropic";
  readonly defaultModel = "claude-sonnet-4-6";

  constructor(private readonly credential: LlmCredential) {}

  async complete(
    prompt: LlmPrompt,
    options?: LlmCompletionOptions,
  ): Promise<LlmCompletionResult> {
    const model = options?.model ?? this.defaultModel;
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.credential.apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
        ...(options?.temperature != null ? { temperature: options.temperature } : {}),
        system: prompt.system,
        messages: [{ role: "user", content: prompt.user }],
      }),
    });

    if (!res.ok) {
      throw new ValidationError(
        `Anthropic 호출 실패 (${res.status}): ${await safeErrorText(res)}`,
      );
    }

    const json = (await res.json()) as AnthropicResponse;
    const text = (json.content ?? [])
      .filter((b) => b.type === "text" && typeof b.text === "string")
      .map((b) => b.text)
      .join("")
      .trim();
    if (text.length === 0) {
      throw new ValidationError("Anthropic 응답에 텍스트 본문이 없습니다.");
    }

    return {
      text,
      model: json.model ?? model,
      usage: json.usage
        ? {
            inputTokens: json.usage.input_tokens,
            outputTokens: json.usage.output_tokens,
          }
        : undefined,
    };
  }
}

interface AnthropicResponse {
  model?: string;
  content?: Array<{ type: string; text?: string }>;
  usage?: { input_tokens: number; output_tokens: number };
}

async function safeErrorText(res: Response): Promise<string> {
  try {
    const body = await res.text();
    return body.slice(0, 500);
  } catch {
    return res.statusText;
  }
}
