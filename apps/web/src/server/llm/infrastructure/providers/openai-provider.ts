import { ValidationError } from "../../../shared/errors/domain-error";
import type {
  LlmCompletionOptions,
  LlmCompletionResult,
  LlmCredential,
  LlmPrompt,
  LlmProvider,
} from "../../../shared/llm";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

/** OpenAI Chat Completions adapter. The `system`/`user` split maps cleanly
 * onto the two messages, so the same `LlmPrompt` drives both providers
 * unchanged. */
export class OpenAIProvider implements LlmProvider {
  readonly id = "openai";
  readonly defaultModel = "gpt-4.1";

  constructor(private readonly credential: LlmCredential) {}

  async complete(
    prompt: LlmPrompt,
    options?: LlmCompletionOptions,
  ): Promise<LlmCompletionResult> {
    const model = options?.model ?? this.defaultModel;
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.credential.apiKey}`,
      },
      body: JSON.stringify({
        model,
        ...(options?.temperature != null ? { temperature: options.temperature } : {}),
        ...(options?.maxTokens != null ? { max_tokens: options.maxTokens } : {}),
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
      }),
    });

    if (!res.ok) {
      throw new ValidationError(
        `OpenAI 호출 실패 (${res.status}): ${await safeErrorText(res)}`,
      );
    }

    const json = (await res.json()) as OpenAIResponse;
    const text = (json.choices?.[0]?.message?.content ?? "").trim();
    if (text.length === 0) {
      throw new ValidationError("OpenAI 응답에 텍스트 본문이 없습니다.");
    }

    return {
      text,
      model: json.model ?? model,
      usage: json.usage
        ? {
            inputTokens: json.usage.prompt_tokens,
            outputTokens: json.usage.completion_tokens,
          }
        : undefined,
    };
  }
}

interface OpenAIResponse {
  model?: string;
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

async function safeErrorText(res: Response): Promise<string> {
  try {
    const body = await res.text();
    return body.slice(0, 500);
  } catch {
    return res.statusText;
  }
}
